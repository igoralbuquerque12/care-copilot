// src/server/api/routers/anamnesis.router.ts
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { createAnamnesisSchema, getAnamnesesFilterSchema } from "~/schemas/anamnesis";
import * as anamnesisService from "~/server/services/anamnesis.service";
import { z } from "zod";

export const anamnesisRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createAnamnesisSchema)
    .mutation(({ ctx, input }) => anamnesisService.createAnamnesis(ctx.db, ctx.user.id, input)),

  getByPatient: protectedProcedure
    .input(z.object({ patientId: z.string().cuid() }))
    .query(({ ctx, input }) => ctx.db.anamnesis.findMany({
      where: { patientId: input.patientId },
      orderBy: { date: 'desc' },
      include: { physicalExam: true, medications: true }
    })),

  listMyAnamneses: protectedProcedure
    .input(getAnamnesesFilterSchema)
    .query(({ ctx, input }) => anamnesisService.listAnamneses(ctx.db, ctx.user.id, input)),
});