/*
  Warnings:

  - The primary key for the `FriendRelation` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `FriendRelation` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[followingId,followerId]` on the table `FriendRelation` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "FriendRelation" DROP CONSTRAINT "FriendRelation_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "FriendRelation_pkey" PRIMARY KEY ("followingId", "followerId");

-- CreateIndex
CREATE UNIQUE INDEX "FriendRelation_followingId_followerId_key" ON "FriendRelation"("followingId", "followerId");
