/*
  Warnings:

  - You are about to drop the column `lecturerId` on the `sk_file` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "sk_file" DROP CONSTRAINT "sk_file_lecturerId_fkey";

-- AlterTable
ALTER TABLE "sk_file" DROP COLUMN "lecturerId";

-- CreateTable
CREATE TABLE "sidang_period" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "sidang_period_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sidang_scheme" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "field" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "sidang_scheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sidang_registration" (
    "id" SERIAL NOT NULL,
    "program_type" TEXT NOT NULL,
    "sks" INTEGER NOT NULL,
    "ipk" INTEGER NOT NULL,
    "tak" INTEGER NOT NULL,
    "sk_exp_date" DATE NOT NULL,
    "thesis_title_id" TEXT NOT NULL,
    "thesis_title_en" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3) NOT NULL,
    "student_id" INTEGER NOT NULL,
    "supervisor_1_id" INTEGER NOT NULL,
    "supervisor_2_id" INTEGER NOT NULL,
    "sidang_scheme_id" INTEGER NOT NULL,

    CONSTRAINT "sidang_registration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sidang_submission" (
    "id" SERIAL NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3) NOT NULL,
    "sidang_registration_id" INTEGER NOT NULL,

    CONSTRAINT "sidang_submission_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "sidang_registration" ADD CONSTRAINT "sidang_registration_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sidang_registration" ADD CONSTRAINT "sidang_registration_supervisor_1_id_fkey" FOREIGN KEY ("supervisor_1_id") REFERENCES "lecturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sidang_registration" ADD CONSTRAINT "sidang_registration_supervisor_2_id_fkey" FOREIGN KEY ("supervisor_2_id") REFERENCES "lecturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sidang_registration" ADD CONSTRAINT "sidang_registration_sidang_scheme_id_fkey" FOREIGN KEY ("sidang_scheme_id") REFERENCES "sidang_scheme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sidang_submission" ADD CONSTRAINT "sidang_submission_sidang_registration_id_fkey" FOREIGN KEY ("sidang_registration_id") REFERENCES "sidang_registration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
