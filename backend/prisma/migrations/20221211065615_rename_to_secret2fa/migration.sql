/*
  Warnings:

  - You are about to drop the column `twoFASecret` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "twoFASecret",
ADD COLUMN     "secret2FA" TEXT NOT NULL DEFAULT '';
