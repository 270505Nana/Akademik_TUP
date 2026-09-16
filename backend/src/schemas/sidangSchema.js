import { z } from "zod";

/**
 * Schema untuk Save Draft Sidang Registration (POST /api/sidang-registrations)
 * Murni menggunakan nama field kanonikal sesuai model Prisma tanpa alias
 */
export const saveSidangDraftSchema = z.object({
  id: z.string().uuid("ID Pendaftaran tidak valid").optional().nullable(),
  mahasiswaId: z.string().uuid("ID Mahasiswa tidak valid").optional().nullable(),
  program: z.string().trim().optional().nullable(),
  skemaSidang: z.string().trim().optional().nullable(),
  jalurNonSidang: z.array(z.string()).optional().nullable(),
  lulusTesBahasa: z.boolean().optional().nullable(),
  sks: z.coerce.number().int().min(0).max(200).optional().nullable(),
  ipk: z.coerce.number().min(0).max(4).optional().nullable(),
  tak: z.coerce.number().int().min(0).optional().nullable(),
  sktaExpDate: z.string().optional().nullable(),
  judulTugasAkhirIndonesia: z.string().trim().optional().nullable(),
  judulTugasAkhirInggris: z.string().trim().optional().nullable(),
  dosenPembimbing1Id: z.string().uuid("ID Dosen Pembimbing 1 tidak valid").optional().nullable(),
  dosenPembimbing2Id: z.string().uuid("ID Dosen Pembimbing 2 tidak valid").optional().nullable(),
});

/**
 * Schema untuk Approve Sidang Registration (PUT /api/sidang-registrations/:id/approve)
 */
export const approveSidangSchema = z.object({
  adminId: z
    .string({ required_error: "Admin ID wajib diisi" })
    .uuid("Admin ID tidak valid"),
  sidangPeriodId: z
    .string({ required_error: "Sidang Period ID wajib diisi" })
    .uuid("Sidang Period ID tidak valid"),
});

/**
 * Schema untuk Reject Sidang Registration (PUT /api/sidang-registrations/:id/reject)
 */
export const rejectSidangSchema = z.object({
  adminId: z
    .string({ required_error: "Admin ID wajib diisi" })
    .uuid("Admin ID tidak valid"),
  message: z
    .string({ required_error: "Pesan penolakan/revisi wajib diisi" })
    .trim()
    .min(1, "Pesan penolakan/revisi wajib diisi"),
  isEdit: z.string().optional().nullable(),
});
