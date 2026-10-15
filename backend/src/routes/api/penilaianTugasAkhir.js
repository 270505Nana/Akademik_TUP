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
 *   description: Manajemen penilaian sidang tugas akhir oleh dosen pembimbing dan penguji
 */

/**
 * @swagger
 * /api/penilaian-tugas-akhir/sidang-registration/{sidangRegistrationId}:
 *   get:
 *     summary: Get Penilaian Sidang Tugas Akhir by Sidang Registration ID
 *     description: Mengembalikan data penilaian jika sudah ada (snapshot), atau template formulir kosong dari kurikulum master data prodi jika belum pernah dinilai (id: null).
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
 *         description: Data penilaian tugas akhir atau template formulir berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   nullable: true
 *                   example: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
 *                 bobotPenilai:
 *                   type: number
 *                   example: 0.6
 *                 nilai:
 *                   type: array
 *                   description: Hierarchical snapshot CLO, Sub-CLO, dan Asesmen
 *                   items:
 *                     type: object
 *                     properties:
 *                       cloProdiId:
 *                         type: string
 *                       cloName:
 *                         type: string
 *                         example: "CLO7"
 *                       deskripsi:
 *                         type: string
 *                       subClo:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             name:
 *                               type: string
 *                             deskripsi:
 *                               type: string
 *                       asesmen:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             jenisAsesmenId:
 *                               type: string
 *                             content:
 *                               type: string
 *                             bobot:
 *                               type: number
 *                               example: 0.1
 *                             nilai:
 *                               type: number
 *                               nullable: true
 *                               example: 85.0
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Akses ditolak atau dosen tidak terdaftar sebagai pembimbing/penguji
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Pendaftaran sidang tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/sidang-registration/:sidangRegistrationId",
  verifyToken,
  authorize("DOSEN"),
  getPenilaianBySidangRegistrationId,
);

/**
 * @swagger
 * /api/penilaian-tugas-akhir/sidang-registration/{sidangRegistrationId}:
 *   put:
 *     summary: Create or Update Penilaian Sidang Tugas Akhir
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nilai
 *             properties:
 *               nilai:
 *                 type: array
 *                 description: Daftar nilai per jenis asesmen
 *                 items:
 *                   type: object
 *                   required:
 *                     - jenisAsesmenId
 *                     - nilai
 *                   properties:
 *                     jenisAsesmenId:
 *                       type: string
 *                       format: uuid
 *                       example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *                     nilai:
 *                       type: number
 *                       format: float
 *                       minimum: 0
 *                       maximum: 100
 *                       example: 85.0
 *               catatanRevisi:
 *                 type: string
 *                 description: Catatan revisi untuk mahasiswa
 *                 example: "Perbaiki format sitasi daftar pustaka"
 *     responses:
 *       200:
 *         description: Penilaian tugas akhir berhasil disimpan / diperbarui
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
 *                     nilai:
 *                       type: array
 *                     catatanRevisi:
 *                       type: string
 *                     sidangRegistrationId:
 *                       type: string
 *                     penilaiType:
 *                       type: string
 *                       enum: ["pembimbing", "penguji"]
 *                     dosenPenilai:
 *                       type: object
 *                     dosenKaprodi:
 *                       type: object
 *       400:
 *         description: Validasi error atau komponen belum lengkap
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Token tidak valid atau tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Akses ditolak atau dosen tidak terdaftar sebagai pembimbing/penguji
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Pendaftaran sidang atau Dosen tidak ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put(
  "/sidang-registration/:sidangRegistrationId",
  verifyToken,
  authorize("DOSEN"),
  validate(savePenilaianTugasAkhirSchema),
  savePenilaianTugasAkhir,
);

export default router;
