// src/server/api/routers/patient.router.ts

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { createPatientSchema, getPatientByIdSchema } from "~/schemas/patient";
import * as patientService from "~/server/services/patient.service";

export const patientRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createPatientSchema)
    .mutation(({ ctx, input }) => {
      console.log('contexto de user: ', ctx.user)
      return patientService.createPatient(ctx.db, ctx.user.id, input);
    }),

  get: protectedProcedure
    .input(getPatientByIdSchema)
    .query(({ ctx, input }) => {
      return patientService.getPatientById(ctx.db, ctx.user.id, input.id);
    }),

  list: protectedProcedure.query(({ ctx }) => {
    return patientService.listPatients(ctx.db, ctx.user.id);
  }),
});