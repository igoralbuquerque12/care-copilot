import { z } from "zod";

export const audioSessionStatusSchema = z.enum([
  "WAITING_FOR_PATIENT",
  "READY",
  "RECORDING",
  "PROCESSING",
  "SYNCED",
  "FINALIZED",
  "ERROR",
  "INSUFFICIENT_CREDITS",
]);

export type AudioSessionStatus = z.infer<typeof audioSessionStatusSchema>;

export const startAudioSessionSchema = z.object({
  patientId: z.string().cuid(),
  consultationId: z.string().cuid().optional(),
});

export type StartAudioSessionInput = z.infer<typeof startAudioSessionSchema>;

export const audioBatchMetadataSchema = z.object({
  sessionId: z.string().cuid(),
  patientId: z.string().cuid(),
  consultationId: z.string().cuid().optional().nullable(),
  batchIndex: z.number().int().min(0),
  hasOverlap: z.boolean(),
  audioDurationSeconds: z.number().min(0),
  startedAt: z.coerce.date(),
  endedAt: z.coerce.date(),
});

export type AudioBatchMetadata = z.infer<typeof audioBatchMetadataSchema>;

export const qstashAudioJobSchema = audioBatchMetadataSchema.extend({
  profileId: z.string().uuid(),
  storagePath: z.string().min(1),
  signedAudioUrl: z.string().url(),
});

export type QstashAudioJob = z.infer<typeof qstashAudioJobSchema>;

export const finalizeAudioSessionSchema = z.object({
  sessionId: z.string().cuid(),
});

export type FinalizeAudioSessionInput = z.infer<
  typeof finalizeAudioSessionSchema
>;
