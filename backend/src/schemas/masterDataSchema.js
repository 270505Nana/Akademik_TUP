import { z } from "zod";

// Schema Dosen
export const upsertDosenSchema = z.object({
  name: z
    .string({ required_error: "Nama wajib diisi" })
    .trim()
    .min(1, "Nama wajib diisi"),
  nip: z
    .string({ required_error: "NIP wajib diisi" })
    .trim()
    .min(1, "NIP wajib diisi"),
  nidn: z.string().trim().optional().nullable(),
  kodeDosen: z
    .string({ required_error: "Kode dosen wajib diisi" })
    .trim()
    .min(1, "Kode dosen wajib diisi"),
  researchGroupId: z
    .string({ required_error: "ID kelompok keahlian wajib diisi" })
    .uuid("ID kelompok keahlian tidak valid"),
  isKetuaKK: z.boolean().optional(),
});

// Schema Mahasiswa
export const upsertMahasiswaSchema = z.object({
  name: z
    .string({ required_error: "Nama wajib diisi" })
    .trim()
    .min(1, "Nama wajib diisi"),
  nim: z
    .string({ required_error: "NIM wajib diisi" })
    .trim()
    .min(1, "NIM wajib diisi"),
  kelasAsal: z
    .string({ required_error: "Kelas asal wajib diisi" })
    .trim()
    .min(1, "Kelas asal wajib diisi"),
  tahunAngkatan: z.coerce
    .number({ required_error: "Tahun angkatan wajib diisi" })
    .int()
    .min(2000)
    .max(2100),
  studyProgramId: z
    .string({ required_error: "Program Studi wajib dipilih" })
    .uuid("ID Program Studi tidak valid"),
  dosenWaliId: z
    .string({ required_error: "Dosen Wali wajib dipilih" })
    .uuid("ID Dosen Wali tidak valid"),
  sks: z.coerce.number().int().min(0).max(200).optional().nullable(),
  ipk: z.coerce.number().min(0).max(4).optional().nullable(),
  tak: z.coerce.number().int().min(0).optional().nullable(),
});

// Schema Admin
export const upsertAdminSchema = z.object({
  name: z
    .string({ required_error: "Nama wajib diisi" })
    .trim()
    .min(1, "Nama wajib diisi"),
});

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
  facultyId: z
    .string({ required_error: "ID Fakultas wajib diisi" })
    .uuid("ID Fakultas tidak valid"),
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

// Schema Kelompok Keahlian (Research Group)
export const upsertResearchGroupSchema = z.object({
  name: z
    .string({ required_error: "Nama kelompok keahlian wajib diisi" })
    .trim()
    .min(1, "Nama kelompok keahlian wajib diisi"),
  isActive: z.boolean().optional(),
});
