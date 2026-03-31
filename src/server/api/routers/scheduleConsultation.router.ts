import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { consultationTypeSchema, createScheduleConsultationSchema } from "~/schemas/consultation";
import * as scheduleConsultationService from "~/server/services/scheduleConsultation.service";

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
        .input(z.object({
            date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            page: z.number().int().min(1).default(1),
            pageSize: z.number().int().min(1).max(100).default(10),
        }))
        .query(({ ctx, input }) =>
            scheduleConsultationService.listConsultationsPaginated(
                ctx.db,
                ctx.user.id,
                input.date,
                input.page,
                input.pageSize,
            )
        ),

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

    getById: protectedProcedure
        .input(z.object({ id: z.string().cuid() }))
        .query(async ({ ctx, input }) => {
            const consultation = await ctx.db.scheduleConsultation.findFirst({
                where: { id: input.id, profileId: ctx.user.id },
                include: { patient: true },
            });

            if (!consultation) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Consulta não encontrada",
                });
            }

            return consultation;
        }),
});
