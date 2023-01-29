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

-- CreateTable
CREATE TABLE "MuteRelation" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "chatroomId" INTEGER NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MuteRelation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BanRelation" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "chatroomId" INTEGER NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BanRelation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MuteRelation" ADD CONSTRAINT "MuteRelation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MuteRelation" ADD CONSTRAINT "MuteRelation_chatroomId_fkey" FOREIGN KEY ("chatroomId") REFERENCES "Chatroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BanRelation" ADD CONSTRAINT "BanRelation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BanRelation" ADD CONSTRAINT "BanRelation_chatroomId_fkey" FOREIGN KEY ("chatroomId") REFERENCES "Chatroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
