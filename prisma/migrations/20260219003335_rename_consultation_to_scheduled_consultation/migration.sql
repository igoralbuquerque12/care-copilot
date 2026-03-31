/*
  Warnings:

  - You are about to drop the column `profileId` on the `Anamnesis` table. All the data in the column will be lost.
  - You are about to drop the `Consultation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Anamnesis" DROP CONSTRAINT "Anamnesis_consultationId_fkey";

-- DropForeignKey
ALTER TABLE "Anamnesis" DROP CONSTRAINT "Anamnesis_profileId_fkey";

-- DropForeignKey
ALTER TABLE "Consultation" DROP CONSTRAINT "Consultation_patientId_fkey";

-- DropForeignKey
ALTER TABLE "Consultation" DROP CONSTRAINT "Consultation_profileId_fkey";

-- AlterTable
ALTER TABLE "Anamnesis" DROP COLUMN "profileId";

-- DropTable
DROP TABLE "Consultation";

-- CreateTable
CREATE TABLE "ScheduleConsultation" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "ConsultationType" NOT NULL DEFAULT 'ROUTINE',
    "patientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduleConsultation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ScheduleConsultation" ADD CONSTRAINT "ScheduleConsultation_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anamnesis" ADD CONSTRAINT "Anamnesis_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "ScheduleConsultation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
