-- CreateTable
CREATE TABLE "GameRecord" (
    "id" SERIAL NOT NULL,
    "winnerName" TEXT NOT NULL,
    "loserName" TEXT NOT NULL,
    "winnerScore" INTEGER NOT NULL,
    "loserScore" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameRecord_pkey" PRIMARY KEY ("id")
);
