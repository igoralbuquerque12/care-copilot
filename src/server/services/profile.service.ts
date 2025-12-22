
import { type PrismaClient } from "@prisma/client";

import { 
  type CreateProfileInput, 
  type UpdateProfileInput 
} from "~/schemas/profile";


export const createProfile = async (
  db: PrismaClient, 
  data: CreateProfileInput
) => {
  return db.profile.create({
    data: {
      id: data.id,
      email: data.email,
      name: data.name,
      phone: data.phone,
      photoUrl: data.photoUrl,
    },
  });
};


export const getProfileById = async (db: PrismaClient, id: string) => {
  return db.profile.findUnique({
    where: { id },
    include: {
      address: true,
    },
  });
};


export const getAllProfiles = async (db: PrismaClient) => {
  return db.profile.findMany({
    include: {
      address: true,
    },
  })
}


export const updateProfile = async (
  db: PrismaClient,
  id: string,
  data: UpdateProfileInput
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