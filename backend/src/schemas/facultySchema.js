import { z } from "zod";

/**
 * Schema untuk Query Parameters Daftar Faculty (GET /api/faculties)
 */
export const listFacultyQuerySchema = z.object({
  search: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : typeof val === "string" ? val.trim() : val),
    z.string().optional()
  ),
  isActive: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val === "true" || val === true ? true : val === "false" || val === false ? false : val),
    z.boolean().optional()
  ),
  sortBy: z
    .enum(["name", "isActive", "createdAt"], {
      error: "sortBy harus salah satu dari: name, isActive, createdAt",
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
 * Schema untuk Create Faculty (POST /api/faculties)
 */
export const createFacultySchema = z.object({
  name: z
    .string({ required_error: "Nama fakultas wajib diisi" })
    .trim()
    .min(3, "Nama fakultas minimal 3 karakter")
    .max(100, "Nama fakultas maksimal 100 karakter"),
  isActive: z.boolean().optional().default(true),
});

/**
 * Schema untuk Update Faculty (PUT /api/faculties/:id)
 */
export const updateFacultySchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Nama fakultas minimal 3 karakter")
    .max(100, "Nama fakultas maksimal 100 karakter")
    .optional(),
  isActive: z.boolean().optional(),
});
