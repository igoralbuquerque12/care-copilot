import { z } from "zod";

export const createAddressSchema = z.object({
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
});

export const updateAddressSchema = createAddressSchema.partial();

export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
export type CreateAddressInput = z.infer<typeof createAddressSchema>;
