import express from "express";
import { verifyToken } from "../../middlewares/auth.js";
import { authorize } from "../../middlewares/authorize.js";
import { validate } from "../../middlewares/validate.js";
import { upload } from "../../middlewares/upload.js";
import {
  setPengujiSidangSchema,
  batchSetPengujiSidangSchema,
  setJadwalSidangSchema,
  batchSetJadwalSidangSchema,
  setPengujiJadwalSidangSchema,
  listPenjadwalanSidangQuerySchema,
} from "../../schemas/penjadwalanSidangSchema.js";
import {
  listPenjadwalanSidang,
  setPengujiSidang,
  batchSetPengujiSidang,
  setJadwalSidang,
  batchSetJadwalSidang,
  setPengujiJadwalSidang,
  exportJadwalSidang,
  toggleLockSidangRegistration,
  toggleReadInfoPenjadwalan,
  togglePublishSidangPeriod,
  uploadNotaDinasController,
  getNotaDinasController,
  getUsersTerlibatSidang,
} from "../../controllers/penjadwalanSidangController.js";

const router = express.Router();

// GET /api/penjadwalan-sidang
router.get(
  "/",
  verifyToken,
  authorize("ADMIN", "DOSEN_KETUAKK"),
  validate(listPenjadwalanSidangQuerySchema, "query"),
  listPenjadwalanSidang,
);

// PATCH /api/penjadwalan-sidang/:id/toggle-lock
router.patch(
  "/:id/toggle-lock",
  verifyToken,
  authorize("ADMIN"),
  toggleLockSidangRegistration,
);

// PATCH /api/penjadwalan-sidang/period/:sidangPeriodId/toggle-publish
router.patch(
  "/period/:sidangPeriodId/toggle-publish",
  verifyToken,
  authorize("ADMIN"),
  togglePublishSidangPeriod,
);

// PATCH /api/penjadwalan-sidang/:id/toggle-read-info-penjadwalan
router.patch(
  "/:id/toggle-read-info-penjadwalan",
  verifyToken,
  authorize("MAHASISWA"),
  toggleReadInfoPenjadwalan,
);

// GET /api/penjadwalan-sidang/export
router.get(
  "/export",
  verifyToken,
  authorize("ADMIN", "DOSEN_KETUAKK"),
  exportJadwalSidang,
);

// GET /api/penjadwalan-sidang/users
router.get(
  "/users",
  verifyToken,
  authorize("ADMIN"),
  getUsersTerlibatSidang,
);

// PUT /api/penjadwalan-sidang/set-penguji/batch
router.put(
  "/set-penguji/batch",
  verifyToken,
  authorize("DOSEN_KETUAKK"),
  validate(batchSetPengujiSidangSchema),
  batchSetPengujiSidang,
);

// PUT /api/penjadwalan-sidang/set-jadwal/batch
router.put(
  "/set-jadwal/batch",
  verifyToken,
  authorize("ADMIN"),
  validate(batchSetJadwalSidangSchema),
  batchSetJadwalSidang,
);

// PUT /api/penjadwalan-sidang/:id/set-penguji
router.put(
  "/:id/set-penguji",
  verifyToken,
  authorize("DOSEN_KETUAKK"),
  validate(setPengujiSidangSchema),
  setPengujiSidang,
);

// PUT /api/penjadwalan-sidang/:id/set-jadwal
router.put(
  "/:id/set-jadwal",
  verifyToken,
  authorize("ADMIN"),
  validate(setJadwalSidangSchema),
  setJadwalSidang,
);

// PUT /api/penjadwalan-sidang/:id/set-penguji-jadwal
router.put(
  "/:id/set-penguji-jadwal",
  verifyToken,
  authorize("ADMIN"),
  validate(setPengujiJadwalSidangSchema),
  setPengujiJadwalSidang,
);

// GET /api/penjadwalan-sidang/:id/nota-dinas
router.get(
  "/:id/nota-dinas",
  verifyToken,
  authorize("ADMIN", "DOSEN_KETUAKK", "DOSEN"),
  getNotaDinasController,
);

// POST /api/penjadwalan-sidang/:id/nota-dinas
router.post(
  "/:id/nota-dinas",
  verifyToken,
  authorize("ADMIN"),
  upload("nota-dinas").single("notaDinasFile"),
  uploadNotaDinasController,
);

export default router;
