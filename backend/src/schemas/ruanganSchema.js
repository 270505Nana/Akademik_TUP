import { z } from "zod";

/**
 * Schema untuk Query Parameters Daftar Ruangan (GET /api/ruangan)
 */
export const listRuanganQuerySchema = z.object({
  search: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : typeof val === "string" ? val.trim() : val),
    z.string().optional()
  ),
  gedung: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : typeof val === "string" ? val.trim() : val),
    z.string().optional()
  ),
  isActive: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val === "true" || val === true ? true : val === "false" || val === false ? false : val),
    z.boolean().optional()
  ),
  sortBy: z
    .enum(["name", "gedung", "isActive", "createdAt"], {
      error: "sortBy harus salah satu dari: name, gedung, isActive, createdAt",
    })
    .optional()
    .default("gedung"),
  sortOrder: z
    .enum(["asc", "desc"], {
      error: "sortOrder harus salah satu dari: asc, desc",
    })
    .optional()
    .default("asc"),
});

/**
 * Schema untuk Create Ruangan (POST /api/ruangan)
 */
export const createRuanganSchema = z.object({
  name: z
    .string({ required_error: "Nama ruangan wajib diisi" })
    .trim()
    .min(1, "Nama ruangan wajib diisi")
    .max(100, "Nama ruangan maksimal 100 karakter"),
  gedung: z
    .string({ required_error: "Gedung wajib diisi" })
    .trim()
    .min(1, "Gedung wajib diisi")
    .max(100, "Gedung maksimal 100 karakter"),
  isActive: z.boolean().optional().default(true),
});

/**
 * Schema untuk Update Ruangan (PUT /api/ruangan/:id)
 */
export const updateRuanganSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nama ruangan tidak boleh kosong")
    .max(100, "Nama ruangan maksimal 100 karakter")
    .optional(),
  gedung: z
    .string()
    .trim()
    .min(1, "Gedung tidak boleh kosong")
    .max(100, "Gedung maksimal 100 karakter")
    .optional(),
  isActive: z.boolean().optional(),
});
