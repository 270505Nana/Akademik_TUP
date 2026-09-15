import { z } from "zod";

export const periodSchema = z.object({
  name: z
    .string({ required_error: "Nama periode wajib diisi" })
    .trim()
    .min(1, "Nama periode wajib diisi"),
  startDate: z
    .string({ required_error: "Tanggal mulai wajib diisi" })
    .datetime({ message: "Format tanggal mulai harus ISO 8601" }),
  endDate: z
    .string({ required_error: "Tanggal selesai wajib diisi" })
    .datetime({ message: "Format tanggal selesai harus ISO 8601" }),
  isActive: z.boolean().optional(),
});
