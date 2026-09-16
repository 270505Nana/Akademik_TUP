import express from 'express';
const router = express.Router();
import { verifyToken } from '../../middlewares/auth.js';
import { isKetuaKK, isAdmin } from '../../middlewares/authorize.js';
import {
  listPenjadwalanSidang,
  setPengujiSidang,
  setJadwalSidang,
} from '../../controllers/penjadwalanSidangController.js';

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
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 */
router.get("/", verifyToken, listPenjadwalanSidang);

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
 *         description: Validation error
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied (Hanya dosen dengan status Ketua KK yang dapat mengakses)
 *       404:
 *         description: Sidang registration or dosen not found
 */
router.put("/:id/set-penguji", verifyToken, isKetuaKK, setPengujiSidang);

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
router.put("/:id/set-jadwal", verifyToken, isAdmin, setJadwalSidang);

export default router;
