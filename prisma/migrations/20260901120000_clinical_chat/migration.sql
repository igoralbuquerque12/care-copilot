-- CreateEnum
CREATE TYPE "ClinicalChatMessageRole" AS ENUM ('USER', 'ASSISTANT');

-- CreateEnum
CREATE TYPE "ClinicalChatMessageStatus" AS ENUM ('STREAMING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "clinical_chat" (
  "id" TEXT NOT NULL,
  "profile_id" UUID NOT NULL,
  "patient_id" TEXT NOT NULL,
  "is_generating" BOOLEAN NOT NULL DEFAULT false,
  "generation_started_at" TIMESTAMP(3),
  "next_sequence" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "clinical_chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinical_chat_message" (
  "id" TEXT NOT NULL,
  "chat_id" TEXT NOT NULL,
  "sequence" INTEGER NOT NULL,
  "role" "ClinicalChatMessageRole" NOT NULL,
  "status" "ClinicalChatMessageStatus" NOT NULL DEFAULT 'COMPLETED',
  "content" TEXT NOT NULL DEFAULT '',
  "context_anamnesis_id" TEXT,
  "model" TEXT,
  "error_code" TEXT,
  "error_message" TEXT,
  "input_tokens" INTEGER,
  "output_tokens" INTEGER,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMP(3),
  CONSTRAINT "clinical_chat_message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinical_chat_attachment" (
  "id" TEXT NOT NULL,
  "message_id" TEXT NOT NULL,
  "storage_path" TEXT NOT NULL,
  "original_name" TEXT NOT NULL,
  "mime_type" TEXT NOT NULL,
  "size_bytes" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "clinical_chat_attachment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "clinical_chat_profile_id_patient_id_key" ON "clinical_chat"("profile_id", "patient_id");
CREATE INDEX "clinical_chat_profile_id_updated_at_idx" ON "clinical_chat"("profile_id", "updated_at");
CREATE UNIQUE INDEX "clinical_chat_message_chat_id_sequence_key" ON "clinical_chat_message"("chat_id", "sequence");
CREATE INDEX "clinical_chat_message_chat_id_sequence_idx" ON "clinical_chat_message"("chat_id", "sequence");
CREATE INDEX "clinical_chat_message_context_anamnesis_id_idx" ON "clinical_chat_message"("context_anamnesis_id");
CREATE UNIQUE INDEX "clinical_chat_attachment_storage_path_key" ON "clinical_chat_attachment"("storage_path");
CREATE INDEX "clinical_chat_attachment_message_id_idx" ON "clinical_chat_attachment"("message_id");

ALTER TABLE "clinical_chat"
  ADD CONSTRAINT "clinical_chat_profile_id_fkey"
  FOREIGN KEY ("profile_id") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "clinical_chat"
  ADD CONSTRAINT "clinical_chat_patient_id_fkey"
  FOREIGN KEY ("patient_id") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "clinical_chat_message"
  ADD CONSTRAINT "clinical_chat_message_chat_id_fkey"
  FOREIGN KEY ("chat_id") REFERENCES "clinical_chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "clinical_chat_message"
  ADD CONSTRAINT "clinical_chat_message_context_anamnesis_id_fkey"
  FOREIGN KEY ("context_anamnesis_id") REFERENCES "Anamnesis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "clinical_chat_attachment"
  ADD CONSTRAINT "clinical_chat_attachment_message_id_fkey"
  FOREIGN KEY ("message_id") REFERENCES "clinical_chat_message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
