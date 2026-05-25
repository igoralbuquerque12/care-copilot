"use client";

import { useState } from "react";
import { PatientSearch } from "./patient-search";
import { PatientInfoCard } from "./patient-info-card";
import { PatientConsultationChart } from "./patient-consultation-chart";
import { PatientAnamnesisTimeline } from "./patient-anamnesis-timeline";
import { PatientAiDiagnosis } from "./patient-ai-diagnosis";
import { AnamnesisDetailPage } from "./anamnesis-detail-page";
import { usePatientDetail } from "../hooks/use-patient-detail";
import { Users } from "lucide-react";

export function PatientsPage() {
  const {
    selectedPatientId,
    selectPatient,
    clearPatient,
    patient,
    isLoadingPatient,
    aiDiagnosis,
    isLoadingAiDiagnosis,
    isErrorAiDiagnosis,
    retryAiDiagnosis,
    markDiagnosisInvalid,
    isMarkingInvalid,
  } = usePatientDetail();

  const [openAnamnesisId, setOpenAnamnesisId] = useState<string | null>(null);

  const openAnamnesis =
    patient?.anamneses.find((a) => a.id === openAnamnesisId) ?? null;

  // ── Anamnesis detail view ──────────────────────────────────────────────────
  if (openAnamnesis && patient) {
    return (
      <div className="h-full flex flex-col">
        <AnamnesisDetailPage
          anamnesis={openAnamnesis}
          patientId={patient.id}
          onBack={() => setOpenAnamnesisId(null)}
        />
      </div>
    );
  }

  // ── Main patient view ──────────────────────────────────────────────────────
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Pacientes
          </h1>
          <p className="text-sm text-muted-foreground">
            Busque e visualize o histórico completo dos seus pacientes
          </p>
        </div>
      </div>

      <PatientSearch
        onSelect={selectPatient}
        onClear={clearPatient}
        selectedPatientId={selectedPatientId}
      />

      {selectedPatientId && (
        <>
          {isLoadingPatient ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">Carregando dados do paciente...</p>
              </div>
            </div>
          ) : patient ? (
            <div className="space-y-6">
              <PatientInfoCard patient={patient} />
              <PatientConsultationChart anamneses={patient.anamneses} />
              <PatientAiDiagnosis
                diagnosis={aiDiagnosis}
                isLoading={isLoadingAiDiagnosis}
                isError={isErrorAiDiagnosis}
                onRetry={retryAiDiagnosis}
                onMarkInvalid={markDiagnosisInvalid}
                isMarkingInvalid={isMarkingInvalid}
              />
              <PatientAnamnesisTimeline
                anamneses={patient.anamneses}
                onOpenDetail={setOpenAnamnesisId}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center py-20">
              <p className="text-muted-foreground">Paciente não encontrado.</p>
            </div>
          )}
        </>
      )}

      {!selectedPatientId && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-4">
            <Users className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-semibold text-muted-foreground">
            Nenhum paciente selecionado
          </h3>
          <p className="mt-1 text-sm text-muted-foreground/70 max-w-md">
            Use a barra de busca acima para encontrar um paciente pelo nome ou CPF e visualizar seu histórico completo.
          </p>
        </div>
      )}
    </div>
  );
}
