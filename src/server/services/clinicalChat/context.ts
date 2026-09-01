import { createHash } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import type {
  ResponseCreateParamsStreaming,
  ResponseInput,
} from "openai/resources/responses/responses";
import {
  anamnesisToClinicalRecord,
  clinicalTemplateInclude,
  withoutInternalAnamnesisId,
} from "../clinical-context";
import { createSignedClinicalAttachmentUrl } from "./storage";
import { CLINICAL_CHAT_MODEL } from "./constants";
import {
  CLINICAL_CHAT_PROMPT_VARIABLES,
  DEFAULT_CLINICAL_CHAT_PROMPT_TEMPLATE,
  renderPromptTemplate,
} from "../ai-prompt-templates";

const clinicalProfileSelect = {
  hasHypertension: true,
  hasDiabetes: true,
  diabetesDuration: true,
  hasDyslipidemia: true,
  hasPriorInfarction: true,
  priorSurgeries: true,
  allergies: true,
  familyHistoryCoronaryEarly: true,
  familyHistorySuddenDeath: true,
  familyHistoryOthers: true,
  smokingStatus: true,
  smokingPacksYear: true,
  alcoholConsumption: true,
  exerciseLevel: true,
} as const;

const surgicalRiskSelect = {
  surgeryName: true,
  isHighRiskSurgery: true,
  hasIschemicHeartDisease: true,
  hasCongestiveHeartFailure: true,
  hasCerebrovascularDisease: true,
  isInsulinDependent: true,
  hasElevatedCreatinine: true,
  leeScore: true,
  riskClass: true,
  asaClass: true,
  mets: true,
  recommendation: true,
  isCleared: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const buildClinicalChatContext = async (
  db: PrismaClient,
  profileId: string,
  patientId: string,
  chatId: string,
  requestedAnamnesisId?: string,
) => {
  const patient = await db.patient.findFirst({
    where: { id: patientId, profileId },
    select: {
      birthDate: true,
      gender: true,
      clinicalProfile: { select: clinicalProfileSelect },
      anamneses: {
        orderBy: [{ date: "asc" }, { id: "asc" }],
        include: {
          physicalExam: true,
          medications: true,
          template: { include: clinicalTemplateInclude },
          surgicalRisk: { select: surgicalRiskSelect },
          aiDiagnoses: {
            where: { status: "COMPLETED" },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              result: true,
              summary: true,
              anamnesisVersion: true,
              resultSchemaVersion: true,
              provider: true,
              model: true,
              completedAt: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });
  if (!patient) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Paciente nao encontrado.",
    });
  }

  const currentIndex = requestedAnamnesisId
    ? patient.anamneses.findIndex((item) => item.id === requestedAnamnesisId)
    : patient.anamneses.length - 1;
  if (requestedAnamnesisId && currentIndex < 0) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Anamnese nao encontrada para este paciente.",
    });
  }
  const current =
    currentIndex >= 0 ? patient.anamneses[currentIndex] : undefined;
  const referenceDate = current?.date ?? new Date();
  const age = Math.max(
    0,
    Math.floor(
      (referenceDate.getTime() - patient.birthDate.getTime()) / 31_557_600_000,
    ),
  );
  const currentRecord = current ? anamnesisToClinicalRecord(current) : null;
  const latestAnalysis = current?.aiDiagnoses[0];

  const messages = await db.clinicalChatMessage.findMany({
    where: {
      chatId,
      OR: [
        { role: "USER", status: "COMPLETED" },
        { role: "ASSISTANT", status: { in: ["COMPLETED", "FAILED"] } },
      ],
    },
    orderBy: { sequence: "asc" },
    select: {
      role: true,
      status: true,
      content: true,
      sequence: true,
      attachments: {
        orderBy: { createdAt: "asc" },
        select: {
          storagePath: true,
          originalName: true,
          mimeType: true,
          sizeBytes: true,
        },
      },
    },
  });

  return {
    currentAnamnesisId: current?.id ?? null,
    clinicalContext: {
      patient: {
        ageAtCurrentAnamnesis: age,
        gender: patient.gender,
        clinicalProfile: patient.clinicalProfile,
      },
      currentAnamnesis: currentRecord
        ? withoutInternalAnamnesisId(currentRecord)
        : null,
      currentSurgicalRisk: current?.surgicalRisk ?? null,
      currentAiAnalysis: latestAnalysis
        ? {
            result: latestAnalysis.result ?? {
              summary: latestAnalysis.summary,
            },
            provider: latestAnalysis.provider,
            model: latestAnalysis.model,
            completedAt: latestAnalysis.completedAt ?? latestAnalysis.createdAt,
            resultSchemaVersion: latestAnalysis.resultSchemaVersion,
            isCurrent:
              latestAnalysis.anamnesisVersion >= (current?.contentVersion ?? 1),
          }
        : null,
      previousAnamneses: patient.anamneses
        .slice(0, Math.max(0, currentIndex))
        .map(anamnesisToClinicalRecord)
        .map(withoutInternalAnamnesisId),
    },
    messages,
  };
};

const contentForUserMessage = async (
  message: Awaited<
    ReturnType<typeof buildClinicalChatContext>
  >["messages"][number],
) => {
  const attachments = await Promise.all(
    message.attachments.map(async (attachment) => ({
      attachment,
      signedUrl: await createSignedClinicalAttachmentUrl(
        attachment.storagePath,
      ),
    })),
  );

  return [
    { type: "input_text" as const, text: message.content },
    ...attachments.map(({ attachment, signedUrl }) =>
      attachment.mimeType === "application/pdf"
        ? {
            type: "input_file" as const,
            file_url: signedUrl,
            filename: attachment.originalName,
            detail: "high" as const,
          }
        : {
            type: "input_image" as const,
            image_url: signedUrl,
            detail: "high" as const,
          },
    ),
  ];
};

export const buildClinicalChatResponseParams = async (
  db: PrismaClient,
  profileId: string,
  patientId: string,
  chatId: string,
  requestedAnamnesisId?: string,
): Promise<ResponseCreateParamsStreaming> => {
  const [built, settings] = await Promise.all([
    buildClinicalChatContext(
      db,
      profileId,
      patientId,
      chatId,
      requestedAnamnesisId,
    ),
    db.aiAnalysisSettings.findUnique({
      where: { profileId },
      select: { clinicalChatPromptTemplate: true },
    }),
  ]);
  const promptHistory = built.messages.map((message) => ({
    sequence: message.sequence,
    role: message.role,
    status: message.status,
    content: message.content,
    attachments: message.attachments.map((attachment) => ({
      name: attachment.originalName,
      mimeType: attachment.mimeType,
      sizeBytes: attachment.sizeBytes,
    })),
  }));
  const attachmentMetadata = promptHistory.flatMap((message) =>
    message.attachments.map((attachment) => ({
      messageSequence: message.sequence,
      ...attachment,
    })),
  );
  const currentMessage = [...built.messages]
    .reverse()
    .find((message) => message.role === "USER")?.content;
  const instructions = renderPromptTemplate(
    settings?.clinicalChatPromptTemplate ??
      DEFAULT_CLINICAL_CHAT_PROMPT_TEMPLATE,
    CLINICAL_CHAT_PROMPT_VARIABLES,
    {
      contexto_clinico: built.clinicalContext,
      paciente: built.clinicalContext.patient,
      anamnese_atual: built.clinicalContext.currentAnamnesis,
      risco_cirurgico_atual: built.clinicalContext.currentSurgicalRisk,
      analise_ia_atual: built.clinicalContext.currentAiAnalysis,
      anamneses_anteriores: built.clinicalContext.previousAnamneses,
      historico_chat: promptHistory,
      mensagem_atual: currentMessage ?? "",
      anexos: attachmentMetadata,
      modelo_chat: CLINICAL_CHAT_MODEL,
    },
  );
  const input: ResponseInput = [];

  for (const message of built.messages) {
    if (message.role === "USER") {
      input.push({
        role: "user",
        content: await contentForUserMessage(message),
      });
    } else {
      input.push({
        role: "assistant",
        content:
          message.status === "FAILED"
            ? `[Resposta anterior interrompida e incompleta]\n${message.content || "(sem conteudo gerado)"}`
            : message.content,
      });
    }
  }

  return {
    model: CLINICAL_CHAT_MODEL,
    ...(instructions.trim() ? { instructions } : {}),
    input,
    reasoning: { effort: "medium" },
    max_output_tokens: 8_000,
    stream: true,
    store: false,
    truncation: "disabled",
    safety_identifier: createHash("sha256")
      .update(profileId)
      .digest("hex")
      .slice(0, 64),
  };
};
