import { type PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";

import {
  type CreateProfileInput,
  type UpdateProfileInput,
} from "~/schemas/profile";
import { grantSignupBonus } from "~/server/services/credits/creditLedger.service";

export const createProfile = async (
  db: PrismaClient,
  data: CreateProfileInput,
) => {
  const profile = await db.profile.create({
    data: {
      id: data.id,
      email: data.email,
      name: data.name,
      phone: data.phone,
      photoUrl: data.photoUrl,
    },
  });

  await grantSignupBonus(db, profile.id);

  return profile;
};

export const getProfileById = async (db: PrismaClient, id: string) => {
  try {
    const profile = await db.profile.findUnique({
      where: { id },
      include: {
        address: true,
      },
    });

    if (profile) {
      await grantSignupBonus(db, profile.id);
    }

    return profile;
  } catch (error) {
    console.error("[Profile - getById]: ", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Erro ao buscar perfil",
    });
  }
};

export const getAllProfiles = async (db: PrismaClient) => {
  try {
    return await db.profile.findMany({
      include: {
        address: true,
      },
    });
  } catch (error) {
    console.error("[Profile - getAll]: ", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Erro ao listar perfis",
    });
  }
};

export const updateProfile = async (
  db: PrismaClient,
  id: string,
  data: UpdateProfileInput,
) => {
  const { address, ...profileData } = data;

  return db.profile.update({
    where: { id },
    data: {
      ...profileData,

      ...(address && {
        address: {
          upsert: {
            create: address,
            update: address,
          },
        },
      }),
    },
    include: {
      address: true,
    },
  });
};

export const deleteProfile = async (db: PrismaClient, id: string) => {
  return db.profile.delete({
    where: { id },
  });
};
