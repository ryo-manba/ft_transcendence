/*
  Warnings:

  - You are about to drop the column `endAt` on the `ChatroomMembers` table. All the data in the column will be lost.
  - You are about to drop the column `startAt` on the `ChatroomMembers` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `ChatroomMembers` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ChatroomMembers" DROP COLUMN "endAt",
DROP COLUMN "startAt",
DROP COLUMN "status";

-- DropEnum
DROP TYPE "ChatroomMembersStatus";
