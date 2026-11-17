import { z } from "zod";

export const listRevisiSidangQuerySchema = z.object({
  sidangPeriodId: z.string().uuid("Format ID Periode Sidang tidak valid").optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  sort: z.enum(["newest", "oldest"]).optional().default("newest"),
});

export const verifyRevisiSidangSchema = z.object({
  nilaiAkhir: z
    .union([z.string(), z.number()])
    .refine((val) => {
      const num = Number(val);
      return !isNaN(num) && num >= 0 && num <= 100;
    }, { message: "Nilai akhir harus berupa angka antara 0 dan 100" })
    .transform((val) => String(val)),
  keteranganLulus: z.string({
    required_error: "Keterangan kelulusan (keteranganLulus) wajib diisi",
  }).min(1, "Keterangan kelulusan wajib diisi"),
  nilaiHuruf: z.string({
    required_error: "Nilai huruf (nilaiHuruf) wajib diisi",
  }).min(1, "Nilai huruf wajib diisi"),
  justifikasi: z.string().optional().nullable(),
});
