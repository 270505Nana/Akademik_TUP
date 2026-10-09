import { z } from "zod";

/**
 * Schema untuk Simpan / Submit Penilaian Tugas Akhir (POST /api/penilaian-tugas-akhir)
 * bobotNilai diisi otomatis oleh backend sehingga tidak perlu ada di request body
 */
export const savePenilaianTugasAkhirSchema = z.object({
  sidangRegistrationId: z
    .string({ message: "ID Pendaftaran Sidang wajib diisi" })
    .trim()
    .min(1, "ID Pendaftaran Sidang wajib diisi"),
  nilai: z
    .record(z.any(), {
      message: "Nilai wajib diisi dalam bentuk object JSON",
    })
    .refine((val) => val !== null && typeof val === "object" && !Array.isArray(val), {
      message: "Nilai wajib diisi dalam bentuk object JSON",
    }),
  catatanRevisi: z.string().optional().nullable(),
});

export const penilaianTugasAkhirSchema = savePenilaianTugasAkhirSchema;
