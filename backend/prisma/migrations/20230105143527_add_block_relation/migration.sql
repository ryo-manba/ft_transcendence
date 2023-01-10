-- CreateTable
CREATE TABLE "BlockRelation" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blockingUserId" INTEGER NOT NULL,
    "blockedByUserId" INTEGER NOT NULL,

    CONSTRAINT "BlockRelation_pkey" PRIMARY KEY ("blockingUserId","blockedByUserId")
);

-- CreateIndex
CREATE UNIQUE INDEX "BlockRelation_blockingUserId_blockedByUserId_key" ON "BlockRelation"("blockingUserId", "blockedByUserId");

-- AddForeignKey
ALTER TABLE "BlockRelation" ADD CONSTRAINT "BlockRelation_blockingUserId_fkey" FOREIGN KEY ("blockingUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockRelation" ADD CONSTRAINT "BlockRelation_blockedByUserId_fkey" FOREIGN KEY ("blockedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
