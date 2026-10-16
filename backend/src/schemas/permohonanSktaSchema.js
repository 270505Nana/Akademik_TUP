import { z } from "zod";
import { isValidISO8601 } from "../utils/validationHelper.js";

/**
 * Daftar kategori permohonan SKTA resmi sesuai domain bisnis & Prisma model
 */
export const sktaCategories = [
  "Permohonan Baru",
  "Perubahan Judul",
  "Perubahan Dosen Pembimbing",
  "Perubahan Judul dan Dosen Pembimbing",
  "Perpanjangan SK",
];

/**
 * Helper untuk field teks opsional yang membersihkan spasi dan string kosong
 */
const optionalTrimmedString = () =>
  z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    if (typeof val === "string") {
      const trimmed = val.trim();
      return trimmed === "" ? undefined : trimmed;
    }
    return val;
  }, z.string().optional().nullable());

/**
 * Helper untuk field UUID opsional yang mengabaikan string kosong / null
 */
const optionalUuid = (invalidMsg = "Format UUID tidak valid") =>
  z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.string().uuid(invalidMsg).optional().nullable()
  );

/**
 * Helper untuk field UUID wajib
 */
const requiredUuid = (emptyMsg, invalidMsg = "Format UUID tidak valid") =>
  z
    .string({ error: emptyMsg })
    .trim()
    .min(1, emptyMsg)
    .pipe(z.string().uuid(invalidMsg));

/**
 * Schema untuk Save Draft Permohonan SKTA (POST /api/permohonan-skta)
 * Digunakan untuk membuat draft awal atau memperbarui draft yang sedang dikerjakan.
 * Mendukung penyimpanan parsial (field tidak wajib terisi semua saat draft).
 */
export const savePermohonanSktaDraftSchema = z
  .object({
    id: optionalUuid("ID Permohonan SKTA tidak valid"),
    mahasiswaId: optionalUuid("ID Mahasiswa tidak valid"),
    category: z
      .preprocess(
        (val) => (val === "" || val === null || val === undefined ? undefined : val),
        z.enum(sktaCategories, {
          error: "Kategori permohonan SKTA tidak valid",
        })
      )
      .optional()
      .default("Permohonan Baru"),
    judulProposalIndonesia: optionalTrimmedString(),
    judulProposalInggris: optionalTrimmedString(),
    dosenPembimbing1Id: optionalUuid("ID Dosen Pembimbing 1 tidak valid"),
    dosenPembimbing2Id: optionalUuid("ID Dosen Pembimbing 2 tidak valid"),
    researchGroupId: optionalUuid("ID Kelompok Riset tidak valid"),
  })
  .refine((data) => data.id || data.mahasiswaId, {
    message: "mahasiswaId atau id permohonan wajib diisi untuk menyimpan draft",
    path: ["mahasiswaId"],
  });

/**
 * Schema untuk Submit Permohonan SKTA (POST /api/permohonan-skta/submit)
 * Digunakan untuk finalisasi pengajuan permohonan SKTA (mengubah isDraft menjadi false).
 * Semua field utama wajib terisi lengkap.
 */
export const submitPermohonanSktaSchema = z.object({
  id: requiredUuid("ID wajib diisi untuk submit", "ID harus berupa format UUID yang valid"),
  mahasiswaId: requiredUuid("Mahasiswa ID wajib diisi", "ID Mahasiswa tidak valid"),
  category: z
    .preprocess(
      (val) => (val === "" || val === null || val === undefined ? undefined : val),
      z.enum(sktaCategories, {
        error: "Kategori permohonan SKTA tidak valid",
      })
    )
    .optional()
    .default("Permohonan Baru"),
  judulProposalIndonesia: z
    .string({ error: "Judul proposal (Indonesia) wajib diisi" })
    .trim()
    .min(1, "Judul proposal (Indonesia) wajib diisi"),
  judulProposalInggris: z
    .string({ error: "Judul proposal (Inggris) wajib diisi" })
    .trim()
    .min(1, "Judul proposal (Inggris) wajib diisi"),
  dosenPembimbing1Id: requiredUuid(
    "Dosen Pembimbing 1 wajib diisi",
    "ID Dosen Pembimbing 1 tidak valid"
  ),
  dosenPembimbing2Id: requiredUuid(
    "Dosen Pembimbing 2 wajib diisi",
    "ID Dosen Pembimbing 2 tidak valid"
  ),
  researchGroupId: optionalUuid("ID Kelompok Riset tidak valid"),
});

/**
 * Schema untuk Update Permohonan SKTA (PUT /api/permohonan-skta/:id)
 * Digunakan untuk mahasiswa memperbarui isian judul atau pembimbing saat masa revisi/edit.
 */
export const updatePermohonanSktaSchema = z.object({
  judulProposalIndonesia: optionalTrimmedString(),
  judulProposalInggris: optionalTrimmedString(),
  dosenPembimbing1Id: optionalUuid("ID Dosen Pembimbing 1 tidak valid"),
  dosenPembimbing2Id: optionalUuid("ID Dosen Pembimbing 2 tidak valid"),
  researchGroupId: optionalUuid("ID Kelompok Riset tidak valid"),
});

/**
 * Schema untuk Approve Permohonan SKTA (PUT /api/permohonan-skta/:id/approve)
 * Dilakukan oleh Admin untuk menerbitkan SKTA.
 */
export const approvePermohonanSktaSchema = z.object({
  adminId: requiredUuid("Admin ID wajib diisi", "Admin ID tidak valid"),
  hasUploadedFinalProposal: z.preprocess((val) => {
    if (typeof val === "boolean") return val;
    if (val === "true" || val === "1") return true;
    if (val === "false" || val === "0") return false;
    return undefined;
  }, z.boolean().optional().nullable()),
  hasTakenLanguageTest: z.preprocess((val) => {
    if (typeof val === "boolean") return val;
    if (val === "true" || val === "1") return true;
    if (val === "false" || val === "0") return false;
    return undefined;
  }, z.boolean().optional().nullable()),
  expDate: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    return val;
  }, z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "expDate harus berupa tanggal yang valid",
  }).optional().nullable()),
});

/**
 * Schema untuk Reject / Minta Revisi Permohonan SKTA (PUT /api/permohonan-skta/:id/reject)
 */
export const rejectPermohonanSktaSchema = z.object({
  adminId: requiredUuid("ID staf akademik wajib diisi", "Admin ID tidak valid"),
  message: z
    .string({ error: "Pesan penolakan wajib diisi" })
    .trim()
    .min(1, "Pesan penolakan wajib diisi"),
  isEdit: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z
      .string()
      .refine((val) => isValidISO8601(val), {
        message: "isEdit harus berupa tanggal yang valid (format ISO 8601)",
      })
      .optional()
      .nullable()
  ),
});

/**
 * Schema untuk Filter Query Export Berkas SKTA sebagai ZIP (GET /api/permohonan-skta/export-skta)
 * Mengikuti konvensi parameter kanonikal workspace:
 * - studyProgramId: parameter eksplisit (tanpa alias studyProgram)
 */
export const exportSktaZipSchema = z.object({
  startDate: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Format startDate tidak valid",
    }).optional()
  ),
  endDate: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Format endDate tidak valid",
    }).optional()
  ),
  dateField: z
    .enum(["createdAt", "updatedAt", "expDate"], {
      error: "dateField harus salah satu dari: createdAt, updatedAt, expDate",
    })
    .optional()
    .default("createdAt"),
  studyProgramId: optionalTrimmedString(),
  tahunAngkatan: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.coerce
      .number({ invalid_type_error: "tahunAngkatan harus berupa angka" })
      .int()
      .min(2000, "tahunAngkatan minimal 2000")
      .max(2100, "tahunAngkatan maksimal 2100")
      .optional()
  ),
  kelasAsal: optionalTrimmedString(),
  category: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.enum(sktaCategories, {
      error: "Kategori permohonan SKTA tidak valid",
    }).optional()
  ),
});
