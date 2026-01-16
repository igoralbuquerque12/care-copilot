// src/schemas/anamnesis.ts
import { z } from "zod";

export const consultationTypeSchema = z.enum(["FIRST_VISIT", "FOLLOW_UP", "ROUTINE"]);
export const nyhaClassSchema = z.enum(["I", "II", "III", "IV"]);

export const createAnamnesisSchema = z.object({
  patientId: z.string().cuid(),
  type: consultationTypeSchema,
  chiefComplaint: z.string().min(1, "Campo obrigatório"),
  currentIllnessHistory: z.string().min(1, "Campo obrigatório"),
  treatmentResponse: z.string().optional(),
  symptomEvolution: z.string().optional(),
  newEvents: z.string().optional(),
  nyhaClass: nyhaClassSchema.default("I"),
  // Sintomas
  hasPalpitations: z.boolean().default(false),
  hasSyncope: z.boolean().default(false),
  hasEdema: z.boolean().default(false),
  hasChestPain: z.boolean().default(false),
  // Exame Físico (Aninhado)
  physicalExam: z.object({
    weight: z.number().optional(),
    height: z.number().optional(),
    bpSystolic: z.number().int().optional(),
    bpDiastolic: z.number().int().optional(),
    heartRate: z.number().int().optional(),
    oxygenSaturation: z.number().int().optional(),
    heartAuscultation: z.string().optional(),
    lungAuscultation: z.string().optional(),
    peripheralPulses: z.string().optional(),
    edemaGrade: z.string().optional(),
  }).optional(),
  // Medicamentos (Lista)
  medications: z.array(z.object({
    name: z.string(),
    dosage: z.string(),
    frequency: z.string(),
  })).optional(),
  diagnosticHypothesis: z.string().optional(),
  conduct: z.string().optional(),
  nextRecallDate: z.coerce.date().optional(),
});

export const getAnamnesesFilterSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  type: consultationTypeSchema.optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
});

export type CreateAnamnesisInput = z.infer<typeof createAnamnesisSchema>;