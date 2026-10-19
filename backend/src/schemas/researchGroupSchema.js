import { z } from "zod";

/**
 * Schema untuk Query Parameters Daftar Research Group (GET /api/research-groups)
 */
export const listResearchGroupQuerySchema = z.object({
  search: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : typeof val === "string" ? val.trim() : val),
    z.string().optional()
  ),
  isActive: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val === "true" || val === true ? true : val === "false" || val === false ? false : val),
    z.boolean().optional()
  ),
  studyProgramId: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : typeof val === "string" ? val.trim() : val),
    z.string().optional()
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
 * Schema untuk Create Research Group (POST /api/research-groups)
 */
export const createResearchGroupSchema = z.object({
  name: z
    .string({ required_error: "Nama kelompok keahlian wajib diisi" })
    .trim()
    .min(3, "Nama kelompok keahlian minimal 3 karakter")
    .max(100, "Nama kelompok keahlian maksimal 100 karakter"),
  isActive: z.boolean().optional().default(true),
  studyProgramIds: z.array(z.string().trim()).optional(),
});

/**
 * Schema untuk Update Research Group (PUT /api/research-groups/:id)
 */
export const updateResearchGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Nama kelompok keahlian minimal 3 karakter")
    .max(100, "Nama kelompok keahlian maksimal 100 karakter")
    .optional(),
  isActive: z.boolean().optional(),
  studyProgramIds: z.array(z.string().trim()).optional(),
});
