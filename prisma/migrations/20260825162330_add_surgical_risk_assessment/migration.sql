-- CreateTable
CREATE TABLE "surgical_risk_assessment" (
    "id" TEXT NOT NULL,
    "profile_id" UUID NOT NULL,
    "anamnesis_id" TEXT NOT NULL,
    "surgery_name" TEXT NOT NULL,
    "is_high_risk_surgery" BOOLEAN NOT NULL DEFAULT false,
    "has_ischemic_heart_disease" BOOLEAN NOT NULL DEFAULT false,
    "has_congestive_heart_failure" BOOLEAN NOT NULL DEFAULT false,
    "has_cerebrovascular_disease" BOOLEAN NOT NULL DEFAULT false,
    "is_insulin_dependent" BOOLEAN NOT NULL DEFAULT false,
    "has_elevated_creatinine" BOOLEAN NOT NULL DEFAULT false,
    "lee_score" INTEGER NOT NULL,
    "risk_class" TEXT NOT NULL,
    "asa_class" TEXT,
    "mets" INTEGER,
    "recommendation" TEXT,
    "is_cleared" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "surgical_risk_assessment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "surgical_risk_assessment_anamnesis_id_key" ON "surgical_risk_assessment"("anamnesis_id");

-- CreateIndex
CREATE INDEX "surgical_risk_assessment_profile_id_idx" ON "surgical_risk_assessment"("profile_id");

-- AddForeignKey
ALTER TABLE "surgical_risk_assessment" ADD CONSTRAINT "surgical_risk_assessment_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surgical_risk_assessment" ADD CONSTRAINT "surgical_risk_assessment_anamnesis_id_fkey" FOREIGN KEY ("anamnesis_id") REFERENCES "Anamnesis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
