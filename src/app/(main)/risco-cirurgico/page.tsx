"use client";

import { useState } from "react";
import { HeartPulse, ChevronRight } from "lucide-react";
import { api } from "~/trpc/react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { Badge } from "~/components/ui/badge";
import { PatientSearch } from "~/features/patients/components/patient-search";
import { SurgicalRiskForm } from "~/features/surgical-risk/components/surgical-risk-form";
import { SurgicalRiskReport } from "~/features/surgical-risk/components/surgical-risk-report";

function StepLabel({ number, label, active, done }: { number: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className={`flex items-center gap-2 text-sm ${done ? "text-primary" : active ? "text-foreground font-medium" : "text-muted-foreground"}`}>
      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold border ${done ? "bg-primary border-primary text-primary-foreground" : active ? "border-foreground" : "border-muted-foreground/40"}`}>
        {done ? "✓" : number}
      </span>
      {label}
    </div>
  );
}

export default function RiscoCirurgicoPage() {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedAnamnesisId, setSelectedAnamnesisId] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);

  const { data: anamneses, isLoading: isLoadingAnamneses } =
    api.surgicalRisk.getPatientAnamneses.useQuery(
      { patientId: selectedPatientId! },
      { enabled: !!selectedPatientId },
    );

  const { data: existingRisk } =
    api.surgicalRisk.getByAnamnesisId.useQuery(
      { anamnesisId: selectedAnamnesisId! },
      { enabled: !!selectedAnamnesisId },
    );

  const step = !selectedPatientId ? 1 : !selectedAnamnesisId ? 2 : 3;

  const handleAnamnesisSelect = (id: string) => {
    setSelectedAnamnesisId(id);
    setShowReport(false);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <HeartPulse className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Risco Cirúrgico Perioperatório</h1>
              <p className="text-sm text-muted-foreground">
                Avaliação baseada no Índice de Risco Cardíaco Revisado (Score de Lee / RCRI)
              </p>
            </div>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-3 mt-5 p-3 rounded-lg bg-muted/50">
            <StepLabel number={1} label="Paciente" active={step === 1} done={step > 1} />
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
            <StepLabel number={2} label="Anamnese" active={step === 2} done={step > 2} />
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
            <StepLabel number={3} label="Avaliação" active={step === 3} done={false} />
          </div>
        </div>

        {/* Passo 1: Busca de paciente */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Passo 1 — Selecionar Paciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PatientSearch
              onSelect={(id) => {
                setSelectedPatientId(id);
                setSelectedAnamnesisId(null);
              }}
              onClear={() => {
                setSelectedPatientId(null);
                setSelectedAnamnesisId(null);
              }}
              selectedPatientId={selectedPatientId}
            />
          </CardContent>
        </Card>

        {/* Passo 2: Seleção de anamnese */}
        {selectedPatientId && (
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Passo 2 — Selecionar Anamnese Base
              </CardTitle>
              <CardDescription>
                Escolha uma das últimas consultas registradas para este paciente
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAnamneses ? (
                <div className="text-sm text-muted-foreground animate-pulse">Carregando anamneses...</div>
              ) : !anamneses?.length ? (
                <div className="text-sm text-muted-foreground">
                  Nenhuma anamnese encontrada para este paciente.
                </div>
              ) : (
                <Select onValueChange={handleAnamnesisSelect} value={selectedAnamnesisId ?? ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma anamnese..." />
                  </SelectTrigger>
                  <SelectContent>
                    {anamneses.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        <div className="flex items-center gap-2">
                          <span>
                            {new Intl.DateTimeFormat("pt-BR").format(new Date(a.date))}
                            {" — "}
                            {a.chiefComplaint.slice(0, 50)}
                            {a.chiefComplaint.length > 50 ? "..." : ""}
                          </span>
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          {(a as any).surgicalRisk && (
                            <Badge variant="secondary" className="text-xs">
                              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                              RCRI {(a as any).surgicalRisk.riskClass as string}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>
        )}

        {/* Passo 3: Formulário ou Laudo */}
        {selectedAnamnesisId && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Passo 3 — Avaliação de Risco Cirúrgico
              </CardTitle>
            </CardHeader>
            <CardContent>
              {existingRisk && !showReport ? (
                <>
                  <SurgicalRiskReport
                    assessment={existingRisk}
                    onEdit={() => setShowReport(false)}
                  />
                  <Separator className="my-4" />
                  <button
                    onClick={() => setShowReport(true)}
                    className="text-sm text-primary hover:underline"
                  >
                    Editar avaliação
                  </button>
                </>
              ) : (
                <SurgicalRiskForm
                  anamnesisId={selectedAnamnesisId}
                  onSuccess={() => setShowReport(false)}
                />
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
