import { z } from "zod";

/**
 * Schema untuk Query Parameters Daftar Sub CLO (GET /api/subclo)
 */
export const listSubcloQuerySchema = z.object({
  search: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : typeof val === "string" ? val.trim() : val),
    z.string().optional()
  ),
  cloProdiId: z.preprocess(
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
 * Schema untuk Create Sub CLO (POST /api/subclo)
 */
export const createSubcloSchema = z.object({
  name: z
    .string({ required_error: "Nama Sub-CLO wajib diisi" })
    .trim()
    .min(1, "Nama Sub-CLO wajib diisi")
    .max(100, "Nama Sub-CLO maksimal 100 karakter"),
  description: z
    .string({ required_error: "Deskripsi Sub-CLO wajib diisi" })
    .trim()
    .min(1, "Deskripsi Sub-CLO wajib diisi"),
  cloProdiId: z
    .string({ required_error: "ID Induk CLO wajib diisi" })
    .trim()
    .min(1, "ID Induk CLO wajib diisi"),
});

/**
 * Schema untuk Update Sub CLO (PUT /api/subclo/:id)
 */
export const updateSubcloSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nama Sub-CLO tidak boleh kosong")
    .max(100, "Nama Sub-CLO maksimal 100 karakter")
    .optional(),
  description: z
    .string()
    .trim()
    .min(1, "Deskripsi Sub-CLO tidak boleh kosong")
    .optional(),
});
