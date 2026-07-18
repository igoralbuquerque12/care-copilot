// src/features/schedule-consultation/types/schedule-consultation.types.ts
import type { ConsultationType } from "~/types/consultation";

export type { ConsultationType } from "~/types/consultation";
export { CONSULTATION_TYPE_LABELS } from "~/types/consultation";

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
