-- CreateTable
CREATE TABLE "AiDiagnosis" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "anamnesisId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "mainDiagnosisHypothesis" TEXT NOT NULL,
    "differentialDiagnoses" TEXT NOT NULL,
    "identifiedPatterns" TEXT NOT NULL,
    "riskAlerts" TEXT NOT NULL,
    "recommendedActions" TEXT NOT NULL,
    "confidenceLevel" TEXT NOT NULL,
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiDiagnosis_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AiDiagnosis" ADD CONSTRAINT "AiDiagnosis_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDiagnosis" ADD CONSTRAINT "AiDiagnosis_anamnesisId_fkey" FOREIGN KEY ("anamnesisId") REFERENCES "Anamnesis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
