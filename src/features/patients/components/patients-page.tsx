"use client";

import { PatientSearch } from "./patient-search";
import { PatientInfoCard } from "./patient-info-card";
import { PatientConsultationChart } from "./patient-consultation-chart";
import { PatientAnamnesisTimeline } from "./patient-anamnesis-timeline";
import { PatientAiDiagnosis } from "./patient-ai-diagnosis";
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

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
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

      {/* Search */}
      <PatientSearch
        onSelect={selectPatient}
        onClear={clearPatient}
        selectedPatientId={selectedPatientId}
      />

      {/* Patient Detail */}
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
              {/* Info Card */}
              <PatientInfoCard patient={patient} />

              {/* Charts */}
              <PatientConsultationChart anamneses={patient.anamneses} />

              {/* AI Diagnosis */}
              <PatientAiDiagnosis
                diagnosis={aiDiagnosis}
                isLoading={isLoadingAiDiagnosis}
                isError={isErrorAiDiagnosis}
                onRetry={retryAiDiagnosis}
                onMarkInvalid={markDiagnosisInvalid}
                isMarkingInvalid={isMarkingInvalid}
              />

              {/* Anamnesis Timeline */}
              <PatientAnamnesisTimeline anamneses={patient.anamneses} />
            </div>
          ) : (
            <div className="flex items-center justify-center py-20">
              <p className="text-muted-foreground">Paciente não encontrado.</p>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
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
