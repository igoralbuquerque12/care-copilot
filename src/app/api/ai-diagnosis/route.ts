import { NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { env } from "~/env";
import { db } from "~/server/db";
import { processAiDiagnosis } from "~/server/services/aiDiagnosis";

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
          { status: 401 }
        );
      }

      const isValid = await receiver.verify({
        signature,
        body,
      });

      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    }

    const { patientId, anamnesisId } = JSON.parse(body) as {
      patientId: string;
      anamnesisId: string;
    };

    if (!patientId || !anamnesisId) {
      return NextResponse.json(
        { error: "Missing patientId or anamnesisId" },
        { status: 400 }
      );
    }

    await processAiDiagnosis(db, patientId, anamnesisId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API ai-diagnosis]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
