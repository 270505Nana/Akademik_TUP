import { z } from "zod";
import { ROLES, EMAIL_DOMAINS } from "../constants/roles.js";

export const registerSchema = z
  .object({
    name: z
      .string({ required_error: "Nama wajib diisi" })
      .trim()
      .min(1, "Nama wajib diisi"),
    email: z
      .string({ required_error: "Email wajib diisi" })
      .trim()
      .email("Format email tidak valid")
      .refine(
        (email) => {
          const domain = email.toLowerCase().split("@")[1];
          return (
            domain === EMAIL_DOMAINS.STUDENT || domain === EMAIL_DOMAINS.TELKOM
          );
        },
        {
          message: `Domain email harus ${EMAIL_DOMAINS.STUDENT} atau ${EMAIL_DOMAINS.TELKOM}`,
        },
      ),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9\s-]{8,15}$/, "Nomor telepon tidak valid")
      .optional()
      .nullable(),
    role: z.enum([ROLES.MAHASISWA, ROLES.DOSEN, ROLES.ADMIN]).optional(),
    password: z
      .string({ required_error: "Kata sandi wajib diisi" })
      .min(8, "Kata sandi minimal 8 karakter"),
    confirmPassword: z.string({
      required_error: "Konfirmasi kata sandi wajib diisi",
    }),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Konfirmasi kata sandi tidak cocok",
      });
    }

    const domain = data.email ? data.email.toLowerCase().split("@")[1] : "";

    if (
      domain === EMAIL_DOMAINS.STUDENT &&
      data.role &&
      data.role !== ROLES.MAHASISWA
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["role"],
        message: "Role harus MAHASISWA untuk domain email mahasiswa",
      });
    }

    if (domain === EMAIL_DOMAINS.TELKOM) {
      if (!data.role) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["role"],
          message: "Role wajib diisi untuk domain email telkomuniversity.ac.id",
        });
      } else if (![ROLES.DOSEN, ROLES.ADMIN].includes(data.role)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["role"],
          message:
            "Role harus DOSEN atau ADMIN untuk domain email telkomuniversity.ac.id",
        });
      }
    }
  });

export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email wajib diisi" })
    .trim()
    .email("Format email tidak valid"),
  password: z
    .string({ required_error: "Kata sandi wajib diisi" })
    .min(8, "Kata sandi minimal 8 karakter"),
});
