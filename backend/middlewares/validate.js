const fs = require("fs");
const { validationResult } = require("express-validator");

const removeUploadedFiles = (files) => {
  if (!files) {
    return;
  }

  if (Array.isArray(files)) {
    files.forEach((file) => {
      if (file?.path) {
        fs.unlink(file.path, () => {});
      }
    });

    return;
  }

  Object.values(files).forEach((value) => {
    removeUploadedFiles(value);
  });
};

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    removeUploadedFiles(req.file || req.files);

    return res.status(422).json({
      message: "Validation error",
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }

  next();
};

module.exports = { validate };
