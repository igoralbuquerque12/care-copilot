import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { createPatientSchema, getPatientByIdSchema, searchPatientSchema } from "~/schemas/patient";
import * as patientService from "~/server/services/patient.service";

export const patientRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createPatientSchema)
    .mutation(({ ctx, input }) => {
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

  search: protectedProcedure
    .input(searchPatientSchema)
    .query(({ ctx, input }) => {
      return patientService.searchPatients(ctx.db, ctx.user.id, input.query);
    }),

  getFullProfile: protectedProcedure
    .input(z.object({ patientId: z.string() }))
    .query(({ ctx, input }) =>
      patientService.getFullProfile(ctx.db, ctx.user.id, input.patientId)
    ),

  getAnamnesisPaginated: protectedProcedure
    .input(z.object({
      patientId: z.string(),
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(50).default(10),
    }))
    .query(({ ctx, input }) =>
      patientService.getAnamnesisPaginated(ctx.db, ctx.user.id, input.patientId, input.page, input.pageSize)
    ),

  getOverview: protectedProcedure
    .input(z.object({ patientId: z.string().cuid() }))
    .query(({ ctx, input }) => patientService.getPatientOverview(ctx.db, ctx.user.id, input.patientId)),

  getTimeline: protectedProcedure
    .input(z.object({
      patientId: z.string().cuid(),
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(50).default(10),
    }))
    .query(({ ctx, input }) => patientService.getPatientTimeline(ctx.db, ctx.user.id, input.patientId, input.page, input.pageSize)),

  getAnamnesisDetail: protectedProcedure
    .input(z.object({ patientId: z.string().cuid(), anamnesisId: z.string().cuid() }))
    .query(({ ctx, input }) => patientService.getPatientAnamnesisDetail(ctx.db, ctx.user.id, input.patientId, input.anamnesisId)),

  getTrends: protectedProcedure
    .input(z.object({ patientId: z.string().cuid() }))
    .query(({ ctx, input }) => patientService.getPatientTrends(ctx.db, ctx.user.id, input.patientId)),
});
