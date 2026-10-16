import { z } from "zod";

/**
 * Schema untuk Create or Update Admin (PUT /api/admin/:id)
 */
export const upsertAdminSchema = z.object({
  name: z
    .string({ error: "Nama wajib diisi" })
    .trim()
    .min(1, "Nama wajib diisi"),
});
