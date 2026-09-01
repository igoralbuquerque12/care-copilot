"use client";

import { useState } from "react";
import {
  ClipboardCheck,
  HeartPulse,
  Loader2,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { PatientSearch } from "~/features/patients/components/patient-search";
import { SurgicalRiskForm } from "~/features/surgical-risk/components/surgical-risk-form";
import { SurgicalRiskReport } from "~/features/surgical-risk/components/surgical-risk-report";
import { api } from "~/trpc/react";

function StepLabel({
  number,
  label,
  active,
  done,
}: {
  number: number;
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div
      className={[
        "flex min-w-0 items-center gap-2 rounded-lg px-2 py-2 text-xs sm:px-3 sm:text-sm",
        done
          ? "bg-primary/10 text-primary"
          : active
            ? "bg-background text-foreground font-medium shadow-sm"
            : "text-muted-foreground",
      ].join(" ")}
    >
      <span
        className={[
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
          done
            ? "border-primary bg-primary text-primary-foreground"
            : active
              ? "border-foreground"
              : "border-muted-foreground/40",
        ].join(" ")}
      >
        {done ? "✓" : number}
      </span>
      <span className="truncate">{label}</span>
    </div>
  );
}

export default function RiscoCirurgicoPage() {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    null,
  );
  const [selectedAnamnesisId, setSelectedAnamnesisId] = useState<string | null>(
    null,
  );
  const [isEditingRisk, setIsEditingRisk] = useState(false);

  const { data: anamneses, isLoading: isLoadingAnamneses } =
    api.surgicalRisk.getPatientAnamneses.useQuery(
      { patientId: selectedPatientId! },
      { enabled: Boolean(selectedPatientId) },
    );

  const { data: existingRisk, isLoading: isLoadingRisk } =
    api.surgicalRisk.getByAnamnesisId.useQuery(
      { anamnesisId: selectedAnamnesisId! },
      { enabled: Boolean(selectedAnamnesisId) },
    );

  const step = !selectedPatientId ? 1 : !selectedAnamnesisId ? 2 : 3;

  const handleAnamnesisSelect = (id: string) => {
    setSelectedAnamnesisId(id);
    setIsEditingRisk(false);
  };

  return (
    <main className="bg-background w-full space-y-6 p-4 md:p-6 lg:p-8">
      <header className="flex items-start gap-3">
        <span className="bg-primary/10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
          <HeartPulse className="text-primary h-5 w-5" />
        </span>
        <div>
          <h1 className="text-foreground text-2xl font-semibold md:text-3xl">
            Risco Cirúrgico Perioperatório
          </h1>
          <p className="text-muted-foreground mt-1 max-w-3xl text-sm">
            Avaliação baseada no Índice de Risco Cardíaco Revisado (Score de Lee
            / RCRI).
          </p>
        </div>
      </header>

      <div className="bg-muted/60 grid grid-cols-3 gap-1 rounded-xl p-1.5 sm:gap-2">
        <StepLabel
          number={1}
          label="Paciente"
          active={step === 1}
          done={step > 1}
        />
        <StepLabel
          number={2}
          label="Anamnese"
          active={step === 2}
          done={step > 2}
        />
        <StepLabel
          number={3}
          label="Avaliação"
          active={step === 3}
          done={false}
        />
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.7fr)]">
        <aside className="space-y-4 xl:sticky xl:top-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <UserRound className="text-primary h-4 w-4" />
                1. Selecionar paciente
              </CardTitle>
              <CardDescription>
                Busque pelo nome ou CPF do paciente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PatientSearch
                onSelect={(id) => {
                  setSelectedPatientId(id);
                  setSelectedAnamnesisId(null);
                  setIsEditingRisk(false);
                }}
                onClear={() => {
                  setSelectedPatientId(null);
                  setSelectedAnamnesisId(null);
                  setIsEditingRisk(false);
                }}
                selectedPatientId={selectedPatientId}
              />
            </CardContent>
          </Card>

          <Card className={!selectedPatientId ? "opacity-60" : undefined}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Stethoscope className="text-primary h-4 w-4" />
                2. Selecionar anamnese
              </CardTitle>
              <CardDescription>
                Use uma consulta registrada como base da avaliação.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedPatientId ? (
                <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
                  Selecione um paciente para carregar as anamneses.
                </p>
              ) : isLoadingAnamneses ? (
                <div className="text-muted-foreground flex items-center gap-2 py-3 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando anamneses...
                </div>
              ) : !anamneses?.length ? (
                <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
                  Nenhuma anamnese encontrada para este paciente.
                </p>
              ) : (
                <Select
                  onValueChange={handleAnamnesisSelect}
                  value={selectedAnamnesisId ?? ""}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma anamnese..." />
                  </SelectTrigger>
                  <SelectContent>
                    {anamneses.map((anamnesis) => (
                      <SelectItem key={anamnesis.id} value={anamnesis.id}>
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="truncate">
                            {new Intl.DateTimeFormat("pt-BR").format(
                              new Date(anamnesis.date),
                            )}
                            {" — "}
                            {anamnesis.chiefComplaint}
                          </span>
                          {anamnesis.surgicalRisk && (
                            <Badge
                              variant="secondary"
                              className="shrink-0 text-xs"
                            >
                              RCRI {anamnesis.surgicalRisk.riskClass}
                            </Badge>
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>
        </aside>

        <section className="min-w-0" aria-label="Avaliação de risco cirúrgico">
          {!selectedAnamnesisId ? (
            <Card className="flex min-h-72 items-center justify-center border-dashed">
              <CardContent className="max-w-md py-12 text-center">
                <span className="bg-primary/10 mx-auto flex h-12 w-12 items-center justify-center rounded-2xl">
                  <ClipboardCheck className="text-primary h-6 w-6" />
                </span>
                <h2
                  id="risk-assessment-title"
                  className="text-foreground mt-4 font-semibold"
                >
                  Avaliação de risco
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  Selecione o paciente e uma anamnese para preencher ou
                  consultar o laudo de risco cirúrgico.
                </p>
              </CardContent>
            </Card>
          ) : isLoadingRisk ? (
            <Card>
              <CardContent className="text-muted-foreground flex min-h-72 items-center justify-center gap-2 text-sm">
                <Loader2 className="h-5 w-5 animate-spin" />
                Carregando avaliação...
              </CardContent>
            </Card>
          ) : existingRisk && !isEditingRisk ? (
            <SurgicalRiskReport
              assessment={existingRisk}
              onEdit={() => setIsEditingRisk(true)}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle id="risk-assessment-title">
                  3. Avaliação de risco cirúrgico
                </CardTitle>
                <CardDescription>
                  Confirme os dados clínicos e registre o parecer médico.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SurgicalRiskForm
                  anamnesisId={selectedAnamnesisId}
                  onSuccess={() => setIsEditingRisk(false)}
                />
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </main>
  );
}
