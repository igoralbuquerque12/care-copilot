// src/server/api/routers/scheduleConsultation.router.ts
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { genderSchema } from "~/schemas/patient";
import * as scheduleConsultationService from "~/server/services/scheduleConsultation.service";
import { searchPatientSchema } from "~/schemas/patient";
import * as patientService from "~/server/services/patient.service";

const consultationTypeSchema = z.enum(["FIRST_VISIT", "FOLLOW_UP", "ROUTINE"]);

const createScheduleConsultationSchema = z.object({
    patientId: z.string().cuid().optional(),
    newPatient: z
        .object({
            name: z.string().min(3, "Nome muito curto"),
            birthDate: z.coerce.date(),
            gender: genderSchema,
            cpf: z.string().optional(),
        })
        .optional(),
    date: z.string().datetime({ offset: true }),
    type: consultationTypeSchema.default("ROUTINE"),
});

export const scheduleConsultationRouter = createTRPCRouter({
    create: protectedProcedure
        .input(createScheduleConsultationSchema)
        .mutation(async ({ ctx, input }) => {
            const profileId = ctx.user.id;
            return scheduleConsultationService.createScheduleConsultation(
                ctx.db,
                profileId,
                input,
            );
        }),

    listByDate: protectedProcedure
        .input(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }))
        .query(({ ctx, input }) => {
            return scheduleConsultationService.listConsultationsByDate(
                ctx.db,
                ctx.user.id,
                input.date,
            );
        }),

    listPaginated: protectedProcedure
        .input(z.object({
            date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            page: z.number().int().min(1).default(1),
            pageSize: z.number().int().min(1).max(50).default(10),
        }))
        .query(({ ctx, input }) => {
            return scheduleConsultationService.listConsultationsPaginated(
                ctx.db,
                ctx.user.id,
                input.date,
                input.page,
                input.pageSize,
            );
        }),

    chartData: protectedProcedure
        .input(z.object({ days: z.union([z.literal(7), z.literal(30)]) }))
        .query(({ ctx, input }) => {
            return scheduleConsultationService.getChartData(
                ctx.db,
                ctx.user.id,
                input.days,
            );
        }),

    update: protectedProcedure
        .input(z.object({
            id: z.string(),
            date: z.string().optional(),
            type: consultationTypeSchema.optional(),
        }))
        .mutation(({ ctx, input }) => {
            return scheduleConsultationService.updateConsultation(
                ctx.db,
                ctx.user.id,
                input.id,
                { date: input.date, type: input.type },
            );
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(({ ctx, input }) => {
            return scheduleConsultationService.deleteConsultation(
                ctx.db,
                ctx.user.id,
                input.id,
            );
        }),

    searchPatients: protectedProcedure
        .input(searchPatientSchema)
        .query(({ ctx, input }) => {
            return patientService.searchPatients(ctx.db, ctx.user.id, input.query);
        }),
});
