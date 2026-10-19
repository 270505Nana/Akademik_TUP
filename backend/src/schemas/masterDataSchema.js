import { z } from "zod";


// Schema Ruangan
export const upsertRuanganSchema = z.object({
  name: z
    .string({ required_error: "Nama ruangan wajib diisi" })
    .trim()
    .min(1, "Nama ruangan wajib diisi"),
  gedung: z.string().trim().optional().nullable(),
  isActive: z.boolean().optional(),
});



