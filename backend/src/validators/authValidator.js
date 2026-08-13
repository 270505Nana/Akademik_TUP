import { body } from 'express-validator';

const ALLOWED_EMAIL_DOMAINS = [
  "student.telkomuniversity.ac.id",
  "telkomuniversity.ac.id",
];

const STUDENT_EMAIL_DOMAIN = "student.telkomuniversity.ac.id";
const TELKOM_EMAIL_DOMAIN = "telkomuniversity.ac.id";

const registerValidator = [
  body("name").notEmpty().withMessage("Nama wajib diisi"),

  body("email")
    .notEmpty()
    .withMessage("Email wajib diisi")
    .isEmail()
    .withMessage("Email tidak valid")
    .custom((value) => {
      const emailDomain = value.toLowerCase().split("@")[1];

      if (!ALLOWED_EMAIL_DOMAINS.includes(emailDomain)) {
        throw new Error(
          "Domain email harus student.telkomuniversity.ac.id atau telkomuniversity.ac.id",
        );
      }

      return true;
    }),

  body("phone")
    .optional({ nullable: true })
    .isMobilePhone()
    .withMessage("Nomor telepon tidak valid"),

  body("password")
    .notEmpty()
    .withMessage("Kata sandi wajib diisi")
    .isLength({ min: 8 })
    .withMessage("Kata sandi minimal 8 karakter"),

  body("confirmPassword")
    .notEmpty()
    .withMessage("Konfirmasi kata sandi wajib diisi")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Konfirmasi kata sandi tidak cocok");
      }
      return true;
    }),

  body("role").custom((value, { req }) => {
    const emailDomain = req.body.email?.toLowerCase().split("@")[1];
    const normalizedRole = typeof value === "string" ? value.trim() : value;

    if (emailDomain === STUDENT_EMAIL_DOMAIN) {
      if (
        normalizedRole === undefined ||
        normalizedRole === null ||
        normalizedRole === ""
      ) {
        return true;
      }

      if (normalizedRole !== "MAHASISWA") {
        throw new Error("Role harus MAHASISWA untuk domain email mahasiswa");
      }

      return true;
    }

    if (emailDomain === TELKOM_EMAIL_DOMAIN) {
      if (
        normalizedRole === undefined ||
        normalizedRole === null ||
        normalizedRole === ""
      ) {
        throw new Error(
          "Role wajib diisi untuk domain email telkomuniversity.ac.id",
        );
      }

      if (!["DOSEN", "ADMIN"].includes(normalizedRole)) {
        throw new Error(
          "Role harus DOSEN atau ADMIN untuk domain email telkomuniversity.ac.id",
        );
      }

      return true;
    }

    throw new Error(
      "Domain email harus student.telkomuniversity.ac.id atau telkomuniversity.ac.id",
    );
  }),
];

const loginValidator = [
  body("email")
    .notEmpty()
    .withMessage("Email wajib diisi")
    .isEmail()
    .withMessage("Email tidak valid"),

  body("password")
    .notEmpty()
    .withMessage("Kata sandi wajib diisi")
    .isLength({ min: 8 })
    .withMessage("Kata sandi minimal 8 karakter"),
];

export { registerValidator, loginValidator };
