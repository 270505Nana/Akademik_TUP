-- CreateTable
CREATE TABLE "sk_file" (
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
    "lecturerId" INTEGER,

    CONSTRAINT "sk_file_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sk_submission" (
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

    CONSTRAINT "sk_submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sk_response" (
    "id" SERIAL NOT NULL,
    "has_uploaded_final_proposal" BOOLEAN NOT NULL,
    "has_taken_language_test" BOOLEAN NOT NULL,
    "message" TEXT,
    "academicStaffId" INTEGER NOT NULL,
    "skSubmissionId" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "sk_response_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "sk_file" ADD CONSTRAINT "sk_file_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sk_file" ADD CONSTRAINT "sk_file_supervisor_1_id_fkey" FOREIGN KEY ("supervisor_1_id") REFERENCES "lecturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sk_file" ADD CONSTRAINT "sk_file_supervisor_2_id_fkey" FOREIGN KEY ("supervisor_2_id") REFERENCES "lecturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sk_file" ADD CONSTRAINT "sk_file_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "lecturer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sk_submission" ADD CONSTRAINT "sk_submission_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sk_submission" ADD CONSTRAINT "sk_submission_supervisor_1_id_fkey" FOREIGN KEY ("supervisor_1_id") REFERENCES "lecturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sk_submission" ADD CONSTRAINT "sk_submission_supervisor_2_id_fkey" FOREIGN KEY ("supervisor_2_id") REFERENCES "lecturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sk_response" ADD CONSTRAINT "sk_response_academicStaffId_fkey" FOREIGN KEY ("academicStaffId") REFERENCES "academic_staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sk_response" ADD CONSTRAINT "sk_response_skSubmissionId_fkey" FOREIGN KEY ("skSubmissionId") REFERENCES "sk_submission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
