"use client";

import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  FileText,
  HeartPulse,
  MessageCircle,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { ClinicalChatPanel } from "~/features/clinical-chat/components/clinical-chat-panel";
import { readFormSnapshot } from "~/server/services/aiDiagnosis/form-snapshot";
import { api, type RouterOutputs } from "~/trpc/react";
import { AnamnesisDetailPage } from "./anamnesis-detail-page";
import { PatientAiDiagnosis } from "./patient-ai-diagnosis";
import { PatientAnamnesisTimeline } from "./patient-anamnesis-timeline";
import { PatientConsultationChart } from "./patient-consultation-chart";
import { PatientInfoCard } from "./patient-info-card";
import { usePatientDetail } from "../hooks/use-patient-detail";

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const displayValue = (value: unknown): string => {
  if (value == null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (value instanceof Date) return value.toLocaleDateString("pt-BR");
  if (Array.isArray(value))
    return value.length
      ? value
          .map((item) =>
            typeof item === "object"
              ? Object.values(asRecord(item)).filter(Boolean).join(" · ")
              : String(item),
          )
          .join("; ")
      : "—";
  if (typeof value === "object")
    return Object.entries(asRecord(value))
      .map(([key, item]) => `${key}: ${displayValue(item)}`)
      .join(" · ");
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "bigint")
    return value.toString();
  return "—";
};

type AnamnesisDetailOutput = RouterOutputs["patient"]["getAnamnesisDetail"];

function SnapshotRecord({ anamnesis }: { anamnesis: AnamnesisDetailOutput }) {
  const snapshot = readFormSnapshot(anamnesis.formSnapshot);
  const custom = asRecord(anamnesis.customResponses);
  const exam = asRecord(anamnesis.physicalExam);
  const root = anamnesis as unknown as Record<string, unknown>;
  const getValue = (
    key: string,
    systemKey: string | null,
    isSystem: boolean,
  ) => {
    if (!isSystem) return custom[key];
    const resolved = systemKey ?? key;
    if (resolved === "medications") return anamnesis.medications;
    return resolved in exam ? exam[resolved] : root[resolved];
  };
  if (!snapshot)
    return (
      <div className="space-y-4">
        <div>
          <p className="text-muted-foreground text-xs">Queixa principal</p>
          <p className="text-sm">{anamnesis.chiefComplaint}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">História atual</p>
          <p className="text-sm whitespace-pre-line">
            {anamnesis.currentIllnessHistory}
          </p>
        </div>
      </div>
    );
  return (
    <div className="space-y-4">
      {snapshot.source === "APPROXIMATED" && (
        <p className="rounded-lg bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200">
          Os rótulos deste formulário antigo foram reconstruídos a partir do
          template disponível hoje.
        </p>
      )}
      {snapshot.sections.map((section) => (
        <section key={section.name} className="bg-card rounded-xl border p-4">
          <h3 className="mb-3 text-sm font-semibold">{section.name}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {section.fields
              .filter((field) => field.isVisible !== false)
              .map((field) => (
                <div
                  key={`${section.name}-${field.key}`}
                  className={field.fieldType === "TEXT" ? "sm:col-span-2" : ""}
                >
                  <p className="text-muted-foreground text-xs font-medium">
                    {field.label}
                  </p>
                  <p className="mt-1 text-sm whitespace-pre-line">
                    {displayValue(
                      getValue(field.key, field.systemKey, field.isSystemField),
                    )}
                  </p>
                </div>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function PatientProfilePage({
  patientId,
  initialAnamnesisId,
  initialView,
}: {
  patientId: string;
  initialAnamnesisId?: string;
  initialView?: string;
}) {
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialAnamnesisId ?? null,
  );
  const [editingDetail, setEditingDetail] = useState(false);
  const [openRiskOnDetail, setOpenRiskOnDetail] = useState(false);
  const [chatOpen, setChatOpen] = useState(initialView === "chat");
  const { overview, timeline, trends } = usePatientDetail(patientId, page);
  useEffect(() => {
    if (!selectedId && timeline.data?.items[0])
      setSelectedId(timeline.data.items[0].id);
  }, [selectedId, timeline.data]);
  const detail = api.patient.getAnamnesisDetail.useQuery(
    { patientId, anamnesisId: selectedId! },
    { enabled: Boolean(selectedId) },
  );
  const patient = overview.data;

  if (overview.isLoading)
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Activity className="text-primary h-6 w-6 animate-pulse" />
      </div>
    );
  if (!patient)
    return (
      <div className="p-8">
        <p>Paciente não encontrado.</p>
      </div>
    );
  if (chatOpen)
    return (
      <ClinicalChatPanel
        patientId={patientId}
        patientName={patient.name}
        contextAnamnesisId={selectedId}
        anamnesis={
          detail.data
            ? {
                id: detail.data.id,
                date: detail.data.date,
                chiefComplaint: detail.data.chiefComplaint,
              }
            : null
        }
        onBack={() => setChatOpen(false)}
      />
    );
  if (editingDetail && detail.data)
    return (
      <AnamnesisDetailPage
        anamnesis={detail.data}
        patientId={patientId}
        initialRiskOpen={openRiskOnDetail}
        onBack={() => {
          setEditingDetail(false);
          setOpenRiskOnDetail(false);
          void detail.refetch();
          void timeline.refetch();
        }}
      />
    );

  return (
    <main className="space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/pacientes">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar aos pacientes
          </Link>
        </Button>
        <Button variant="outline" onClick={() => setChatOpen(true)}>
          <MessageCircle className="mr-2 h-4 w-4" />
          Chat clínico geral
        </Button>
      </div>
      <PatientInfoCard patient={patient} />

      {trends.data && <PatientConsultationChart anamneses={trends.data} />}

      <div className="grid items-start gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
        {timeline.data && (
          <PatientAnamnesisTimeline
            data={timeline.data}
            selectedId={selectedId}
            onSelect={(id) => {
              setSelectedId(id);
              setEditingDetail(false);
            }}
            onPage={setPage}
          />
        )}
        <section className="bg-card min-w-0 rounded-2xl border p-4 md:p-5">
          {detail.isLoading ? (
            <p className="text-muted-foreground py-12 text-center text-sm">
              Carregando anamnese...
            </p>
          ) : detail.data ? (
            <Tabs key={detail.data.id} defaultValue="analysis">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <TabsList>
                  <TabsTrigger value="analysis">Análise da IA</TabsTrigger>
                  <TabsTrigger value="record">Registro</TabsTrigger>
                </TabsList>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={detail.data.surgicalRisk ? "secondary" : "default"}
                    onClick={() => {
                      setOpenRiskOnDetail(true);
                      setEditingDetail(true);
                    }}
                  >
                    <HeartPulse className="mr-2 h-4 w-4" />
                    {detail.data.surgicalRisk
                      ? `RCRI ${detail.data.surgicalRisk.riskClass} · ${detail.data.surgicalRisk.leeScore}/6`
                      : "Avaliar risco cirúrgico"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setChatOpen(true)}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Chat desta anamnese
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setOpenRiskOnDetail(false);
                      setEditingDetail(true);
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Abrir e editar
                  </Button>
                </div>
              </div>
              <TabsContent value="analysis">
                <PatientAiDiagnosis anamnesisId={detail.data.id} />
              </TabsContent>
              <TabsContent value="record">
                <div className="mb-4 flex items-center gap-2">
                  <FileText className="text-primary h-4 w-4" />
                  <div>
                    <p className="text-sm font-semibold">
                      {detail.data.chiefComplaint}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(detail.data.date).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
                <SnapshotRecord anamnesis={detail.data} />
              </TabsContent>
            </Tabs>
          ) : (
            <div className="py-12 text-center">
              <AlertTriangle className="text-muted-foreground mx-auto h-6 w-6" />
              <p className="text-muted-foreground mt-2 text-sm">
                Selecione uma anamnese.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
