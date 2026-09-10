import { type PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { audioBatchMetadataSchema } from "~/schemas/audio-session";
import type { QstashAudioJob } from "~/schemas/audio-session";
import { assertMinimumBalanceForBatch } from "~/server/services/credits/credit-ledger.service";
import { messageQueue } from "~/server/messaging";
import { env } from "~/env";
import { AUDIO_QUEUE_RETRIES } from "./audio.config";
import type { IngestInput } from "./audio.types";
import {
  createSignedAudioUrl,
  uploadAudioBatch,
} from "./audio-batch-storage.service";

const enqueueAudioProcessing = (job: QstashAudioJob) =>
  messageQueue.publish({
    url: `${env.APP_URL}/api/audio/process`,
    body: job,
    retries: AUDIO_QUEUE_RETRIES,
    deduplicationId: `${job.sessionId}:${job.batchIndex}`,
  });

export const ingestBatch = async (db: PrismaClient, input: IngestInput) => {
  const meta = audioBatchMetadataSchema.parse(input.rawPayload);

  const session = await db.audioConsultationSession.findFirst({
    where: { id: meta.sessionId, profileId: input.profileId },
  });

  if (!session) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Sessao nao encontrada",
    });
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
      sessionId_batchIndex: {
        sessionId: meta.sessionId,
        batchIndex: meta.batchIndex,
      },
    },
  });

  if (existing && existing.status !== "ERROR") {
    return {
      sessionId: meta.sessionId,
      batchIndex: meta.batchIndex,
      deduped: true,
    };
  }

  const storagePath = await uploadAudioBatch(
    input.profileId,
    meta.sessionId,
    meta.batchIndex,
    input.file,
  );

  await db.audioBatchRecord.upsert({
    where: {
      sessionId_batchIndex: {
        sessionId: meta.sessionId,
        batchIndex: meta.batchIndex,
      },
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
  await enqueueAudioProcessing({
    ...meta,
    profileId: input.profileId,
    storagePath,
    signedAudioUrl,
  });

  return {
    sessionId: meta.sessionId,
    batchIndex: meta.batchIndex,
    deduped: false,
  };
};
