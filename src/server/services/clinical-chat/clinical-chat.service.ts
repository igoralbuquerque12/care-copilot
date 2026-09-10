import type { PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import type { ClinicalChatTurnInput } from "../../../schemas/clinical-chat";
import {
  getClinicalChatAvailability,
  resolveClinicalChatCredential,
} from "./availability";
import {
  CLINICAL_CHAT_MAX_TOTAL_ATTACHMENT_BYTES,
  CLINICAL_CHAT_MODEL,
  CLINICAL_CHAT_STALE_LOCK_MS,
} from "./constants";
import {
  createSignedClinicalAttachmentUrl,
  deleteClinicalAttachments,
  uploadClinicalAttachments,
  type ValidatedClinicalAttachment,
} from "./storage";

const assertPatientAndResolveAnamnesis = async (
  db: PrismaClient,
  profileId: string,
  patientId: string,
  requestedAnamnesisId?: string,
) => {
  const patient = await db.patient.findFirst({
    where: { id: patientId, profileId },
    select: {
      id: true,
      anamneses: {
        where: requestedAnamnesisId ? { id: requestedAnamnesisId } : undefined,
        orderBy: [{ date: "desc" }, { id: "desc" }],
        take: 1,
        select: { id: true },
      },
    },
  });
  if (!patient)
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Paciente nao encontrado.",
    });
  if (
    requestedAnamnesisId &&
    patient.anamneses[0]?.id !== requestedAnamnesisId
  ) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Anamnese nao encontrada para este paciente.",
    });
  }
  return patient.anamneses[0]?.id;
};

const getOrCreateChat = async (
  db: PrismaClient,
  profileId: string,
  patientId: string,
) => {
  const existing = await db.clinicalChat.findUnique({
    where: { profileId_patientId: { profileId, patientId } },
  });
  if (existing) return existing;
  try {
    return await db.clinicalChat.create({ data: { profileId, patientId } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return db.clinicalChat.findUniqueOrThrow({
        where: { profileId_patientId: { profileId, patientId } },
      });
    }
    throw error;
  }
};

const acquireGenerationLock = async (db: PrismaClient, chatId: string) => {
  const staleBefore = new Date(Date.now() - CLINICAL_CHAT_STALE_LOCK_MS);
  const locked = await db.clinicalChat.updateMany({
    where: {
      id: chatId,
      OR: [
        { isGenerating: false },
        { generationStartedAt: null },
        { generationStartedAt: { lt: staleBefore } },
      ],
    },
    data: { isGenerating: true, generationStartedAt: new Date() },
  });
  if (locked.count === 0) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Ja existe uma resposta sendo gerada para este paciente.",
    });
  }
};

export const releaseGenerationLock = async (
  db: PrismaClient,
  chatId: string,
) => {
  await db.clinicalChat.updateMany({
    where: { id: chatId },
    data: { isGenerating: false, generationStartedAt: null },
  });
};

export const getClinicalChat = async (
  db: PrismaClient,
  profileId: string,
  input: { patientId: string; cursor?: number; limit: number },
) => {
  await assertPatientAndResolveAnamnesis(db, profileId, input.patientId);
  const [availability, chat] = await Promise.all([
    getClinicalChatAvailability(db, profileId),
    db.clinicalChat.findUnique({
      where: { profileId_patientId: { profileId, patientId: input.patientId } },
      select: { id: true, isGenerating: true },
    }),
  ]);

  if (!chat) {
    return {
      availability,
      chatId: null,
      isGenerating: false,
      messages: [],
      nextCursor: undefined,
      attachmentBytes: 0,
    };
  }

  const [rows, aggregate] = await Promise.all([
    db.clinicalChatMessage.findMany({
      where: {
        chatId: chat.id,
        sequence: input.cursor ? { lt: input.cursor } : undefined,
      },
      orderBy: { sequence: "desc" },
      take: input.limit + 1,
      select: {
        id: true,
        sequence: true,
        role: true,
        status: true,
        content: true,
        contextAnamnesisId: true,
        model: true,
        errorMessage: true,
        createdAt: true,
        completedAt: true,
        attachments: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            originalName: true,
            mimeType: true,
            sizeBytes: true,
          },
        },
      },
    }),
    db.clinicalChatAttachment.aggregate({
      where: { message: { chatId: chat.id } },
      _sum: { sizeBytes: true },
    }),
  ]);
  const hasMore = rows.length > input.limit;
  const page = hasMore ? rows.slice(0, input.limit) : rows;
  const nextCursor = hasMore ? page.at(-1)?.sequence : undefined;

  return {
    availability,
    chatId: chat.id,
    isGenerating: chat.isGenerating,
    messages: page.reverse(),
    nextCursor,
    attachmentBytes: aggregate._sum.sizeBytes ?? 0,
  };
};

export const getClinicalChatAttachmentUrl = async (
  db: PrismaClient,
  profileId: string,
  patientId: string,
  attachmentId: string,
) => {
  const attachment = await db.clinicalChatAttachment.findFirst({
    where: {
      id: attachmentId,
      message: { chat: { profileId, patientId } },
    },
    select: { storagePath: true, originalName: true },
  });
  if (!attachment) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Anexo nao encontrado.",
    });
  }
  return {
    url: await createSignedClinicalAttachmentUrl(attachment.storagePath),
    originalName: attachment.originalName,
  };
};

export type PreparedClinicalChatTurn = {
  chatId: string;
  patientId: string;
  anamnesisId?: string;
  userMessageId?: string;
  assistantMessageId: string;
  apiKey: string;
};

export const prepareClinicalChatTurn = async (
  db: PrismaClient,
  profileId: string,
  input: ClinicalChatTurnInput,
  files: ValidatedClinicalAttachment[],
): Promise<PreparedClinicalChatTurn> => {
  const apiKey = await resolveClinicalChatCredential(db, profileId);
  const anamnesisId = await assertPatientAndResolveAnamnesis(
    db,
    profileId,
    input.patientId,
    input.anamnesisId,
  );
  const chat = await getOrCreateChat(db, profileId, input.patientId);
  await acquireGenerationLock(db, chat.id);

  let uploadedPaths: string[] = [];
  try {
    if (input.retryAssistantMessageId) {
      if (files.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Nao e possivel adicionar anexos ao repetir uma resposta.",
        });
      }
      const failed = await db.clinicalChatMessage.findFirst({
        where: {
          id: input.retryAssistantMessageId,
          chatId: chat.id,
          role: "ASSISTANT",
          status: "FAILED",
        },
        select: { id: true, sequence: true },
      });
      const last = await db.clinicalChatMessage.findFirst({
        where: { chatId: chat.id },
        orderBy: { sequence: "desc" },
        select: { sequence: true },
      });
      if (!failed || failed.sequence !== last?.sequence) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Somente a ultima resposta com falha pode ser repetida.",
        });
      }
      await db.clinicalChatMessage.update({
        where: { id: failed.id },
        data: {
          status: "STREAMING",
          content: "",
          contextAnamnesisId: anamnesisId,
          model: CLINICAL_CHAT_MODEL,
          errorCode: null,
          errorMessage: null,
          inputTokens: null,
          outputTokens: null,
          completedAt: null,
        },
      });
      return {
        chatId: chat.id,
        patientId: input.patientId,
        anamnesisId,
        assistantMessageId: failed.id,
        apiKey,
      };
    }

    const existingTotal = await db.clinicalChatAttachment.aggregate({
      where: { message: { chatId: chat.id } },
      _sum: { sizeBytes: true },
    });
    const newTotal = files.reduce((total, file) => total + file.sizeBytes, 0);
    if (
      (existingTotal._sum.sizeBytes ?? 0) + newTotal >
      CLINICAL_CHAT_MAX_TOTAL_ATTACHMENT_BYTES
    ) {
      throw new TRPCError({
        code: "PAYLOAD_TOO_LARGE",
        message: "Os anexos deste chat atingiriam o limite acumulado de 50 MB.",
      });
    }

    const stored = await uploadClinicalAttachments(
      profileId,
      input.patientId,
      chat.id,
      files,
    );
    uploadedPaths = stored.map((item) => item.storagePath);

    const created = await db.$transaction(async (tx) => {
      const currentChat = await tx.clinicalChat.findUniqueOrThrow({
        where: { id: chat.id },
        select: { nextSequence: true },
      });
      const user = await tx.clinicalChatMessage.create({
        data: {
          chatId: chat.id,
          sequence: currentChat.nextSequence,
          role: "USER",
          status: "COMPLETED",
          content: input.message,
          contextAnamnesisId: anamnesisId,
          completedAt: new Date(),
          attachments: {
            create: stored.map((attachment) => ({
              storagePath: attachment.storagePath,
              originalName: attachment.originalName,
              mimeType: attachment.mimeType,
              sizeBytes: attachment.sizeBytes,
            })),
          },
        },
      });
      const assistant = await tx.clinicalChatMessage.create({
        data: {
          chatId: chat.id,
          sequence: currentChat.nextSequence + 1,
          role: "ASSISTANT",
          status: "STREAMING",
          contextAnamnesisId: anamnesisId,
          model: CLINICAL_CHAT_MODEL,
        },
      });
      await tx.clinicalChat.update({
        where: { id: chat.id },
        data: { nextSequence: { increment: 2 } },
      });
      return { user, assistant };
    });

    return {
      chatId: chat.id,
      patientId: input.patientId,
      anamnesisId,
      userMessageId: created.user.id,
      assistantMessageId: created.assistant.id,
      apiKey,
    };
  } catch (error) {
    await deleteClinicalAttachments(uploadedPaths);
    await releaseGenerationLock(db, chat.id);
    throw error;
  }
};

export const completeClinicalChatTurn = async (
  db: PrismaClient,
  turn: PreparedClinicalChatTurn,
  content: string,
  usage?: { inputTokens?: number; outputTokens?: number },
) => {
  await db.$transaction([
    db.clinicalChatMessage.update({
      where: { id: turn.assistantMessageId },
      data: {
        status: "COMPLETED",
        content,
        inputTokens: usage?.inputTokens,
        outputTokens: usage?.outputTokens,
        completedAt: new Date(),
      },
    }),
    db.clinicalChat.update({
      where: { id: turn.chatId },
      data: { isGenerating: false, generationStartedAt: null },
    }),
  ]);
};

export const failClinicalChatTurn = async (
  db: PrismaClient,
  turn: PreparedClinicalChatTurn,
  partialContent: string,
  error: unknown,
) => {
  const mapped = mapClinicalChatError(error);
  await db.$transaction([
    db.clinicalChatMessage.update({
      where: { id: turn.assistantMessageId },
      data: {
        status: "FAILED",
        content: partialContent,
        errorCode: mapped.code,
        errorMessage: mapped.message,
        completedAt: new Date(),
      },
    }),
    db.clinicalChat.update({
      where: { id: turn.chatId },
      data: { isGenerating: false, generationStartedAt: null },
    }),
  ]);
  return mapped;
};

export const mapClinicalChatError = (error: unknown) => {
  const candidate =
    error && typeof error === "object"
      ? (error as { status?: unknown; code?: unknown; message?: unknown })
      : {};
  const raw =
    typeof candidate.message === "string"
      ? candidate.message.toLowerCase()
      : "";
  if (
    /context length|context window|too many tokens|request too large|maximum context/.test(
      raw,
    )
  ) {
    return {
      code: "CONTEXT_TOO_LARGE",
      message:
        "O contexto clinico completo excedeu a janela aceita pelo modelo. Nenhum dado foi removido.",
    };
  }
  if (candidate.status === 429) {
    return {
      code: "OPENAI_RATE_LIMIT",
      message:
        "A OpenAI esta temporariamente ocupada. Tente novamente em instantes.",
    };
  }
  return {
    code: "OPENAI_ERROR",
    message: "Nao foi possivel concluir a resposta clinica. Tente novamente.",
  };
};
