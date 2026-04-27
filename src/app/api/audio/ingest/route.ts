import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { getUser } from "~/server/auth/supabase.server";
import { ingestBatch } from "~/server/services/audio/audioIngestion.service";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const payloadStr = formData.get("payload");

    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }
    if (typeof payloadStr !== "string") {
      return NextResponse.json({ error: "Missing payload" }, { status: 400 });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(payloadStr);
    } catch {
      return NextResponse.json({ error: "Invalid payload JSON" }, { status: 400 });
    }

    const result = await ingestBatch(db, {
      profileId: user.id,
      file,
      rawPayload: parsed,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("[API audio/ingest]:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
