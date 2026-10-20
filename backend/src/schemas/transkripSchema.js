import { z } from "zod";

/**
 * Schema untuk Query Parameters Daftar Transkrip Upload (GET /api/transkrip)
 */
export const listTranskripQuerySchema = z.object({
  mahasiswaId: z.preprocess(
    (val) =>
      val === "" || val === null || val === undefined
        ? undefined
        : typeof val === "string"
        ? val.trim()
        : val,
    z.string().optional()
  ),
  search: z.preprocess(
    (val) =>
      val === "" || val === null || val === undefined
        ? undefined
        : typeof val === "string"
        ? val.trim()
        : val,
    z.string().optional()
  ),
  sortBy: z
    .enum(["createdAt", "name"], {
      error: "sortBy harus salah satu dari: createdAt, name",
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
    z
      .union([
        z.literal("all"),
        z.literal("-1"),
        z.coerce.number().int().min(1).max(100),
      ])
      .optional()
  ),
});

/**
 * Schema untuk Create Transkrip Upload (POST /api/transkrip)
 */
export const createTranskripSchema = z.object({
  name: z
    .string({ required_error: "name wajib diisi" })
    .trim()
    .min(1, "name wajib diisi"),
  mahasiswaId: z
    .string({ required_error: "mahasiswaId wajib diisi" })
    .trim()
    .min(1, "mahasiswaId wajib diisi"),
});

/**
 * Schema untuk Update Transkrip Upload (PATCH /api/transkrip/:id)
 */
export const updateTranskripSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "name tidak boleh kosong jika diisi")
    .optional(),
  mahasiswaId: z
    .string()
    .trim()
    .min(1, "mahasiswaId tidak boleh kosong jika diisi")
    .optional(),
});
