import { type PrismaClient, Prisma } from "@prisma/client";
import { calculateCreditConsumptionBreakdown } from "~/server/ai/credits/utils";
import { getAudioTranscriber } from "~/server/ai/transcription";
import {
  consolidatedFormStateSchema,
  type ConsolidatedFormState,
} from "~/schemas/audio-anamnesis-form";
import type { QstashAudioJob } from "~/schemas/audio-session";
import {
  deleteAudioBatch,
  downloadAudioFromSignedUrl,
} from "./audioBatchStorage.service";
import {
  assertMinimumBalanceForBatch,
  debitBatch,
} from "~/server/services/credits/creditLedger.service";
import { mergeBatch } from "./anamnesisMerge.service";

export const processAudioJob = async (db: PrismaClient, job: QstashAudioJob) => {
  const session = await db.audioConsultationSession.findFirst({
    where: { id: job.sessionId, profileId: job.profileId },
  });

  if (!session) {
    throw new Error(`Sessao ${job.sessionId} nao encontrada para profile ${job.profileId}`);
  }

  const batch = await db.audioBatchRecord.findUnique({
    where: {
      sessionId_batchIndex: {
        sessionId: job.sessionId,
        batchIndex: job.batchIndex,
      },
    },
  });

  if (!batch) {
    throw new Error(
      `Lote ${job.batchIndex} nao registrado para a sessao ${job.sessionId}`,
    );
  }

  if (batch.status === "PROCESSED") {
    return { skipped: true as const };
  }

  try {
    await assertMinimumBalanceForBatch(db, job.profileId);
  } catch (error) {
    await db.audioConsultationSession.update({
      where: { id: job.sessionId },
      data: { status: "INSUFFICIENT_CREDITS" },
    });
    throw error;
  }

  await db.audioBatchRecord.update({
    where: { id: batch.id },
    data: { status: "PROCESSING" },
  });

  try {
    const { buffer, mimeType } = await downloadAudioFromSignedUrl(
      job.signedAudioUrl,
    );

    const transcriber = getAudioTranscriber();
    const transcription = await transcriber.transcribe({
      audio: buffer,
      mimeType,
      language: "pt",
    });

    const audioDurationSeconds = Math.max(
      Math.ceil(transcription.durationSeconds ?? job.audioDurationSeconds),
      1,
    );

    const currentFormState = consolidatedFormStateSchema.parse(
      session.currentFormState,
    );

    const merge = await mergeBatch({
      ctx: {
        sessionId: job.sessionId,
        patientId: job.patientId,
        consultationId: job.consultationId ?? null,
        batchIndex: job.batchIndex,
      },
      currentFormState,
      transcript: transcription.text,
    });

    const breakdown = calculateCreditConsumptionBreakdown({
      audioDurationSeconds,
      promptText: merge.promptText,
      outputText: merge.rawOutputText,
    });

    const nextFormState: ConsolidatedFormState = merge.response.nextFormState;

    await db.$transaction(async (tx) => {
      await debitBatch(tx as PrismaClient, {
        profileId: job.profileId,
        sessionId: job.sessionId,
        batchIndex: job.batchIndex,
        breakdown,
      });

      await tx.audioConsultationSession.update({
        where: { id: job.sessionId },
        data: {
          status: "SYNCED",
          lastBatchIndex: Math.max(session.lastBatchIndex, job.batchIndex),
          currentFormState: nextFormState as unknown as Prisma.InputJsonValue,
          lastProcessedTranscript: transcription.text,
          lastFieldOperations:
            merge.response.fieldOperations as unknown as Prisma.InputJsonValue,
        },
      });

      await tx.audioBatchRecord.update({
        where: { id: batch.id },
        data: { status: "PROCESSED", processedAt: new Date() },
      });
    });

    await deleteAudioBatch(job.storagePath);

    return { skipped: false as const, breakdown };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    await db.audioBatchRecord.update({
      where: { id: batch.id },
      data: {
        status: "ERROR",
        errorMessage: message,
        retries: { increment: 1 },
      },
    });
    await db.audioConsultationSession.update({
      where: { id: job.sessionId },
      data: { status: "ERROR", errorMessage: message },
    });
    throw error;
  }
};
