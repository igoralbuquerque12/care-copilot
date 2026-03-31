export type ConsultationType = "FIRST_VISIT" | "FOLLOW_UP" | "ROUTINE";

export const CONSULTATION_TYPE_LABELS: Record<ConsultationType, string> = {
  FIRST_VISIT: "Primeira Consulta",
  FOLLOW_UP: "Retorno",
  ROUTINE: "Rotina",
};
