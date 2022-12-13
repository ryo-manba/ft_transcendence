-- CreateEnum
CREATE TYPE "ChatroomMembersStatus" AS ENUM ('NORMAL', 'BAN', 'MUTE');

-- AlterTable
ALTER TABLE "ChatroomMembers" ADD COLUMN     "status" "ChatroomMembersStatus" NOT NULL DEFAULT 'NORMAL';
