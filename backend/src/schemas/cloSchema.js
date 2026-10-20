import { z } from "zod";

/**
 * Schema untuk Query Parameters Daftar CLO (GET /api/clo)
 */
export const listCloQuerySchema = z.object({
  search: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : typeof val === "string" ? val.trim() : val),
    z.string().optional()
  ),
  studyProgramId: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : typeof val === "string" ? val.trim() : val),
    z.string().optional()
  ),
  sortBy: z
    .enum(["name", "createdAt"], {
      error: "sortBy harus salah satu dari: name, createdAt",
    })
    .optional()
    .default("name"),
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
 * Schema untuk Create CLO (POST /api/clo)
 */
export const createCloSchema = z.object({
  name: z
    .string({ required_error: "Nama CLO wajib diisi" })
    .trim()
    .min(1, "Nama CLO wajib diisi")
    .max(100, "Nama CLO maksimal 100 karakter"),
  description: z
    .string({ required_error: "Deskripsi CLO wajib diisi" })
    .trim()
    .min(1, "Deskripsi CLO wajib diisi"),
  studyProgramId: z
    .string({ required_error: "ID Program Studi wajib diisi" })
    .trim()
    .min(1, "ID Program Studi wajib diisi"),
});

/**
 * Schema untuk Update CLO (PUT /api/clo/:id)
 */
export const updateCloSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nama CLO tidak boleh kosong")
    .max(100, "Nama CLO maksimal 100 karakter")
    .optional(),
  description: z
    .string()
    .trim()
    .min(1, "Deskripsi CLO tidak boleh kosong")
    .optional(),
});
