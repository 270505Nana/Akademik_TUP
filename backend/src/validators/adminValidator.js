import { body } from 'express-validator';

const upsertAdminValidator = [
  body("name").notEmpty().withMessage("Nama wajib diisi"),
];

export { upsertAdminValidator };
