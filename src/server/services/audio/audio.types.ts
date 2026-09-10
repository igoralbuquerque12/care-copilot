import type { LlmExtractionResponse } from "~/schemas/audio-anamnesis-form";

export type IngestInput = {
  profileId: string;
  file: Blob;
  rawPayload: unknown;
};

export type MergeContext = {
  sessionId: string;
  patientId: string;
  consultationId: string | null;
  batchIndex: number;
};

export type MergeResult = {
  response: LlmExtractionResponse;
  promptText: string;
  rawOutputText: string;
};
