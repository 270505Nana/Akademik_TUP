import express from 'express';
import {
  createSkemaPerhitungan,
  getSkemaPerhitungans,
  getSkemaPerhitunganById,
  updateSkemaPerhitungan,
  deleteSkemaPerhitungan,
} from '../../controllers/skemaPerhitunganController.js';
import { verifyToken } from '../../middlewares/auth.js';
import { isAdminOrKetuaKKOrKetuaProdi } from '../../middlewares/authorize.js';

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
 *       - $ref: '#/components/parameters/pageQueryParam'
 *       - $ref: '#/components/parameters/limitQueryParam'
 *     responses:
 *       200:
 *         description: Data retrieved successfully
 */
router.get("/", verifyToken, getSkemaPerhitungans);

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
 *         description: Created successfully
 *       403:
 *         description: Access denied (Admin, Ketua KK, atau Ketua Prodi)
 */
router.post("/", verifyToken, isAdminOrKetuaKKOrKetuaProdi, createSkemaPerhitungan);

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
 *     responses:
 *       200:
 *         description: Data retrieved successfully
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
 *         description: Updated successfully
 *       403:
 *         description: Access denied (Admin, Ketua KK, atau Ketua Prodi)
 */
router.put("/:id", verifyToken, isAdminOrKetuaKKOrKetuaProdi, updateSkemaPerhitungan);

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
 *     responses:
 *       200:
 *         description: Deleted successfully
 *       403:
 *         description: Access denied (Admin, Ketua KK, atau Ketua Prodi)
 */
router.delete("/:id", verifyToken, isAdminOrKetuaKKOrKetuaProdi, deleteSkemaPerhitungan);

export default router;