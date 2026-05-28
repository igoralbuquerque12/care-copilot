import { type PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";

import {
  type CreateDoctorBySuperAdminInput,
  type CreateProfileInput,
  type UpdateProfileInput,
} from "~/schemas/profile";
import { grantSignupBonus } from "~/server/services/credits/creditLedger.service";
import { seedDefaultTemplate } from "~/server/services/formTemplate.service";
import { SupabaseService } from "~/server/supabase/supabase-admin";

export const createProfile = async (
  db: PrismaClient,
  data: CreateProfileInput,
) => {
  const profile = await db.profile.upsert({
    where: { id: data.id },
    create: {
      id: data.id,
      email: data.email,
      name: data.name,
      phone: data.phone,
      photoUrl: data.photoUrl,
    },
    update: {
      email: data.email,
      name: data.name,
      phone: data.phone,
      photoUrl: data.photoUrl,
    },
  });

  await grantSignupBonus(db, profile.id);
  await seedDefaultTemplate(db, profile.id);

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
      await seedDefaultTemplate(db, profile.id);
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

export const assertSuperAdmin = async (db: PrismaClient, profileId: string) => {
  const profile = await db.profile.findUnique({
    where: { id: profileId },
    select: { id: true, superAdmin: true },
  });

  if (!profile?.superAdmin) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Acesso restrito a administradores do sistema",
    });
  }

  return profile;
};

export const createDoctorBySuperAdmin = async (
  db: PrismaClient,
  superAdminProfileId: string,
  input: CreateDoctorBySuperAdminInput,
) => {
  await assertSuperAdmin(db, superAdminProfileId);

  const existingProfile = await db.profile.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  if (existingProfile) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Ja existe um medico cadastrado com este email",
    });
  }

  const { data, error } = await SupabaseService.client.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: input.emailConfirm,
    user_metadata: {
      name: input.name,
    },
  });

  if (error) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: error.message || "Erro ao criar usuario no Supabase",
    });
  }

  const authUser = data.user;
  if (!authUser) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Supabase nao retornou o usuario criado",
    });
  }

  try {
    return await createProfile(db, {
      id: authUser.id,
      email: input.email,
      name: input.name,
      phone: input.phone,
    });
  } catch (error) {
    await SupabaseService.client.auth.admin.deleteUser(authUser.id);
    throw error;
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
