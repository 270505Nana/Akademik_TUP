import { z } from "zod";

/**
 * Schema untuk Set Penguji Sidang (PUT /api/penjadwalan-sidang/:id/set-penguji)
 */
export const setPengujiSidangSchema = z
  .object({
    dosenPenguji1Id: z
      .string({
        error: (iss) =>
          iss.input === undefined || iss.input === null
            ? "ID dosen penguji 1 wajib diisi"
            : "ID dosen penguji 1 harus berupa string",
      })
      .trim()
      .min(1, "ID dosen penguji 1 wajib diisi"),
    dosenPenguji2Id: z
      .string({
        error: (iss) =>
          iss.input === undefined || iss.input === null
            ? "ID dosen penguji 2 wajib diisi"
            : "ID dosen penguji 2 harus berupa string",
      })
      .trim()
      .min(1, "ID dosen penguji 2 wajib diisi"),
  })
  .refine((data) => data.dosenPenguji1Id !== data.dosenPenguji2Id, {
    path: ["dosenPenguji2Id"],
    message: "Dosen penguji 1 dan dosen penguji 2 tidak boleh sama",
  });

/**
 * Schema untuk Item Batch Set Penguji Sidang
 */
export const batchSetPengujiItemSchema = z
  .object({
    id: z
      .string({
        error: (iss) =>
          iss.input === undefined || iss.input === null
            ? "ID pendaftaran sidang wajib diisi"
            : "ID pendaftaran sidang harus berupa string",
      })
      .trim()
      .min(1, "ID pendaftaran sidang wajib diisi"),
    dosenPenguji1Id: z
      .string({
        error: (iss) =>
          iss.input === undefined || iss.input === null
            ? "ID dosen penguji 1 wajib diisi"
            : "ID dosen penguji 1 harus berupa string",
      })
      .trim()
      .min(1, "ID dosen penguji 1 wajib diisi"),
    dosenPenguji2Id: z
      .string({
        error: (iss) =>
          iss.input === undefined || iss.input === null
            ? "ID dosen penguji 2 wajib diisi"
            : "ID dosen penguji 2 harus berupa string",
      })
      .trim()
      .min(1, "ID dosen penguji 2 wajib diisi"),
  })
  .refine((item) => item.dosenPenguji1Id !== item.dosenPenguji2Id, {
    path: ["dosenPenguji2Id"],
    message: "Dosen penguji 1 dan dosen penguji 2 tidak boleh sama",
  });

/**
 * Schema untuk Batch Set Penguji Sidang (PUT /api/penjadwalan-sidang/set-penguji/batch)
 */
export const batchSetPengujiSidangSchema = z
  .any()
  .superRefine((val, ctx) => {
    if (!Array.isArray(val) || val.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["body"],
        message: "Request body harus berupa array data dan tidak boleh kosong",
      });
    }
  })
  .pipe(
    z.array(batchSetPengujiItemSchema).superRefine((items, ctx) => {
      const seenIds = new Set();
      items.forEach((item, idx) => {
        if (item.id && seenIds.has(item.id)) {
          ctx.addIssue({
            code: "custom",
            path: [idx, "id"],
            message:
              "ID pendaftaran sidang tidak boleh duplikat dalam satu request",
          });
        } else if (item.id) {
          seenIds.add(item.id);
        }
      });
    }),
  );

/**
 * Schema untuk Set Jadwal Sidang (PUT /api/penjadwalan-sidang/:id/set-jadwal)
 */
export const setJadwalSidangSchema = z.object({
  tglSidang: z
    .string({
      error: (iss) =>
        iss.input === undefined || iss.input === null
          ? "Tanggal sidang wajib diisi"
          : "Tanggal sidang harus berupa string",
    })
    .trim()
    .min(1, "Tanggal sidang wajib diisi")
    .refine((val) => !isNaN(Date.parse(val)), {
      message:
        "Tanggal sidang harus berupa tanggal yang valid (format ISO 8601)",
    }),
  ruanganSidangId: z
    .string({
      error: (iss) =>
        iss.input === undefined || iss.input === null
          ? "ID ruangan sidang wajib diisi"
          : "ID ruangan sidang harus berupa string",
    })
    .trim()
    .min(1, "ID ruangan sidang wajib diisi"),
});

/**
 * Schema untuk Item Batch Set Jadwal Sidang
 */
export const batchSetJadwalItemSchema = z.object({
  id: z
    .string({
      error: (iss) =>
        iss.input === undefined || iss.input === null
          ? "ID pendaftaran sidang wajib diisi"
          : "ID pendaftaran sidang harus berupa string",
    })
    .trim()
    .min(1, "ID pendaftaran sidang wajib diisi"),
  tglSidang: z
    .string({
      error: (iss) =>
        iss.input === undefined || iss.input === null
          ? "Tanggal sidang wajib diisi"
          : "Tanggal sidang harus berupa string",
    })
    .trim()
    .min(1, "Tanggal sidang wajib diisi")
    .refine((val) => !isNaN(Date.parse(val)), {
      message:
        "Tanggal sidang harus berupa tanggal yang valid (format ISO 8601)",
    }),
  ruanganSidangId: z
    .string({
      error: (iss) =>
        iss.input === undefined || iss.input === null
          ? "ID ruangan sidang wajib diisi"
          : "ID ruangan sidang harus berupa string",
    })
    .trim()
    .min(1, "ID ruangan sidang wajib diisi"),
});

/**
 * Schema untuk Batch Set Jadwal Sidang (PUT /api/penjadwalan-sidang/set-jadwal/batch)
 */
export const batchSetJadwalSidangSchema = z
  .any()
  .superRefine((val, ctx) => {
    if (!Array.isArray(val) || val.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["body"],
        message: "Request body harus berupa array data dan tidak boleh kosong",
      });
    }
  })
  .pipe(
    z.array(batchSetJadwalItemSchema).superRefine((items, ctx) => {
      const seenIds = new Set();
      items.forEach((item, idx) => {
        if (item.id && seenIds.has(item.id)) {
          ctx.addIssue({
            code: "custom",
            path: [idx, "id"],
            message:
              "ID pendaftaran sidang tidak boleh duplikat dalam satu request",
          });
        } else if (item.id) {
          seenIds.add(item.id);
        }
      });
    }),
  );
