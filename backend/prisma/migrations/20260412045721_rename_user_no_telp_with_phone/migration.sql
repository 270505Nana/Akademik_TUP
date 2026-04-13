/*
  Warnings:

  - You are about to drop the column `noTelp` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "noTelp",
ADD COLUMN     "phone" TEXT;
