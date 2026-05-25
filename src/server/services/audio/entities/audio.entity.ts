import type { LlmExtractionResponse } from "~/schemas/audio-anamnesis-form";

/** Input payload for the audio batch ingestion pipeline. */
export type IngestInput = {
  profileId: string;
  file: Blob;
  rawPayload: unknown;
};

/** Session and batch context forwarded to the LLM merge step. */
export type MergeContext = {
  sessionId: string;
  patientId: string;
  consultationId: string | null;
  batchIndex: number;
};

/** Result returned by the LLM merge step. */
export type MergeResult = {
  response: LlmExtractionResponse;
  /** Full prompt text sent to the LLM (used for credit calculation). */
  promptText: string;
  /** Raw text output from the LLM (used for credit calculation). */
  rawOutputText: string;
};
