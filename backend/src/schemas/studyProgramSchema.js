import { z } from "zod";

/**
 * Schema untuk Query Parameters Daftar Study Program (GET /api/study-programs)
 */
export const listStudyProgramQuerySchema = z.object({
  search: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : typeof val === "string" ? val.trim() : val),
    z.string().optional()
  ),
  isActive: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val === "true" || val === true ? true : val === "false" || val === false ? false : val),
    z.boolean().optional()
  ),
  facultyId: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : typeof val === "string" ? val.trim() : val),
    z.string().optional()
  ),
  sortBy: z
    .enum(["name", "faculty", "isActive", "createdAt"], {
      error: "sortBy harus salah satu dari: name, faculty, isActive, createdAt",
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
 * Schema untuk Create Study Program (POST /api/study-programs)
 */
export const createStudyProgramSchema = z.object({
  name: z
    .string({ required_error: "Nama program studi wajib diisi" })
    .trim()
    .min(3, "Nama program studi minimal 3 karakter")
    .max(100, "Nama program studi maksimal 100 karakter"),
  facultyId: z
    .string({ required_error: "ID fakultas wajib diisi" })
    .trim()
    .min(1, "ID fakultas wajib diisi"),
  isActive: z.boolean().optional().default(true),
});

/**
 * Schema untuk Update Study Program (PUT /api/study-programs/:id)
 */
export const updateStudyProgramSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Nama program studi minimal 3 karakter")
    .max(100, "Nama program studi maksimal 100 karakter")
    .optional(),
  facultyId: z.string().trim().min(1, "ID fakultas tidak boleh kosong").optional(),
  isActive: z.boolean().optional(),
});
