// src/server/services/patient.service.ts

import { type PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { type CreatePatientInput } from "~/schemas/patient";

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
