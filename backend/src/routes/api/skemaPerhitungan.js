import express from "express";
import {
  createSkemaPerhitungan,
  getSkemaPerhitungans,
  getSkemaPerhitunganById,
  updateSkemaPerhitungan,
  deleteSkemaPerhitungan,
} from "../../controllers/skemaPerhitunganController.js";
import { verifyToken } from "../../middlewares/auth.js";
import { isAdminOrKetuaKKOrKetuaProdi } from "../../middlewares/authorize.js";
import { validate } from "../../middlewares/validate.js";
import {
  listSkemaPerhitunganQuerySchema,
  createSkemaSchema,
  updateSkemaSchema,
} from "../../schemas/skemaPerhitunganSchema.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Skema Perhitungan Nilai Final
 *   description: Pengaturan Bobot Rata-rata Pembimbing (Ra) dan Penguji (Rb) Prodi
 */

/**
 * @swagger
 * /api/skema-perhitungan:
 *   get:
 *     summary: Get all Skema Perhitungan Nilai
 *     tags: [Skema Perhitungan Nilai Final]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: studyProgramId
 *         schema:
 *           type: string
 *         description: Filter by Study Program ID
 *       - in: query
 *         name: cloProdiId
 *         schema:
 *           type: string
 *         description: Filter by CLO ID
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [bobotRataRataPembimbing, bobotRataRataPenguji, createdAt]
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort direction
 *       - $ref: '#/components/parameters/pageQueryParam'
 *       - $ref: '#/components/parameters/limitQueryParam'
 *     responses:
 *       200:
 *         description: Data retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied
 */
router.get(
  "/",
  verifyToken,
  validate(listSkemaPerhitunganQuerySchema, "query"),
  getSkemaPerhitungans
);

/**
 * @swagger
 * /api/skema-perhitungan:
 *   post:
 *     summary: Create new Skema Perhitungan Nilai
 *     tags: [Skema Perhitungan Nilai Final]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bobotRataRataPembimbing
 *               - bobotRataRataPenguji
 *               - studyProgramId
 *               - cloProdiId
 *             properties:
 *               bobotRataRataPembimbing:
 *                 type: number
 *                 format: float
 *                 example: 0.6
 *               bobotRataRataPenguji:
 *                 type: number
 *                 format: float
 *                 example: 0.4
 *               studyProgramId:
 *                 type: string
 *               cloProdiId:
 *                 type: string
 *                 description: "ID CLO yang akan diatur bobot perhitungannya"
 *     responses:
 *       201:
 *         description: Skema Perhitungan Nilai berhasil dibuat
 *       202:
 *         description: Permohonan penambahan Skema Perhitungan berhasil diajukan dan sedang menunggu persetujuan
 *       400:
 *         description: Validation error
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied (Admin, Ketua KK, atau Ketua Prodi)
 *       404:
 *         description: CLO tidak ditemukan pada Program Studi ini
 *       409:
 *         description: Skema perhitungan untuk CLO ini sudah ada
 */
router.post(
  "/",
  verifyToken,
  isAdminOrKetuaKKOrKetuaProdi,
  validate(createSkemaSchema),
  createSkemaPerhitungan
);

/**
 * @swagger
 * /api/skema-perhitungan/{id}:
 *   get:
 *     summary: Get Skema Perhitungan Nilai by ID
 *     tags: [Skema Perhitungan Nilai Final]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Skema Perhitungan UUID
 *     responses:
 *       200:
 *         description: Data retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied
 *       404:
 *         description: Skema Perhitungan Nilai tidak ditemukan
 */
router.get("/:id", verifyToken, getSkemaPerhitunganById);

/**
 * @swagger
 * /api/skema-perhitungan/{id}:
 *   put:
 *     summary: Update Skema Perhitungan Nilai
 *     tags: [Skema Perhitungan Nilai Final]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Skema Perhitungan UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bobotRataRataPembimbing:
 *                 type: number
 *                 format: float
 *               bobotRataRataPenguji:
 *                 type: number
 *                 format: float
 *     responses:
 *       200:
 *         description: Skema Perhitungan Nilai berhasil diperbarui / Permohonan berhasil diajukan
 *       400:
 *         description: Validation error / Total kombinasi bobot harus 1
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied (Admin, Ketua KK, atau Ketua Prodi)
 *       404:
 *         description: Skema Perhitungan Nilai tidak ditemukan
 *       409:
 *         description: Data sedang dalam proses permohonan persetujuan oleh pengguna lain
 */
router.put(
  "/:id",
  verifyToken,
  isAdminOrKetuaKKOrKetuaProdi,
  validate(updateSkemaSchema),
  updateSkemaPerhitungan
);

/**
 * @swagger
 * /api/skema-perhitungan/{id}:
 *   delete:
 *     summary: Delete Skema Perhitungan Nilai
 *     tags: [Skema Perhitungan Nilai Final]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Skema Perhitungan UUID
 *     responses:
 *       200:
 *         description: Skema Perhitungan Nilai berhasil dihapus / Permohonan berhasil diajukan
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied (Admin, Ketua KK, atau Ketua Prodi)
 *       404:
 *         description: Skema Perhitungan Nilai tidak ditemukan
 *       409:
 *         description: Data sedang dalam proses permohonan persetujuan oleh pengguna lain
 */
router.delete(
  "/:id",
  verifyToken,
  isAdminOrKetuaKKOrKetuaProdi,
  deleteSkemaPerhitungan
);

export default router;
