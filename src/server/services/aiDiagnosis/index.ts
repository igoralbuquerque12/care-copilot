import type { Prisma, PrismaClient } from "@prisma/client";
import { Prisma as PrismaNamespace } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { env } from "~/env";
import { anamnesisAnalysisResultSchema, type AnamnesisAnalysisResult } from "~/schemas/ai-analysis";
import { messageQueue } from "~/server/messaging";
import { BASE_PROMPT_VERSION } from "./constants";
import { decryptApiKey } from "./credentials";
import { createFormSnapshot, readFormSnapshot } from "./form-snapshot";
import { buildDiagnosisPrompt } from "./prompt-builder";
import { generateStructuredAnalysis, isTransientProviderError } from "./providers";
import { getResolvedConfiguration } from "./settings";
import type { AnalysisAnamnesisInput, PatientHistoryForAI } from "./types";

const QUEUE_RETRIES = 3;
const PROVIDER_RETRIES = 3;
const RESULT_SCHEMA_VERSION = 2;

const toRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};

const templateInclude = {
  sections: {
    orderBy: { order: "asc" as const },
    include: { fields: { orderBy: { order: "asc" as const } } },
  },
};

type AnamnesisWithRelations = Prisma.AnamnesisGetPayload<{
  include: {
    physicalExam: true;
    medications: true;
    template: { include: typeof templateInclude };
  };
}>;

const toAnalysisInput = (anamnesis: AnamnesisWithRelations): AnalysisAnamnesisInput => {
  const snapshot = readFormSnapshot(anamnesis.formSnapshot) ?? (
    anamnesis.template
      ? readFormSnapshot(createFormSnapshot(anamnesis.template, "APPROXIMATED"))
      : null
  );
  const labels = new Map(
    snapshot?.sections.flatMap((section) => section.fields.map((field) => [field.key, field.label] as const)) ?? [],
  );
  const custom = Object.fromEntries(
    Object.entries(toRecord(anamnesis.customResponses)).map(([key, value]) => [
      labels.get(key) ?? key,
      value,
    ]),
  );
  const exam = anamnesis.physicalExam;

  return {
    id: anamnesis.id,
    date: anamnesis.date,
    templateName: snapshot?.templateName ?? anamnesis.template?.name ?? "Formulario nao identificado",
    fields: {
      "Queixa principal": anamnesis.chiefComplaint,
      "Historia da doenca atual": anamnesis.currentIllnessHistory,
      "Resposta ao tratamento": anamnesis.treatmentResponse,
      "Evolucao dos sintomas": anamnesis.symptomEvolution,
      "Novos eventos": anamnesis.newEvents,
      "Classe NYHA": anamnesis.nyhaClass,
      Sintomas: {
        palpitacoes: anamnesis.hasPalpitations,
        sincope: anamnesis.hasSyncope,
        edema: anamnesis.hasEdema,
        dorToracica: anamnesis.hasChestPain,
      },
      "Exame fisico": exam ? {
        peso: exam.weight,
        altura: exam.height,
        pressaoSistolica: exam.bpSystolic,
        pressaoDiastolica: exam.bpDiastolic,
        frequenciaCardiaca: exam.heartRate,
        saturacaoOxigenio: exam.oxygenSaturation,
        auscultaCardiaca: exam.heartAuscultation,
        auscultaPulmonar: exam.lungAuscultation,
        pulsosPerifericos: exam.peripheralPulses,
        grauEdema: exam.edemaGrade,
      } : null,
      Medicamentos: anamnesis.medications.map(({ name, dosage, frequency }) => ({ name, dosage, frequency })),
      "Hipotese diagnostica do medico": anamnesis.diagnosticHypothesis,
      "Conduta do medico": anamnesis.conduct,
      "Proximo retorno": anamnesis.nextRecallDate,
      "Campos personalizados": custom,
    },
  };
};

const confidenceLevelFor = (score: number): AnamnesisAnalysisResult["confidence"]["level"] =>
  score < 50 ? "LOW" : score < 80 ? "MEDIUM" : "HIGH";

const parseResult = (raw: string, coverage: AnamnesisAnalysisResult["historyCoverage"]) => {
  const parsed = anamnesisAnalysisResultSchema.parse(JSON.parse(raw));
  parsed.confidence.level = confidenceLevelFor(parsed.confidence.score);
  parsed.historyCoverage = coverage;
  return parsed;
};

const generateWithTransientRetries = async (
  request: Parameters<typeof generateStructuredAnalysis>[0],
) => {
  for (let attempt = 1; attempt <= PROVIDER_RETRIES; attempt += 1) {
    try {
      return await generateStructuredAnalysis(request);
    } catch (error) {
      if (attempt === PROVIDER_RETRIES || !isTransientProviderError(error)) throw error;
    }
  }
  throw new Error("Falha transitoria do provedor");
};

export const createAnalysisJob = async (
  db: PrismaClient,
  profileId: string,
  patientId: string,
  anamnesisId: string,
) => {
  const anamnesis = await db.anamnesis.findFirst({
    where: { id: anamnesisId, patientId, profileId },
    select: { id: true, contentVersion: true },
  });
  if (!anamnesis) throw new TRPCError({ code: "NOT_FOUND", message: "Anamnese nao encontrada" });

  const configuration = await getResolvedConfiguration(db, profileId).catch(() => null);
  if (!configuration) return { id: undefined, status: "NOT_CONFIGURED" as const };

  const active = await db.aiDiagnosis.findFirst({
    where: { anamnesisId, status: { in: ["PENDING", "PROCESSING"] } },
    orderBy: { createdAt: "desc" },
  });
  if (active) return { id: active.id, status: active.status };

  const latest = await db.aiDiagnosis.findFirst({
    where: { anamnesisId },
    orderBy: { attempt: "desc" },
    select: { attempt: true },
  });

  let analysis;
  try {
    analysis = await db.aiDiagnosis.create({
      data: {
        patientId,
        anamnesisId,
        status: "PENDING",
        attempt: (latest?.attempt ?? 0) + 1,
        anamnesisVersion: anamnesis.contentVersion,
        provider: configuration.settings.provider,
        model: configuration.settings.model,
        basePromptVersion: BASE_PROMPT_VERSION,
        customInstructionsSnapshot: configuration.settings.customInstructions,
        resultSchemaVersion: RESULT_SCHEMA_VERSION,
      },
    });
  } catch (error) {
    if (error instanceof PrismaNamespace.PrismaClientKnownRequestError && error.code === "P2002") {
      const concurrent = await db.aiDiagnosis.findFirst({
        where: { anamnesisId, status: { in: ["PENDING", "PROCESSING"] } },
        orderBy: { createdAt: "desc" },
      });
      if (concurrent) return { id: concurrent.id, status: concurrent.status };
    }
    throw error;
  }

  try {
    await messageQueue.publish({
      url: `${env.APP_URL}/api/ai-diagnosis`,
      body: { analysisId: analysis.id },
      retries: QUEUE_RETRIES,
      deduplicationId: `ai-analysis-${analysis.id}`,
    });
  } catch {
    await db.aiDiagnosis.update({
      where: { id: analysis.id },
      data: {
        status: "FAILED",
        errorCode: "DISPATCH_ERROR",
        errorMessage: "Nao foi possivel iniciar a analise. Tente novamente.",
        completedAt: new Date(),
      },
    });
    return { id: analysis.id, status: "FAILED" as const };
  }
  return { id: analysis.id, status: analysis.status };
};

export const processAiDiagnosis = async (db: PrismaClient, analysisId: string) => {
  const claimed = await db.aiDiagnosis.updateMany({
    where: { id: analysisId, status: "PENDING" },
    data: { status: "PROCESSING", startedAt: new Date(), errorCode: null, errorMessage: null },
  });
  if (claimed.count === 0) return { processed: false };

  try {
    const analysis = await db.aiDiagnosis.findUniqueOrThrow({ where: { id: analysisId } });
    if (!analysis.provider || !analysis.model) throw new Error("Configuracao da analise ausente");

    const patient = await db.patient.findFirst({
      where: { id: analysis.patientId },
      select: {
        profileId: true,
        birthDate: true,
        gender: true,
        clinicalProfile: {
          select: {
            hasHypertension: true, hasDiabetes: true, diabetesDuration: true,
            hasDyslipidemia: true, hasPriorInfarction: true, priorSurgeries: true,
            allergies: true, familyHistoryCoronaryEarly: true,
            familyHistorySuddenDeath: true, familyHistoryOthers: true,
            smokingStatus: true, smokingPacksYear: true, alcoholConsumption: true,
            exerciseLevel: true,
          },
        },
        anamneses: {
          orderBy: [{ date: "asc" }, { id: "asc" }],
          include: {
            physicalExam: true,
            medications: true,
            template: { include: templateInclude },
          },
        },
      },
    });
    if (!patient) throw new Error("Paciente nao encontrado");
    const currentRecord = patient.anamneses.find((item) => item.id === analysis.anamnesisId);
    if (!currentRecord) throw new Error("Anamnese atual nao encontrada");

    const credential = await db.aiProviderCredential.findUnique({
      where: {
        profileId_provider: {
          profileId: patient.profileId,
          provider: analysis.provider,
        },
      },
    });
    if (!credential) throw new Error("Credencial do provedor nao encontrada");

    const current = toAnalysisInput(currentRecord);
    const history: PatientHistoryForAI = {
      patient: {
        ageAtCurrentAnamnesis: Math.max(0, Math.floor(
          (current.date.getTime() - patient.birthDate.getTime()) / 31_557_600_000,
        )),
        gender: patient.gender,
      },
      clinicalProfile: patient.clinicalProfile,
      current,
      previous: patient.anamneses
        .filter((item) => item.id !== current.id && item.date <= current.date)
        .map(toAnalysisInput),
    };
    const prompt = buildDiagnosisPrompt(history, analysis.customInstructionsSnapshot ?? "");

    let result: AnamnesisAnalysisResult | null = null;
    let lastValidationError = "";
    for (let attempt = 0; attempt < 2 && !result; attempt += 1) {
      const raw = await generateWithTransientRetries({
        provider: analysis.provider,
        apiKey: decryptApiKey(credential),
        model: analysis.model,
        systemPrompt: prompt.systemPrompt,
        userPrompt: attempt === 0
          ? prompt.userPrompt
          : `${prompt.userPrompt}\n\nA resposta anterior foi invalida (${lastValidationError}). Corrija o JSON e retorne somente o objeto completo.`,
      });
      try {
        result = parseResult(raw, prompt.coverage);
      } catch (error) {
        lastValidationError = error instanceof Error ? error.message.slice(0, 500) : "JSON invalido";
      }
    }
    if (!result) throw new Error("O modelo retornou uma analise em formato invalido");

    await db.aiDiagnosis.update({
      where: { id: analysisId },
      data: {
        status: "COMPLETED",
        result: result as unknown as Prisma.InputJsonValue,
        resultSchemaVersion: RESULT_SCHEMA_VERSION,
        summary: result.summary,
        mainDiagnosisHypothesis: result.aiDiagnosis.primary,
        differentialDiagnoses: result.aiDiagnosis.differentials.join("; "),
        identifiedPatterns: result.longitudinalComparison.overview,
        riskAlerts: result.riskAlerts.map((item) => item.title).join("; "),
        recommendedActions: result.suggestedNextSteps.map((item) => item.action).join("; "),
        confidenceLevel: result.confidence.level,
        completedAt: new Date(),
      },
    });
    return { processed: true };
  } catch (error) {
    console.error("[AI analysis] processing failed");
    await db.aiDiagnosis.update({
      where: { id: analysisId },
      data: {
        status: "FAILED",
        errorCode: isTransientProviderError(error) ? "PROVIDER_TRANSIENT_ERROR" : "PROVIDER_ERROR",
        errorMessage: "Nao foi possivel concluir a analise. Verifique a configuracao e tente novamente.",
        completedAt: new Date(),
      },
    });
    return { processed: false };
  }
};

export const getAnalysisByAnamnesis = async (
  db: PrismaClient,
  profileId: string,
  anamnesisId: string,
) => {
  const anamnesis = await db.anamnesis.findFirst({
    where: { id: anamnesisId, profileId },
    select: {
      id: true, patientId: true, contentVersion: true,
      aiDiagnoses: { where: { isValid: true }, orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!anamnesis) throw new TRPCError({ code: "NOT_FOUND", message: "Anamnese nao encontrada" });
  const analysis = anamnesis.aiDiagnoses[0];
  if (!analysis) {
    const configuration = await getResolvedConfiguration(db, profileId).catch(() => null);
    return {
      anamnesisId,
      patientId: anamnesis.patientId,
      state: configuration ? "NOT_GENERATED" as const : "NOT_CONFIGURED" as const,
      analysis: null,
    };
  }
  const legacy = analysis.status === "COMPLETED" && (
    analysis.resultSchemaVersion < RESULT_SCHEMA_VERSION || !analysis.result
  );
  const stale = analysis.anamnesisVersion < anamnesis.contentVersion;
  return {
    anamnesisId,
    patientId: anamnesis.patientId,
    state: legacy ? "LEGACY" as const : stale ? "STALE" as const : analysis.status,
    analysis,
  };
};

export const retryAnalysis = async (
  db: PrismaClient,
  profileId: string,
  anamnesisId: string,
) => {
  const anamnesis = await db.anamnesis.findFirst({
    where: { id: anamnesisId, profileId },
    select: { patientId: true },
  });
  if (!anamnesis) throw new TRPCError({ code: "NOT_FOUND", message: "Anamnese nao encontrada" });
  return createAnalysisJob(db, profileId, anamnesis.patientId, anamnesisId);
};
