import { z } from "zod";

/**
 * Schema untuk Query Parameters Daftar Jenis Asesmen (GET /api/jenis-asesmen)
 */
export const listJenisAsesmenQuerySchema = z.object({
  search: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : typeof val === "string" ? val.trim() : val),
    z.string().optional()
  ),
  cloProdiId: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : typeof val === "string" ? val.trim() : val),
    z.string().optional()
  ),
  sortBy: z
    .enum(["content", "bobot", "createdAt"], {
      error: "sortBy harus salah satu dari: content, bobot, createdAt",
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
 * Schema untuk Create Jenis Asesmen (POST /api/jenis-asesmen)
 */
export const createJenisAsesmenSchema = z.object({
  content: z
    .string({ required_error: "Deskripsi Jenis Asesmen wajib diisi" })
    .trim()
    .min(1, "Deskripsi Jenis Asesmen wajib diisi"),
  bobot: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.coerce
      .number({ required_error: "Bobot nilai wajib diisi", invalid_type_error: "Bobot nilai harus berupa angka" })
      .min(0, "Bobot nilai minimal 0")
  ),
  cloProdiId: z
    .string({ required_error: "ID CLO wajib diisi" })
    .trim()
    .min(1, "ID CLO wajib diisi"),
});

/**
 * Schema untuk Update Jenis Asesmen (PUT /api/jenis-asesmen/:id)
 */
export const updateJenisAsesmenSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Deskripsi Jenis Asesmen tidak boleh kosong")
    .optional(),
  bobot: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.coerce
      .number({ invalid_type_error: "Bobot nilai harus berupa angka" })
      .min(0, "Bobot nilai minimal 0")
      .optional()
  ),
});
