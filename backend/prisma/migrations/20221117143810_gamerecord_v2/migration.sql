/*
  Warnings:

  - You are about to drop the column `loserName` on the `GameRecord` table. All the data in the column will be lost.
  - You are about to drop the column `winnerName` on the `GameRecord` table. All the data in the column will be lost.
  - Added the required column `loserId` to the `GameRecord` table without a default value. This is not possible if the table is not empty.
  - Added the required column `winnerId` to the `GameRecord` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GameRecord" DROP COLUMN "loserName",
DROP COLUMN "winnerName",
ADD COLUMN     "loserId" INTEGER NOT NULL,
ADD COLUMN     "winnerId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "point" INTEGER NOT NULL DEFAULT 1000;

-- AddForeignKey
ALTER TABLE "GameRecord" ADD CONSTRAINT "GameRecord_loserId_fkey" FOREIGN KEY ("loserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRecord" ADD CONSTRAINT "GameRecord_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
