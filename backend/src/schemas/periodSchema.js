import { z } from "zod";

/**
 * Helper untuk memvalidasi tanggal dalam format ISO 8601
 */
const isValidDateString = (val) => typeof val === "string" && !isNaN(Date.parse(val));

/**
 * Helper untuk preprocessing boolean dari query/body
 */
const booleanPreprocess = z.preprocess((val) => {
  if (val === undefined || val === null || val === "") return undefined;
  if (typeof val === "boolean") return val;
  if (val === "true") return true;
  if (val === "false") return false;
  return val;
}, z.boolean({ invalid_type_error: "isOpen harus berupa boolean" }).optional());

/**
 * Schema untuk Query Parameters Daftar Periode (Sidang & Yudisium)
 */
export const listPeriodQuerySchema = z.object({
  search: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : typeof val === "string" ? val.trim() : val),
    z.string().optional()
  ),
  category: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : typeof val === "string" ? val.trim() : val),
    z.string().optional()
  ),
  sortBy: z
    .enum(["startDate", "endDate", "createdAt", "name", "period"], {
      error: "sortBy harus salah satu dari: startDate, endDate, createdAt, name, period",
    })
    .optional()
    .default("startDate"),
  sortOrder: z
    .enum(["asc", "desc"], {
      error: "sortOrder harus salah satu dari: asc, desc",
    })
    .optional()
    .default("desc"),
  page: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.any().optional()
  ),
  limit: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.any().optional()
  ),
  pagination: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.any().optional()
  ),
});

/**
 * Schema untuk Create Period (Sidang & Yudisium)
 */
export const createPeriodSchema = z
  .object({
    name: z
      .string({
        required_error: "Nama wajib diisi",
        invalid_type_error: "Nama harus berupa string",
      })
      .trim()
      .min(1, "Nama wajib diisi"),
    category: z
      .string({
        required_error: "Category wajib diisi",
        invalid_type_error: "Category harus berupa string",
      })
      .trim()
      .min(1, "Category wajib diisi"),
    period: z
      .string({
        required_error: "Period wajib diisi",
        invalid_type_error: "Period harus berupa string",
      })
      .trim()
      .min(1, "Period wajib diisi"),
    startDate: z
      .string({
        required_error: "Tanggal mulai wajib diisi",
        invalid_type_error: "Tanggal mulai harus berupa string",
      })
      .trim()
      .min(1, "Tanggal mulai wajib diisi")
      .refine(isValidDateString, {
        message: "Tanggal mulai harus berupa tanggal yang valid (format ISO 8601)",
      }),
    endDate: z
      .string({
        required_error: "Tanggal selesai wajib diisi",
        invalid_type_error: "Tanggal selesai harus berupa string",
      })
      .trim()
      .min(1, "Tanggal selesai wajib diisi")
      .refine(isValidDateString, {
        message: "Tanggal selesai harus berupa tanggal yang valid (format ISO 8601)",
      }),
    isOpen: booleanPreprocess.default(false),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
      }
      return true;
    },
    {
      message: "Tanggal selesai tidak boleh sebelum tanggal mulai",
      path: ["endDate"],
    }
  );

/**
 * Schema untuk Update Period (Sidang & Yudisium)
 */
export const updatePeriodSchema = z
  .object({
    name: z
      .string({ invalid_type_error: "Nama harus berupa string" })
      .trim()
      .min(1, "Nama tidak boleh kosong")
      .optional(),
    category: z
      .string({ invalid_type_error: "Category harus berupa string" })
      .trim()
      .min(1, "Category tidak boleh kosong")
      .optional(),
    period: z
      .string({ invalid_type_error: "Period harus berupa string" })
      .trim()
      .min(1, "Period tidak boleh kosong")
      .optional(),
    startDate: z
      .string({ invalid_type_error: "Tanggal mulai harus berupa string" })
      .trim()
      .refine(isValidDateString, {
        message: "Tanggal mulai harus berupa tanggal yang valid (format ISO 8601)",
      })
      .optional(),
    endDate: z
      .string({ invalid_type_error: "Tanggal selesai harus berupa string" })
      .trim()
      .refine(isValidDateString, {
        message: "Tanggal selesai harus berupa tanggal yang valid (format ISO 8601)",
      })
      .optional(),
    isOpen: booleanPreprocess,
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
      }
      return true;
    },
    {
      message: "Tanggal selesai tidak boleh sebelum tanggal mulai",
      path: ["endDate"],
    }
  );

/**
 * Legacy schema (preserved for backwards compatibility)
 */
export const periodSchema = z.object({
  name: z
    .string({ required_error: "Nama periode wajib diisi" })
    .trim()
    .min(1, "Nama periode wajib diisi"),
  startDate: z
    .string({ required_error: "Tanggal mulai wajib diisi" })
    .datetime({ message: "Format tanggal mulai harus ISO 8601" }),
  endDate: z
    .string({ required_error: "Tanggal selesai wajib diisi" })
    .datetime({ message: "Format tanggal selesai harus ISO 8601" }),
  isActive: z.boolean().optional(),
});
