import { z } from "zod";

export const saveSidangDraftSchema = z.object({
  periodId: z.string().uuid("ID Periode tidak valid").optional().nullable(),
  program: z.string().trim().optional().nullable(),
  sks: z.coerce.number().int().min(0).optional().nullable(),
  ipk: z.coerce.number().min(0).max(4).optional().nullable(),
  tak: z.coerce.number().int().min(0).optional().nullable(),
  sktaExpDate: z.string().optional().nullable(),
  judulTugasAkhirIndonesia: z.string().trim().optional().nullable(),
  judulTugasAkhirInggris: z.string().trim().optional().nullable(),
  dosenPembimbing1Id: z.string().uuid().optional().nullable(),
  dosenPembimbing2Id: z.string().uuid().optional().nullable(),
  dosenWaliId: z.string().uuid().optional().nullable(),
  researchGroupId: z.string().uuid().optional().nullable(),
  skemaSidang: z.string().trim().optional().nullable(),
  jalurNonSidang: z.string().trim().optional().nullable(),
  lulusTesBahasa: z.boolean().optional().nullable(),
  skorTesBahasa: z.coerce.number().optional().nullable(),
});

export const reviewSidangSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "REVISION"], {
    required_error: "Status review wajib diisi",
  }),
  reviewNotes: z.string().trim().optional().nullable(),
  tglSidang: z.string().optional().nullable(),
  waktuMulai: z.string().optional().nullable(),
  waktuSelesai: z.string().optional().nullable(),
  ruanganId: z.string().uuid().optional().nullable(),
  dosenPenguji1Id: z.string().uuid().optional().nullable(),
  dosenPenguji2Id: z.string().uuid().optional().nullable(),
});
