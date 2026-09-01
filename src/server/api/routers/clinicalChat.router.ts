import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  getClinicalChatAttachmentUrlSchema,
  getClinicalChatSchema,
} from "~/schemas/clinical-chat";
import {
  getClinicalChat,
  getClinicalChatAttachmentUrl,
} from "~/server/services/clinicalChat";

export const clinicalChatRouter = createTRPCRouter({
  get: protectedProcedure
    .input(getClinicalChatSchema)
    .query(({ ctx, input }) => getClinicalChat(ctx.db, ctx.user.id, input)),

  getAttachmentUrl: protectedProcedure
    .input(getClinicalChatAttachmentUrlSchema)
    .query(({ ctx, input }) =>
      getClinicalChatAttachmentUrl(
        ctx.db,
        ctx.user.id,
        input.patientId,
        input.attachmentId,
      ),
    ),
});
