-- CreateTable
CREATE TABLE "cumlaude_scheme" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "field" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "cumlaude_scheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "yudisium_registration" (
    "id" SERIAL NOT NULL,
    "program_type" TEXT NOT NULL,
    "ipk" INTEGER NOT NULL,
    "tak" INTEGER NOT NULL,
    "sk_exp_date" DATE NOT NULL,
    "thesis_title_id" TEXT NOT NULL,
    "thesis_title_en" TEXT NOT NULL,
    "is_confirmed" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3) NOT NULL,
    "student_id" INTEGER NOT NULL,
    "supervisor_1_id" INTEGER NOT NULL,
    "supervisor_2_id" INTEGER NOT NULL,
    "sidang_scheme_id" INTEGER NOT NULL,
    "cumlaude_scheme_id" INTEGER NOT NULL,

    CONSTRAINT "yudisium_registration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cumlaude_submission" (
    "id" SERIAL NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3) NOT NULL,
    "yudisium_registration_id" INTEGER NOT NULL,

    CONSTRAINT "cumlaude_submission_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "yudisium_registration" ADD CONSTRAINT "yudisium_registration_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yudisium_registration" ADD CONSTRAINT "yudisium_registration_supervisor_1_id_fkey" FOREIGN KEY ("supervisor_1_id") REFERENCES "lecturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yudisium_registration" ADD CONSTRAINT "yudisium_registration_supervisor_2_id_fkey" FOREIGN KEY ("supervisor_2_id") REFERENCES "lecturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yudisium_registration" ADD CONSTRAINT "yudisium_registration_sidang_scheme_id_fkey" FOREIGN KEY ("sidang_scheme_id") REFERENCES "sidang_scheme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yudisium_registration" ADD CONSTRAINT "yudisium_registration_cumlaude_scheme_id_fkey" FOREIGN KEY ("cumlaude_scheme_id") REFERENCES "cumlaude_scheme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cumlaude_submission" ADD CONSTRAINT "cumlaude_submission_yudisium_registration_id_fkey" FOREIGN KEY ("yudisium_registration_id") REFERENCES "sidang_registration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
