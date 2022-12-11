/*
  Warnings:

  - You are about to drop the column `oauthid` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[oAuthId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "User_oauthid_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "oauthid",
ADD COLUMN     "oAuthId" TEXT,
ADD COLUMN     "secret2FA" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "User_oAuthId_key" ON "User"("oAuthId");
