export type AIGenerateRequest = {
  prompt: string;
  responseFormat?: "text" | "json";
};

export type AIGenerateResponse = {
  text: string;
};

export interface AIClient {
  generate(request: AIGenerateRequest): Promise<AIGenerateResponse>;
}
