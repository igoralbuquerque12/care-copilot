import {
  AI_CREDIT_CONFIG,
  type AICreditConfig,
} from "~/server/ai/credits/credit.config";

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

// This deterministic billing estimate is not equivalent to a provider tokenizer.
export function splitTextIntoApproximateTokens(text: string): string[] {
  const normalizedText = text.trim();

  if (!normalizedText) {
    return [];
  }

  return normalizedText.match(TOKEN_REGEX) ?? [];
}

export function estimateTokenCount(text: string): number {
  return splitTextIntoApproximateTokens(text).length;
}

export function calculateAudioTranscriptionCredits(
  audioDurationSeconds: number,
  config: AICreditConfig = AI_CREDIT_CONFIG,
): number {
  const normalizedSeconds = Math.max(0, Math.ceil(audioDurationSeconds));

  return normalizedSeconds * config.whisperCreditsPerAudioSecond;
}

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
