import express from "express";
import { verifyToken } from "../../middlewares/auth.js";
import { authorize } from "../../middlewares/authorize.js";
import { validate } from "../../middlewares/validate.js";
import {
  setPengujiSidangSchema,
  batchSetPengujiSidangSchema,
  setJadwalSidangSchema,
  batchSetJadwalSidangSchema,
  setPengujiJadwalSidangSchema,
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
} from "../../controllers/penjadwalanSidangController.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Penjadwalan Sidang
 *   description: Penjadwalan sidang endpoints
 */

/**
 * @swagger
 * /api/penjadwalan-sidang:
 *   get:
 *     summary: Get all penjadwalan sidang (paginated)
 *     tags: [Penjadwalan Sidang]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sidangPeriodId
 *         schema:
 *           type: string
 *         description: ID Periode Sidang. Jika dikosongkan, otomatis memfilter data pada periode sidang yang saat ini aktif.
 *       - $ref: '#/components/parameters/pageQueryParam'
 *       - $ref: '#/components/parameters/limitQueryParam'
 *     responses:
 *       200:
 *         description: Penjadwalan sidang data retrieved successfully with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                       mahasiswa:
 *                         type: object
 *                       dosenPembimbing1:
 *                         type: object
 *                       dosenPembimbing2:
 *                         type: object
 *                       dosenPenguji1:
 *                         type: object
 *                       dosenPenguji2:
 *                         type: object
 *                       tglSidang:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       ruanganSidang:
 *                         type: object
 *                         nullable: true
 *                       isLocked:
 *                         type: boolean
 *                         description: Lock status to prevent examiners changes by dosen
 *                       isPublished:
 *                         type: boolean
 *                         description: Publish status of sidang schedule to mahasiswa
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied (Hanya Admin dan Dosen Ketua KK yang dapat mengakses)
 */
router.get("/", verifyToken, authorize("ADMIN", "DOSEN_KETUAKK"), listPenjadwalanSidang);

/**
 * @swagger
 * /api/penjadwalan-sidang/{id}/toggle-lock:
 *   patch:
 *     summary: Toggle lock status of sidang registration (Admin only)
 *     tags: [Penjadwalan Sidang]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sidang registration ID (UUID)
 *     responses:
 *       200:
 *         description: Status kunci pendaftaran sidang berhasil diperbarui
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied (Hanya admin yang dapat mengakses)
 *       404:
 *         description: Sidang registration not found
 */
router.patch(
  "/:id/toggle-lock",
  verifyToken,
  authorize("ADMIN"),
  toggleLockSidangRegistration,
);

/**
 * @swagger
 * /api/penjadwalan-sidang/period/{sidangPeriodId}/toggle-publish:
 *   patch:
 *     summary: Toggle publish status of sidang period to mahasiswa (Admin only)
 *     description: Mempublikasikan atau membatalkan publikasi seluruh jadwal sidang pada periode tertentu kepada mahasiswa.
 *     tags: [Penjadwalan Sidang]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sidangPeriodId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID Periode Sidang (UUID)
 *     responses:
 *       200:
 *         description: Status publikasi jadwal sidang untuk periode ini berhasil diperbarui
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied (Hanya admin yang dapat mengakses)
 *       404:
 *         description: Periode sidang tidak ditemukan
 */
router.patch(
  "/period/:sidangPeriodId/toggle-publish",
  verifyToken,
  authorize("ADMIN"),
  togglePublishSidangPeriod,
);



/**
 * @swagger
 * /api/penjadwalan-sidang/{id}/toggle-read-info-penjadwalan:
 *   patch:
 *     summary: Tandai info penjadwalan sidang telah dibaca (Mahasiswa only)
 *     description: Digunakan oleh mahasiswa untuk menandai bahwa ia telah membaca info penjadwalan sidang terbaru (hanya satu arah, membuat isInfoPenjadwalanReaded menjadi true).
 *     tags: [Penjadwalan Sidang]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sidang registration ID (UUID)
 *     responses:
 *       200:
 *         description: Info penjadwalan sidang berhasil ditandai sudah dibaca
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Info penjadwalan sidang berhasil ditandai sudah dibaca
 *                 data:
 *                   type: object
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied (Hanya mahasiswa pemilik pendaftaran yang dapat mengakses)
 *       404:
 *         description: Sidang registration not found atau jadwal belum dipublikasikan
 */
router.patch(
  "/:id/toggle-read-info-penjadwalan",
  verifyToken,
  authorize("MAHASISWA"),
  toggleReadInfoPenjadwalan,
);

/**
 * @swagger
 * /api/penjadwalan-sidang/export:
 *   get:
 *     summary: Export data jadwal sidang
 *     tags: [Penjadwalan Sidang]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sidangPeriodId
 *         schema:
 *           type: string
 *         description: ID Periode Sidang. Jika dikosongkan, otomatis mengekspor jadwal pada periode sidang yang saat ini aktif.
 *     responses:
 *       200:
 *         description: Berhasil mengunduh file Excel format iGracias
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied (Hanya Admin dan Dosen Ketua KK yang dapat mengakses)
 */
router.get("/export", verifyToken, authorize("ADMIN", "DOSEN_KETUAKK"), exportJadwalSidang);

/**
 * @swagger
 * /api/penjadwalan-sidang/set-penguji/batch:
 *   put:
 *     summary: Set dosen penguji sidang batch (Ketua KK only)
 *     tags: [Penjadwalan Sidang]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               required:
 *                 - id
 *                 - dosenPenguji1Id
 *                 - dosenPenguji2Id
 *               properties:
 *                 id:
 *                   type: string
 *                   description: Sidang registration ID (UUID)
 *                 dosenPenguji1Id:
 *                   type: string
 *                   description: ID dosen penguji 1 (UUID)
 *                 dosenPenguji2Id:
 *                   type: string
 *                   description: ID dosen penguji 2 (UUID)
 *     responses:
 *       200:
 *         description: Dosen penguji sidang batch berhasil ditentukan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Validation error / Jadwal bentrok / Sidang terkunci
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied (Hanya dosen dengan status Ketua KK yang dapat mengakses)
 *       404:
 *         description: Sidang registration or dosen not found
 */
router.put(
  "/set-penguji/batch",
  verifyToken,
  authorize("DOSEN_KETUAKK"),
  validate(batchSetPengujiSidangSchema),
  batchSetPengujiSidang,
);

/**
 * @swagger
 * /api/penjadwalan-sidang/set-jadwal/batch:
 *   put:
 *     summary: Set jadwal sidang batch (Admin only)
 *     tags: [Penjadwalan Sidang]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               required:
 *                 - id
 *                 - tglSidang
 *                 - ruanganSidangId
 *               properties:
 *                 id:
 *                   type: string
 *                   description: Sidang registration ID (UUID)
 *                 tglSidang:
 *                   type: string
 *                   format: date-time
 *                   description: Tanggal dan waktu pelaksanaan sidang (ISO 8601)
 *                 ruanganSidangId:
 *                   type: string
 *                   description: ID ruangan sidang (UUID)
 *     responses:
 *       200:
 *         description: Jadwal sidang batch berhasil ditentukan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Validation error / Jadwal bentrok
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied (Hanya admin yang dapat mengakses)
 *       404:
 *         description: Sidang registration or ruangan not found
 */
router.put(
  "/set-jadwal/batch",
  verifyToken,
  authorize("ADMIN"),
  validate(batchSetJadwalSidangSchema),
  batchSetJadwalSidang,
);

/**
 * @swagger
 * /api/penjadwalan-sidang/{id}/set-penguji:
 *   put:
 *     summary: Set dosen penguji sidang (Ketua KK only)
 *     tags: [Penjadwalan Sidang]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sidang registration ID (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dosenPenguji1Id
 *               - dosenPenguji2Id
 *             properties:
 *               dosenPenguji1Id:
 *                 type: string
 *                 description: ID dosen penguji 1 (UUID)
 *               dosenPenguji2Id:
 *                 type: string
 *                 description: ID dosen penguji 2 (UUID)
 *     responses:
 *       200:
 *         description: Dosen penguji sidang berhasil ditentukan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Validation error / Sidang terkunci
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied (Hanya dosen dengan status Ketua KK yang dapat mengakses)
 *       404:
 *         description: Sidang registration or dosen not found
 */
router.put(
  "/:id/set-penguji",
  verifyToken,
  authorize("DOSEN_KETUAKK"),
  validate(setPengujiSidangSchema),
  setPengujiSidang,
);

/**
 * @swagger
 * /api/penjadwalan-sidang/{id}/set-jadwal:
 *   put:
 *     summary: Set jadwal sidang (Admin only)
 *     tags: [Penjadwalan Sidang]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sidang registration ID (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tglSidang
 *               - ruanganSidangId
 *             properties:
 *               tglSidang:
 *                 type: string
 *                 format: date-time
 *                 description: Tanggal dan waktu pelaksanaan sidang (ISO 8601)
 *               ruanganSidangId:
 *                 type: string
 *                 description: ID ruangan sidang (UUID)
 *     responses:
 *       200:
 *         description: Jadwal sidang berhasil ditentukan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Validation error
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied (Hanya admin yang dapat mengakses)
 *       404:
 *         description: Sidang registration or ruangan not found
 */
router.put(
  "/:id/set-jadwal",
  verifyToken,
  authorize("ADMIN"),
  validate(setJadwalSidangSchema),
  setJadwalSidang,
);

/**
 * @swagger
 * /api/penjadwalan-sidang/{id}/set-penguji-jadwal:
 *   put:
 *     summary: Set dosen penguji dan jadwal sidang sekaligus (Admin only)
 *     tags: [Penjadwalan Sidang]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sidang registration ID (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dosenPenguji1Id
 *               - dosenPenguji2Id
 *               - tglSidang
 *               - ruanganSidangId
 *             properties:
 *               dosenPenguji1Id:
 *                 type: string
 *                 description: ID dosen penguji 1 (UUID)
 *               dosenPenguji2Id:
 *                 type: string
 *                 description: ID dosen penguji 2 (UUID)
 *               tglSidang:
 *                 type: string
 *                 format: date-time
 *                 description: Tanggal dan waktu pelaksanaan sidang (ISO 8601)
 *               ruanganSidangId:
 *                 type: string
 *                 description: ID ruangan sidang (UUID)
 *     responses:
 *       200:
 *         description: Dosen penguji dan jadwal sidang berhasil ditentukan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Validation error / Jadwal bentrok
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied (Hanya admin yang dapat mengakses)
 *       404:
 *         description: Sidang registration, dosen, atau ruangan not found
 */
router.put(
  "/:id/set-penguji-jadwal",
  verifyToken,
  authorize("ADMIN"),
  validate(setPengujiJadwalSidangSchema),
  setPengujiJadwalSidang,
);

export default router;
