import { z } from "zod";
import { EMAIL_DOMAINS } from "../constants/roles.js";

export const registerSchema = z
  .object({
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
    password: z
      .string({ required_error: "Kata sandi wajib diisi" })
      .min(8, "Kata sandi minimal 8 karakter"),
    confirmPassword: z.string({
      required_error: "Konfirmasi kata sandi wajib diisi",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Konfirmasi kata sandi tidak cocok",
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
