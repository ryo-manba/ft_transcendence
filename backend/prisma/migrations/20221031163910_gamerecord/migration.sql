-- CreateTable
CREATE TABLE "GameRecord" (
    "id" SERIAL NOT NULL,
    "winnerName" TEXT NOT NULL,
    "loserName" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "winScore" INTEGER NOT NULL,
    "loseScore" INTEGER NOT NULL,
    "isPlaying" BOOLEAN NOT NULL,

    CONSTRAINT "GameRecord_pkey" PRIMARY KEY ("id")
);
