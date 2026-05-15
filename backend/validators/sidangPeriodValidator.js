const { body } = require("express-validator");

const createSidangPeriodValidator = [
  body("name")
    .notEmpty()
    .withMessage("Nama wajib diisi")
    .isString()
    .withMessage("Nama harus berupa string"),

  body("startDate")
    .notEmpty()
    .withMessage("Tanggal mulai wajib diisi")
    .isISO8601()
    .withMessage(
      "Tanggal mulai harus berupa tanggal yang valid (format ISO 8601)",
    )
    .custom((value) => {
      if (new Date(value) < new Date()) {
        throw new Error("Tanggal mulai tidak boleh di masa lalu");
      }
      return true;
    }),

  body("endDate")
    .notEmpty()
    .withMessage("Tanggal selesai wajib diisi")
    .isISO8601()
    .withMessage(
      "Tanggal selesai harus berupa tanggal yang valid (format ISO 8601)",
    )
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startDate)) {
        throw new Error("Tanggal selesai harus setelah tanggal mulai");
      }
      return true;
    }),

  body("isOpen")
    .optional()
    .isBoolean()
    .withMessage("isOpen harus berupa boolean"),
];

const updateSidangPeriodValidator = [
  body("name").optional().isString().withMessage("Nama harus berupa string"),

  body("startDate")
    .optional()
    .isISO8601()
    .withMessage(
      "Tanggal mulai harus berupa tanggal yang valid (format ISO 8601)",
    )
    .custom((value) => {
      if (new Date(value) < new Date()) {
        throw new Error("Tanggal mulai tidak boleh di masa lalu");
      }
      return true;
    }),

  body("endDate")
    .optional()
    .isISO8601()
    .withMessage(
      "Tanggal selesai harus berupa tanggal yang valid (format ISO 8601)",
    )
    .custom((value, { req }) => {
      const startDate = req.body.startDate || req.body.existingStartDate;
      if (new Date(value) <= new Date(startDate)) {
        throw new Error("Tanggal selesai harus setelah tanggal mulai");
      }
      return true;
    }),

  body("isOpen")
    .optional()
    .isBoolean()
    .withMessage("isOpen harus berupa boolean"),
];

module.exports = {
  createSidangPeriodValidator,
  updateSidangPeriodValidator,
};
