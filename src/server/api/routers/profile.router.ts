import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  createDoctorBySuperAdminSchema,
  updateProfileSchema,
} from "~/schemas/profile";
import * as profileService from "~/server/services/profile.service";

export const profileRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    return profileService.getProfileById(ctx.db, ctx.user.id);
  }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    return profileService.getAllProfiles(ctx.db);
  }),

  update: protectedProcedure
    .input(updateProfileSchema)
    .mutation(async ({ ctx, input }) => {
      return profileService.updateProfile(ctx.db, ctx.user.id, input);
    }),

  createDoctorBySuperAdmin: protectedProcedure
    .input(createDoctorBySuperAdminSchema)
    .mutation(async ({ ctx, input }) => {
      return profileService.createDoctorBySuperAdmin(ctx.db, ctx.user.id, input);
    }),

  delete: protectedProcedure.mutation(async ({ ctx }) => {
    return profileService.deleteProfile(ctx.db, ctx.user.id);
  }),
});
