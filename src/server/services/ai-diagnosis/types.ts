import type { AnamnesisAnalysisResult } from "~/schemas/ai-analysis";

export type AnalysisAnamnesisInput = {
  id: string;
  date: Date;
  templateName: string;
  fields: Record<string, unknown>;
};

export type PatientHistoryForAI = {
  patient: { ageAtCurrentAnamnesis: number; gender: string };
  clinicalProfile: Record<string, unknown> | null;
  current: AnalysisAnamnesisInput;
  previous: AnalysisAnamnesisInput[];
};

export type BuiltAnalysisPrompt = {
  systemPrompt: string;
  userPrompt: string;
  coverage: AnamnesisAnalysisResult["historyCoverage"];
};
