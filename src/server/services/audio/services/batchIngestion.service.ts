import { type PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { audioBatchMetadataSchema } from "~/schemas/audio-session";
import type { QstashAudioJob } from "~/schemas/audio-session";
import { assertMinimumBalanceForBatch } from "~/server/services/credits/creditLedger.service";
import { messageQueue } from "~/server/messaging";
import { env } from "~/env";
import { AUDIO_QUEUE_RETRIES } from "../audio.config";
import type { IngestInput } from "../entities/audio.entity";
import { createSignedAudioUrl, uploadAudioBatch } from "./batchStorage.service";

const enqueueAudioProcessing = (job: QstashAudioJob) =>
  messageQueue.publish({
    url: `${env.APP_URL}/api/audio/process`,
    body: job,
    retries: AUDIO_QUEUE_RETRIES,
    deduplicationId: `${job.sessionId}:${job.batchIndex}`,
  });

// ── Ingestion ──────────────────────────────────────────────────────────────────

/**
 * Entry point for a new audio batch. Validates session ownership and credit
 * balance, uploads the WAV file to storage, upserts the `AudioBatchRecord`,
 * updates the session status to PROCESSING, and enqueues the processing job.
 *
 * Duplicate batches (same sessionId + batchIndex) that are not in ERROR status
 * are ignored and returned with `deduped: true`.
 *
 * @param db - Prisma client
 * @param input - Ingestion payload: profileId, WAV blob, raw form metadata
 * @returns Object with `{ sessionId, batchIndex, deduped }`
 * @throws FORBIDDEN if the session does not exist or the patient doesn't match
 */
export const ingestBatch = async (db: PrismaClient, input: IngestInput) => {
  const meta = audioBatchMetadataSchema.parse(input.rawPayload);

  const session = await db.audioConsultationSession.findFirst({
    where: { id: meta.sessionId, profileId: input.profileId },
  });

  if (!session) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Sessao nao encontrada" });
  }

  if (session.patientId !== meta.patientId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Paciente nao corresponde a sessao",
    });
  }

  await assertMinimumBalanceForBatch(db, input.profileId);

  const existing = await db.audioBatchRecord.findUnique({
    where: {
      sessionId_batchIndex: { sessionId: meta.sessionId, batchIndex: meta.batchIndex },
    },
  });

  if (existing && existing.status !== "ERROR") {
    return { sessionId: meta.sessionId, batchIndex: meta.batchIndex, deduped: true };
  }

  const storagePath = await uploadAudioBatch(
    input.profileId,
    meta.sessionId,
    meta.batchIndex,
    input.file,
  );

  await db.audioBatchRecord.upsert({
    where: {
      sessionId_batchIndex: { sessionId: meta.sessionId, batchIndex: meta.batchIndex },
    },
    update: {
      storagePath,
      audioDurationSeconds: Math.ceil(meta.audioDurationSeconds),
      status: "PENDING",
      retries: existing ? existing.retries + 1 : 0,
      errorMessage: null,
    },
    create: {
      sessionId: meta.sessionId,
      batchIndex: meta.batchIndex,
      storagePath,
      audioDurationSeconds: Math.ceil(meta.audioDurationSeconds),
      status: "PENDING",
    },
  });

  await db.audioConsultationSession.update({
    where: { id: meta.sessionId },
    data: { status: "PROCESSING" },
  });

  const signedAudioUrl = await createSignedAudioUrl(storagePath);
  console.log("Teste 1 - salvou no supabase o audio")
  await enqueueAudioProcessing({
    ...meta,
    profileId: input.profileId,
    storagePath,
    signedAudioUrl,
  });

  return { sessionId: meta.sessionId, batchIndex: meta.batchIndex, deduped: false };
};
