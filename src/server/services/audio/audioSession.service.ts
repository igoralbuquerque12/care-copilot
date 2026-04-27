import { type PrismaClient, Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import {
  buildEmptyConsolidatedFormState,
  consolidatedFormStateSchema,
  type ConsolidatedFormState,
} from "~/schemas/audio-anamnesis-form";
import { assertMinimumBalanceForSession } from "~/server/services/credits/creditLedger.service";
import { mapConsolidatedFormToAnamnesisInput } from "./mapConsolidatedToAnamnesis";
import { createAnamnesis } from "~/server/services/anamnesis.service";

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
    throw new TRPCError({ code: "NOT_FOUND", message: "Paciente nao encontrado" });
  }

  if (input.consultationId) {
    const consultation = await db.scheduleConsultation.findFirst({
      where: { id: input.consultationId, profileId, patientId: input.patientId },
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

  const initialFormState = buildEmptyConsolidatedFormState({
    patient: {
      name: patient.name,
      birthDate: patient.birthDate,
      gender: (patient.gender as ConsolidatedFormState["patient"]["gender"]) ?? null,
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
            alcoholConsumption: patient.clinicalProfile.alcoholConsumption ?? "",
            exerciseLevel: patient.clinicalProfile.exerciseLevel,
          }
        : {},
    },
    anamnesis: {
      consultationId: input.consultationId ?? null,
    },
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
    throw new TRPCError({ code: "NOT_FOUND", message: "Sessao nao encontrada" });
  }

  return session;
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
) => {
  const session = await db.audioConsultationSession.findFirst({
    where: { id: sessionId, profileId },
  });

  if (!session) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Sessao nao encontrada" });
  }

  if (session.status === "FINALIZED") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Sessao ja foi finalizada",
    });
  }

  const parsed = consolidatedFormStateSchema.parse(session.currentFormState);

  const anamnesisInput = mapConsolidatedFormToAnamnesisInput(parsed, {
    patientId: session.patientId,
    consultationId: session.consultationId ?? undefined,
  });

  const anamnesis = await createAnamnesis(db, profileId, anamnesisInput);

  await db.audioConsultationSession.update({
    where: { id: sessionId },
    data: { status: "FINALIZED", endedAt: new Date() },
  });

  return { sessionId, anamnesisId: anamnesis.id };
};
