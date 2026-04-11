-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'LECTURER', 'ACADEMIC_STAFF');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "noTelp" TEXT,
    "role" "Role",

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicStaff" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "name" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "AcademicStaff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchGroup" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "name" TEXT NOT NULL,

    CONSTRAINT "ResearchGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lecturer" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "nip" TEXT NOT NULL,
    "nidn" TEXT NOT NULL,
    "lecturerCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "researchGroupId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Lecturer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Faculty" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "name" TEXT NOT NULL,

    CONSTRAINT "Faculty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyProgram" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "name" TEXT NOT NULL,
    "facultyId" INTEGER NOT NULL,

    CONSTRAINT "StudyProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "nim" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "sks" INTEGER NOT NULL,
    "ipk" INTEGER NOT NULL,
    "tak" INTEGER NOT NULL,
    "studyProgramId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "dosenWaliId" INTEGER NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkFile" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "fileUrl" TEXT NOT NULL,
    "exp_date" DATE NOT NULL,
    "proposalTitleId" TEXT NOT NULL,
    "proposalTitleEn" TEXT NOT NULL,
    "studentId" INTEGER NOT NULL,
    "dosenPembimbing1Id" INTEGER NOT NULL,
    "dosenPembimbing2Id" INTEGER NOT NULL,

    CONSTRAINT "SkFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkSubmission" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "proposalTitleId" TEXT NOT NULL,
    "proposalTitleEn" TEXT NOT NULL,
    "attachmentUrl" TEXT NOT NULL,
    "studentId" INTEGER NOT NULL,
    "dosenPembimbing1Id" INTEGER NOT NULL,
    "dosenPembimbing2Id" INTEGER NOT NULL,

    CONSTRAINT "SkSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkResponse" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "hasUploadedFinalProposal" BOOLEAN NOT NULL,
    "hasTakenLanguageTest" BOOLEAN NOT NULL,
    "message" TEXT,
    "academicStaffId" INTEGER NOT NULL,
    "skSubmissionId" INTEGER NOT NULL,

    CONSTRAINT "SkResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SidangPeriod" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "name" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,

    CONSTRAINT "SidangPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SidangScheme" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "name" TEXT NOT NULL,
    "field" JSONB,

    CONSTRAINT "SidangScheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SidangRegistration" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "programType" TEXT NOT NULL,
    "sks" INTEGER NOT NULL,
    "ipk" INTEGER NOT NULL,
    "tak" INTEGER NOT NULL,
    "sk_exp_date" DATE NOT NULL,
    "thesisTitleId" TEXT NOT NULL,
    "thesisTitleEn" TEXT NOT NULL,
    "studentId" INTEGER NOT NULL,
    "dosenPembimbing1Id" INTEGER NOT NULL,
    "dosenPembimbing2Id" INTEGER NOT NULL,
    "sidangSchemeId" INTEGER NOT NULL,

    CONSTRAINT "SidangRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SidangSubmission" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "data" JSONB NOT NULL,
    "sidangRegistrationId" INTEGER NOT NULL,

    CONSTRAINT "SidangSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CumlaudeScheme" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "name" TEXT NOT NULL,
    "field" JSONB,

    CONSTRAINT "CumlaudeScheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YudisiumRegistration" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "programType" TEXT NOT NULL,
    "ipk" INTEGER NOT NULL,
    "tak" INTEGER NOT NULL,
    "sk_exp_date" DATE NOT NULL,
    "thesisTitleId" TEXT NOT NULL,
    "thesisTitleEn" TEXT NOT NULL,
    "isConfirmed" BOOLEAN NOT NULL,
    "studentId" INTEGER NOT NULL,
    "dosenPembimbing1Id" INTEGER NOT NULL,
    "dosenPembimbing2Id" INTEGER NOT NULL,
    "sidangSchemeId" INTEGER NOT NULL,
    "cumlaudeSchemeId" INTEGER NOT NULL,

    CONSTRAINT "YudisiumRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CumlaudeSubmission" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL,
    "data" JSONB NOT NULL,
    "yudisiumRegistrationId" INTEGER NOT NULL,

    CONSTRAINT "CumlaudeSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicStaff_userId_key" ON "AcademicStaff"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Lecturer_nip_key" ON "Lecturer"("nip");

-- CreateIndex
CREATE UNIQUE INDEX "Lecturer_nidn_key" ON "Lecturer"("nidn");

-- CreateIndex
CREATE UNIQUE INDEX "Lecturer_userId_key" ON "Lecturer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_nim_key" ON "Student"("nim");

-- CreateIndex
CREATE UNIQUE INDEX "Student_userId_key" ON "Student"("userId");

-- AddForeignKey
ALTER TABLE "AcademicStaff" ADD CONSTRAINT "AcademicStaff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lecturer" ADD CONSTRAINT "Lecturer_researchGroupId_fkey" FOREIGN KEY ("researchGroupId") REFERENCES "ResearchGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lecturer" ADD CONSTRAINT "Lecturer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyProgram" ADD CONSTRAINT "StudyProgram_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_studyProgramId_fkey" FOREIGN KEY ("studyProgramId") REFERENCES "StudyProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_dosenWaliId_fkey" FOREIGN KEY ("dosenWaliId") REFERENCES "Lecturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkFile" ADD CONSTRAINT "SkFile_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkFile" ADD CONSTRAINT "SkFile_dosenPembimbing1Id_fkey" FOREIGN KEY ("dosenPembimbing1Id") REFERENCES "Lecturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkFile" ADD CONSTRAINT "SkFile_dosenPembimbing2Id_fkey" FOREIGN KEY ("dosenPembimbing2Id") REFERENCES "Lecturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkSubmission" ADD CONSTRAINT "SkSubmission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkSubmission" ADD CONSTRAINT "SkSubmission_dosenPembimbing1Id_fkey" FOREIGN KEY ("dosenPembimbing1Id") REFERENCES "Lecturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkSubmission" ADD CONSTRAINT "SkSubmission_dosenPembimbing2Id_fkey" FOREIGN KEY ("dosenPembimbing2Id") REFERENCES "Lecturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkResponse" ADD CONSTRAINT "SkResponse_academicStaffId_fkey" FOREIGN KEY ("academicStaffId") REFERENCES "AcademicStaff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkResponse" ADD CONSTRAINT "SkResponse_skSubmissionId_fkey" FOREIGN KEY ("skSubmissionId") REFERENCES "SkSubmission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SidangRegistration" ADD CONSTRAINT "SidangRegistration_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SidangRegistration" ADD CONSTRAINT "SidangRegistration_dosenPembimbing1Id_fkey" FOREIGN KEY ("dosenPembimbing1Id") REFERENCES "Lecturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SidangRegistration" ADD CONSTRAINT "SidangRegistration_dosenPembimbing2Id_fkey" FOREIGN KEY ("dosenPembimbing2Id") REFERENCES "Lecturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SidangRegistration" ADD CONSTRAINT "SidangRegistration_sidangSchemeId_fkey" FOREIGN KEY ("sidangSchemeId") REFERENCES "SidangScheme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SidangSubmission" ADD CONSTRAINT "SidangSubmission_sidangRegistrationId_fkey" FOREIGN KEY ("sidangRegistrationId") REFERENCES "SidangRegistration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YudisiumRegistration" ADD CONSTRAINT "YudisiumRegistration_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YudisiumRegistration" ADD CONSTRAINT "YudisiumRegistration_dosenPembimbing1Id_fkey" FOREIGN KEY ("dosenPembimbing1Id") REFERENCES "Lecturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YudisiumRegistration" ADD CONSTRAINT "YudisiumRegistration_dosenPembimbing2Id_fkey" FOREIGN KEY ("dosenPembimbing2Id") REFERENCES "Lecturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YudisiumRegistration" ADD CONSTRAINT "YudisiumRegistration_sidangSchemeId_fkey" FOREIGN KEY ("sidangSchemeId") REFERENCES "SidangScheme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YudisiumRegistration" ADD CONSTRAINT "YudisiumRegistration_cumlaudeSchemeId_fkey" FOREIGN KEY ("cumlaudeSchemeId") REFERENCES "CumlaudeScheme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CumlaudeSubmission" ADD CONSTRAINT "CumlaudeSubmission_yudisiumRegistrationId_fkey" FOREIGN KEY ("yudisiumRegistrationId") REFERENCES "YudisiumRegistration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
