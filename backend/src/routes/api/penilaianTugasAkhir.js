import express from "express";
import {
  getPenilaianBySidangRegistrationId,
  savePenilaianTugasAkhir,
} from "../../controllers/penilaianTugasAkhirController.js";
import { verifyToken } from "../../middlewares/auth.js";
import { authorize } from "../../middlewares/authorize.js";
import { validate } from "../../middlewares/validate.js";
import { savePenilaianTugasAkhirSchema } from "../../schemas/penilaianTugasAkhirSchema.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Penilaian Tugas Akhir
 *   description: Endpoints pengelolaan penilaian sidang tugas akhir oleh dosen penilai & kaprodi
 */

/**
 * @swagger
 * /api/penilaian-tugas-akhir/sidang-registration/{sidangRegistrationId}:
 *   get:
 *     summary: Get Penilaian Tugas Akhir by Sidang Registration ID
 *     tags: [Penilaian Tugas Akhir]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sidangRegistrationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID Pendaftaran Sidang (UUID)
 *     responses:
 *       200:
 *         description: Data penilaian tugas akhir berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bobotPenilai:
 *                   type: number
 *                   example: 0.5
 *                 bobotNilai:
 *                   type: object
 *                   example:
 *                     nilai1: 0.2
 *                     nilai2: 0.3
 *                     nilai3: 0.3
 *                     nilai4: 0.2
 *                 nilai:
 *                   type: object
 *                   example:
 *                     nilai1: 90.0
 *                     nilai2: 80.0
 *                     nilai3: 85.0
 *                     nilai4: 98.0
 *                 catatanRevisi:
 *                   type: string
 *                   example: "Perbaiki format penulisan bab 4"
 *                 sidangRegistrationId:
 *                   type: string
 *                   example: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
 *                 penilaiType:
 *                   type: string
 *                   enum: ["pembimbing", "penguji"]
 *                   example: "pembimbing"
 *                 dosenPenilai:
 *                   type: object
 *                 dosenKaprodi:
 *                   type: object
 *       401:
 *         description: Token tidak valid atau tidak ditemukan
 *       403:
 *         description: Akses ditolak atau dosen tidak terdaftar sebagai pembimbing/penguji
 *       404:
 *         description: Pendaftaran sidang tidak ditemukan
 */
router.get(
  "/sidang-registration/:sidangRegistrationId",
  verifyToken,
  authorize("DOSEN"),
  getPenilaianBySidangRegistrationId
);

/**
 * @swagger
 * /api/penilaian-tugas-akhir:
 *   post:
 *     summary: Simpan / Submit Penilaian Sidang Tugas Akhir
 *     tags: [Penilaian Tugas Akhir]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sidangRegistrationId
 *               - nilai
 *             properties:
 *               sidangRegistrationId:
 *                 type: string
 *                 description: ID Pendaftaran Sidang (UUID)
 *                 example: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
 *               nilai:
 *                 type: object
 *                 description: Komponen nilai dalam bentuk JSON
 *                 example:
 *                   nilai1: 90.0
 *                   nilai2: 80.0
 *                   nilai3: 85.0
 *                   nilai4: 98.0
 *               catatanRevisi:
 *                 type: string
 *                 description: Catatan revisi untuk mahasiswa
 *                 example: "Perbaiki format sitasi daftar pustaka"
 *     responses:
 *       201:
 *         description: Penilaian tugas akhir berhasil dibuat
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Penilaian tugas akhir berhasil disimpan"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     bobotPenilai:
 *                       type: number
 *                     bobotNilai:
 *                       type: object
 *                     nilai:
 *                       type: object
 *                     catatanRevisi:
 *                       type: string
 *                     sidangRegistrationId:
 *                       type: string
 *                     penilaiType:
 *                       type: string
 *                       enum: ["pembimbing", "penguji"]
 *                       example: "pembimbing"
 *                     dosenPenilai:
 *                       type: object
 *                     dosenKaprodi:
 *                       type: object
 *       200:
 *         description: Penilaian tugas akhir berhasil diperbarui
 *       400:
 *         description: Validasi error
 *       401:
 *         description: Token tidak valid atau tidak ditemukan
 *       403:
 *         description: Akses ditolak atau dosen tidak terdaftar sebagai pembimbing/penguji
 *       404:
 *         description: Pendaftaran sidang atau Dosen tidak ditemukan
 */
router.post(
  "/",
  verifyToken,
  authorize("DOSEN"),
  validate(savePenilaianTugasAkhirSchema),
  savePenilaianTugasAkhir
);

export default router;
