import { z } from "zod";

export const clinicalChatAvailabilitySchema = z.enum([
  "AVAILABLE",
  "NOT_CONFIGURED",
  "OPENAI_REQUIRED",
  "OPENAI_CREDENTIAL_UNVERIFIED",
]);

export const getClinicalChatSchema = z.object({
  patientId: z.string().cuid(),
  cursor: z.number().int().positive().optional(),
  limit: z.number().int().min(1).max(100).default(50),
});

export const getClinicalChatAttachmentUrlSchema = z.object({
  patientId: z.string().cuid(),
  attachmentId: z.string().cuid(),
});

export const clinicalChatTurnSchema = z
  .object({
    patientId: z.string().cuid(),
    anamnesisId: z.string().cuid().optional(),
    message: z.string().trim().max(8_000).default(""),
    retryAssistantMessageId: z.string().cuid().optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.retryAssistantMessageId && value.message.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["message"],
        message: "Escreva uma mensagem antes de enviar.",
      });
    }
  });

export type ClinicalChatAvailability = z.infer<
  typeof clinicalChatAvailabilitySchema
>;
export type ClinicalChatTurnInput = z.infer<typeof clinicalChatTurnSchema>;
