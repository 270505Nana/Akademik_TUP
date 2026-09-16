import { z } from "zod";

/**
 * Schema untuk Create Permohonan SKTA (POST /api/permohonan-skta)
 * Menggunakan field kanonikal sesuai model Prisma tanpa alias
 */
export const createSktaSchema = z.object({
  mahasiswaId: z
    .string({ required_error: "ID Mahasiswa wajib diisi" })
    .uuid("ID Mahasiswa tidak valid"),
  judulProposalIndonesia: z
    .string({ required_error: "Judul proposal bahasa Indonesia wajib diisi" })
    .trim()
    .min(1, "Judul proposal bahasa Indonesia wajib diisi"),
  judulProposalInggris: z
    .string({ required_error: "Judul proposal bahasa Inggris wajib diisi" })
    .trim()
    .min(1, "Judul proposal bahasa Inggris wajib diisi"),
  dosenPembimbing1Id: z
    .string({ required_error: "Dosen Pembimbing 1 wajib dipilih" })
    .uuid("ID Dosen Pembimbing 1 tidak valid"),
  dosenPembimbing2Id: z
    .string({ required_error: "Dosen Pembimbing 2 wajib dipilih" })
    .uuid("ID Dosen Pembimbing 2 tidak valid"),
  researchGroupId: z
    .string()
    .uuid("ID Kelompok Riset tidak valid")
    .optional()
    .nullable(),
});

/**
 * Schema untuk Reject Permohonan SKTA (PUT /api/permohonan-skta/:id/reject)
 */
export const rejectSktaSchema = z.object({
  adminId: z
    .string({ required_error: "Admin ID wajib diisi" })
    .uuid("Admin ID tidak valid"),
  message: z
    .string({ required_error: "Alasan penolakan wajib diisi" })
    .trim()
    .min(1, "Alasan penolakan wajib diisi"),
});
