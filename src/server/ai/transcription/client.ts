export type TranscriptionRequest = {
  audio: Buffer;
  mimeType: string;
  language?: string;
};

export type TranscriptionResponse = {
  text: string;
  durationSeconds?: number;
};

export interface AudioTranscriber {
  transcribe(request: TranscriptionRequest): Promise<TranscriptionResponse>;
}
