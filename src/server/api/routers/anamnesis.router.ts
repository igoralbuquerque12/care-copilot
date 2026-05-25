import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { createAnamnesisSchema, getAnamnesesFilterSchema, updateAnamnesisSchema } from "~/schemas/anamnesis";
import * as anamnesisService from "~/server/services/anamnesis.service";
import { z } from "zod";

export const anamnesisRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createAnamnesisSchema)
    .mutation(({ ctx, input }) => anamnesisService.createAnamnesis(ctx.db, ctx.user.id, input)),

  update: protectedProcedure
    .input(updateAnamnesisSchema)
    .mutation(({ ctx, input }) => anamnesisService.updateAnamnesis(ctx.db, ctx.user.id, input)),

  getByPatient: protectedProcedure
    .input(z.object({ patientId: z.string().cuid() }))
    .query(({ ctx, input }) =>
      anamnesisService.getByPatient(ctx.db, ctx.user.id, input.patientId)
    ),

  listMyAnamneses: protectedProcedure
    .input(getAnamnesesFilterSchema)
    .query(({ ctx, input }) => anamnesisService.listAnamneses(ctx.db, ctx.user.id, input)),
});