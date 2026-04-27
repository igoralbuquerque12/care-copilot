export const VALID_CONFIDENCE_LEVELS = ["ALTA", "MEDIA", "BAIXA"] as const;

export const DEFAULT_CONFIDENCE_LEVEL = "MEDIA" as const;

/** Schema JSON embutido no prompt para instruir o modelo sobre o formato esperado */
export const AI_DIAGNOSIS_RESPONSE_SCHEMA = `{
  "summary": "Resumo geral do quadro clínico do paciente em 2-3 parágrafos",
  "mainDiagnosisHypothesis": "Hipótese diagnóstica principal baseada no conjunto de dados",
  "differentialDiagnoses": "Diagnósticos diferenciais a considerar, separados por ponto e vírgula",
  "identifiedPatterns": "Padrões identificados ao longo das consultas (progressão, tendências, correlações)",
  "riskAlerts": "Alertas de risco que o médico deve considerar",
  "recommendedActions": "Ações recomendadas: exames, ajustes de medicação, encaminhamentos",
  "confidenceLevel": "ALTA, MEDIA ou BAIXA — baseado na quantidade e qualidade dos dados disponíveis"
}`;
