-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ONLINE', 'PLAYING', 'OFFLINE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'OFFLINE';
