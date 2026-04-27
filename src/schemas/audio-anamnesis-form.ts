import { z } from "zod";
import { genderSchema } from "~/schemas/patient";
import { nyhaClassSchema } from "~/schemas/anamnesis";

const exerciseLevelSchema = z.enum(["SEDENTARIO", "IRREGULAR", "ATIVO"]);

const medicationSchema = z.object({
  name: z.string(),
  dosage: z.string(),
  frequency: z.string(),
});

const clinicalProfileFormSchema = z.object({
  hasHypertension: z.boolean().nullable().optional(),
  hasDiabetes: z.boolean().nullable().optional(),
  diabetesDuration: z.number().int().nullable().optional(),
  allergies: z.string().optional(),
  hasDyslipidemia: z.boolean().nullable().optional(),
  hasPriorInfarction: z.boolean().nullable().optional(),
  priorSurgeries: z.string().optional(),
  familyHistoryCoronaryEarly: z.boolean().nullable().optional(),
  familyHistorySuddenDeath: z.boolean().nullable().optional(),
  familyHistoryOthers: z.string().optional(),
  smokingStatus: z.boolean().nullable().optional(),
  smokingPacksYear: z.number().int().nullable().optional(),
  alcoholConsumption: z.string().optional(),
  exerciseLevel: exerciseLevelSchema.nullable().optional(),
});

const patientFormSchema = z.object({
  name: z.string(),
  birthDate: z.coerce.date().nullable().optional(),
  gender: genderSchema.nullable().optional(),
  cpf: z.string().optional(),
  clinicalProfile: clinicalProfileFormSchema,
});

const physicalExamFormSchema = z.object({
  weight: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  bpSystolic: z.number().int().nullable().optional(),
  bpDiastolic: z.number().int().nullable().optional(),
  heartRate: z.number().int().nullable().optional(),
  oxygenSaturation: z.number().int().nullable().optional(),
  heartAuscultation: z.string().optional(),
  lungAuscultation: z.string().optional(),
  peripheralPulses: z.string().optional(),
  edemaGrade: z.string().optional(),
});

const anamnesisFormSchema = z.object({
  consultationId: z.string().nullable().optional(),
  chiefComplaint: z.string().default(""),
  currentIllnessHistory: z.string().default(""),
  treatmentResponse: z.string().default(""),
  symptomEvolution: z.string().default(""),
  newEvents: z.string().default(""),
  nyhaClass: nyhaClassSchema.nullable().optional(),
  hasPalpitations: z.boolean().nullable().optional(),
  hasSyncope: z.boolean().nullable().optional(),
  hasEdema: z.boolean().nullable().optional(),
  hasChestPain: z.boolean().nullable().optional(),
  physicalExam: physicalExamFormSchema,
  medications: z.array(medicationSchema).default([]),
  diagnosticHypothesis: z.string().default(""),
  conduct: z.string().default(""),
  nextRecallDate: z.coerce.date().nullable().optional(),
});

export const consolidatedFormStateSchema = z.object({
  patient: patientFormSchema,
  anamnesis: anamnesisFormSchema,
});

export type ConsolidatedFormState = z.infer<typeof consolidatedFormStateSchema>;

export const fieldOperationSchema = z.object({
  action: z.enum(["replace", "append", "merge", "noop"]),
  reason: z.string(),
});

export const llmExtractionResponseSchema = z.object({
  nextFormState: consolidatedFormStateSchema,
  fieldOperations: z.record(z.string(), fieldOperationSchema).default({}),
});

export type LlmExtractionResponse = z.infer<typeof llmExtractionResponseSchema>;

export const buildEmptyConsolidatedFormState = (
  partial?: Partial<{
    patient: Partial<ConsolidatedFormState["patient"]>;
    anamnesis: Partial<ConsolidatedFormState["anamnesis"]>;
  }>,
): ConsolidatedFormState => {
  return consolidatedFormStateSchema.parse({
    patient: {
      name: partial?.patient?.name ?? "",
      birthDate: partial?.patient?.birthDate ?? null,
      gender: partial?.patient?.gender ?? null,
      cpf: partial?.patient?.cpf ?? "",
      clinicalProfile: partial?.patient?.clinicalProfile ?? {},
    },
    anamnesis: {
      consultationId: partial?.anamnesis?.consultationId ?? null,
      chiefComplaint: partial?.anamnesis?.chiefComplaint ?? "",
      currentIllnessHistory: partial?.anamnesis?.currentIllnessHistory ?? "",
      treatmentResponse: partial?.anamnesis?.treatmentResponse ?? "",
      symptomEvolution: partial?.anamnesis?.symptomEvolution ?? "",
      newEvents: partial?.anamnesis?.newEvents ?? "",
      nyhaClass: partial?.anamnesis?.nyhaClass ?? null,
      hasPalpitations: partial?.anamnesis?.hasPalpitations ?? null,
      hasSyncope: partial?.anamnesis?.hasSyncope ?? null,
      hasEdema: partial?.anamnesis?.hasEdema ?? null,
      hasChestPain: partial?.anamnesis?.hasChestPain ?? null,
      physicalExam: partial?.anamnesis?.physicalExam ?? {},
      medications: partial?.anamnesis?.medications ?? [],
      diagnosticHypothesis: partial?.anamnesis?.diagnosticHypothesis ?? "",
      conduct: partial?.anamnesis?.conduct ?? "",
      nextRecallDate: partial?.anamnesis?.nextRecallDate ?? null,
    },
  });
};

export const consolidatedFormStateSchemaDescription = `Schema esperado (JSON):
{
  "patient": {
    "name": string,
    "birthDate": string ISO ou null,
    "gender": "Masculino" | "Feminino" | "Outro" | null,
    "cpf": string,
    "clinicalProfile": {
      "hasHypertension": boolean | null,
      "hasDiabetes": boolean | null,
      "diabetesDuration": int (anos) | null,
      "allergies": string,
      "hasDyslipidemia": boolean | null,
      "hasPriorInfarction": boolean | null,
      "priorSurgeries": string,
      "familyHistoryCoronaryEarly": boolean | null,
      "familyHistorySuddenDeath": boolean | null,
      "familyHistoryOthers": string,
      "smokingStatus": boolean | null,
      "smokingPacksYear": int | null,
      "alcoholConsumption": string,
      "exerciseLevel": "SEDENTARIO" | "IRREGULAR" | "ATIVO" | null
    }
  },
  "anamnesis": {
    "consultationId": string | null,
    "chiefComplaint": string,
    "currentIllnessHistory": string,
    "treatmentResponse": string,
    "symptomEvolution": string,
    "newEvents": string,
    "nyhaClass": "I" | "II" | "III" | "IV" | null,
    "hasPalpitations": boolean | null,
    "hasSyncope": boolean | null,
    "hasEdema": boolean | null,
    "hasChestPain": boolean | null,
    "physicalExam": {
      "weight": number (kg) | null,
      "height": number (cm) | null,
      "bpSystolic": int (mmHg) | null,
      "bpDiastolic": int (mmHg) | null,
      "heartRate": int (bpm) | null,
      "oxygenSaturation": int (%) | null,
      "heartAuscultation": string,
      "lungAuscultation": string,
      "peripheralPulses": string,
      "edemaGrade": string
    },
    "medications": Array<{ "name": string, "dosage": string, "frequency": string }>,
    "diagnosticHypothesis": string,
    "conduct": string,
    "nextRecallDate": string ISO ou null
  }
}`;
