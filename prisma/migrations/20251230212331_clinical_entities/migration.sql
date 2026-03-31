-- CreateEnum
CREATE TYPE "ConsultationType" AS ENUM ('FIRST_VISIT', 'FOLLOW_UP', 'ROUTINE');

-- CreateEnum
CREATE TYPE "NyhaClass" AS ENUM ('I', 'II', 'III', 'IV');

-- CreateEnum
CREATE TYPE "ExerciseLevel" AS ENUM ('SEDENTARIO', 'IRREGULAR', 'ATIVO');

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "profileId" UUID NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalProfile" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "hasHypertension" BOOLEAN NOT NULL DEFAULT false,
    "hasDiabetes" BOOLEAN NOT NULL DEFAULT false,
    "diabetesDuration" INTEGER,
    "hasDyslipidemia" BOOLEAN NOT NULL DEFAULT false,
    "hasPriorInfarction" BOOLEAN NOT NULL DEFAULT false,
    "priorSurgeries" TEXT,
    "allergies" TEXT,
    "familyHistoryCoronaryEarly" BOOLEAN NOT NULL DEFAULT false,
    "familyHistorySuddenDeath" BOOLEAN NOT NULL DEFAULT false,
    "familyHistoryOthers" TEXT,
    "smokingStatus" BOOLEAN NOT NULL DEFAULT false,
    "smokingPacksYear" INTEGER,
    "alcoholConsumption" TEXT,
    "exerciseLevel" "ExerciseLevel" NOT NULL DEFAULT 'SEDENTARIO',

    CONSTRAINT "ClinicalProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Anamnesis" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "ConsultationType" NOT NULL DEFAULT 'FIRST_VISIT',
    "patientId" TEXT NOT NULL,
    "profileId" UUID NOT NULL,
    "chiefComplaint" TEXT NOT NULL,
    "currentIllnessHistory" TEXT NOT NULL,
    "treatmentResponse" TEXT,
    "symptomEvolution" TEXT,
    "newEvents" TEXT,
    "nyhaClass" "NyhaClass" NOT NULL DEFAULT 'I',
    "hasPalpitations" BOOLEAN NOT NULL DEFAULT false,
    "hasSyncope" BOOLEAN NOT NULL DEFAULT false,
    "hasEdema" BOOLEAN NOT NULL DEFAULT false,
    "hasChestPain" BOOLEAN NOT NULL DEFAULT false,
    "diagnosticHypothesis" TEXT,
    "conduct" TEXT,
    "nextRecallDate" TIMESTAMP(3),

    CONSTRAINT "Anamnesis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhysicalExam" (
    "id" TEXT NOT NULL,
    "anamnesisId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "bpSystolic" INTEGER,
    "bpDiastolic" INTEGER,
    "heartRate" INTEGER,
    "oxygenSaturation" INTEGER,
    "heartAuscultation" TEXT,
    "lungAuscultation" TEXT,
    "peripheralPulses" TEXT,
    "edemaGrade" TEXT,

    CONSTRAINT "PhysicalExam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrescribedMedication" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "anamnesisId" TEXT NOT NULL,

    CONSTRAINT "PrescribedMedication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClinicalProfile_patientId_key" ON "ClinicalProfile"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "PhysicalExam_anamnesisId_key" ON "PhysicalExam"("anamnesisId");

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalProfile" ADD CONSTRAINT "ClinicalProfile_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anamnesis" ADD CONSTRAINT "Anamnesis_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anamnesis" ADD CONSTRAINT "Anamnesis_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhysicalExam" ADD CONSTRAINT "PhysicalExam_anamnesisId_fkey" FOREIGN KEY ("anamnesisId") REFERENCES "Anamnesis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescribedMedication" ADD CONSTRAINT "PrescribedMedication_anamnesisId_fkey" FOREIGN KEY ("anamnesisId") REFERENCES "Anamnesis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
