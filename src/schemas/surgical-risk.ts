import { z } from "zod";

export const leeFactorsSchema = z.object({
  isHighRiskSurgery: z.boolean().default(false),
  hasIschemicHeartDisease: z.boolean().default(false),
  hasCongestiveHeartFailure: z.boolean().default(false),
  hasCerebrovascularDisease: z.boolean().default(false),
  isInsulinDependent: z.boolean().default(false),
  hasElevatedCreatinine: z.boolean().default(false),
});

export const createSurgicalRiskSchema = z.object({
  anamnesisId: z.string().cuid("ID de anamnese inv�lido"),
  surgeryName: z.string().min(1, "Nome da cirurgia � obrigat�rio"),

  isHighRiskSurgery: z.boolean().default(false),
  hasIschemicHeartDisease: z.boolean().default(false),
  hasCongestiveHeartFailure: z.boolean().default(false),
  hasCerebrovascularDisease: z.boolean().default(false),
  isInsulinDependent: z.boolean().default(false),
  hasElevatedCreatinine: z.boolean().default(false),

  asaClass: z.enum(["I", "II", "III", "IV", "V", "VI"]).optional(),
  mets: z.number().int().min(1).max(12).optional(),
  recommendation: z.string().optional(),
  isCleared: z.boolean().default(true),
});

export const updateSurgicalRiskSchema = createSurgicalRiskSchema
  .partial()
  .extend({ id: z.string().cuid("ID inv�lido") });

export type CreateSurgicalRiskInput = z.infer<typeof createSurgicalRiskSchema>;
export type UpdateSurgicalRiskInput = z.infer<typeof updateSurgicalRiskSchema>;
export type LeeFactors = z.infer<typeof leeFactorsSchema>;
