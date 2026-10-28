import { z } from "zod";

/**
 * Helper untuk memvalidasi tanggal dalam format ISO 8601
 */
const isValidDateString = (val) => typeof val === "string" && !isNaN(Date.parse(val));

/**
 * Helper untuk preprocessing boolean dari query/body
 */
const booleanPreprocess = z.preprocess((val) => {
  if (val === undefined || val === null || val === "") return undefined;
  if (typeof val === "boolean") return val;
  if (val === "true") return true;
  if (val === "false") return false;
  return val;
}, z.boolean({ invalid_type_error: "Minat wirausaha harus berupa boolean" }).optional().nullable());

/**
 * Schema untuk Query Parameters Daftar Pendaftaran Yudisium (GET /api/yudisium-registrations)
 */
export const listYudisiumQuerySchema = z.object({
  search: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : typeof val === "string" ? val.trim() : val),
    z.string().optional()
  ),
  studyProgramId: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : typeof val === "string" ? val.trim() : val),
    z.string().optional()
  ),
  skemaSidang: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : typeof val === "string" ? val.trim() : val),
    z.string().optional()
  ),
  pengajuanCumlaude: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : typeof val === "string" ? val.trim() : val),
    z.string().optional()
  ),
  skemaCumlaude: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : typeof val === "string" ? val.trim() : val),
    z.string().optional()
  ),
  status: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : typeof val === "string" ? val.trim() : val),
    z.string().optional()
  ),
  sortBy: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : typeof val === "string" ? val.trim() : val),
    z.string().optional().default("newest")
  ),
  page: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.any().optional()
  ),
  limit: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.any().optional()
  ),
  pagination: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.any().optional()
  ),
});

/**
 * Schema untuk Export Data Yudisium (GET /api/yudisium-registrations/export)
 */
export const exportYudisiumQuerySchema = z.object({
  yudisiumPeriodId: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : typeof val === "string" ? val.trim() : val),
    z.string().uuid("ID Periode Yudisium tidak valid").optional()
  ),
});

/**
 * Schema untuk Save Draft Yudisium Registration (POST /api/yudisium-registrations)
 */
export const saveYudisiumDraftSchema = z.object({
  id: z.string({ invalid_type_error: "ID harus berupa string" }).uuid("ID harus berupa string").optional().nullable(),
  program: z.string({ invalid_type_error: "Program harus berupa string" }).trim().optional().nullable(),
  programType: z.string({ invalid_type_error: "Program harus berupa string" }).trim().optional().nullable(),
  tak: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
    z.number({ invalid_type_error: "TAK harus berupa integer" }).int("TAK harus berupa integer").min(0).optional().nullable()
  ),
  tglSidang: z
    .string({ invalid_type_error: "Tanggal sidang tidak valid" })
    .refine(isValidDateString, { message: "Tanggal sidang tidak valid" })
    .optional()
    .nullable(),
  judulTugasAkhirIndonesia: z.string({ invalid_type_error: "Judul TA (Indonesia) harus berupa string" }).trim().optional().nullable(),
  thesisTitleId: z.string({ invalid_type_error: "Judul TA (Indonesia) harus berupa string" }).trim().optional().nullable(),
  judulTugasAkhirInggris: z.string({ invalid_type_error: "Judul TA (Inggris) harus berupa string" }).trim().optional().nullable(),
  thesisTitleEn: z.string({ invalid_type_error: "Judul TA (Inggris) harus berupa string" }).trim().optional().nullable(),
  skemaSidang: z.string({ invalid_type_error: "Skema sidang harus berupa string jika diisi" }).trim().optional().nullable(),
  sidangScheme: z.string({ invalid_type_error: "Skema sidang harus berupa string jika diisi" }).trim().optional().nullable(),
  pengajuanCumlaude: z.string({ invalid_type_error: "Pengajuan cumlaude harus berupa string jika diisi" }).trim().optional().nullable(),
  jalurYudisium: z.string({ invalid_type_error: "Pengajuan cumlaude harus berupa string jika diisi" }).trim().optional().nullable(),
  skemaCumlaude: z.union([z.string(), z.array(z.string())], { invalid_type_error: "Skema cumlaude harus berupa string jika diisi" }).optional().nullable(),
  cumlaudeScheme: z.union([z.string(), z.array(z.string())], { invalid_type_error: "Skema cumlaude harus berupa string jika diisi" }).optional().nullable(),
  skemaTambahan: z.union([z.string(), z.array(z.string())]).optional().nullable(),
  evidenCumlaude: z.string({ invalid_type_error: "Eviden cumlaude harus berupa string jika diisi" }).trim().optional().nullable(),
  eviden_cumlaude: z.string({ invalid_type_error: "Eviden cumlaude harus berupa string jika diisi" }).trim().optional().nullable(),
  evidenList: z.string({ invalid_type_error: "Eviden cumlaude harus berupa string jika diisi" }).trim().optional().nullable(),
  statusKelulusan: z.string().trim().optional().nullable(),
  berminatWirausaha: booleanPreprocess,
  mahasiswaId: z.string({ invalid_type_error: "ID mahasiswa harus berupa string" }).uuid("ID mahasiswa harus berupa string").optional().nullable(),
  dosenWaliId: z.string({ invalid_type_error: "ID dosen wali harus berupa string" }).trim().min(1).optional().nullable(),
  doswalId: z.string({ invalid_type_error: "ID dosen wali harus berupa string" }).trim().min(1).optional().nullable(),
  dosenPembimbing1Id: z.string({ invalid_type_error: "ID dosen pembimbing 1 harus berupa string" }).trim().min(1).optional().nullable(),
  dosenPembimbing2Id: z.string({ invalid_type_error: "ID dosen pembimbing 2 harus berupa string" }).trim().min(1).optional().nullable(),
  yudisiumPeriodId: z.string({ invalid_type_error: "ID periode yudisium harus berupa string" }).uuid("ID periode yudisium harus berupa string").optional().nullable(),
  yudisiumRegistrationPeriodId: z.string({ invalid_type_error: "ID periode pendaftaran yudisium harus berupa string" }).uuid("ID periode pendaftaran yudisium harus berupa string").optional().nullable(),
});

/**
 * Schema untuk Submit Yudisium Registration (POST /api/yudisium-registrations/submit)
 */
export const submitYudisiumSchema = z
  .object({
    id: z
      .string({ required_error: "ID wajib diisi untuk submit", invalid_type_error: "ID harus berupa string" })
      .trim()
      .min(1, "ID wajib diisi untuk submit"),
    program: z.string({ invalid_type_error: "Program harus berupa string" }).trim().optional(),
    programType: z.string({ invalid_type_error: "Program harus berupa string" }).trim().optional(),
    tak: z.preprocess(
      (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
      z
        .number({ required_error: "TAK wajib diisi", invalid_type_error: "TAK harus berupa integer" })
        .int("TAK harus berupa integer")
    ),
    tglSidang: z
      .string({ required_error: "Tanggal sidang wajib diisi" })
      .refine(isValidDateString, { message: "Tanggal sidang tidak valid" }),
    judulTugasAkhirIndonesia: z.string({ invalid_type_error: "Judul TA (Indonesia) harus berupa string" }).trim().optional(),
    thesisTitleId: z.string({ invalid_type_error: "Judul TA (Indonesia) harus berupa string" }).trim().optional(),
    judulTugasAkhirInggris: z.string({ invalid_type_error: "Judul TA (Inggris) harus berupa string" }).trim().optional(),
    thesisTitleEn: z.string({ invalid_type_error: "Judul TA (Inggris) harus berupa string" }).trim().optional(),
    berminatWirausaha: z.preprocess(
      (val) => {
        if (val === undefined || val === null || val === "") return undefined;
        if (typeof val === "boolean") return val;
        if (val === "true") return true;
        if (val === "false") return false;
        return val;
      },
      z.boolean({
        required_error: "Minat wirausaha wajib diisi",
        invalid_type_error: "Minat wirausaha harus berupa boolean",
      })
    ),
    mahasiswaId: z
      .string({ required_error: "ID mahasiswa wajib diisi", invalid_type_error: "ID mahasiswa harus berupa string" })
      .trim()
      .min(1, "ID mahasiswa wajib diisi"),
    dosenWaliId: z.string({ invalid_type_error: "ID dosen wali harus berupa string jika diisi" }).trim().optional().nullable(),
    doswalId: z.string({ invalid_type_error: "ID dosen wali harus berupa string jika diisi" }).trim().optional().nullable(),
    dosenPembimbing1Id: z.string({ invalid_type_error: "ID dosen pembimbing 1 harus berupa string jika diisi" }).trim().optional().nullable(),
    dosenPembimbing2Id: z.string({ invalid_type_error: "ID dosen pembimbing 2 harus berupa string jika diisi" }).trim().optional().nullable(),
    skemaSidang: z.string({ invalid_type_error: "Skema sidang harus berupa string jika diisi" }).trim().optional().nullable(),
    sidangScheme: z.string({ invalid_type_error: "Skema sidang harus berupa string jika diisi" }).trim().optional().nullable(),
    pengajuanCumlaude: z.string({ invalid_type_error: "Pengajuan cumlaude harus berupa string jika diisi" }).trim().optional().nullable(),
    jalurYudisium: z.string({ invalid_type_error: "Pengajuan cumlaude harus berupa string jika diisi" }).trim().optional().nullable(),
    skemaCumlaude: z.union([z.string(), z.array(z.string())], { invalid_type_error: "Skema cumlaude harus berupa string jika diisi" }).optional().nullable(),
    cumlaudeScheme: z.union([z.string(), z.array(z.string())], { invalid_type_error: "Skema cumlaude harus berupa string jika diisi" }).optional().nullable(),
    skemaTambahan: z.union([z.string(), z.array(z.string())]).optional().nullable(),
    evidenCumlaude: z.string({ invalid_type_error: "Eviden cumlaude harus berupa string jika diisi" }).trim().optional().nullable(),
    eviden_cumlaude: z.string({ invalid_type_error: "Eviden cumlaude harus berupa string jika diisi" }).trim().optional().nullable(),
    evidenList: z.string({ invalid_type_error: "Eviden cumlaude harus berupa string jika diisi" }).trim().optional().nullable(),
    yudisiumPeriodId: z.string({ invalid_type_error: "ID periode yudisium harus berupa string" }).trim().optional().nullable(),
    yudisiumRegistrationPeriodId: z.string({ invalid_type_error: "ID periode pendaftaran yudisium harus berupa string" }).trim().optional().nullable(),
  })
  .refine((data) => Boolean(data.program || data.programType), {
    message: "Program wajib diisi",
    path: ["program"],
  })
  .refine((data) => Boolean(data.judulTugasAkhirIndonesia || data.thesisTitleId), {
    message: "Judul TA (Indonesia) wajib diisi",
    path: ["judulTugasAkhirIndonesia"],
  })
  .refine((data) => Boolean(data.judulTugasAkhirInggris || data.thesisTitleEn), {
    message: "Judul TA (Inggris) wajib diisi",
    path: ["judulTugasAkhirInggris"],
  });

/**
 * Schema untuk Approve Yudisium Registration (PUT /api/yudisium-registrations/:id/approve)
 */
export const approveYudisiumSchema = z.object({
  adminId: z
    .string({ required_error: "ID staf akademik wajib diisi" })
    .trim()
    .min(1, "ID staf akademik wajib diisi")
    .uuid("ID staf akademik tidak valid"),
  yudisiumPeriodId: z
    .string({ required_error: "ID periode yudisium wajib diisi" })
    .trim()
    .min(1, "ID periode yudisium wajib diisi")
    .uuid("ID periode yudisium tidak valid"),
  pengajuanCumlaudeFinal: z.string().trim().optional().nullable(),
  skemaCumlaudeFinal: z.string().trim().optional().nullable(),
  yudisiumRegistrationUploadIds: z
    .array(z.string().uuid("ID berkas tidak valid"))
    .optional()
    .nullable(),
});

/**
 * Schema untuk Reject / Request Revision Yudisium Registration (PUT /api/yudisium-registrations/:id/reject)
 */
export const rejectYudisiumSchema = z.object({
  adminId: z
    .string({ required_error: "ID staf akademik wajib diisi" })
    .trim()
    .min(1, "ID staf akademik wajib diisi")
    .uuid("ID staf akademik tidak valid"),
  message: z
    .string({ required_error: "Pesan penolakan wajib diisi" })
    .trim()
    .min(1, "Pesan penolakan wajib diisi"),
  isEdit: z
    .string()
    .refine(isValidDateString, {
      message: "isEdit harus berupa tanggal yang valid (format ISO 8601)",
    })
    .optional()
    .nullable(),
  yudisiumRegistrationUploadIds: z
    .array(z.string().uuid("ID berkas tidak valid"))
    .optional()
    .nullable(),
});
