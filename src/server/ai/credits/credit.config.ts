export const AI_CREDIT_CONFIG = {
  signupBonusCredits: 10_000,
  whisperCreditsPerAudioSecond: 3,
  promptInputTokensPerCredit: 5,
  outputTokensPerCredit: 1,
  minimumRequiredCreditsToStartSession: 300,
  minimumRequiredCreditsPerBatch: 100,
} as const;

export type AICreditConfig = typeof AI_CREDIT_CONFIG;
