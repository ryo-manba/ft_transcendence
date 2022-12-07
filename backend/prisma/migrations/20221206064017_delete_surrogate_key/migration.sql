/*
  Warnings:

  - The primary key for the `ChatroomAdmin` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `ChatroomAdmin` table. All the data in the column will be lost.
  - The primary key for the `ChatroomMembers` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `ChatroomMembers` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[chatroomId,userId]` on the table `ChatroomAdmin` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[chatroomId,userId]` on the table `ChatroomMembers` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ChatroomAdmin" DROP CONSTRAINT "ChatroomAdmin_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "ChatroomAdmin_pkey" PRIMARY KEY ("chatroomId", "userId");

-- AlterTable
ALTER TABLE "ChatroomMembers" DROP CONSTRAINT "ChatroomMembers_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "ChatroomMembers_pkey" PRIMARY KEY ("chatroomId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatroomAdmin_chatroomId_userId_key" ON "ChatroomAdmin"("chatroomId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatroomMembers_chatroomId_userId_key" ON "ChatroomMembers"("chatroomId", "userId");
