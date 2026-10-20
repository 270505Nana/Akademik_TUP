import { z } from "zod";

/**
 * Schema untuk Query Parameters Daftar Mahasiswa Bimbingan (GET /api/mahasiswa-bimbingan)
 */
export const listMahasiswaBimbinganQuerySchema = z.object({
  search: z.preprocess(
    (val) =>
      val === "" || val === null || val === undefined
        ? undefined
        : typeof val === "string"
        ? val.trim()
        : val,
    z.string().optional()
  ),
  studyProgramId: z.preprocess(
    (val) =>
      val === "" || val === null || val === undefined
        ? undefined
        : typeof val === "string"
        ? val.trim()
        : val,
    z.string().optional()
  ),
  sortBy: z
    .enum(
      [
        "newest",
        "oldest",
        "studyProgramAsc",
        "studyProgramDesc",
        "nameAsc",
        "nameDesc",
        "nimAsc",
        "nimDesc",
        "createdAt",
        "name",
        "nim",
        "studyProgram",
      ],
      {
        error:
          "sortBy harus salah satu dari: newest, oldest, studyProgramAsc, studyProgramDesc, nameAsc, nameDesc, nimAsc, nimDesc, createdAt, name, nim, studyProgram",
      }
    )
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
