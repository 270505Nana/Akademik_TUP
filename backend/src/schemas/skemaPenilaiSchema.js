import { z } from "zod";

/**
 * Schema untuk Query Parameters Daftar Skema Penilai (GET /api/skema-penilai)
 */
export const listSkemaPenilaiQuerySchema = z.object({
  search: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : typeof val === "string" ? val.trim() : val),
    z.string().optional()
  ),
  studyProgramId: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : typeof val === "string" ? val.trim() : val),
    z.string().optional()
  ),
  sortBy: z
    .enum(["type", "bobot", "createdAt"], {
      error: "sortBy harus salah satu dari: type, bobot, createdAt",
    })
    .optional()
    .default("createdAt"),
  sortOrder: z
    .enum(["asc", "desc"], {
      error: "sortOrder harus salah satu dari: asc, desc",
    })
    .optional()
    .default("asc"),
  page: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.coerce.number().int().min(1).optional()
  ),
  limit: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.coerce.number().int().min(1).max(100).optional()
  ),
});

/**
 * Schema untuk Create Skema Penilai (POST /api/skema-penilai)
 */
export const createSkemaPenilaiSchema = z.object({
  type: z
    .string({ required_error: "Tipe penilai wajib diisi (contoh: pembimbing_1, penguji_1)" })
    .trim()
    .min(1, "Tipe penilai wajib diisi (contoh: pembimbing_1, penguji_1)"),
  bobot: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.coerce
      .number({ required_error: "Bobot nilai wajib diisi", invalid_type_error: "Bobot nilai harus berupa angka" })
      .min(0, "Bobot nilai minimal 0")
  ),
  studyProgramId: z
    .string({ required_error: "ID Program Studi wajib diisi" })
    .trim()
    .min(1, "ID Program Studi wajib diisi"),
});

/**
 * Schema untuk Update Skema Penilai (PUT /api/skema-penilai/:id)
 */
export const updateSkemaPenilaiSchema = z.object({
  type: z
    .string()
    .trim()
    .min(1, "Tipe penilai tidak boleh kosong")
    .optional(),
  bobot: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.coerce
      .number({ invalid_type_error: "Bobot nilai harus berupa angka" })
      .min(0, "Bobot nilai minimal 0")
      .optional()
  ),
});
