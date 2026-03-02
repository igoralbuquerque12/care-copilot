// src/features/schedule-consultation/types/schedule-consultation.types.ts

export type ConsultationType = "FIRST_VISIT" | "FOLLOW_UP" | "ROUTINE";

export const CONSULTATION_TYPE_LABELS: Record<ConsultationType, string> = {
    FIRST_VISIT: "Primeira Consulta",
    FOLLOW_UP: "Retorno",
    ROUTINE: "Rotina",
};

export type PatientOption = {
    id: string;
    name: string;
    cpf?: string | null;
};

export type ScheduleConsultationFormData = {
    // Existing patient
    patientId?: string;
    // New patient fields (used when patientId is not set)
    newPatientName: string;
    newPatientBirthDate: string; // "YYYY-MM-DD"
    newPatientGender: "Masculino" | "Feminino" | "Outro" | "";
    newPatientCpf: string;
    // Consultation fields
    date: string; // "YYYY-MM-DD"
    time: string; // "HH:mm"
    type: ConsultationType;
};
