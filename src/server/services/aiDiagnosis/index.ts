// src/server/services/aiDiagnosis/index.ts

import { type PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { aiClient } from "~/server/ai";
import { qstash } from "~/server/qstash/client";
import { env } from "~/env";
import { buildDiagnosisPrompt } from "./prompt-builder";
import { VALID_CONFIDENCE_LEVELS, DEFAULT_CONFIDENCE_LEVEL } from "./constants";
import type { PatientHistoryForAI, AiDiagnosisResult } from "./types";

export const triggerDiagnosis = async (
  patientId: string,
  anamnesisId: string,
) => {
  try {
    if (qstash) {
      await qstash.publishJSON({
        url: `${env.APP_URL}/api/ai-diagnosis`,
        body: { patientId, anamnesisId },
        retries: 3,
      });
      return;
    }
    const { db } = await import("~/server/db");
    await processAiDiagnosis(db, patientId, anamnesisId);
  } catch (error) {
    console.error("[AI Diagnosis - trigger]: ", error);
  }
};

export const processAiDiagnosis = async (
  db: PrismaClient,
  patientId: string,
  anamnesisId: string,
) => {
  try {
    const patient = await db.patient.findUnique({
      where: { id: patientId },
      include: {
        clinicalProfile: true,
        anamneses: {
          orderBy: { date: "asc" },
          include: { physicalExam: true, medications: true },
        },
      },
    });

    if (!patient) throw new Error(`Patient ${patientId} not found`);

    const historyData: PatientHistoryForAI = {
      patient: {
        name: patient.name,
        gender: patient.gender,
        birthDate: patient.birthDate,
        cpf: patient.cpf,
      },
      clinicalProfile: patient.clinicalProfile,
      anamneses: patient.anamneses.map((a) => ({
        date: a.date,
        chiefComplaint: a.chiefComplaint,
        currentIllnessHistory: a.currentIllnessHistory,
        treatmentResponse: a.treatmentResponse,
        symptomEvolution: a.symptomEvolution,
        newEvents: a.newEvents,
        nyhaClass: a.nyhaClass,
        hasPalpitations: a.hasPalpitations,
        hasSyncope: a.hasSyncope,
        hasEdema: a.hasEdema,
        hasChestPain: a.hasChestPain,
        diagnosticHypothesis: a.diagnosticHypothesis,
        conduct: a.conduct,
        physicalExam: a.physicalExam,
        medications: a.medications,
      })),
    };

    const prompt = buildDiagnosisPrompt(historyData);
    const response = await aiClient.generate({ prompt, responseFormat: "json" });

    const parsed = JSON.parse(response.text) as AiDiagnosisResult;

    if (!VALID_CONFIDENCE_LEVELS.includes(parsed.confidenceLevel as typeof VALID_CONFIDENCE_LEVELS[number])) {
      parsed.confidenceLevel = DEFAULT_CONFIDENCE_LEVEL;
    }

    await db.aiDiagnosis.create({
      data: {
        patientId,
        anamnesisId,
        summary: parsed.summary,
        mainDiagnosisHypothesis: parsed.mainDiagnosisHypothesis,
        differentialDiagnoses: parsed.differentialDiagnoses,
        identifiedPatterns: parsed.identifiedPatterns,
        riskAlerts: parsed.riskAlerts,
        recommendedActions: parsed.recommendedActions,
        confidenceLevel: parsed.confidenceLevel,
      },
    });
  } catch (error) {
    console.error("[AI Diagnosis - process]: ", error);
    throw error;
  }
};

export const getLatestDiagnosis = async (
  db: PrismaClient,
  patientId: string,
) => {
  try {
    return await db.aiDiagnosis.findFirst({
      where: { patientId, isValid: true },
      orderBy: { createdAt: "desc" },
      include: {
        anamnesis: { select: { date: true, chiefComplaint: true } },
      },
    });
  } catch (error) {
    console.error("[AI Diagnosis - getLatest]: ", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Erro ao buscar diagnóstico IA",
    });
  }
};

export const markDiagnosisInvalid = async (
  db: PrismaClient,
  profileId: string,
  diagnosisId: string,
) => {
  try {
    const diagnosis = await db.aiDiagnosis.findUnique({
      where: { id: diagnosisId },
      select: { patient: { select: { profileId: true } } },
    });

    if (!diagnosis || diagnosis.patient.profileId !== profileId) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
    }

    return await db.aiDiagnosis.update({
      where: { id: diagnosisId },
      data: { isValid: false },
    });
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    console.error("[AI Diagnosis - markInvalid]: ", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Erro ao marcar diagnóstico como inválido",
    });
  }
};
