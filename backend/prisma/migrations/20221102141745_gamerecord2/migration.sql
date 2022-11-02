/*
  Warnings:

  - You are about to drop the column `date` on the `GameRecord` table. All the data in the column will be lost.
  - You are about to drop the column `loseScore` on the `GameRecord` table. All the data in the column will be lost.
  - You are about to drop the column `loserName` on the `GameRecord` table. All the data in the column will be lost.
  - You are about to drop the column `winScore` on the `GameRecord` table. All the data in the column will be lost.
  - Added the required column `player1Name` to the `GameRecord` table without a default value. This is not possible if the table is not empty.
  - Added the required column `player1Score` to the `GameRecord` table without a default value. This is not possible if the table is not empty.
  - Added the required column `player2Name` to the `GameRecord` table without a default value. This is not possible if the table is not empty.
  - Added the required column `player2Score` to the `GameRecord` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GameRecord" DROP COLUMN "date",
DROP COLUMN "loseScore",
DROP COLUMN "loserName",
DROP COLUMN "winScore",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "player1Name" TEXT NOT NULL,
ADD COLUMN     "player1Score" INTEGER NOT NULL,
ADD COLUMN     "player2Name" TEXT NOT NULL,
ADD COLUMN     "player2Score" INTEGER NOT NULL;
