"use client";

import { useState, useCallback } from "react";
import { api } from "~/trpc/react";
import { toast } from "sonner";

export function usePatientDetail() {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const patientQuery = api.patient.getFullProfile.useQuery(
    { patientId: selectedPatientId! },
    { enabled: !!selectedPatientId }
  );

  const aiDiagnosisQuery = api.aiDiagnosis.getLatestByPatient.useQuery(
    { patientId: selectedPatientId! },
    { enabled: !!selectedPatientId }
  );

  const markInvalidMutation = api.aiDiagnosis.markInvalid.useMutation({
    onSuccess: () => {
      toast.success("Feedback registrado. Obrigado!");
      void aiDiagnosisQuery.refetch();
    },
    onError: () => {
      toast.error("Erro ao registrar feedback.");
    },
  });

  const selectPatient = useCallback((id: string) => {
    setSelectedPatientId(id);
  }, []);

  const clearPatient = useCallback(() => {
    setSelectedPatientId(null);
  }, []);

  const markDiagnosisInvalid = useCallback(
    (diagnosisId: string) => {
      markInvalidMutation.mutate({ diagnosisId });
    },
    [markInvalidMutation]
  );

  return {
    selectedPatientId,
    selectPatient,
    clearPatient,
    patient: patientQuery.data,
    isLoadingPatient: patientQuery.isLoading,
    aiDiagnosis: aiDiagnosisQuery.data,
    isLoadingAiDiagnosis: aiDiagnosisQuery.isLoading,
    isErrorAiDiagnosis: aiDiagnosisQuery.isError,
    retryAiDiagnosis: () => void aiDiagnosisQuery.refetch(),
    markDiagnosisInvalid,
    isMarkingInvalid: markInvalidMutation.isPending,
  };
}
