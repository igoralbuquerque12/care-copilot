import type { ConsultationType } from "~/types/consultation";

export type { ConsultationType } from "~/types/consultation";
export { CONSULTATION_TYPE_LABELS } from "~/types/consultation";

export type PatientOption = {
  id: string;
  name: string;
  cpf?: string | null;
};

export type ScheduleConsultationFormData = {
  patientId?: string;
  newPatientName: string;
  newPatientBirthDate: string; // "YYYY-MM-DD"
  newPatientGender: "Masculino" | "Feminino" | "Outro" | "";
  newPatientCpf: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
  type: ConsultationType;
};
