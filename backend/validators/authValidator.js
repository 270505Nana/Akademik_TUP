const { body } = require("express-validator");

const ALLOWED_EMAIL_DOMAINS = [
  "student.telkomuniversity.ac.id",
  "telkomuniversity.ac.id",
];

const STUDENT_EMAIL_DOMAIN = "student.telkomuniversity.ac.id";
const TELKOM_EMAIL_DOMAIN = "telkomuniversity.ac.id";

const registerValidator = [
  body("username").notEmpty().withMessage("Username is required"),

  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email")
    .custom((value) => {
      const emailDomain = value.toLowerCase().split("@")[1];

      if (!ALLOWED_EMAIL_DOMAINS.includes(emailDomain)) {
        throw new Error(
          "Email domain must be student.telkomuniversity.ac.id or telkomuniversity.ac.id",
        );
      }

      return true;
    }),

  body("phone")
    .optional({ nullable: true })
    .isMobilePhone()
    .withMessage("Invalid phone number"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),

  body("confirmPassword")
    .notEmpty()
    .withMessage("Confirm password is required")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Confirm password does not match");
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

      if (normalizedRole !== "STUDENT") {
        throw new Error("Role must be STUDENT for student email domain");
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
          "Role is required for telkomuniversity.ac.id email domain",
        );
      }

      if (!["LECTURER", "ACADEMIC_STAFF"].includes(normalizedRole)) {
        throw new Error(
          "Role must be LECTURER or ACADEMIC_STAFF for telkomuniversity.ac.id email domain",
        );
      }

      return true;
    }

    throw new Error(
      "Email domain must be student.telkomuniversity.ac.id or telkomuniversity.ac.id",
    );
  }),
];

const loginValidator = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
];

module.exports = { registerValidator, loginValidator };
