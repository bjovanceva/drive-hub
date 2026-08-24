/*
  Warnings:

  - The values [INSTRUCTOR] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('STUDENT', 'ADMIN');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_drivingSchoolId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "instructorSchoolId" INTEGER,
ALTER COLUMN "drivingSchoolId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "instructorId" INTEGER;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_drivingSchoolId_fkey" FOREIGN KEY ("drivingSchoolId") REFERENCES "DrivingSchool"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_instructorSchoolId_fkey" FOREIGN KEY ("instructorSchoolId") REFERENCES "DrivingSchool"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
