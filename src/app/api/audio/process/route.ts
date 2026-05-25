import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { messageQueue } from "~/server/messaging";
import { qstashAudioJobSchema } from "~/schemas/audio-session";
import { processAudioJob } from "~/server/services/audio/services/worker.service";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const body = await request.text();

    const isValid = await messageQueue.verifySignature(request, body);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const json = JSON.parse(body) as unknown;
    const job = qstashAudioJobSchema.parse(json);

    const result = await processAudioJob(db, job);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("[API audio/process]:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
