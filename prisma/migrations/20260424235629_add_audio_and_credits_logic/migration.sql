-- CreateEnum
CREATE TYPE "AudioSessionStatus" AS ENUM ('WAITING_FOR_PATIENT', 'READY', 'RECORDING', 'PROCESSING', 'SYNCED', 'FINALIZED', 'ERROR', 'INSUFFICIENT_CREDITS');

-- CreateEnum
CREATE TYPE "AudioBatchStatus" AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'ERROR');

-- CreateEnum
CREATE TYPE "CreditLedgerType" AS ENUM ('SIGNUP_BONUS', 'AUDIO_TRANSCRIPTION', 'PROMPT_INPUT', 'LLM_OUTPUT', 'MANUAL_ADJUSTMENT', 'REFUND');

-- AlterTable
ALTER TABLE "profile" ADD COLUMN     "credits_balance" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "audio_consultation_session" (
    "id" TEXT NOT NULL,
    "profile_id" UUID NOT NULL,
    "patient_id" TEXT NOT NULL,
    "consultation_id" TEXT,
    "status" "AudioSessionStatus" NOT NULL DEFAULT 'READY',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "last_batch_index" INTEGER NOT NULL DEFAULT -1,
    "current_form_state" JSONB NOT NULL,
    "last_processed_transcript" TEXT,
    "last_field_operations" JSONB,
    "credits_consumed" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audio_consultation_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audio_batch_record" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "batch_index" INTEGER NOT NULL,
    "storage_path" TEXT NOT NULL,
    "audio_duration_seconds" INTEGER NOT NULL,
    "status" "AudioBatchStatus" NOT NULL DEFAULT 'PENDING',
    "retries" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audio_batch_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_ledger_entry" (
    "id" TEXT NOT NULL,
    "profile_id" UUID NOT NULL,
    "session_id" TEXT,
    "batch_index" INTEGER,
    "type" "CreditLedgerType" NOT NULL,
    "credits" INTEGER NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_ledger_entry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "audio_consultation_session_consultation_id_key" ON "audio_consultation_session"("consultation_id");

-- CreateIndex
CREATE INDEX "audio_consultation_session_profile_id_status_idx" ON "audio_consultation_session"("profile_id", "status");

-- CreateIndex
CREATE INDEX "audio_batch_record_status_created_at_idx" ON "audio_batch_record"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "audio_batch_record_session_id_batch_index_key" ON "audio_batch_record"("session_id", "batch_index");

-- CreateIndex
CREATE INDEX "credit_ledger_entry_profile_id_created_at_idx" ON "credit_ledger_entry"("profile_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "credit_ledger_entry_session_id_batch_index_type_key" ON "credit_ledger_entry"("session_id", "batch_index", "type");

-- AddForeignKey
ALTER TABLE "audio_consultation_session" ADD CONSTRAINT "audio_consultation_session_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audio_consultation_session" ADD CONSTRAINT "audio_consultation_session_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audio_consultation_session" ADD CONSTRAINT "audio_consultation_session_consultation_id_fkey" FOREIGN KEY ("consultation_id") REFERENCES "ScheduleConsultation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audio_batch_record" ADD CONSTRAINT "audio_batch_record_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "audio_consultation_session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_ledger_entry" ADD CONSTRAINT "credit_ledger_entry_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
