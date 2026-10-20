import { z } from "zod";

/**
 * Schema untuk Query Parameters Daftar Pusat Informasi (GET /api/pusat-informasi)
 */
export const listPusatInformasiQuerySchema = z.object({
  search: z.preprocess(
    (val) =>
      val === "" || val === null || val === undefined
        ? undefined
        : typeof val === "string"
        ? val.trim()
        : val,
    z.string().optional()
  ),
  category: z.preprocess(
    (val) =>
      val === "" || val === null || val === undefined
        ? undefined
        : typeof val === "string"
        ? val.trim()
        : val,
    z.string().optional()
  ),
  sortBy: z
    .enum(["createdAt", "name", "category", "queue", "newest", "oldest"], {
      error:
        "sortBy harus salah satu dari: createdAt, name, category, queue, newest, oldest",
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
 * Schema untuk Create Pusat Informasi (POST /api/pusat-informasi)
 */
export const createPusatInformasiSchema = z.object({
  category: z
    .string({ required_error: "category wajib diisi" })
    .trim()
    .min(1, "category wajib diisi"),
  name: z
    .string({ required_error: "name wajib diisi" })
    .trim()
    .min(1, "name wajib diisi"),
  description: z.preprocess(
    (val) =>
      val === null || val === undefined
        ? ""
        : typeof val === "string"
        ? val.trim()
        : val,
    z.string().optional().default("")
  ),
  icon: z.preprocess(
    (val) =>
      val === null || val === undefined
        ? ""
        : typeof val === "string"
        ? val.trim()
        : val,
    z.string().optional().default("")
  ),
  url: z
    .string({ required_error: "url wajib diisi" })
    .trim()
    .min(1, "url wajib diisi"),
  isPublish: z.preprocess(
    (val) => val === "true" || val === true,
    z.boolean().optional().default(false)
  ),
  showInPreview: z.preprocess(
    (val) =>
      val === "" || val === null || val === undefined
        ? null
        : val === "true" || val === true
        ? true
        : val === "false" || val === false
        ? false
        : val,
    z.union([z.boolean(), z.string()]).nullable().optional()
  ),
});

/**
 * Schema untuk Update Pusat Informasi (PUT /api/pusat-informasi/:id)
 */
export const updatePusatInformasiSchema = z.object({
  category: z
    .string()
    .trim()
    .min(1, "category tidak boleh kosong")
    .optional(),
  name: z
    .string()
    .trim()
    .min(1, "name tidak boleh kosong")
    .optional(),
  description: z
    .string()
    .optional(),
  icon: z
    .string()
    .optional(),
  url: z
    .string()
    .trim()
    .min(1, "url tidak boleh kosong")
    .optional(),
  isPublish: z.preprocess(
    (val) =>
      val === "" || val === null || val === undefined
        ? undefined
        : val === "true" || val === true
        ? true
        : val === "false" || val === false
        ? false
        : val,
    z.boolean().optional()
  ),
  showInPreview: z.preprocess(
    (val) =>
      val === "" || val === null || val === undefined
        ? undefined
        : val === "true" || val === true
        ? true
        : val === "false" || val === false
        ? false
        : val,
    z.union([z.boolean(), z.string()]).nullable().optional()
  ),
  queue: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.coerce
      .number({ invalid_type_error: "queue harus berupa angka integer positif (minimal 1)" })
      .int("queue harus berupa angka integer positif (minimal 1)")
      .min(1, "queue harus berupa angka integer positif (minimal 1)")
      .optional()
  ),
});
