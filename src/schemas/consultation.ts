import { z } from "zod";
import { genderSchema } from "~/schemas/patient";

export const consultationTypeSchema = z.enum(["FIRST_VISIT", "FOLLOW_UP", "ROUTINE"]);

export const createConsultationSchema = z.object({
    patientId: z.string().cuid(),
    date: z.coerce.date().default(() => new Date()),
    type: consultationTypeSchema.default("ROUTINE"),
    anamnesisId: z.string().cuid().optional(),
});

export const updateConsultationSchema = z.object({
    id: z.string().cuid(),
    date: z.coerce.date().optional(),
    type: consultationTypeSchema.optional(),
    anamnesisId: z.string().cuid().optional().nullable(),
});

export const getConsultationByIdSchema = z.object({
    id: z.string().cuid(),
});

export const listConsultationsByPatientSchema = z.object({
    patientId: z.string().cuid(),
});

export const deleteConsultationSchema = z.object({
    id: z.string().cuid(),
});

export type CreateConsultationInput = z.infer<typeof createConsultationSchema>;
export type UpdateConsultationInput = z.infer<typeof updateConsultationSchema>;

export const createScheduleConsultationSchema = z.object({
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

export type CreateScheduleConsultationInput = z.infer<typeof createScheduleConsultationSchema>;
