/*
  Warnings:

  - Added the required column `location` to the `DrivingSchool` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DrivingSchool" ADD COLUMN     "location" TEXT NOT NULL;
