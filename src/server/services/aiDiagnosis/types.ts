// src/server/services/aiDiagnosis/types.ts

export type PatientHistoryForAI = {
  patient: {
    name: string;
    gender: string;
    birthDate: Date;
    cpf?: string | null;
  };
  clinicalProfile?: {
    hasHypertension: boolean;
    hasDiabetes: boolean;
    diabetesDuration?: number | null;
    hasDyslipidemia: boolean;
    hasPriorInfarction: boolean;
    priorSurgeries?: string | null;
    allergies?: string | null;
    familyHistoryCoronaryEarly: boolean;
    familyHistorySuddenDeath: boolean;
    familyHistoryOthers?: string | null;
    smokingStatus: boolean;
    smokingPacksYear?: number | null;
    alcoholConsumption?: string | null;
    exerciseLevel: string;
  } | null;
  anamneses: Array<{
    date: Date;
    chiefComplaint: string;
    currentIllnessHistory: string;
    treatmentResponse?: string | null;
    symptomEvolution?: string | null;
    newEvents?: string | null;
    nyhaClass: string;
    hasPalpitations: boolean;
    hasSyncope: boolean;
    hasEdema: boolean;
    hasChestPain: boolean;
    diagnosticHypothesis?: string | null;
    conduct?: string | null;
    physicalExam?: {
      weight?: number | null;
      height?: number | null;
      bpSystolic?: number | null;
      bpDiastolic?: number | null;
      heartRate?: number | null;
      oxygenSaturation?: number | null;
      heartAuscultation?: string | null;
      lungAuscultation?: string | null;
      peripheralPulses?: string | null;
      edemaGrade?: string | null;
    } | null;
    medications: Array<{
      name: string;
      dosage: string;
      frequency: string;
    }>;
  }>;
};

export type AiDiagnosisResult = {
  summary: string;
  mainDiagnosisHypothesis: string;
  differentialDiagnoses: string;
  identifiedPatterns: string;
  riskAlerts: string;
  recommendedActions: string;
  confidenceLevel: "ALTA" | "MEDIA" | "BAIXA";
};
