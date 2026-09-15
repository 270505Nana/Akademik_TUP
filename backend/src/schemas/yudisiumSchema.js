import { z } from "zod";

export const saveYudisiumDraftSchema = z.object({
  periodId: z.string().uuid("ID Periode tidak valid").optional().nullable(),
  program: z.string().trim().optional().nullable(),
  sks: z.coerce.number().int().min(0).optional().nullable(),
  ipk: z.coerce.number().min(0).max(4).optional().nullable(),
  tak: z.coerce.number().int().min(0).optional().nullable(),
  sktaExpDate: z.string().optional().nullable(),
  tglLulusSidang: z.string().optional().nullable(),
  judulTugasAkhirIndonesia: z.string().trim().optional().nullable(),
  judulTugasAkhirInggris: z.string().trim().optional().nullable(),
  dosenPembimbing1Id: z.string().uuid().optional().nullable(),
  dosenPembimbing2Id: z.string().uuid().optional().nullable(),
  dosenWaliId: z.string().uuid().optional().nullable(),
  peminatan: z.string().trim().optional().nullable(),
  berminatWirausaha: z.boolean().optional().nullable(),
  skemaCumlaude: z.string().trim().optional().nullable(),
});

export const reviewYudisiumSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "REVISION"], {
    required_error: "Status verifikasi wajib diisi",
  }),
  reviewNotes: z.string().trim().optional().nullable(),
  nomorIjazah: z.string().trim().optional().nullable(),
  nomorSertifikatPendidik: z.string().trim().optional().nullable(),
  nomorSkYudisium: z.string().trim().optional().nullable(),
  tglSkYudisium: z.string().optional().nullable(),
  tglWisuda: z.string().optional().nullable(),
  periodeWisuda: z.string().trim().optional().nullable(),
  nomorSertifikatProfesi: z.string().trim().optional().nullable(),
});
