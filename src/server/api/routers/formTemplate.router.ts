import { z } from "zod";

import {
  createFormTemplateSchema,
  updateFormTemplateSchema,
} from "~/schemas/form-template";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import * as formTemplateService from "~/server/services/formTemplate.service";

export const formTemplateRouter = createTRPCRouter({
  getDefault: protectedProcedure.query(({ ctx }) =>
    formTemplateService.getDefaultTemplate(ctx.db, ctx.user.id),
  ),

  list: protectedProcedure.query(({ ctx }) =>
    formTemplateService.listTemplates(ctx.db, ctx.user.id),
  ),

  getById: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(({ ctx, input }) =>
      formTemplateService.getTemplateById(ctx.db, ctx.user.id, input.id),
    ),

  create: protectedProcedure
    .input(createFormTemplateSchema)
    .mutation(({ ctx, input }) =>
      formTemplateService.createTemplate(ctx.db, ctx.user.id, input),
    ),

  update: protectedProcedure
    .input(updateFormTemplateSchema)
    .mutation(({ ctx, input }) =>
      formTemplateService.updateTemplate(ctx.db, ctx.user.id, input),
    ),

  setDefault: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(({ ctx, input }) =>
      formTemplateService.setDefaultTemplate(ctx.db, ctx.user.id, input.id),
    ),

  duplicate: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(({ ctx, input }) =>
      formTemplateService.duplicateTemplate(ctx.db, ctx.user.id, input.id),
    ),

  archive: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(({ ctx, input }) =>
      formTemplateService.archiveTemplate(ctx.db, ctx.user.id, input.id),
    ),
});
