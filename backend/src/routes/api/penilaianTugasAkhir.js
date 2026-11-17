import express from "express";
import {
  getPenilaianBySidangRegistrationId,
  getAllPenilaianBySidangRegistrationId,
  savePenilaianTugasAkhir,
  tutupSidang,
} from "../../controllers/penilaianTugasAkhirController.js";
import { verifyToken } from "../../middlewares/auth.js";
import { authorize } from "../../middlewares/authorize.js";
import { validate } from "../../middlewares/validate.js";
import {
  savePenilaianTugasAkhirSchema,
  tutupSidangSchema,
} from "../../schemas/penilaianTugasAkhirSchema.js";

const router = express.Router();

// 1. Rekap seluruh penilaian sidang dan kalkulasi berita acara
router.get(
  "/sidang-registration/:sidangRegistrationId",
  verifyToken,
  authorize("ADMIN", "DOSEN"),
  getAllPenilaianBySidangRegistrationId,
);

// 2. Formulir / data penilaian individual dosen login (me)
router.get(
  "/sidang-registration/:sidangRegistrationId/me",
  verifyToken,
  authorize("DOSEN"),
  getPenilaianBySidangRegistrationId,
);

router.put(
  "/sidang-registration/:sidangRegistrationId/me",
  verifyToken,
  authorize("DOSEN"),
  validate(savePenilaianTugasAkhirSchema),
  savePenilaianTugasAkhir,
);

// 3. Menutup sidang tugas akhir (khusus Dosen Pembimbing 1)
router.post(
  "/sidang-registration/:sidangRegistrationId/tutup-sidang",
  verifyToken,
  authorize("DOSEN"),
  validate(tutupSidangSchema),
  tutupSidang,
);

export default router;
