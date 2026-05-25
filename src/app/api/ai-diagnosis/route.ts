import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { messageQueue } from "~/server/messaging";
import { processAiDiagnosis } from "~/server/services/aiDiagnosis";

export async function POST(request: Request) {
  try {
    const body = await request.text();

    const isValid = await messageQueue.verifySignature(request, body);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const { patientId, anamnesisId } = JSON.parse(body) as {
      patientId: string;
      anamnesisId: string;
    };

    if (!patientId || !anamnesisId) {
      return NextResponse.json(
        { error: "Missing patientId or anamnesisId" },
        { status: 400 },
      );
    }

    await processAiDiagnosis(db, patientId, anamnesisId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API ai-diagnosis]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
