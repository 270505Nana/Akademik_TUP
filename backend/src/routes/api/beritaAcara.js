import express from "express";
import { verifyToken } from "../../middlewares/auth.js";
import { authorize } from "../../middlewares/authorize.js";
import { validate } from "../../middlewares/validate.js";
import { upload } from "../../middlewares/upload.js";
import {
  listBeritaAcaraQuerySchema,
  updateBeritaAcaraSchema,
  publishBeritaAcaraSchema,
} from "../../schemas/beritaAcaraSchema.js";
import {
  getBeritaAcaraList,
  getBeritaAcaraById,
  getLatestBeritaAcaraMahasiswa,
  updateBeritaAcara,
  uploadBerkasBeritaAcara,
  deleteBerkasBeritaAcara,
  downloadBerkasBeritaAcara,
  publishBeritaAcara,
} from "../../controllers/beritaAcaraController.js";

const router = express.Router();

// Helper middleware to normalize uploaded file from fields
const extractBeritaAcaraFile = (req, res, next) => {
  if (req.files) {
    req.file =
      req.files.berkas?.[0] ||
      req.files.file?.[0] ||
      req.files.berkasBeritaAcara?.[0] ||
      req.file;
  }
  next();
};

// GET /api/berita-acara (Admin)
router.get(
  "/",
  verifyToken,
  authorize("ADMIN"),
  validate(listBeritaAcaraQuerySchema, "query"),
  getBeritaAcaraList
);

// GET /api/berita-acara/me (Mahasiswa)
router.get(
  "/me",
  verifyToken,
  authorize("MAHASISWA"),
  getLatestBeritaAcaraMahasiswa
);

// GET /api/berita-acara/:id (Admin)
router.get(
  "/:id",
  verifyToken,
  authorize("ADMIN"),
  getBeritaAcaraById
);

// PUT /api/berita-acara/:id (Admin)
router.put(
  "/:id",
  verifyToken,
  authorize("ADMIN"),
  validate(updateBeritaAcaraSchema),
  updateBeritaAcara
);

// PUT /api/berita-acara/:id/berkas (Admin upload file)
router.put(
  "/:id/berkas",
  verifyToken,
  authorize("ADMIN"),
  upload("berkas-berita-acara").fields([
    { name: "berkas", maxCount: 1 },
    { name: "file", maxCount: 1 },
    { name: "berkasBeritaAcara", maxCount: 1 },
  ]),
  extractBeritaAcaraFile,
  uploadBerkasBeritaAcara
);

// DELETE /api/berita-acara/:id/berkas (Admin delete file)
router.delete(
  "/:id/berkas",
  verifyToken,
  authorize("ADMIN"),
  deleteBerkasBeritaAcara
);

// GET /api/berita-acara/:id/berkas/download (Admin, Mahasiswa & Dosen Terkait)
router.get(
  "/:id/berkas/download",
  verifyToken,
  authorize("ADMIN", "MAHASISWA", "DOSEN"),
  downloadBerkasBeritaAcara
);

// PATCH /api/berita-acara/:id/publish (Admin toggle publish)
router.patch(
  "/:id/publish",
  verifyToken,
  authorize("ADMIN"),
  validate(publishBeritaAcaraSchema),
  publishBeritaAcara
);

export default router;
