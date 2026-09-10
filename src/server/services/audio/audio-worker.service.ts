import type { Prisma, PrismaClient } from "@prisma/client";
import { calculateCreditConsumptionBreakdown } from "~/server/ai/credits/utils";
import { getAudioTranscriber } from "~/server/ai/transcription";
import { aiClientAudio } from "~/server/ai";
import {
  consolidatedFormStateSchema,
  buildConsolidatedFormStateSchemaDescription,
  llmExtractionResponseSchema,
  type ConsolidatedFormState,
} from "~/schemas/audio-anamnesis-form";
import type { QstashAudioJob } from "~/schemas/audio-session";
import {
  assertMinimumBalanceForBatch,
  debitBatch,
} from "~/server/services/credits/credit-ledger.service";
import {
  deleteAudioBatch,
  downloadAudioFromSignedUrl,
} from "./audio-batch-storage.service";
import type { MergeContext, MergeResult } from "./audio.types";
import {
  getDefaultTemplate,
  getTemplateById,
} from "~/server/services/form-templates/form-template.service";

const SYSTEM_PROMPT = `Voce e um parser clinico especializado em atualizar formularios de anamnese.
Sua funcao e analisar uma nova transcricao de audio medico e atualizar um JSON existente.

Regras obrigatorias:
1. Retorne somente JSON valido.
2. Nao invente informacoes ausentes.
3. A transcricao pode conter frases repetidas no inicio por causa de overlap entre lotes.
4. Atualize o JSON de forma idempotente.
5. Nao duplique sintomas, eventos ou medicacoes.
6. So substitua um valor anterior quando a nova transcricao contradizer claramente o valor antigo ou trouxer uma versao mais precisa.
7. Quando a nova fala apenas complementar o valor anterior, una os textos com coerencia sem repetir conteudo.
8. Respeite estritamente os tipos e enums do schema fornecido.
9. Se estiver em duvida, preserve o valor anterior.`;

const buildUserPrompt = (
  ctx: MergeContext,
  currentFormState: ConsolidatedFormState,
  transcript: string,
  template?: Awaited<ReturnType<typeof getDefaultTemplate>>,
) => {
  const customFieldLines =
    template?.sections.flatMap((section) =>
      section.fields
        .filter((field) => !field.isSystemField)
        .map(
          (field) =>
            `- customFields.${field.key} (${field.fieldType}): "${field.label}"`,
        ),
    ) ?? [];
  const customFieldsDescription = customFieldLines.length
    ? customFieldLines.join("\n")
    : "Nenhum";

  return `Contexto da sessao:
- sessionId: ${ctx.sessionId}
- patientId: ${ctx.patientId}
- consultationId: ${ctx.consultationId ?? "null"}
- batchIndex: ${ctx.batchIndex}

Observacao importante:
O inicio desta transcricao pode repetir os ultimos segundos do lote anterior. Considere essas frases como overlap e nao como informacao nova por padrao.

${buildConsolidatedFormStateSchemaDescription(template)}

Campos personalizados do medico a preencher em customFields:
${customFieldsDescription}

Formulario atual (JSON):
${JSON.stringify(currentFormState)}

Nova transcricao:
"""${transcript}"""

Retorne um objeto JSON com exatamente as chaves:
1. "nextFormState" - o JSON consolidado atualizado, mantendo o mesmo schema do formulario atual.
2. "fieldOperations" - mapa de "secao.campo" => { "action": "replace"|"append"|"merge"|"noop", "reason": string }.`;
};

const mergeBatch = async (params: {
  ctx: MergeContext;
  currentFormState: ConsolidatedFormState;
  transcript: string;
  template?: Awaited<ReturnType<typeof getDefaultTemplate>>;
}): Promise<MergeResult> => {
  const userPrompt = buildUserPrompt(
    params.ctx,
    params.currentFormState,
    params.transcript,
    params.template,
  );
  const fullPrompt = `${SYSTEM_PROMPT}\n\n${userPrompt}`;

  const raw = await aiClientAudio.generate({
    prompt: fullPrompt,
    responseFormat: "json",
  });
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.text);
  } catch (error) {
    throw new Error(
      `LLM retornou JSON invalido: ${(error as Error).message}. Texto: ${raw.text.slice(0, 200)}...`,
    );
  }

  // Some models wrap the object in a single-element array under JSON mode.
  if (Array.isArray(parsed) && parsed.length === 1) {
    parsed = parsed[0];
  }

  const validated = llmExtractionResponseSchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error(
      `Saida do LLM nao corresponde ao schema esperado: ${validated.error.message}`,
    );
  }

  return {
    response: validated.data,
    promptText: fullPrompt,
    rawOutputText: raw.text,
  };
};

export const processAudioJob = async (
  db: PrismaClient,
  job: QstashAudioJob,
) => {
  const session = await db.audioConsultationSession.findFirst({
    where: { id: job.sessionId, profileId: job.profileId },
  });

  if (!session) {
    throw new Error(
      `Sessao ${job.sessionId} nao encontrada para profile ${job.profileId}`,
    );
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
    const template = currentFormState.templateId
      ? await getTemplateById(db, job.profileId, currentFormState.templateId)
      : await getDefaultTemplate(db, job.profileId);

    const merge = await mergeBatch({
      ctx: {
        sessionId: job.sessionId,
        patientId: job.patientId,
        consultationId: job.consultationId ?? null,
        batchIndex: job.batchIndex,
      },
      currentFormState,
      transcript: transcription.text,
      template,
    });

    const breakdown = calculateCreditConsumptionBreakdown({
      audioDurationSeconds,
      promptText: merge.promptText,
      outputText: merge.rawOutputText,
    });

    const nextFormState: ConsolidatedFormState = merge.response.nextFormState;

    await db.$transaction(async (tx) => {
      await debitBatch(tx, {
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
          lastFieldOperations: merge.response
            .fieldOperations as unknown as Prisma.InputJsonValue,
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
    const message =
      error instanceof Error ? error.message : "Erro desconhecido";
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
