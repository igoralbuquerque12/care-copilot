import type { ConsolidatedFormState } from "~/schemas/audio-anamnesis-form";
import type { AudioSessionStatus } from "~/schemas/audio-session";

export type AudioSessionView = {
  id: string;
  patientId: string;
  consultationId: string | null;
  status: AudioSessionStatus;
  lastBatchIndex: number;
  currentFormState: ConsolidatedFormState;
  creditsConsumed: number;
};

export type VadFsmState = "IDLE" | "LISTENING" | "BUFFERING";

export type AudioVisualState =
  | "waiting_for_patient"
  | "ready_to_record"
  | "listening"
  | "buffering"
  | "uploading"
  | "processing"
  | "synced"
  | "error"
  | "insufficient_credits";
