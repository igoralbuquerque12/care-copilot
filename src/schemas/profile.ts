import { z } from "zod";

import { createAddressSchema, updateAddressSchema } from "~/schemas/address";

export const createProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  phone: z.string().optional(),
  photoUrl: z.string().url().optional(),
  address: createAddressSchema.optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  photoUrl: z.string().url().optional().or(z.literal("")),
  address: updateAddressSchema.optional(),
});

export const filterProfileSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().optional(),
});

export type CreateProfileInput = z.infer<typeof createProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type FilterProfileInput = z.infer<typeof filterProfileSchema>;
