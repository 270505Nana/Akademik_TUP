import { z } from "zod";

export const createSktaSchema = z.object({
  topikTugasAkhir: z
    .string({ required_error: "Topik tugas akhir wajib diisi" })
    .trim()
    .min(1, "Topik tugas akhir wajib diisi"),
  judulTugasAkhirIndonesia: z
    .string({ required_error: "Judul tugas akhir wajib diisi" })
    .trim()
    .min(1, "Judul tugas akhir wajib diisi"),
  dosenPembimbing1Id: z
    .string({ required_error: "Dosen pembimbing 1 wajib dipilih" })
    .uuid("ID Dosen Pembimbing 1 tidak valid"),
  dosenPembimbing2Id: z
    .string()
    .uuid("ID Dosen Pembimbing 2 tidak valid")
    .optional()
    .nullable(),
  researchGroupId: z
    .string()
    .uuid("ID Kelompok Riset tidak valid")
    .optional()
    .nullable(),
});

export const reviewSktaSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "REVISION"], {
    required_error: "Status review wajib diisi",
  }),
  reviewNotes: z.string().trim().optional().nullable(),
});
