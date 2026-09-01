// src/server/services/patient.service.ts

import { type PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { type CreatePatientInput } from "~/schemas/patient";
import { createFormSnapshot } from "~/server/services/aiDiagnosis/form-snapshot";

export const getFullProfile = async (
  db: PrismaClient,
  profileId: string,
  patientId: string,
) => {
  try {
    return await db.patient.findFirst({
      where: { id: patientId, profileId },
      include: {
        clinicalProfile: true,
        anamneses: {
          orderBy: { date: "desc" },
          take: 10,
          include: {
            physicalExam: true,
            medications: true,
            consultation: { select: { id: true, date: true, type: true } },
            template: {
              include: {
                sections: {
                  orderBy: { order: "asc" },
                  include: {
                    fields: { orderBy: { order: "asc" } },
                  },
                },
              },
            },
          },
        },
        consultations: {
          orderBy: { date: "desc" },
          take: 20,
          select: { id: true, date: true, type: true },
        },
      },
    });
  } catch (error) {
    console.error("[Patient - getFullProfile]: ", error);
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao buscar perfil do paciente" });
  }
};

export const getAnamnesisPaginated = async (
  db: PrismaClient,
  profileId: string,
  patientId: string,
  page: number,
  pageSize: number,
) => {
  try {
    const [total, items] = await Promise.all([
      db.anamnesis.count({
        where: { patientId, patient: { profileId } },
      }),
      db.anamnesis.findMany({
        where: { patientId, patient: { profileId } },
        orderBy: { date: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          physicalExam: true,
          medications: true,
          consultation: { select: { id: true, date: true, type: true } },
          template: {
            include: {
              sections: {
                orderBy: { order: "asc" },
                include: {
                  fields: { orderBy: { order: "asc" } },
                },
              },
            },
          },
        },
      }),
    ]);
    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  } catch (error) {
    console.error("[Patient - getAnamnesisPaginated]: ", error);
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao listar anamneses" });
  }
};

export const createPatient = async (
  db: PrismaClient,
  profileId: string,
  data: CreatePatientInput,
) => {
  try {
    console.log("profileid:", profileId)
    const { clinicalProfile, ...patientData } = data;

    return await db.patient.create({
      data: {
        ...patientData,
        profileId,
        clinicalProfile: clinicalProfile
          ? { create: clinicalProfile }
          : undefined,
      },
    });
  } catch (error) {
    console.error("[Patient - create]: ", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Erro ao criar paciente",
    });
  }
};

export const getPatientById = async (
  db: PrismaClient,
  profileId: string,
  patientId: string,
) => {
  try {
    return await db.patient.findUnique({
      where: {
        id: patientId,
        profileId,
      },
      include: {
        clinicalProfile: true,
        anamneses: { take: 5, orderBy: { date: "desc" } },
      },
    });
  } catch (error) {
    console.error("[Patient - getById]: ", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Erro ao buscar paciente",
    });
  }
};

export const listPatients = async (db: PrismaClient, profileId: string) => {
  try {
    return await db.patient.findMany({
      where: { profileId },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("[Patient - list]: ", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Erro ao listar pacientes",
    });
  }
};

export const searchPatients = async (
  db: PrismaClient,
  profileId: string,
  query: string,
) => {
  try {
    return await db.patient.findMany({
      where: {
        profileId,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { cpf: { contains: query } },
        ],
      },
      orderBy: { name: "asc" },
      take: 10,
    });
  } catch (error) {
    console.error("[Patient - search]: ", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Erro ao buscar pacientes",
    });
  }
};

export const getPatientOverview = async (
  db: PrismaClient,
  profileId: string,
  patientId: string,
) => {
  const patient = await db.patient.findFirst({
    where: { id: patientId, profileId },
    include: {
      clinicalProfile: true,
      _count: { select: { anamneses: true, consultations: true } },
      anamneses: {
        orderBy: { date: "desc" },
        take: 1,
        select: { id: true, date: true, chiefComplaint: true, diagnosticHypothesis: true },
      },
    },
  });
  if (!patient) throw new TRPCError({ code: "NOT_FOUND", message: "Paciente nao encontrado" });
  return patient;
};

const analysisState = (anamnesis: {
  contentVersion: number;
  aiDiagnoses: Array<{ status: string; result: unknown; resultSchemaVersion: number; anamnesisVersion: number }>;
}) => {
  const analysis = anamnesis.aiDiagnoses[0];
  if (!analysis) return "NOT_GENERATED" as const;
  if (analysis.status !== "COMPLETED") return analysis.status;
  if (!analysis.result || analysis.resultSchemaVersion < 2) return "LEGACY" as const;
  if (analysis.anamnesisVersion < anamnesis.contentVersion) return "STALE" as const;
  return analysis.status;
};

export const getPatientTimeline = async (
  db: PrismaClient,
  profileId: string,
  patientId: string,
  page: number,
  pageSize: number,
) => {
  const where = { patientId, profileId };
  const [total, items] = await Promise.all([
    db.anamnesis.count({ where }),
    db.anamnesis.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true, date: true, chiefComplaint: true, nyhaClass: true,
        hasPalpitations: true, hasSyncope: true, hasEdema: true, hasChestPain: true,
        contentVersion: true, formSnapshot: true,
        template: { select: { name: true } },
        aiDiagnoses: {
          where: { isValid: true }, orderBy: { createdAt: "desc" }, take: 1,
          select: { status: true, result: true, resultSchemaVersion: true, anamnesisVersion: true },
        },
      },
    }),
  ]);
  return {
    items: items.map((item) => ({ ...item, analysisState: analysisState(item) })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
};

export const getPatientAnamnesisDetail = async (
  db: PrismaClient,
  profileId: string,
  patientId: string,
  anamnesisId: string,
) => {
  const item = await db.anamnesis.findFirst({
    where: { id: anamnesisId, patientId, profileId },
    include: {
      physicalExam: true,
      medications: true,
      surgicalRisk: true,
      template: { include: { sections: { orderBy: { order: "asc" }, include: { fields: { orderBy: { order: "asc" } } } } } },
      aiDiagnoses: { where: { isValid: true }, orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Anamnese nao encontrada" });
  return {
    ...item,
    formSnapshot: item.formSnapshot ?? (
      item.template ? createFormSnapshot(item.template, "APPROXIMATED") : null
    ),
    analysisState: analysisState(item),
  };
};

export const getPatientTrends = async (
  db: PrismaClient,
  profileId: string,
  patientId: string,
) => {
  const items = await db.anamnesis.findMany({
    where: { patientId, profileId },
    orderBy: { date: "asc" },
    select: {
      id: true, date: true, nyhaClass: true, customResponses: true, formSnapshot: true,
      physicalExam: { select: { weight: true, bpSystolic: true, bpDiastolic: true, heartRate: true, oxygenSaturation: true } },
      template: {
        select: {
          id: true,
          name: true,
          sections: {
            orderBy: { order: "asc" },
            select: {
              name: true,
              description: true,
              fields: {
                orderBy: { order: "asc" },
                select: {
                  key: true,
                  systemKey: true,
                  label: true,
                  description: true,
                  fieldType: true,
                  isSystemField: true,
                  isVisible: true,
                  isRequired: true,
                  config: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return items.map(({ template, ...item }) => ({
    ...item,
    formSnapshot: item.formSnapshot ?? (
      template ? createFormSnapshot(template, "APPROXIMATED") : null
    ),
  }));
};
