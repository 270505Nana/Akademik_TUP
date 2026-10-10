import { z } from "zod";

export const savePenilaianTugasAkhirSchema = z.object({
  nilai: z
    .record(z.any(), {
      message: "Nilai wajib diisi dalam bentuk object JSON",
    })
    .refine(
      (val) => val !== null && typeof val === "object" && !Array.isArray(val),
      {
        message: "Nilai wajib diisi dalam bentuk object JSON",
      },
    ),
  catatanRevisi: z.string().optional().nullable(),
});
