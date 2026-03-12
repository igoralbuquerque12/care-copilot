// src/server/services/patient.service.ts

import { type PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { type CreatePatientInput } from "~/schemas/patient";

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
