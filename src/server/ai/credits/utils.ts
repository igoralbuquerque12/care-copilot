import {
  AI_CREDIT_CONFIG,
  type AICreditConfig,
} from "~/server/ai/credits/config";

const TOKEN_REGEX = /[\p{L}\p{N}_]+|[^\s\p{L}\p{N}_]/gu;

export type CreditConsumptionBreakdown = {
  audioDurationSeconds: number;
  audioCredits: number;
  inputTokens: number;
  inputCredits: number;
  outputTokens: number;
  outputCredits: number;
  totalCredits: number;
};

/**
 * Splits a text into approximate tokens using a lightweight regex strategy.
 *
 * This is intentionally simple and deterministic. It is suitable for product
 * billing heuristics, but it is not equivalent to the tokenizer used by model
 * providers.
 *
 * @param text - Raw text to estimate.
 * @returns An array of approximate tokens.
 */
export function splitTextIntoApproximateTokens(text: string): string[] {
  const normalizedText = text.trim();

  if (!normalizedText) {
    return [];
  }

  return normalizedText.match(TOKEN_REGEX) ?? [];
}

/**
 * Counts approximate tokens for a given text.
 *
 * @param text - Raw text to estimate.
 * @returns The estimated token count.
 */
export function estimateTokenCount(text: string): number {
  return splitTextIntoApproximateTokens(text).length;
}

/**
 * Calculates how many credits should be charged for a transcribed audio batch.
 *
 * Fractions of a second are rounded up to avoid under-billing partial audio.
 *
 * @param audioDurationSeconds - Duration of the processed audio batch.
 * @param config - Optional pricing config override.
 * @returns The credits charged for audio transcription.
 */
export function calculateAudioTranscriptionCredits(
  audioDurationSeconds: number,
  config: AICreditConfig = AI_CREDIT_CONFIG,
): number {
  const normalizedSeconds = Math.max(0, Math.ceil(audioDurationSeconds));

  return normalizedSeconds * config.whisperCreditsPerAudioSecond;
}

/**
 * Calculates credits charged for the final prompt sent to the extraction model.
 *
 * @param promptText - Final prompt text sent to the model.
 * @param config - Optional pricing config override.
 * @returns The credits charged for prompt input.
 */
export function calculatePromptInputCredits(
  promptText: string,
  config: AICreditConfig = AI_CREDIT_CONFIG,
): number {
  const inputTokens = estimateTokenCount(promptText);

  if (inputTokens === 0) {
    return 0;
  }

  return Math.ceil(inputTokens / config.promptInputTokensPerCredit);
}

/**
 * Calculates credits charged for the model output text.
 *
 * @param outputText - Model response text.
 * @param config - Optional pricing config override.
 * @returns The credits charged for model output.
 */
export function calculateOutputCredits(
  outputText: string,
  config: AICreditConfig = AI_CREDIT_CONFIG,
): number {
  const outputTokens = estimateTokenCount(outputText);

  if (outputTokens === 0) {
    return 0;
  }

  return Math.ceil(outputTokens / config.outputTokensPerCredit);
}

/**
 * Calculates the full credit breakdown for a processed audio batch.
 *
 * @param params - Raw inputs used by the worker.
 * @param config - Optional pricing config override.
 * @returns A breakdown ready to persist in a ledger entry.
 */
export function calculateCreditConsumptionBreakdown(
  params: {
    audioDurationSeconds: number;
    promptText: string;
    outputText: string;
  },
  config: AICreditConfig = AI_CREDIT_CONFIG,
): CreditConsumptionBreakdown {
  const inputTokens = estimateTokenCount(params.promptText);
  const outputTokens = estimateTokenCount(params.outputText);
  const audioCredits = calculateAudioTranscriptionCredits(
    params.audioDurationSeconds,
    config,
  );
  const inputCredits = inputTokens
    ? Math.ceil(inputTokens / config.promptInputTokensPerCredit)
    : 0;
  const outputCredits = outputTokens
    ? Math.ceil(outputTokens / config.outputTokensPerCredit)
    : 0;

  return {
    audioDurationSeconds: Math.max(0, params.audioDurationSeconds),
    audioCredits,
    inputTokens,
    inputCredits,
    outputTokens,
    outputCredits,
    totalCredits: audioCredits + inputCredits + outputCredits,
  };
}
