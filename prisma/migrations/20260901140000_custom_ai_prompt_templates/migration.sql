ALTER TABLE "ai_analysis_settings"
  ADD COLUMN "analysis_prompt_template" TEXT,
  ADD COLUMN "clinical_chat_prompt_template" TEXT;

ALTER TABLE "AiDiagnosis"
  ADD COLUMN "promptTemplateSnapshot" TEXT;
