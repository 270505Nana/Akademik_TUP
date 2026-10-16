import { z } from "zod";

/**
 * Schema untuk Create or Update Dosen (PUT /api/dosen/:id)
 */
export const upsertDosenSchema = z.object({
  name: z
    .string({ error: "Nama wajib diisi" })
    .trim()
    .min(1, "Nama wajib diisi"),
  nip: z
    .string({ error: "NIP wajib diisi" })
    .trim()
    .min(1, "NIP wajib diisi"),
  nidn: z.string().trim().optional().nullable(),
  kodeDosen: z
    .string({ error: "Kode dosen wajib diisi" })
    .trim()
    .min(1, "Kode dosen wajib diisi"),
  researchGroupId: z
    .string({ error: "ID kelompok keahlian wajib diisi" })
    .trim()
    .min(1, "ID kelompok keahlian wajib diisi"),
  studyProgramId: z
    .string({ error: "Program Studi wajib dipilih" })
    .trim()
    .min(1, "Program Studi wajib dipilih"),
  isKetuaKK: z.boolean().optional(),
  isKetuaProdi: z.boolean().optional(),
  isKepalaUrusanAkademik: z.string().trim().optional().nullable(),
});

/**
 * Schema untuk Query Parameters Daftar Dosen (GET /api/dosen)
 */
export const listDosenQuerySchema = z.object({
  search: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : typeof val === "string" ? val.trim() : val),
    z.string().optional()
  ),
  researchGroupId: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : typeof val === "string" ? val.trim() : val),
    z.string().optional()
  ),
  studyProgramId: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : typeof val === "string" ? val.trim() : val),
    z.string().optional()
  ),
  sortBy: z
    .enum(["name", "nip", "nidn", "kodeDosen", "researchGroup", "createdAt"], {
      error: "sortBy harus salah satu dari: name, nip, nidn, kodeDosen, researchGroup, createdAt",
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
