import OpenAI from "openai";
import { NextResponse } from "next/server";
import { TRPCError } from "@trpc/server";
import { clinicalChatTurnSchema } from "~/schemas/clinical-chat";
import { getUser } from "~/server/auth/supabase.server";
import { db } from "~/server/db";
import {
  completeClinicalChatTurn,
  failClinicalChatTurn,
  prepareClinicalChatTurn,
} from "~/server/services/clinicalChat";
import { buildClinicalChatResponseParams } from "~/server/services/clinicalChat/context";
import { validateClinicalAttachments } from "~/server/services/clinicalChat/storage";

export const runtime = "nodejs";
export const maxDuration = 300;

const encoder = new TextEncoder();
const encodeSse = (event: string, data: unknown) =>
  encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

const errorStatus = (error: unknown) => {
  if (!(error instanceof TRPCError)) return 500;
  switch (error.code) {
    case "UNAUTHORIZED":
      return 401;
    case "FORBIDDEN":
      return 403;
    case "NOT_FOUND":
      return 404;
    case "CONFLICT":
      return 409;
    case "PAYLOAD_TOO_LARGE":
      return 413;
    case "BAD_REQUEST":
    case "PRECONDITION_FAILED":
      return 400;
    default:
      return 500;
  }
};

const publicErrorMessage = (error: unknown) =>
  error instanceof TRPCError
    ? error.message
    : "Nao foi possivel iniciar o chat clinico.";

const optionalFormString = (value: FormDataEntryValue | null) =>
  typeof value === "string" && value.length > 0 ? value : undefined;

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 55_000_000) {
    return NextResponse.json(
      { error: "O envio excede o limite permitido." },
      { status: 413 },
    );
  }

  const user = await getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Formulario de envio invalido." },
      { status: 400 },
    );
  }

  const parsed = clinicalChatTurnSchema.safeParse({
    patientId: formData.get("patientId"),
    anamnesisId: optionalFormString(formData.get("anamnesisId")),
    message: formData.get("message") ?? "",
    retryAssistantMessageId: optionalFormString(
      formData.get("retryAssistantMessageId"),
    ),
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados invalidos." },
      { status: 400 },
    );
  }

  const rawFiles = formData
    .getAll("files")
    .filter((entry): entry is File => entry instanceof Blob && "name" in entry);

  let turn: Awaited<ReturnType<typeof prepareClinicalChatTurn>>;
  try {
    const files = await validateClinicalAttachments(rawFiles);
    turn = await prepareClinicalChatTurn(db, user.id, parsed.data, files);
  } catch (error) {
    return NextResponse.json(
      { error: publicErrorMessage(error) },
      { status: errorStatus(error) },
    );
  }

  let params: Awaited<ReturnType<typeof buildClinicalChatResponseParams>>;
  try {
    params = await buildClinicalChatResponseParams(
      db,
      user.id,
      turn.patientId,
      turn.chatId,
      turn.anamnesisId,
    );
  } catch (error) {
    const mapped = await failClinicalChatTurn(db, turn, "", error);
    return NextResponse.json({ error: mapped.message }, { status: 500 });
  }

  const abortController = new AbortController();
  let disconnected = false;
  const handleDisconnect = () => {
    disconnected = true;
    abortController.abort();
  };
  if (request.signal.aborted) handleDisconnect();
  else
    request.signal.addEventListener("abort", handleDisconnect, { once: true });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let content = "";
      let inputTokens: number | undefined;
      let outputTokens: number | undefined;
      let completed = false;

      if (!disconnected) {
        controller.enqueue(
          encodeSse("meta", {
            chatId: turn.chatId,
            userMessageId: turn.userMessageId,
            assistantMessageId: turn.assistantMessageId,
          }),
        );
      }

      try {
        const client = new OpenAI({ apiKey: turn.apiKey });
        const openAiStream = await client.responses.create(params, {
          signal: abortController.signal,
        });

        for await (const event of openAiStream) {
          if (event.type === "response.output_text.delta") {
            content += event.delta;
            if (!disconnected)
              controller.enqueue(encodeSse("delta", { delta: event.delta }));
          } else if (event.type === "response.completed") {
            completed = true;
            inputTokens = event.response.usage?.input_tokens;
            outputTokens = event.response.usage?.output_tokens;
          } else if (event.type === "response.failed") {
            throw new Error(
              event.response.error?.message ?? "OpenAI response failed",
            );
          } else if (event.type === "response.incomplete") {
            throw new Error(
              `OpenAI response incomplete: ${event.response.incomplete_details?.reason ?? "unknown"}`,
            );
          }
        }

        if (!completed)
          throw new Error("OpenAI stream ended before completion");
        await completeClinicalChatTurn(db, turn, content, {
          inputTokens,
          outputTokens,
        });
        if (!disconnected) {
          controller.enqueue(
            encodeSse("done", {
              assistantMessageId: turn.assistantMessageId,
              content,
            }),
          );
        }
      } catch (error) {
        console.error("[Clinical chat] response generation failed");
        const mapped = await failClinicalChatTurn(db, turn, content, error);
        if (!disconnected) controller.enqueue(encodeSse("error", mapped));
      } finally {
        request.signal.removeEventListener("abort", handleDisconnect);
        if (!disconnected) controller.close();
      }
    },
    cancel: handleDisconnect,
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
