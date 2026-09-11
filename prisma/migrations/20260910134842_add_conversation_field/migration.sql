/*
  Warnings:

  - A unique constraint covering the columns `[privateKey]` on the table `Conversation` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `type` to the `Conversation` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ConversationType" AS ENUM ('PRIVATE', 'GROUP');

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "name" TEXT,
ADD COLUMN     "privateKey" TEXT,
ADD COLUMN     "type" "ConversationType" NOT NULL;

-- AlterTable
ALTER TABLE "ConversationParticipant" ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_privateKey_key" ON "Conversation"("privateKey");
