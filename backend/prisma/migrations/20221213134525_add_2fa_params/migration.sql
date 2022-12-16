/*
  Warnings:

  - A unique constraint covering the columns `[oAuthId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "has2FA" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "oAuthId" TEXT,
ADD COLUMN     "secret2FA" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "User_oAuthId_key" ON "User"("oAuthId");
