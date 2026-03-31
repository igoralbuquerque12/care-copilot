/*
  Warnings:

  - Added the required column `profileId` to the `Anamnesis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profileId` to the `ScheduleConsultation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Anamnesis" ADD COLUMN     "profileId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "ScheduleConsultation" ADD COLUMN     "profileId" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "ScheduleConsultation" ADD CONSTRAINT "ScheduleConsultation_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anamnesis" ADD CONSTRAINT "Anamnesis_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
