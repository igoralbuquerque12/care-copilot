-- CreateEnum
CREATE TYPE "form_field_type" AS ENUM (
    'TEXT',
    'SHORT_TEXT',
    'NUMBER',
    'BOOLEAN',
    'SELECT',
    'RADIO',
    'DATE',
    'NYHA_CLASS',
    'MEDICATIONS'
);

-- CreateTable
CREATE TABLE "anamnesis_form_template" (
    "id" TEXT NOT NULL,
    "profile_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anamnesis_form_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anamnesis_form_section" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "is_collapsible" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "anamnesis_form_section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anamnesis_form_field" (
    "id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "field_type" "form_field_type" NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB,
    "is_system_field" BOOLEAN NOT NULL DEFAULT false,
    "system_key" TEXT,

    CONSTRAINT "anamnesis_form_field_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Anamnesis"
ADD COLUMN "templateId" TEXT,
ADD COLUMN "customResponses" JSONB NOT NULL DEFAULT '{}';

-- CreateIndex
CREATE INDEX "anamnesis_form_template_profile_id_is_archived_idx" ON "anamnesis_form_template"("profile_id", "is_archived");

-- CreateIndex
CREATE INDEX "anamnesis_form_template_profile_id_is_default_idx" ON "anamnesis_form_template"("profile_id", "is_default");

-- CreateIndex
CREATE INDEX "anamnesis_form_section_template_id_order_idx" ON "anamnesis_form_section"("template_id", "order");

-- CreateIndex
CREATE UNIQUE INDEX "anamnesis_form_field_section_id_key_key" ON "anamnesis_form_field"("section_id", "key");

-- CreateIndex
CREATE INDEX "anamnesis_form_field_section_id_order_idx" ON "anamnesis_form_field"("section_id", "order");

-- AddForeignKey
ALTER TABLE "anamnesis_form_template" ADD CONSTRAINT "anamnesis_form_template_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anamnesis_form_section" ADD CONSTRAINT "anamnesis_form_section_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "anamnesis_form_template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anamnesis_form_field" ADD CONSTRAINT "anamnesis_form_field_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "anamnesis_form_section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anamnesis" ADD CONSTRAINT "Anamnesis_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "anamnesis_form_template"("id") ON DELETE SET NULL ON UPDATE CASCADE;
