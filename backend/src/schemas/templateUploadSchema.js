import { z } from "zod";

export const ALLOWED_TEMPLATE_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/zip",
  "application/x-zip-compressed",
];

/**
 * Schema untuk Query Parameters Daftar Template Upload (GET /api/templates)
 */
export const listTemplateUploadQuerySchema = z.object({
  category: z.preprocess(
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
    .enum(["category", "queue", "name", "createdAt", "newest", "oldest"], {
      error:
        "sortBy harus salah satu dari: category, queue, name, createdAt, newest, oldest",
    })
    .optional()
    .default("category"),
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
 * Schema untuk Create Template Upload (POST /api/templates)
 */
export const createTemplateUploadSchema = z.object({
  name: z
    .string({ required_error: "name wajib diisi" })
    .trim()
    .min(1, "name wajib diisi"),
  category: z
    .string({ required_error: "category wajib diisi" })
    .trim()
    .min(1, "category wajib diisi"),
  isPublish: z.preprocess(
    (val) => val === "true" || val === true,
    z.boolean().optional().default(false)
  ),
  isRequired: z.preprocess(
    (val) => (val === undefined ? true : val === "true" || val === true),
    z.boolean().optional().default(true)
  ),
});

/**
 * Schema untuk Update Template Upload (PATCH /api/templates/:id)
 */
export const updateTemplateUploadSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "name tidak boleh kosong")
    .optional(),
  category: z
    .string()
    .trim()
    .min(1, "category tidak boleh kosong")
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
  isRequired: z.preprocess(
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
  queue: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.coerce
      .number({ invalid_type_error: "queue harus berupa angka integer positif (minimal 1)" })
      .int("queue harus berupa angka integer positif (minimal 1)")
      .min(1, "queue harus berupa angka integer positif (minimal 1)")
      .optional()
  ),
});
