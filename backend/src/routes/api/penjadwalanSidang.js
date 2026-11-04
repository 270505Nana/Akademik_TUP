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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Keyword pencarian untuk nama mahasiswa, NIM, atau judul tugas akhir
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [newest, oldest]
 *           default: newest
 *         description: Sort option (newest atau oldest berdasarkan createdAt)
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
 *                       judulTugasAkhirIndonesia:
 *                         type: string
 *                         nullable: true
 *                       judulTugasAkhirInggris:
 *                         type: string
 *                         nullable: true
 *                       skemaSidang:
 *                         type: string
 *                         nullable: true
 *                       skemaSidangFinal:
 *                         type: string
 *                         nullable: true
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
 *                       isInfoPenjadwalanReaded:
 *                         type: boolean
 *                         description: Status baca info penjadwalan oleh mahasiswa
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
 *     description: Mengunci atau membuka status penguncian sidang. Status isLocked ditujukan khusus untuk membatasi dosen/Ketua KK agar tidak dapat mengubah penguji setelah dikunci.
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
 *     description: Menentukan dosen penguji secara massal. Dosen pembimbing tidak dapat menjadi dosen penguji. Tindakan dibatasi jika pendaftaran dikunci atau periode telah dipublikasikan.
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
 *         description: Validation error / Jadwal bentrok / Sidang terkunci / Penguji merangkap pembimbing
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
 *     description: Menentukan jadwal sidang secara massal oleh Admin. Admin tidak dibatasi oleh isLocked.
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
 *     description: Menentukan dosen penguji satu pendaftaran sidang oleh Ketua KK. Dosen pembimbing tidak dapat menjadi dosen penguji. Tindakan ditolak jika sidang terkunci atau telah dipublikasikan.
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
 *         description: Validation error / Sidang terkunci / Penguji merangkap pembimbing
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
 *     description: Menentukan jadwal sidang satu pendaftaran oleh Admin. Admin tidak dibatasi oleh isLocked.
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
 *         description: Validation error / Jadwal bentrok
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
 *     description: Menentukan dosen penguji dan jadwal sidang sekaligus oleh Admin. Admin tidak dibatasi oleh isLocked, namun dosen penguji tidak boleh sama dengan dosen pembimbing.
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
 *         description: Validation error / Jadwal bentrok / Penguji merangkap pembimbing
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
