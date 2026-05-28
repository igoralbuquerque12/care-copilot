import { z } from "zod";

export const formFieldTypeSchema = z.enum([
  "TEXT",
  "SHORT_TEXT",
  "NUMBER",
  "BOOLEAN",
  "SELECT",
  "RADIO",
  "DATE",
  "NYHA_CLASS",
  "MEDICATIONS",
]);

export type FormFieldType = z.infer<typeof formFieldTypeSchema>;

export const formFieldOptionSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
});

export const formFieldConfigSchema = z
  .object({
    options: z.array(formFieldOptionSchema).optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    step: z.number().optional(),
    unit: z.string().optional(),
    placeholder: z.string().optional(),
    maxLength: z.number().int().positive().optional(),
    trueLabel: z.string().optional(),
    falseLabel: z.string().optional(),
  })
  .passthrough();

export type FormFieldConfig = z.infer<typeof formFieldConfigSchema>;

export const upsertFormFieldSchema = z.object({
  id: z.string().cuid().optional(),
  key: z
    .string()
    .min(1)
    .regex(/^[A-Za-z][A-Za-z0-9_]*$/, "Use apenas letras, numeros e underline"),
  label: z.string().min(1),
  description: z.string().optional().nullable(),
  order: z.number().int().min(0),
  fieldType: formFieldTypeSchema,
  isRequired: z.boolean().default(false),
  isVisible: z.boolean().default(true),
  config: formFieldConfigSchema.optional().nullable(),
  isSystemField: z.boolean().optional(),
  systemKey: z.string().optional().nullable(),
});

export const upsertFormSectionSchema = z.object({
  id: z.string().cuid().optional(),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  order: z.number().int().min(0),
  isCollapsible: z.boolean().default(false),
  fields: z.array(upsertFormFieldSchema),
});

export const createFormTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  isDefault: z.boolean().default(false),
  sections: z.array(upsertFormSectionSchema).min(1),
});

export const updateFormTemplateSchema = createFormTemplateSchema
  .partial()
  .extend({
    id: z.string().cuid(),
  });

export type CreateFormTemplateInput = z.infer<typeof createFormTemplateSchema>;
export type UpdateFormTemplateInput = z.infer<typeof updateFormTemplateSchema>;

export const SYSTEM_ANAMNESIS_FIELD_KEYS = [
  "chiefComplaint",
  "currentIllnessHistory",
  "treatmentResponse",
  "symptomEvolution",
  "newEvents",
  "nyhaClass",
  "hasPalpitations",
  "hasSyncope",
  "hasEdema",
  "hasChestPain",
  "weight",
  "height",
  "bpSystolic",
  "bpDiastolic",
  "heartRate",
  "oxygenSaturation",
  "heartAuscultation",
  "lungAuscultation",
  "peripheralPulses",
  "edemaGrade",
  "medications",
  "diagnosticHypothesis",
  "conduct",
  "nextRecallDate",
] as const;

export const SYSTEM_ANAMNESIS_FIELD_KEY_SET = new Set<string>(
  SYSTEM_ANAMNESIS_FIELD_KEYS,
);
