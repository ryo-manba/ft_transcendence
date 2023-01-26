/*
  Warnings:

  - The primary key for the `BanRelation` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `MuteRelation` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "BanRelation" DROP CONSTRAINT "BanRelation_pkey",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "BanRelation_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "MuteRelation" DROP CONSTRAINT "MuteRelation_pkey",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "MuteRelation_pkey" PRIMARY KEY ("id");
