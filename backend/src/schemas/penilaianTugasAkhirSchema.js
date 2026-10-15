import { z } from "zod";

const komponenNilaiSchema = z.object({
  jenisAsesmenId: z.string({ required_error: "ID Jenis Asesmen wajib diisi" }).uuid("Format ID Jenis Asesmen tidak valid"),
  nilai: z.number({
    required_error: "Nilai wajib diisi",
    invalid_type_error: "Nilai harus berupa angka",
  })
    .min(0, "Nilai minimal 0")
    .max(100, "Nilai maksimal 100"),
});

export const savePenilaianTugasAkhirSchema = z.object({
  nilai: z
    .array(komponenNilaiSchema, {
      required_error: "Daftar nilai wajib diisi dalam bentuk array",
      invalid_type_error: "Daftar nilai harus berupa array",
    })
    .min(1, "Minimal satu komponen nilai harus diisi"),
  catatanRevisi: z.string().optional().nullable(),
});

export const tutupSidangSchema = z.object({
  deadlineRevisi: z
    .string({ required_error: "Batas waktu revisi (deadlineRevisi) wajib diisi" })
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Format tanggal batas waktu revisi tidak valid",
    }),
  keterangan: z.enum(["Lulus", "Lulus Bersyarat", "Tidak Lulus"], {
    required_error:
      "Keterangan kelulusan wajib diisi ('Lulus', 'Lulus Bersyarat', atau 'Tidak Lulus')",
    invalid_type_error:
      "Keterangan kelulusan harus bernilai 'Lulus', 'Lulus Bersyarat', atau 'Tidak Lulus'",
  }),
  nilaiAkhir: z
    .union([z.number(), z.string()])
    .optional()
    .nullable(),
  justifikasi: z.string().optional().nullable(),
});

