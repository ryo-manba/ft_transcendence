/*
  Warnings:

  - A unique constraint covering the columns `[oauthid]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "has2FA" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "oauthid" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_oauthid_key" ON "User"("oauthid");
