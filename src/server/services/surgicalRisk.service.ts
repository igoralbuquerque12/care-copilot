import { type PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import type { CreateSurgicalRiskInput, UpdateSurgicalRiskInput } from "~/schemas/surgical-risk";

export type LeeFactors = {
  isHighRiskSurgery: boolean;
  hasIschemicHeartDisease: boolean;
  hasCongestiveHeartFailure: boolean;
  hasCerebrovascularDisease: boolean;
  isInsulinDependent: boolean;
  hasElevatedCreatinine: boolean;
};

export type LeeScoreResult = {
  score: number;
  riskClass: "I" | "II" | "III" | "IV";
  /** Risco estimado de MACE (Major Adverse Cardiac Events) */
  estimatedRisk: string;
};

export type InferredRiskFactors = LeeFactors & {
  wasInferred: boolean;
  inferredFields: string[];
};


/**
 * Calcula o Índice de Risco Cardíaco Revisado (Lee Score / RCRI).
 * Cada preditor positivo vale 1 ponto.
 *
 * Classificação de risco (MACE estimado):
 *  - Classe I  (0 pts): ~0,4%
 *  - Classe II (1 pt):  ~0,9%
 *  - Classe III (2 pts): ~6,6%
 *  - Classe IV (=3 pts): ~11%
 */
export function calculateLeeScore(factors: LeeFactors): LeeScoreResult {
  const score =
    (factors.isHighRiskSurgery ? 1 : 0) +
    (factors.hasIschemicHeartDisease ? 1 : 0) +
    (factors.hasCongestiveHeartFailure ? 1 : 0) +
    (factors.hasCerebrovascularDisease ? 1 : 0) +
    (factors.isInsulinDependent ? 1 : 0) +
    (factors.hasElevatedCreatinine ? 1 : 0);

  let riskClass: "I" | "II" | "III" | "IV";
  let estimatedRisk: string;

  if (score === 0) {
    riskClass = "I";
    estimatedRisk = "~0,4%";
  } else if (score === 1) {
    riskClass = "II";
    estimatedRisk = "~0,9%";
  } else if (score === 2) {
    riskClass = "III";
    estimatedRisk = "~6,6%";
  } else {
    riskClass = "IV";
    estimatedRisk = "~11%";
  }

  return { score, riskClass, estimatedRisk };
}

/**
 * Tenta inferir os 6 preditores do Score de Lee a partir dos dados existentes
 * de anamnese, perfil clínico e medicamentos prescritos.
 *
 * Campos sem mapeamento direto (hasCerebrovascularDisease, hasElevatedCreatinine,
 * isHighRiskSurgery) ficam como false - o médico deve confirmar.
 */
export function inferRiskFactorsFromPatient(
  anamnesis: {
    nyhaClass: string;
    hasEdema: boolean;
    hasPalpitations: boolean;
  },
  clinicalProfile: {
    hasPriorInfarction: boolean;
    hasDiabetes: boolean;
  } | null,
  medications: Array<{ name: string }>,
): InferredRiskFactors {
  const inferredFields: string[] = [];

  const hasIschemicHeartDisease = clinicalProfile?.hasPriorInfarction ?? false;
  if (hasIschemicHeartDisease) inferredFields.push("hasIschemicHeartDisease");

  const hasCongestiveHeartFailure =
    anamnesis.nyhaClass === "III" ||
    anamnesis.nyhaClass === "IV" ||
    anamnesis.hasEdema;
  if (hasCongestiveHeartFailure) inferredFields.push("hasCongestiveHeartFailure");

  const isInsulinDependent = medications.some((m) =>
    m.name.toLowerCase().includes("insulina"),
  );
  if (isInsulinDependent) inferredFields.push("isInsulinDependent");

  const hasCerebrovascularDisease = false;
  const hasElevatedCreatinine = false;
  const isHighRiskSurgery = false;

  const wasInferred = inferredFields.length > 0;

  return {
    isHighRiskSurgery,
    hasIschemicHeartDisease,
    hasCongestiveHeartFailure,
    hasCerebrovascularDisease,
    isInsulinDependent,
    hasElevatedCreatinine,
    wasInferred,
    inferredFields,
  };
}

export async function createSurgicalRisk(
  db: PrismaClient,
  profileId: string,
  data: CreateSurgicalRiskInput,
) {
  const anamnesis = await db.anamnesis.findFirst({
    where: { id: data.anamnesisId, profileId },
  });
  if (!anamnesis) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Anamnese não encontrada",
    });
  }

  const existing = await db.surgicalRiskAssessment.findUnique({
    where: { anamnesisId: data.anamnesisId },
  });
  if (existing) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Já existe uma avaliação de risco cirúrgico para esta anamnese",
    });
  }

  const { anamnesisId, surgeryName, asaClass, mets, recommendation, isCleared, ...factors } = data;
  const { score, riskClass } = calculateLeeScore(factors);

  return db.surgicalRiskAssessment.create({
    data: {
      profileId,
      anamnesisId,
      surgeryName,
      ...factors,
      leeScore: score,
      riskClass,
      asaClass,
      mets,
      recommendation,
      isCleared,
    },
  });
}

export async function updateSurgicalRisk(
  db: PrismaClient,
  profileId: string,
  riskId: string,
  data: Omit<UpdateSurgicalRiskInput, "id">,
) {
  const existing = await db.surgicalRiskAssessment.findFirst({
    where: { id: riskId, profileId },
  });
  if (!existing) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Avaliação de risco cirúrgico não encontrada",
    });
  }

  const { surgeryName, asaClass, mets, recommendation, isCleared, ...rawFactors } = data;

  const mergedFactors: LeeFactors = {
    isHighRiskSurgery: rawFactors.isHighRiskSurgery ?? existing.isHighRiskSurgery,
    hasIschemicHeartDisease: rawFactors.hasIschemicHeartDisease ?? existing.hasIschemicHeartDisease,
    hasCongestiveHeartFailure: rawFactors.hasCongestiveHeartFailure ?? existing.hasCongestiveHeartFailure,
    hasCerebrovascularDisease: rawFactors.hasCerebrovascularDisease ?? existing.hasCerebrovascularDisease,
    isInsulinDependent: rawFactors.isInsulinDependent ?? existing.isInsulinDependent,
    hasElevatedCreatinine: rawFactors.hasElevatedCreatinine ?? existing.hasElevatedCreatinine,
  };

  const { score, riskClass } = calculateLeeScore(mergedFactors);

  return db.surgicalRiskAssessment.update({
    where: { id: riskId },
    data: {
      ...(surgeryName !== undefined && { surgeryName }),
      ...mergedFactors,
      leeScore: score,
      riskClass,
      ...(asaClass !== undefined && { asaClass }),
      ...(mets !== undefined && { mets }),
      ...(recommendation !== undefined && { recommendation }),
      ...(isCleared !== undefined && { isCleared }),
    },
  });
}

export async function getByAnamnesisId(
  db: PrismaClient,
  profileId: string,
  anamnesisId: string,
) {
  return db.surgicalRiskAssessment.findFirst({
    where: { anamnesisId, profileId },
  });
}

export async function getPatientAnamnesesForRisk(
  db: PrismaClient,
  profileId: string,
  patientId: string,
  limit = 3,
) {
  return db.anamnesis.findMany({
    where: { patientId, profileId },
    orderBy: { date: "desc" },
    take: limit,
    include: {
      medications: { select: { name: true } },
      surgicalRisk: true,
      patient: {
        select: {
          clinicalProfile: {
            select: {
              hasPriorInfarction: true,
              hasDiabetes: true,
            },
          },
        },
      },
    },
  });
}

export async function inferFromAnamnesisId(
  db: PrismaClient,
  profileId: string,
  anamnesisId: string,
): Promise<InferredRiskFactors> {
  const anamnesis = await db.anamnesis.findFirst({
    where: { id: anamnesisId, profileId },
    include: {
      medications: { select: { name: true } },
      patient: {
        include: {
          clinicalProfile: {
            select: {
              hasPriorInfarction: true,
              hasDiabetes: true,
            },
          },
        },
      },
    },
  });

  if (!anamnesis) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Anamnese não encontrada",
    });
  }

  return inferRiskFactorsFromPatient(
    {
      nyhaClass: anamnesis.nyhaClass,
      hasEdema: anamnesis.hasEdema,
      hasPalpitations: anamnesis.hasPalpitations,
    },
    anamnesis.patient.clinicalProfile,
    anamnesis.medications,
  );
}