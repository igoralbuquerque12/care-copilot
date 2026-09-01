-- CreateEnum
CREATE TYPE "AiProvider" AS ENUM ('OPENAI', 'GROQ', 'GEMINI', 'ANTHROPIC');

-- CreateEnum
CREATE TYPE "AnalysisStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "Anamnesis"
  ADD COLUMN "formSnapshot" JSONB,
  ADD COLUMN "contentVersion" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Existing diagnoses remain readable as legacy completed analyses.
ALTER TABLE "AiDiagnosis"
  ALTER COLUMN "summary" DROP NOT NULL,
  ALTER COLUMN "mainDiagnosisHypothesis" DROP NOT NULL,
  ALTER COLUMN "differentialDiagnoses" DROP NOT NULL,
  ALTER COLUMN "identifiedPatterns" DROP NOT NULL,
  ALTER COLUMN "riskAlerts" DROP NOT NULL,
  ALTER COLUMN "recommendedActions" DROP NOT NULL,
  ALTER COLUMN "confidenceLevel" DROP NOT NULL,
  ADD COLUMN "status" "AnalysisStatus" NOT NULL DEFAULT 'COMPLETED',
  ADD COLUMN "attempt" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "anamnesisVersion" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "provider" "AiProvider",
  ADD COLUMN "model" TEXT,
  ADD COLUMN "result" JSONB,
  ADD COLUMN "resultSchemaVersion" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "basePromptVersion" TEXT,
  ADD COLUMN "customInstructionsSnapshot" TEXT,
  ADD COLUMN "errorCode" TEXT,
  ADD COLUMN "errorMessage" TEXT,
  ADD COLUMN "startedAt" TIMESTAMP(3),
  ADD COLUMN "completedAt" TIMESTAMP(3);

CREATE INDEX "AiDiagnosis_anamnesisId_createdAt_idx" ON "AiDiagnosis"("anamnesisId", "createdAt");
CREATE INDEX "AiDiagnosis_status_idx" ON "AiDiagnosis"("status");

-- Prevent duplicate active jobs for one anamnesis while allowing retries after failure.
CREATE UNIQUE INDEX "AiDiagnosis_one_active_per_anamnesis"
  ON "AiDiagnosis"("anamnesisId")
  WHERE "status" IN ('PENDING', 'PROCESSING');

-- CreateTable
CREATE TABLE "ai_provider_credential" (
  "id" TEXT NOT NULL,
  "profile_id" UUID NOT NULL,
  "provider" "AiProvider" NOT NULL,
  "encrypted_api_key" TEXT NOT NULL,
  "iv" TEXT NOT NULL,
  "auth_tag" TEXT NOT NULL,
  "key_version" INTEGER NOT NULL DEFAULT 1,
  "last_four" TEXT NOT NULL,
  "verified_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_provider_credential_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ai_provider_credential_profile_id_provider_key"
  ON "ai_provider_credential"("profile_id", "provider");

ALTER TABLE "ai_provider_credential"
  ADD CONSTRAINT "ai_provider_credential_profile_id_fkey"
  FOREIGN KEY ("profile_id") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "ai_analysis_settings" (
  "id" TEXT NOT NULL,
  "profile_id" UUID NOT NULL,
  "provider" "AiProvider" NOT NULL,
  "model" TEXT NOT NULL,
  "custom_instructions" TEXT NOT NULL DEFAULT '',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_analysis_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ai_analysis_settings_profile_id_key" ON "ai_analysis_settings"("profile_id");

ALTER TABLE "ai_analysis_settings"
  ADD CONSTRAINT "ai_analysis_settings_profile_id_fkey"
  FOREIGN KEY ("profile_id") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
