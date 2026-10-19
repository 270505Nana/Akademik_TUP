import { z } from "zod";

/**
 * Schema untuk Create or Update Mahasiswa (PUT /api/mahasiswa/:id)
 */
export const upsertMahasiswaSchema = z.object({
  name: z
    .string({ required_error: "Nama wajib diisi" })
    .trim()
    .min(1, "Nama wajib diisi"),
  nim: z
    .string({ required_error: "NIM wajib diisi" })
    .trim()
    .min(1, "NIM wajib diisi"),
  kelasAsal: z
    .string({ required_error: "Kelas asal wajib diisi" })
    .trim()
    .min(1, "Kelas asal wajib diisi"),
  tahunAngkatan: z.coerce
    .number({ required_error: "Tahun angkatan wajib diisi" })
    .int()
    .min(2000)
    .max(2100),
  // NOTE: Validasi UUID sementara dilonggarkan menjadi non-empty string untuk fleksibilitas format ID (legacy / custom ID).
  studyProgramId: z
    .string({ required_error: "Program Studi wajib dipilih" })
    .trim()
    .min(1, "Program Studi wajib dipilih"),
  dosenWaliId: z
    .string({ required_error: "Dosen Wali wajib dipilih" })
    .trim()
    .min(1, "Dosen Wali wajib dipilih"),
  sks: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : val),
    z.coerce.number().int().min(0).max(200).nullable().optional()
  ),
  ipk: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : val),
    z.coerce.number().min(0).max(4).nullable().optional()
  ),
  tak: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : val),
    z.coerce.number().int().min(0).nullable().optional()
  ),
});

/**
 * Schema untuk Query Parameters Daftar Mahasiswa (GET /api/mahasiswa)
 */
export const listMahasiswaQuerySchema = z.object({
  search: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : typeof val === "string" ? val.trim() : val),
    z.string().optional()
  ),
  studyProgramId: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : typeof val === "string" ? val.trim() : val),
    z.string().optional()
  ),
  tahunAngkatan: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.coerce.number().int().min(2000).max(2100).optional()
  ),
  sortBy: z
    .enum(["createdAt", "name", "nim", "kelasAsal", "tahunAngkatan", "ipk", "sks", "tak"], {
      error: "sortBy harus salah satu dari: createdAt, name, nim, kelasAsal, tahunAngkatan, ipk, sks, tak",
    })
    .optional()
    .default("createdAt"),
  sortOrder: z
    .enum(["asc", "desc"], {
      error: "sortOrder harus salah satu dari: asc, desc",
    })
    .optional()
    .default("desc"),
  page: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.coerce.number().int().min(1).optional()
  ),
  limit: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.coerce.number().int().min(1).max(100).optional()
  ),
});
