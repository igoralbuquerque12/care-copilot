import { z } from "zod";

export const aiProviderSchema = z.enum([
  "OPENAI",
  "GROQ",
  "GEMINI",
  "ANTHROPIC",
]);

export const analysisStatusSchema = z.enum([
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
]);

const conciseText = z.string().trim().min(1).max(8_000);

export const evidenceSchema = z.object({
  date: z.string().max(32),
  field: z.string().max(160),
  note: z.string().max(2_000),
});

export const anamnesisAnalysisResultSchema = z.object({
  summary: conciseText,
  longitudinalComparison: z.object({
    overview: conciseText,
    changes: z.array(z.object({
      field: z.string().max(160),
      currentValue: z.string().max(2_000),
      previousValue: z.string().max(2_000).nullable(),
      previousDate: z.string().max(32).nullable(),
      interpretation: z.string().max(3_000),
    })).max(50),
  }),
  physicianReview: z.array(z.object({
    subject: z.string().max(240),
    physicianEntry: z.string().max(3_000),
    assessment: z.enum(["AGREEMENT", "REVIEW", "INSUFFICIENT_DATA"]),
    rationale: z.string().max(4_000),
  })).max(50),
  aiDiagnosis: z.object({
    primary: conciseText,
    differentials: z.array(z.string().max(2_000)).max(20),
  }),
  riskAlerts: z.array(z.object({
    title: z.string().max(240),
    severity: z.enum(["LOW", "MEDIUM", "HIGH"]),
    rationale: z.string().max(3_000),
  })).max(30),
  suggestedNextSteps: z.array(z.object({
    action: z.string().max(1_000),
    rationale: z.string().max(3_000),
  })).max(30),
  missingQuestions: z.array(z.object({
    question: z.string().max(1_000),
    reason: z.string().max(3_000),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  })).max(30),
  evidence: z.array(evidenceSchema).max(100),
  confidence: z.object({
    score: z.number().int().min(0).max(100),
    level: z.enum(["LOW", "MEDIUM", "HIGH"]),
    rationale: z.string().max(4_000),
    supportingFactors: z.array(z.string().max(1_000)).max(20),
    limitingFactors: z.array(z.string().max(1_000)).max(20),
  }),
  historyCoverage: z.object({
    totalAnamneses: z.number().int().nonnegative(),
    representedAnamneses: z.number().int().nonnegative(),
    totalFields: z.number().int().nonnegative(),
    representedFields: z.number().int().nonnegative(),
    truncatedFields: z.number().int().nonnegative(),
  }),
});

export const saveCredentialSchema = z.object({
  provider: aiProviderSchema,
  apiKey: z.string().trim().min(8).max(2_048),
});

export const removeCredentialSchema = z.object({ provider: aiProviderSchema });

export const saveAnalysisSettingsSchema = z.object({
  provider: aiProviderSchema,
  model: z.string().trim().min(1).max(200).regex(
    /^[A-Za-z0-9._:/-]+$/,
    "Identificador de modelo invalido",
  ),
  customInstructions: z.string().max(8_000).default(""),
});

export const testCredentialSchema = saveAnalysisSettingsSchema.pick({
  provider: true,
  model: true,
});

export const saveAiPromptTemplatesSchema = z.object({
  analysisPromptTemplate: z.string().max(50_000),
  clinicalChatPromptTemplate: z.string().max(50_000),
});

export const analysisByAnamnesisSchema = z.object({
  anamnesisId: z.string().cuid(),
});

export type AiProvider = z.infer<typeof aiProviderSchema>;
export type AnalysisStatus = z.infer<typeof analysisStatusSchema>;
export type AnamnesisAnalysisResult = z.infer<typeof anamnesisAnalysisResultSchema>;
export type SaveAnalysisSettingsInput = z.infer<typeof saveAnalysisSettingsSchema>;
export type SaveAiPromptTemplatesInput = z.infer<
  typeof saveAiPromptTemplatesSchema
>;
