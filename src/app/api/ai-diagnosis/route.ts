import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { messageQueue } from "~/server/messaging";
import { processAiDiagnosis } from "~/server/services/aiDiagnosis";

export async function POST(request: Request) {
  const body = await request.text();
  if (!await messageQueue.verifySignature(request, body)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let analysisId: string | undefined;
  try {
    analysisId = (JSON.parse(body) as { analysisId?: string }).analysisId;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (!analysisId) {
    return NextResponse.json({ error: "Missing analysisId" }, { status: 400 });
  }

  await processAiDiagnosis(db, analysisId);
  return NextResponse.json({ success: true });
}
