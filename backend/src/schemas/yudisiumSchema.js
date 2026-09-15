import { z } from "zod";

/**
 * Schema untuk Save Draft Yudisium Registration (POST /api/yudisium-registrations)
 * Murni menggunakan nama field kanonikal sesuai model YudisiumRegistration di schema.prisma
 */
export const saveYudisiumDraftSchema = z.object({
  id: z.string().uuid("ID Pendaftaran tidak valid").optional().nullable(),
  mahasiswaId: z.string().uuid("ID Mahasiswa tidak valid").optional().nullable(),
  program: z.string().trim().optional().nullable(),
  dosenWaliId: z.string().uuid("ID Dosen Wali tidak valid").optional().nullable(),
  dosenPembimbing1Id: z.string().uuid("ID Dosen Pembimbing 1 tidak valid").optional().nullable(),
  dosenPembimbing2Id: z.string().uuid("ID Dosen Pembimbing 2 tidak valid").optional().nullable(),
  judulTugasAkhirIndonesia: z.string().trim().optional().nullable(),
  judulTugasAkhirInggris: z.string().trim().optional().nullable(),
  tak: z.coerce.number().int().min(0).optional().nullable(),
  tglSidang: z.string().optional().nullable(),
  skemaSidang: z.string().trim().optional().nullable(),
  pengajuanCumlaude: z.string().trim().optional().nullable(),
  skemaCumlaude: z.string().trim().optional().nullable(),
  evidenCumlaude: z.string().trim().optional().nullable(),
  berminatWirausaha: z.boolean().optional().nullable(),
  yudisiumRegistrationPeriodId: z.string().uuid("ID Periode Registrasi tidak valid").optional().nullable(),
  yudisiumPeriodId: z.string().uuid("ID Periode Yudisium tidak valid").optional().nullable(),
});

/**
 * Schema untuk Approve Yudisium Registration (PUT /api/yudisium-registrations/:id/approve)
 */
export const approveYudisiumSchema = z.object({
  adminId: z
    .string({ required_error: "Admin ID wajib diisi" })
    .uuid("Admin ID tidak valid"),
  yudisiumPeriodId: z
    .string({ required_error: "ID Periode Yudisium wajib diisi" })
    .uuid("ID Periode Yudisium tidak valid"),
});

/**
 * Schema untuk Reject / Request Revision Yudisium Registration (PUT /api/yudisium-registrations/:id/reject)
 */
export const rejectYudisiumSchema = z.object({
  adminId: z
    .string({ required_error: "Admin ID wajib diisi" })
    .uuid("Admin ID tidak valid"),
  message: z
    .string({ required_error: "Pesan penolakan/revisi wajib diisi" })
    .trim()
    .min(1, "Pesan penolakan/revisi wajib diisi"),
  isEdit: z.string().optional().nullable(),
});
