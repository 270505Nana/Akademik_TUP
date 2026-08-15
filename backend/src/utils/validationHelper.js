import fs from 'fs';

// Helper to remove uploaded files when validation fails
export const removeUploadedFiles = (files) => {
  if (!files) return;

  if (Array.isArray(files)) {
    files.forEach((file) => {
      if (file?.path) {
        fs.unlink(file.path, () => {});
      }
    });
    return;
  }

  if (typeof files === 'object') {
    Object.values(files).forEach((value) => {
      if (Array.isArray(value)) {
        value.forEach((file) => file?.path && fs.unlink(file.path, () => {}));
      } else if (value?.path) {
        fs.unlink(value.path, () => {});
      }
    });
  }
};

// Response helper for validation errors
export const sendValidationError = (res, errors, req = null) => {
  if (req) {
    removeUploadedFiles(req.file || req.files);
  }

  let formattedErrors = [];
  if (Array.isArray(errors)) {
    formattedErrors = errors.map(err => ({
      field: err.field,
      message: err.message
    }));
  } else if (typeof errors === 'object' && errors !== null) {
    formattedErrors = Object.entries(errors).map(([field, message]) => ({
      field,
      message
    }));
  }

  return res.status(400).json({
    message: "Validation error",
    errors: formattedErrors
  });
};

// Utility validators
export const isNil = (val) => val === undefined || val === null || (typeof val === 'string' && val.trim() === '');

export const isValidEmail = (email) => {
  if (typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const isValidPhone = (phone) => {
  if (typeof phone !== 'string') return false;
  // Simple check for mobile phone number
  const re = /^\+?[0-9\s-]{8,15}$/;
  return re.test(phone);
};

export const isValidISO8601 = (dateStr) => {
  if (typeof dateStr !== 'string') return false;
  const timestamp = Date.parse(dateStr);
  return !isNaN(timestamp);
};

export const parseBoolean = (val) => {
  if (typeof val === 'boolean') return val;
  if (val === 'true') return true;
  if (val === 'false') return false;
  return undefined;
};
