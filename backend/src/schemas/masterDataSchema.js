import { z } from "zod";


// Schema Ruangan
export const upsertRuanganSchema = z.object({
  name: z
    .string({ required_error: "Nama ruangan wajib diisi" })
    .trim()
    .min(1, "Nama ruangan wajib diisi"),
  gedung: z.string().trim().optional().nullable(),
  isActive: z.boolean().optional(),
});

// Schema Program Studi
export const upsertStudyProgramSchema = z.object({
  name: z
    .string({ required_error: "Nama program studi wajib diisi" })
    .trim()
    .min(1, "Nama program studi wajib diisi"),
  code: z
    .string({ required_error: "Kode program studi wajib diisi" })
    .trim()
    .min(1, "Kode program studi wajib diisi"),
  // NOTE: Validasi UUID sementara dilonggarkan menjadi non-empty string untuk fleksibilitas format ID (legacy / custom ID).
  // TODO (Production): Kembalikan ke .uuid("ID Fakultas tidak valid") jika semua ID sudah terstandarisasi UUID.
  facultyId: z
    .string({ required_error: "ID Fakultas wajib diisi" })
    .trim()
    .min(1, "ID Fakultas wajib diisi"),
    // .uuid("ID Fakultas tidak valid"),
  isActive: z.boolean().optional(),
});

// Schema Fakultas
export const upsertFacultySchema = z.object({
  name: z
    .string({ required_error: "Nama fakultas wajib diisi" })
    .trim()
    .min(1, "Nama fakultas wajib diisi"),
  code: z
    .string({ required_error: "Kode fakultas wajib diisi" })
    .trim()
    .min(1, "Kode fakultas wajib diisi"),
  isActive: z.boolean().optional(),
});

