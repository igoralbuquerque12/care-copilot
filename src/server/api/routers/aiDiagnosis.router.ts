import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  analysisByAnamnesisSchema,
  removeCredentialSchema,
  saveAiPromptTemplatesSchema,
  saveAnalysisSettingsSchema,
  saveCredentialSchema,
  testCredentialSchema,
} from "~/schemas/ai-analysis";
import * as analysisService from "~/server/services/aiDiagnosis";
import * as settingsService from "~/server/services/aiDiagnosis/settings";

export const aiDiagnosisRouter = createTRPCRouter({
  getSettings: protectedProcedure.query(({ ctx }) =>
    settingsService.getSettings(ctx.db, ctx.user.id),
  ),
  saveCredential: protectedProcedure
    .input(saveCredentialSchema)
    .mutation(({ ctx, input }) =>
      settingsService.saveCredential(ctx.db, ctx.user.id, input.provider, input.apiKey),
    ),
  removeCredential: protectedProcedure
    .input(removeCredentialSchema)
    .mutation(({ ctx, input }) =>
      settingsService.removeCredential(ctx.db, ctx.user.id, input.provider),
    ),
  testCredential: protectedProcedure
    .input(testCredentialSchema)
    .mutation(({ ctx, input }) =>
      settingsService.testCredential(ctx.db, ctx.user.id, input.provider, input.model),
    ),
  saveSettings: protectedProcedure
    .input(saveAnalysisSettingsSchema)
    .mutation(({ ctx, input }) =>
      settingsService.saveSettings(ctx.db, ctx.user.id, input),
    ),
  savePromptTemplates: protectedProcedure
    .input(saveAiPromptTemplatesSchema)
    .mutation(({ ctx, input }) =>
      settingsService.savePromptTemplates(ctx.db, ctx.user.id, input),
    ),
  getByAnamnesis: protectedProcedure
    .input(analysisByAnamnesisSchema)
    .query(({ ctx, input }) =>
      analysisService.getAnalysisByAnamnesis(ctx.db, ctx.user.id, input.anamnesisId),
    ),
  retry: protectedProcedure
    .input(analysisByAnamnesisSchema)
    .mutation(({ ctx, input }) =>
      analysisService.retryAnalysis(ctx.db, ctx.user.id, input.anamnesisId),
    ),
});
