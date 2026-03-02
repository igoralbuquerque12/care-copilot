// src/schemas/patient.ts
import { z } from "zod";

export const genderSchema = z.enum(["Masculino", "Feminino", "Outro"]);

export const createPatientSchema = z.object({
  name: z.string().min(3, "Nome muito curto"),
  birthDate: z.coerce.date(),
  gender: genderSchema,
  cpf: z.string().optional(),
  // Dados opcionais do perfil clínico inicial
  clinicalProfile: z.object({
    hasHypertension: z.boolean().optional(),
    hasDiabetes: z.boolean().optional(),
    diabetesDuration: z.number().optional(),
    allergies: z.string().optional(),
  }).optional(),
});

export const getPatientByIdSchema = z.object({
  id: z.string().cuid(),
});

export const searchPatientSchema = z.object({
  query: z.string().min(1),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type SearchPatientInput = z.infer<typeof searchPatientSchema>;