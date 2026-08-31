import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { createSurgicalRiskSchema, updateSurgicalRiskSchema } from "~/schemas/surgical-risk";
import * as surgicalRiskService from "~/server/services/surgicalRisk.service";

export const surgicalRiskRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createSurgicalRiskSchema)
    .mutation(({ ctx, input }) =>
      surgicalRiskService.createSurgicalRisk(ctx.db, ctx.user.id, input),
    ),

  update: protectedProcedure
    .input(updateSurgicalRiskSchema)
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return surgicalRiskService.updateSurgicalRisk(ctx.db, ctx.user.id, id, data);
    }),

  getByAnamnesisId: protectedProcedure
    .input(z.object({ anamnesisId: z.string().cuid() }))
    .query(({ ctx, input }) =>
      surgicalRiskService.getByAnamnesisId(ctx.db, ctx.user.id, input.anamnesisId),
    ),

  inferFromAnamnesis: protectedProcedure
    .input(z.object({ anamnesisId: z.string().cuid() }))
    .query(({ ctx, input }) =>
      surgicalRiskService.inferFromAnamnesisId(ctx.db, ctx.user.id, input.anamnesisId),
    ),

  getPatientAnamneses: protectedProcedure
    .input(z.object({ patientId: z.string().cuid() }))
    .query(({ ctx, input }) =>
      surgicalRiskService.getPatientAnamnesesForRisk(ctx.db, ctx.user.id, input.patientId),
    ),
});
