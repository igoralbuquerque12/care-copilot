import type { AudioBatchStatus, Prisma, PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import {
  buildEmptyConsolidatedFormState,
  consolidatedFormStateSchema,
  type ConsolidatedFormState,
} from "~/schemas/audio-anamnesis-form";
import type { CreateAnamnesisInput } from "~/schemas/anamnesis";
import { assertMinimumBalanceForSession } from "~/server/services/credits/credit-ledger.service";
import { createAnamnesis } from "~/server/services/anamnesis/anamnesis.service";
import { getDefaultTemplate } from "~/server/services/form-templates/form-template.service";

type MapContext = { patientId: string; consultationId?: string };

const OPEN_BATCH_STATUSES: AudioBatchStatus[] = ["PENDING", "PROCESSING"];

const getMetadataNumber = (metadata: Prisma.JsonValue, key: string) => {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return 0;
  }

  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
};

const mapConsolidatedFormToAnamnesisInput = (
  form: ConsolidatedFormState,
  ctx: MapContext,
): CreateAnamnesisInput => {
  const a = form.anamnesis;
  const px = a.physicalExam;

  const physicalExam =
    (px.weight ??
    px.height ??
    px.bpSystolic ??
    px.bpDiastolic ??
    px.heartRate ??
    px.oxygenSaturation ??
    px.heartAuscultation ??
    px.lungAuscultation ??
    px.peripheralPulses ??
    px.edemaGrade)
      ? {
          weight: px.weight ?? undefined,
          height: px.height ?? undefined,
          bpSystolic: px.bpSystolic ?? undefined,
          bpDiastolic: px.bpDiastolic ?? undefined,
          heartRate: px.heartRate ?? undefined,
          oxygenSaturation: px.oxygenSaturation ?? undefined,
          heartAuscultation: px.heartAuscultation ?? undefined,
          lungAuscultation: px.lungAuscultation ?? undefined,
          peripheralPulses: px.peripheralPulses ?? undefined,
          edemaGrade: px.edemaGrade ?? undefined,
        }
      : undefined;

  return {
    patientId: ctx.patientId,
    consultationId: ctx.consultationId,
    chiefComplaint: a.chiefComplaint || "Coletado por captura de audio",
    currentIllnessHistory:
      a.currentIllnessHistory || "Coletado por captura de audio",
    treatmentResponse: a.treatmentResponse || undefined,
    symptomEvolution: a.symptomEvolution || undefined,
    newEvents: a.newEvents || undefined,
    nyhaClass: a.nyhaClass ?? "I",
    hasPalpitations: a.hasPalpitations ?? false,
    hasSyncope: a.hasSyncope ?? false,
    hasEdema: a.hasEdema ?? false,
    hasChestPain: a.hasChestPain ?? false,
    physicalExam,
    medications: a.medications.length ? a.medications : undefined,
    diagnosticHypothesis: a.diagnosticHypothesis || undefined,
    conduct: a.conduct || undefined,
    nextRecallDate: a.nextRecallDate ?? undefined,
    templateId: form.templateId ?? undefined,
    customResponses: form.customFields,
  };
};

export const startSession = async (
  db: PrismaClient,
  profileId: string,
  input: { patientId: string; consultationId?: string },
) => {
  const patient = await db.patient.findFirst({
    where: { id: input.patientId, profileId },
    include: { clinicalProfile: true },
  });

  if (!patient) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Paciente nao encontrado",
    });
  }

  if (input.consultationId) {
    const consultation = await db.scheduleConsultation.findFirst({
      where: {
        id: input.consultationId,
        profileId,
        patientId: input.patientId,
      },
      select: { id: true },
    });
    if (!consultation) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Consulta nao pertence ao paciente informado",
      });
    }
  }

  await assertMinimumBalanceForSession(db, profileId);
  const template = await getDefaultTemplate(db, profileId);
  const customFields = Object.fromEntries(
    template.sections
      .flatMap((section) => section.fields)
      .filter((field) => !field.isSystemField)
      .map((field) => [field.key, null]),
  );

  const initialFormState = buildEmptyConsolidatedFormState({
    patient: {
      name: patient.name,
      birthDate: patient.birthDate,
      gender:
        (patient.gender as ConsolidatedFormState["patient"]["gender"]) ?? null,
      cpf: patient.cpf ?? "",
      clinicalProfile: patient.clinicalProfile
        ? {
            hasHypertension: patient.clinicalProfile.hasHypertension,
            hasDiabetes: patient.clinicalProfile.hasDiabetes,
            diabetesDuration: patient.clinicalProfile.diabetesDuration,
            allergies: patient.clinicalProfile.allergies ?? "",
            hasDyslipidemia: patient.clinicalProfile.hasDyslipidemia,
            hasPriorInfarction: patient.clinicalProfile.hasPriorInfarction,
            priorSurgeries: patient.clinicalProfile.priorSurgeries ?? "",
            familyHistoryCoronaryEarly:
              patient.clinicalProfile.familyHistoryCoronaryEarly,
            familyHistorySuddenDeath:
              patient.clinicalProfile.familyHistorySuddenDeath,
            familyHistoryOthers:
              patient.clinicalProfile.familyHistoryOthers ?? "",
            smokingStatus: patient.clinicalProfile.smokingStatus,
            smokingPacksYear: patient.clinicalProfile.smokingPacksYear,
            alcoholConsumption:
              patient.clinicalProfile.alcoholConsumption ?? "",
            exerciseLevel: patient.clinicalProfile.exerciseLevel,
          }
        : {},
    },
    anamnesis: {
      consultationId: input.consultationId ?? null,
    },
    customFields,
    templateId: template.id,
  });

  const session = await db.audioConsultationSession.create({
    data: {
      profileId,
      patientId: input.patientId,
      consultationId: input.consultationId,
      status: "READY",
      currentFormState: initialFormState as unknown as Prisma.InputJsonValue,
    },
  });

  return session;
};

export const getSession = async (
  db: PrismaClient,
  profileId: string,
  sessionId: string,
) => {
  const session = await db.audioConsultationSession.findFirst({
    where: { id: sessionId, profileId },
  });

  if (!session) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Sessao nao encontrada",
    });
  }

  return session;
};

export const getReviewSummary = async (
  db: PrismaClient,
  profileId: string,
  sessionId: string,
) => {
  const session = await db.audioConsultationSession.findFirst({
    where: { id: sessionId, profileId },
    select: {
      id: true,
      status: true,
      startedAt: true,
      endedAt: true,
      creditsConsumed: true,
    },
  });

  if (!session) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Sessao nao encontrada",
    });
  }

  const [pendingBatchCount, batches, ledgerEntries] = await Promise.all([
    db.audioBatchRecord.count({
      where: { sessionId, status: { in: OPEN_BATCH_STATUSES } },
    }),
    db.audioBatchRecord.findMany({
      where: { sessionId },
      select: { audioDurationSeconds: true },
    }),
    db.creditLedgerEntry.findMany({
      where: { profileId, sessionId },
      select: { metadata: true },
    }),
  ]);

  const inputTokens = ledgerEntries.reduce(
    (total, entry) => total + getMetadataNumber(entry.metadata, "inputTokens"),
    0,
  );
  const outputTokens = ledgerEntries.reduce(
    (total, entry) => total + getMetadataNumber(entry.metadata, "outputTokens"),
    0,
  );
  const transcriptionSeconds = batches.reduce(
    (total, batch) => total + batch.audioDurationSeconds,
    0,
  );
  const durationSeconds = Math.max(
    0,
    Math.round(
      ((session.endedAt ?? new Date()).getTime() -
        session.startedAt.getTime()) /
        1000,
    ),
  );

  return {
    sessionId: session.id,
    status: session.status,
    pendingBatchCount,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    durationSeconds,
    transcriptionSeconds,
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    creditsConsumed: session.creditsConsumed,
  };
};

export const markSessionError = async (
  db: PrismaClient,
  sessionId: string,
  errorMessage: string,
) => {
  return db.audioConsultationSession.update({
    where: { id: sessionId },
    data: { status: "ERROR", errorMessage },
  });
};

export const finalizeSession = async (
  db: PrismaClient,
  profileId: string,
  sessionId: string,
  formStateOverride?: ConsolidatedFormState,
) => {
  const session = await db.audioConsultationSession.findFirst({
    where: { id: sessionId, profileId },
  });

  if (!session) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Sessao nao encontrada",
    });
  }

  if (session.status === "FINALIZED") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Sessao ja foi finalizada",
    });
  }

  const pendingBatchCount = await db.audioBatchRecord.count({
    where: { sessionId, status: { in: OPEN_BATCH_STATUSES } },
  });

  if (pendingBatchCount > 0 || session.status === "PROCESSING") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Aguarde o processamento dos lotes de audio antes de finalizar",
    });
  }

  const parsed = consolidatedFormStateSchema.parse(
    formStateOverride ?? session.currentFormState,
  );

  const anamnesisInput = mapConsolidatedFormToAnamnesisInput(parsed, {
    patientId: session.patientId,
    consultationId: session.consultationId ?? undefined,
  });

  const anamnesis = await createAnamnesis(db, profileId, anamnesisInput);

  await db.audioConsultationSession.update({
    where: { id: sessionId },
    data: {
      status: "FINALIZED",
      endedAt: new Date(),
      currentFormState: parsed as unknown as Prisma.InputJsonValue,
    },
  });

  return { sessionId, anamnesisId: anamnesis.anamnesisId };
};
