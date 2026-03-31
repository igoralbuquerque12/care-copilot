import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import * as aiDiagnosisService from "~/server/services/aiDiagnosis";

export const aiDiagnosisRouter = createTRPCRouter({
  getLatestByPatient: protectedProcedure
    .input(z.object({ patientId: z.string() }))
    .query(({ ctx, input }) =>
      aiDiagnosisService.getLatestDiagnosis(ctx.db, input.patientId)
    ),

  markInvalid: protectedProcedure
    .input(z.object({ diagnosisId: z.string() }))
    .mutation(({ ctx, input }) =>
      aiDiagnosisService.markDiagnosisInvalid(ctx.db, ctx.user.id, input.diagnosisId)
    ),
});
