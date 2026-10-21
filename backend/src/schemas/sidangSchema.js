import { z } from "zod";

/**
 * Helper untuk memvalidasi tanggal dalam format ISO 8601
 */
const isValidDateString = (val) => typeof val === "string" && !isNaN(Date.parse(val));

/**
 * Schema untuk Query Parameters Daftar Pendaftaran Sidang (GET /api/sidang-registrations)
 */
export const listSidangQuerySchema = z.object({
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
  jalurNonSidang: z.preprocess(
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
 * Schema untuk Save Draft Sidang Registration (POST /api/sidang-registrations)
 * Menerima field kanonikal Prisma maupun varian yang digunakan oleh klien/frontend
 */
export const saveSidangDraftSchema = z.object({
  id: z.string().uuid("ID Pendaftaran tidak valid").optional().nullable(),
  mahasiswaId: z.string().uuid("ID Mahasiswa tidak valid").optional().nullable(),
  programType: z.string({ invalid_type_error: "Tipe program harus berupa string" }).trim().optional().nullable(),
  program: z.string({ invalid_type_error: "Tipe program harus berupa string" }).trim().optional().nullable(),
  sidangScheme: z.string().trim().optional().nullable(),
  skemaSidang: z.string().trim().optional().nullable(),
  skemaSidangFinal: z.string().trim().optional().nullable(),
  jalurNonSidang: z
    .array(z.string(), { invalid_type_error: "Jalur non sidang harus berupa array jika diisi" })
    .optional()
    .nullable(),
  jalurNonSidangFinal: z.string().trim().optional().nullable(),
  lulusTesBahasa: z.preprocess((val) => {
    if (val === undefined || val === null || val === "") return undefined;
    if (typeof val === "boolean") return val;
    if (val === "true") return true;
    if (val === "false") return false;
    return val;
  }, z.boolean({ invalid_type_error: "lulusTesBahasa harus berupa boolean" }).optional().nullable()),
  sks: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
    z.number({ invalid_type_error: "SKS harus berupa integer" }).int("SKS harus berupa integer").min(0).max(200).optional().nullable()
  ),
  ipk: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
    z.number({ invalid_type_error: "IPK harus berupa float" }).min(0).max(4).optional().nullable()
  ),
  tak: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
    z.number({ invalid_type_error: "TAK harus berupa integer" }).int("TAK harus berupa integer").min(0).optional().nullable()
  ),
  sktaExpDate: z
    .string({ invalid_type_error: "Tanggal berlaku SKTA harus berupa tanggal yang valid (format ISO 8601)" })
    .refine(isValidDateString, {
      message: "Tanggal berlaku SKTA harus berupa tanggal yang valid (format ISO 8601)",
    })
    .optional()
    .nullable(),
  thesisTitleId: z.string({ invalid_type_error: "Judul TA (ID) harus berupa string" }).trim().optional().nullable(),
  thesisTitleEn: z.string({ invalid_type_error: "Judul TA (EN) harus berupa string" }).trim().optional().nullable(),
  judulTugasAkhirIndonesia: z.string({ invalid_type_error: "Judul TA (ID) harus berupa string" }).trim().optional().nullable(),
  judulTugasAkhirInggris: z.string({ invalid_type_error: "Judul TA (EN) harus berupa string" }).trim().optional().nullable(),
  dosenPembimbing1Id: z.string().uuid("ID Dosen Pembimbing 1 tidak valid").optional().nullable(),
  dosenPembimbing2Id: z.string().uuid("ID Dosen Pembimbing 2 tidak valid").optional().nullable(),
});

/**
 * Schema untuk Submit Sidang Registration (POST /api/sidang-registrations/submit)
 */
export const submitSidangSchema = z
  .object({
    id: z
      .string({ required_error: "ID wajib diisi untuk submit", invalid_type_error: "ID harus berupa string" })
      .trim()
      .min(1, "ID wajib diisi untuk submit"),
    programType: z.string({ invalid_type_error: "Tipe program harus berupa string" }).trim().optional(),
    program: z.string({ invalid_type_error: "Tipe program harus berupa string" }).trim().optional(),
    sidangScheme: z.string().trim().optional().nullable(),
    skemaSidang: z.string().trim().optional().nullable(),
    jalurNonSidang: z
      .array(z.string(), { invalid_type_error: "Jalur non sidang harus berupa array jika diisi" })
      .optional()
      .nullable(),
    lulusTesBahasa: z.preprocess((val) => {
      if (val === undefined || val === null || val === "") return undefined;
      if (typeof val === "boolean") return val;
      if (val === "true") return true;
      if (val === "false") return false;
      return val;
    }, z.boolean({ invalid_type_error: "lulusTesBahasa harus berupa boolean" }).optional().nullable()),
    sks: z.preprocess(
      (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
      z
        .number({ required_error: "SKS wajib diisi", invalid_type_error: "SKS harus berupa integer" })
        .int("SKS harus berupa integer")
    ),
    ipk: z.preprocess(
      (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
      z.number({ required_error: "IPK wajib diisi", invalid_type_error: "IPK harus berupa float" })
    ),
    tak: z.preprocess(
      (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
      z
        .number({ required_error: "TAK wajib diisi", invalid_type_error: "TAK harus berupa integer" })
        .int("TAK harus berupa integer")
    ),
    sktaExpDate: z
      .string({ required_error: "Tanggal berlaku SKTA wajib diisi" })
      .refine(isValidDateString, {
        message: "Tanggal berlaku SKTA harus berupa tanggal yang valid (format ISO 8601)",
      }),
    thesisTitleId: z.string({ invalid_type_error: "Judul TA (ID) harus berupa string" }).trim().optional(),
    thesisTitleEn: z.string({ invalid_type_error: "Judul TA (EN) harus berupa string" }).trim().optional(),
    judulTugasAkhirIndonesia: z.string({ invalid_type_error: "Judul TA (ID) harus berupa string" }).trim().optional(),
    judulTugasAkhirInggris: z.string({ invalid_type_error: "Judul TA (EN) harus berupa string" }).trim().optional(),
    mahasiswaId: z
      .string({ required_error: "ID mahasiswa wajib diisi", invalid_type_error: "ID mahasiswa harus berupa string" })
      .trim()
      .min(1, "ID mahasiswa wajib diisi"),
    dosenPembimbing1Id: z
      .string({ required_error: "ID dosen pembimbing 1 wajib diisi", invalid_type_error: "ID dosen pembimbing 1 harus berupa string" })
      .trim()
      .min(1, "ID dosen pembimbing 1 wajib diisi"),
    dosenPembimbing2Id: z
      .string({ required_error: "ID dosen pembimbing 2 wajib diisi", invalid_type_error: "ID dosen pembimbing 2 harus berupa string" })
      .trim()
      .min(1, "ID dosen pembimbing 2 wajib diisi"),
  })
  .refine((data) => Boolean(data.programType || data.program), {
    message: "Tipe program wajib diisi",
    path: ["programType"],
  })
  .refine((data) => Boolean(data.thesisTitleId || data.judulTugasAkhirIndonesia), {
    message: "Judul TA (ID) wajib diisi",
    path: ["thesisTitleId"],
  })
  .refine((data) => Boolean(data.thesisTitleEn || data.judulTugasAkhirInggris), {
    message: "Judul TA (EN) wajib diisi",
    path: ["thesisTitleEn"],
  });

/**
 * Schema untuk Approve Sidang Registration (PUT /api/sidang-registrations/:id/approve)
 */
export const approveSidangSchema = z.object({
  adminId: z
    .string({ required_error: "ID staf akademik wajib diisi" })
    .trim()
    .min(1, "ID staf akademik wajib diisi")
    .uuid("ID staf akademik tidak valid"),
  sidangPeriodId: z
    .string({ required_error: "ID periode sidang wajib diisi" })
    .trim()
    .min(1, "ID periode sidang wajib diisi")
    .uuid("ID periode sidang tidak valid"),
  skemaSidangFinal: z.string().trim().optional().nullable(),
  jalurNonSidangFinal: z.string().trim().optional().nullable(),
  sidangRegistrationUploadIds: z
    .array(z.string().uuid("ID berkas tidak valid"))
    .optional()
    .nullable(),
});

/**
 * Schema untuk Reject Sidang Registration (PUT /api/sidang-registrations/:id/reject)
 */
export const rejectSidangSchema = z.object({
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
  sidangRegistrationUploadIds: z
    .array(z.string().uuid("ID berkas tidak valid"))
    .optional()
    .nullable(),
});
