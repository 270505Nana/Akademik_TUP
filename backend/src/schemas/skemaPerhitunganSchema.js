import { z } from "zod";

const bobot = z.coerce
  .number({
    invalid_type_error: "Bobot harus berupa angka",
    required_error: "Bobot wajib diisi",
  })
  .min(0, "Bobot minimal 0")
  .max(1, "Bobot maksimal 1");

const isTotalOne = (data) => {
  return (
    Math.abs(data.bobotRataRataPembimbing + data.bobotRataRataPenguji - 1) <
    0.001
  );
};

/**
 * Schema untuk Query Parameters Daftar Skema Perhitungan Nilai (GET /api/skema-perhitungan)
 */
export const listSkemaPerhitunganQuerySchema = z.object({
  studyProgramId: z.preprocess(
    (val) =>
      val === "" || val === null || val === undefined
        ? undefined
        : typeof val === "string"
        ? val.trim()
        : val,
    z.string().optional()
  ),
  cloProdiId: z.preprocess(
    (val) =>
      val === "" || val === null || val === undefined
        ? undefined
        : typeof val === "string"
        ? val.trim()
        : val,
    z.string().optional()
  ),
  sortBy: z
    .enum(["bobotRataRataPembimbing", "bobotRataRataPenguji", "createdAt"], {
      error:
        "sortBy harus salah satu dari: bobotRataRataPembimbing, bobotRataRataPenguji, createdAt",
    })
    .optional()
    .default("createdAt"),
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
 * Schema untuk Create Skema Perhitungan Nilai (POST /api/skema-perhitungan)
 */
export const createSkemaSchema = z
  .object({
    bobotRataRataPembimbing: bobot,
    bobotRataRataPenguji: bobot,
    studyProgramId: z.string({
      required_error: "ID Program Studi wajib diisi",
    }),
    cloProdiId: z
      .string({ required_error: "ID CLO wajib diisi" })
      .uuid("Format ID CLO tidak valid"),
  })
  .refine(isTotalOne, {
    message: "Total bobot pembimbing + penguji harus 1 (100%)",
    path: ["bobotRataRataPembimbing"],
  });

/**
 * Schema untuk Update Skema Perhitungan Nilai (PUT /api/skema-perhitungan/:id)
 */
export const updateSkemaSchema = z
  .object({
    bobotRataRataPembimbing: bobot.optional(),
    bobotRataRataPenguji: bobot.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Minimal satu field harus diisi untuk melakukan pembaruan",
  });
