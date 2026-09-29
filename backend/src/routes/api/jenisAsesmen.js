import express from 'express';

const router = express.Router();

import {
  createJenisAsesmen,
  getJenisAsesmens,
  getJenisAsesmenById,
  updateJenisAsesmen,
  deleteJenisAsesmen,
} from '../../controllers/jenisAsesmenController.js';

import { verifyToken } from '../../middlewares/auth.js';
import { isAdmin } from '../../middlewares/authorize.js';

/**
 * @swagger
 * tags:
 *   name: Jenis Asesmen
 *   description: Jenis Asesmen CLO endpoints
 */

/**
 * @swagger
 * /api/jenis-asesmen:
 *   get:
 *     summary: Get all Jenis Asesmen data (with filter, sort, and pagination)
 *     tags: [Jenis Asesmen]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by content (deskripsi asesmen)
 *       - in: query
 *         name: cloProdiId
 *         schema:
 *           type: string
 *         description: Filter Jenis Asesmen by CLO Prodi ID
 *       - $ref: '#/components/parameters/pageQueryParam'
 *       - $ref: '#/components/parameters/limitQueryParam'
 *     responses:
 *       200:
 *         description: Jenis Asesmen data retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 */
router.get("/", verifyToken, getJenisAsesmens);

/**
 * @swagger
 * /api/jenis-asesmen:
 *   post:
 *     summary: Create new Jenis Asesmen
 *     tags: [Jenis Asesmen]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *               - bobot
 *               - cloProdiId
 *             properties:
 *               content:
 *                 type: string
 *                 example: Presentasi Hasil Penelitian secara Individu/Tim
 *               bobot:
 *                 type: number
 *                 format: float
 *                 example: 0.1
 *               cloProdiId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Jenis Asesmen created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied (Admin only)
 */
router.post("/", verifyToken, isAdmin, createJenisAsesmen); 

/**
 * @swagger
 * /api/jenis-asesmen/{id}:
 *   get:
 *     summary: Get Jenis Asesmen by ID
 *     tags: [Jenis Asesmen]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Jenis Asesmen UUID
 *     responses:
 *       200:
 *         description: Jenis Asesmen data retrieved successfully
 *       404:
 *         description: Jenis Asesmen not found
 */
router.get("/:id", verifyToken, getJenisAsesmenById);

/**
 * @swagger
 * /api/jenis-asesmen/{id}:
 *   put:
 *     summary: Update Jenis Asesmen
 *     tags: [Jenis Asesmen]
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
 *               content:
 *                 type: string
 *                 example: Penyusunan dan Penulisan Laporan Tugas Akhir
 *               bobot:
 *                 type: number
 *                 format: float
 *                 example: 0.2
 *     responses:
 *       200:
 *         description: Jenis Asesmen updated successfully
 *       404:
 *         description: Jenis Asesmen not found
 */
router.put("/:id", verifyToken, isAdmin, updateJenisAsesmen); 

/**
 * @swagger
 * /api/jenis-asesmen/{id}:
 *   delete:
 *     summary: Delete Jenis Asesmen (soft delete)
 *     tags: [Jenis Asesmen]
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
 *         description: Jenis Asesmen deleted successfully
 *       404:
 *         description: Jenis Asesmen not found
 */
router.delete("/:id", verifyToken, isAdmin, deleteJenisAsesmen); 

export default router;