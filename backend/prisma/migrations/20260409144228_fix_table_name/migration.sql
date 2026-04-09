/*
  Warnings:

  - You are about to drop the `academic_staff` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cumlaude_scheme` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cumlaude_submission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `faculty` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `lecturer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `research_group` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sidang_period` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sidang_registration` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sidang_scheme` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sidang_submission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sk_file` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sk_response` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sk_submission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `student` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `study_program` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `yudisium_registration` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "academic_staff" DROP CONSTRAINT "academic_staff_user_id_fkey";

-- DropForeignKey
ALTER TABLE "cumlaude_submission" DROP CONSTRAINT "cumlaude_submission_yudisium_registration_id_fkey";

-- DropForeignKey
ALTER TABLE "lecturer" DROP CONSTRAINT "lecturer_research_group_id_fkey";

-- DropForeignKey
ALTER TABLE "lecturer" DROP CONSTRAINT "lecturer_user_id_fkey";

-- DropForeignKey
ALTER TABLE "sidang_registration" DROP CONSTRAINT "sidang_registration_sidang_scheme_id_fkey";

-- DropForeignKey
ALTER TABLE "sidang_registration" DROP CONSTRAINT "sidang_registration_student_id_fkey";

-- DropForeignKey
ALTER TABLE "sidang_registration" DROP CONSTRAINT "sidang_registration_supervisor_1_id_fkey";

-- DropForeignKey
ALTER TABLE "sidang_registration" DROP CONSTRAINT "sidang_registration_supervisor_2_id_fkey";

-- DropForeignKey
ALTER TABLE "sidang_submission" DROP CONSTRAINT "sidang_submission_sidang_registration_id_fkey";

-- DropForeignKey
ALTER TABLE "sk_file" DROP CONSTRAINT "sk_file_student_id_fkey";

-- DropForeignKey
ALTER TABLE "sk_file" DROP CONSTRAINT "sk_file_supervisor_1_id_fkey";

-- DropForeignKey
ALTER TABLE "sk_file" DROP CONSTRAINT "sk_file_supervisor_2_id_fkey";

-- DropForeignKey
ALTER TABLE "sk_response" DROP CONSTRAINT "sk_response_academicStaffId_fkey";

-- DropForeignKey
ALTER TABLE "sk_response" DROP CONSTRAINT "sk_response_skSubmissionId_fkey";

-- DropForeignKey
ALTER TABLE "sk_submission" DROP CONSTRAINT "sk_submission_student_id_fkey";

-- DropForeignKey
ALTER TABLE "sk_submission" DROP CONSTRAINT "sk_submission_supervisor_1_id_fkey";

-- DropForeignKey
ALTER TABLE "sk_submission" DROP CONSTRAINT "sk_submission_supervisor_2_id_fkey";

-- DropForeignKey
ALTER TABLE "student" DROP CONSTRAINT "student_lecturer_id_fkey";

-- DropForeignKey
ALTER TABLE "student" DROP CONSTRAINT "student_study_program_id_fkey";

-- DropForeignKey
ALTER TABLE "student" DROP CONSTRAINT "student_user_id_fkey";

-- DropForeignKey
ALTER TABLE "study_program" DROP CONSTRAINT "study_program_faculty_id_fkey";

-- DropForeignKey
ALTER TABLE "yudisium_registration" DROP CONSTRAINT "yudisium_registration_cumlaude_scheme_id_fkey";

-- DropForeignKey
ALTER TABLE "yudisium_registration" DROP CONSTRAINT "yudisium_registration_sidang_scheme_id_fkey";

-- DropForeignKey
ALTER TABLE "yudisium_registration" DROP CONSTRAINT "yudisium_registration_student_id_fkey";

-- DropForeignKey
ALTER TABLE "yudisium_registration" DROP CONSTRAINT "yudisium_registration_supervisor_1_id_fkey";

-- DropForeignKey
ALTER TABLE "yudisium_registration" DROP CONSTRAINT "yudisium_registration_supervisor_2_id_fkey";

-- DropTable
DROP TABLE "academic_staff";

-- DropTable
DROP TABLE "cumlaude_scheme";

-- DropTable
DROP TABLE "cumlaude_submission";

-- DropTable
DROP TABLE "faculty";

-- DropTable
DROP TABLE "lecturer";

-- DropTable
DROP TABLE "research_group";

-- DropTable
DROP TABLE "sidang_period";

-- DropTable
DROP TABLE "sidang_registration";

-- DropTable
DROP TABLE "sidang_scheme";

-- DropTable
DROP TABLE "sidang_submission";

-- DropTable
DROP TABLE "sk_file";

-- DropTable
DROP TABLE "sk_response";

-- DropTable
DROP TABLE "sk_submission";

-- DropTable
DROP TABLE "student";

-- DropTable
DROP TABLE "study_program";

-- DropTable
DROP TABLE "user";

-- DropTable
DROP TABLE "yudisium_registration";

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "no_telp" TEXT,
    "role" "Role",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_staffs" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "academic_staffs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research_groups" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "research_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lecturers" (
    "id" SERIAL NOT NULL,
    "nip" TEXT NOT NULL,
    "nidn" TEXT NOT NULL,
    "lecturer_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "research_group_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "lecturers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faculties" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "faculties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_programs" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "faculty_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "study_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" SERIAL NOT NULL,
    "nim" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "class_name" TEXT NOT NULL,
    "sks" INTEGER NOT NULL,
    "ipk" INTEGER NOT NULL,
    "tak" INTEGER NOT NULL,
    "study_program_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "lecturer_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sk_files" (
    "id" SERIAL NOT NULL,
    "file_url" TEXT NOT NULL,
    "exp_date" DATE NOT NULL,
    "proposal_title_id" TEXT NOT NULL,
    "proposal_title_en" TEXT NOT NULL,
    "student_id" INTEGER NOT NULL,
    "supervisor_1_id" INTEGER NOT NULL,
    "supervisor_2_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "sk_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sk_submissions" (
    "id" SERIAL NOT NULL,
    "proposal_title_id" TEXT NOT NULL,
    "proposal_title_en" TEXT NOT NULL,
    "attachment_url" TEXT NOT NULL,
    "student_id" INTEGER NOT NULL,
    "supervisor_1_id" INTEGER NOT NULL,
    "supervisor_2_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "sk_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sk_responses" (
    "id" SERIAL NOT NULL,
    "has_uploaded_final_proposal" BOOLEAN NOT NULL,
    "has_taken_language_test" BOOLEAN NOT NULL,
    "message" TEXT,
    "academicStaffId" INTEGER NOT NULL,
    "skSubmissionId" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "sk_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sidang_periods" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "sidang_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sidang_schemes" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "field" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "sidang_schemes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sidang_registrations" (
    "id" SERIAL NOT NULL,
    "program_type" TEXT NOT NULL,
    "sks" INTEGER NOT NULL,
    "ipk" INTEGER NOT NULL,
    "tak" INTEGER NOT NULL,
    "sk_exp_date" DATE NOT NULL,
    "thesis_title_id" TEXT NOT NULL,
    "thesis_title_en" TEXT NOT NULL,
    "student_id" INTEGER NOT NULL,
    "supervisor_1_id" INTEGER NOT NULL,
    "supervisor_2_id" INTEGER NOT NULL,
    "sidang_scheme_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sidang_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sidang_submissions" (
    "id" SERIAL NOT NULL,
    "data" JSONB NOT NULL,
    "sidang_registration_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sidang_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cumlaude_schemes" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "field" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "cumlaude_schemes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "yudisium_registrations" (
    "id" SERIAL NOT NULL,
    "program_type" TEXT NOT NULL,
    "ipk" INTEGER NOT NULL,
    "tak" INTEGER NOT NULL,
    "sk_exp_date" DATE NOT NULL,
    "thesis_title_id" TEXT NOT NULL,
    "thesis_title_en" TEXT NOT NULL,
    "is_confirmed" BOOLEAN NOT NULL,
    "student_id" INTEGER NOT NULL,
    "supervisor_1_id" INTEGER NOT NULL,
    "supervisor_2_id" INTEGER NOT NULL,
    "sidang_scheme_id" INTEGER NOT NULL,
    "cumlaude_scheme_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "yudisium_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cumlaude_submissions" (
    "id" SERIAL NOT NULL,
    "data" JSONB NOT NULL,
    "yudisium_registration_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cumlaude_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "academic_staffs_user_id_key" ON "academic_staffs"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "lecturers_nip_key" ON "lecturers"("nip");

-- CreateIndex
CREATE UNIQUE INDEX "lecturers_nidn_key" ON "lecturers"("nidn");

-- CreateIndex
CREATE UNIQUE INDEX "lecturers_user_id_key" ON "lecturers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "students_nim_key" ON "students"("nim");

-- CreateIndex
CREATE UNIQUE INDEX "students_user_id_key" ON "students"("user_id");

-- AddForeignKey
ALTER TABLE "academic_staffs" ADD CONSTRAINT "academic_staffs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lecturers" ADD CONSTRAINT "lecturers_research_group_id_fkey" FOREIGN KEY ("research_group_id") REFERENCES "research_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lecturers" ADD CONSTRAINT "lecturers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_programs" ADD CONSTRAINT "study_programs_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "faculties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_study_program_id_fkey" FOREIGN KEY ("study_program_id") REFERENCES "study_programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_lecturer_id_fkey" FOREIGN KEY ("lecturer_id") REFERENCES "lecturers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sk_files" ADD CONSTRAINT "sk_files_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sk_files" ADD CONSTRAINT "sk_files_supervisor_1_id_fkey" FOREIGN KEY ("supervisor_1_id") REFERENCES "lecturers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sk_files" ADD CONSTRAINT "sk_files_supervisor_2_id_fkey" FOREIGN KEY ("supervisor_2_id") REFERENCES "lecturers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sk_submissions" ADD CONSTRAINT "sk_submissions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sk_submissions" ADD CONSTRAINT "sk_submissions_supervisor_1_id_fkey" FOREIGN KEY ("supervisor_1_id") REFERENCES "lecturers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sk_submissions" ADD CONSTRAINT "sk_submissions_supervisor_2_id_fkey" FOREIGN KEY ("supervisor_2_id") REFERENCES "lecturers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sk_responses" ADD CONSTRAINT "sk_responses_academicStaffId_fkey" FOREIGN KEY ("academicStaffId") REFERENCES "academic_staffs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sk_responses" ADD CONSTRAINT "sk_responses_skSubmissionId_fkey" FOREIGN KEY ("skSubmissionId") REFERENCES "sk_submissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sidang_registrations" ADD CONSTRAINT "sidang_registrations_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sidang_registrations" ADD CONSTRAINT "sidang_registrations_supervisor_1_id_fkey" FOREIGN KEY ("supervisor_1_id") REFERENCES "lecturers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sidang_registrations" ADD CONSTRAINT "sidang_registrations_supervisor_2_id_fkey" FOREIGN KEY ("supervisor_2_id") REFERENCES "lecturers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sidang_registrations" ADD CONSTRAINT "sidang_registrations_sidang_scheme_id_fkey" FOREIGN KEY ("sidang_scheme_id") REFERENCES "sidang_schemes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sidang_submissions" ADD CONSTRAINT "sidang_submissions_sidang_registration_id_fkey" FOREIGN KEY ("sidang_registration_id") REFERENCES "sidang_registrations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yudisium_registrations" ADD CONSTRAINT "yudisium_registrations_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yudisium_registrations" ADD CONSTRAINT "yudisium_registrations_supervisor_1_id_fkey" FOREIGN KEY ("supervisor_1_id") REFERENCES "lecturers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yudisium_registrations" ADD CONSTRAINT "yudisium_registrations_supervisor_2_id_fkey" FOREIGN KEY ("supervisor_2_id") REFERENCES "lecturers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yudisium_registrations" ADD CONSTRAINT "yudisium_registrations_sidang_scheme_id_fkey" FOREIGN KEY ("sidang_scheme_id") REFERENCES "sidang_schemes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yudisium_registrations" ADD CONSTRAINT "yudisium_registrations_cumlaude_scheme_id_fkey" FOREIGN KEY ("cumlaude_scheme_id") REFERENCES "cumlaude_schemes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cumlaude_submissions" ADD CONSTRAINT "cumlaude_submissions_yudisium_registration_id_fkey" FOREIGN KEY ("yudisium_registration_id") REFERENCES "yudisium_registrations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
