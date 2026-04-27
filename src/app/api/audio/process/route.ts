import { NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { env } from "~/env";
import { db } from "~/server/db";
import { qstashAudioJobSchema } from "~/schemas/audio-session";
import { processAudioJob } from "~/server/services/audio/audioWorker.service";

export const runtime = "nodejs";
export const maxDuration = 300;

const receiver =
  env.QSTASH_CURRENT_SIGNING_KEY && env.QSTASH_NEXT_SIGNING_KEY
    ? new Receiver({
        currentSigningKey: env.QSTASH_CURRENT_SIGNING_KEY,
        nextSigningKey: env.QSTASH_NEXT_SIGNING_KEY,
      })
    : null;

export async function POST(request: Request) {
  try {
    const body = await request.text();

    if (receiver) {
      const signature = request.headers.get("upstash-signature");
      if (!signature) {
        return NextResponse.json(
          { error: "Missing signature" },
          { status: 401 },
        );
      }

      const isValid = await receiver.verify({ signature, body });
      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 },
        );
      }
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
