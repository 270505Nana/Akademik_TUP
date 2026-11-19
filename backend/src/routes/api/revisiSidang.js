import express from "express";
import { verifyToken } from "../../middlewares/auth.js";
import { authorize } from "../../middlewares/authorize.js";
import { validate } from "../../middlewares/validate.js";
import { upload } from "../../middlewares/upload.js";
import {
  listRevisiSidangQuerySchema,
  verifyRevisiSidangSchema,
} from "../../schemas/revisiSidangSchema.js";
import {
  getRevisiSidangList,
  getLatestRevisiSidangMahasiswa,
  getRevisiSidangById,
  submitRevisiSidang,
  deleteBerkasRevisiSidang,
  verifyRevisiSidang,
} from "../../controllers/revisiSidangController.js";

const router = express.Router();

// Helper middleware to normalize uploaded file from fields
const extractRevisiFile = (req, res, next) => {
  if (req.files) {
    req.file = req.files.berkasRevisi?.[0] || req.files.file?.[0] || req.file;
  }
  next();
};

// GET /api/revisi-sidang (Admin & Dosen)
router.get(
  "/",
  verifyToken,
  authorize("ADMIN", "DOSEN"),
  validate(listRevisiSidangQuerySchema, "query"),
  getRevisiSidangList,
);

// GET /api/revisi-sidang/me (Mahasiswa)
router.get(
  "/me",
  verifyToken,
  authorize("MAHASISWA"),
  getLatestRevisiSidangMahasiswa,
);

// GET /api/revisi-sidang/:id (Admin & Dosen Pembimbing 1)
router.get(
  "/:id",
  verifyToken,
  authorize("ADMIN", "DOSEN"),
  getRevisiSidangById,
);

// PUT /api/revisi-sidang/:id/submit (Mahasiswa)
router.put(
  "/:id/submit",
  verifyToken,
  authorize("MAHASISWA"),
  upload("berkas-revisi").fields([
    { name: "berkasRevisi", maxCount: 1 },
    { name: "file", maxCount: 1 },
  ]),
  extractRevisiFile,
  submitRevisiSidang,
);

// DELETE /api/revisi-sidang/:id/berkas (Mahasiswa)
router.delete(
  "/:id/berkas",
  verifyToken,
  authorize("MAHASISWA"),
  deleteBerkasRevisiSidang,
);

// PUT /api/revisi-sidang/:id/verify (Dosen Pembimbing 1)
router.put(
  "/:id/verify",
  verifyToken,
  authorize("DOSEN"),
  validate(verifyRevisiSidangSchema),
  verifyRevisiSidang,
);

export default router;
