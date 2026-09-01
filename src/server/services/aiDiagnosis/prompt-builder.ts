import { ANALYSIS_JSON_SHAPE } from "./constants";
import type { BuiltAnalysisPrompt, PatientHistoryForAI } from "./types";
import {
  ANALYSIS_PROMPT_VARIABLES,
  DEFAULT_ANALYSIS_PROMPT_TEMPLATE,
  renderPromptTemplate,
} from "../ai-prompt-templates";

const PREVIOUS_FIELD_LIMIT = 1_500;
const CURRENT_FIELD_LIMIT = 6_000;

const elapsedFrom = (previous: Date, current: Date) => {
  const days = Math.max(0, Math.floor((current.getTime() - previous.getTime()) / 86_400_000));
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  const remainingDays = days % 30;
  return [
    years ? `${years} ano(s)` : "",
    months ? `${months} mes(es)` : "",
    remainingDays || (!years && !months) ? `${remainingDays} dia(s)` : "",
  ].filter(Boolean).join(" e ");
};

const compactFields = (
  fields: Record<string, unknown>,
  maxLength: number,
  counter: { truncated: number },
) => Object.fromEntries(Object.entries(fields).map(([key, rawValue]) => {
  const value = typeof rawValue === "string" ? rawValue : JSON.stringify(rawValue);
  if (!value || value.length <= maxLength) return [key, rawValue];
  counter.truncated += 1;
  return [key, `${value.slice(0, maxLength)}… [campo truncado]`];
}));

export function buildDiagnosisPrompt(
  data: PatientHistoryForAI,
  customInstructions = "",
  promptTemplate = DEFAULT_ANALYSIS_PROMPT_TEMPLATE,
): BuiltAnalysisPrompt {
  const counter = { truncated: 0 };
  const currentDate = data.current.date;
  const previous = data.previous.map((anamnesis) => ({
    date: anamnesis.date.toISOString().slice(0, 10),
    elapsedBeforeCurrent: elapsedFrom(anamnesis.date, currentDate),
    templateName: anamnesis.templateName,
    fields: compactFields(anamnesis.fields, PREVIOUS_FIELD_LIMIT, counter),
  }));
  const current = {
    date: currentDate.toISOString().slice(0, 10),
    templateName: data.current.templateName,
    fields: compactFields(data.current.fields, CURRENT_FIELD_LIMIT, counter),
  };

  const coverage = {
    totalAnamneses: previous.length + 1,
    representedAnamneses: previous.length + 1,
    totalFields: Object.keys(current.fields).length + previous.reduce(
      (total, anamnesis) => total + Object.keys(anamnesis.fields).length,
      0,
    ),
    representedFields: Object.keys(current.fields).length + previous.reduce(
      (total, anamnesis) => total + Object.keys(anamnesis.fields).length,
      0,
    ),
    truncatedFields: counter.truncated,
  };

  const clinicalContext = {
    patient: data.patient,
    clinicalProfile: data.clinicalProfile,
    previousAnamneses: previous,
    currentAnamnesis: current,
    deterministicHistoryCoverage: coverage,
  };
  const systemPrompt = renderPromptTemplate(
    promptTemplate,
    ANALYSIS_PROMPT_VARIABLES,
    {
      contexto_clinico: clinicalContext,
      paciente: data.patient,
      perfil_clinico: data.clinicalProfile,
      anamnese_atual: current,
      anamneses_anteriores: previous,
      cobertura_historico: coverage,
      formato_saida: ANALYSIS_JSON_SHAPE,
      instrucoes_adicionais: customInstructions.trim() || "Nenhuma.",
    },
  );
  const userPrompt = "Execute agora o prompt configurado.";

  return { systemPrompt, userPrompt, coverage };
}
