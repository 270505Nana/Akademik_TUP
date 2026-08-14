import express from 'express';
const router = express.Router();

import {
  listBerkasMahasiswa,
  getBerkasMahasiswaById,
  createBerkasMahasiswa,
  deleteBerkasMahasiswa,
  downloadBerkasMahasiswa,
} from '../../controllers/berkasMahasiswaController.js';

import { verifyToken } from '../../middlewares/auth.js';
import { upload } from '../../middlewares/upload.js';

/**
 * @swagger
 * tags:
 *   name: Berkas Mahasiswa
 *   description: Management endpoints for unified student files (SKL, Transkrip, Dokumen Validasi Skta, Formulir Penerbitan Skta)
 */

/**
 * @swagger
 * /api/berkas-mahasiswa:
 *   get:
 *     summary: Retrieve list of Berkas Mahasiswa
 *     tags: [Berkas Mahasiswa]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter files by category (e.g. SKL, Transkrip, Dokumen Validasi Skta, Formulir Penerbitan Skta)
 *       - in: query
 *         name: mahasiswaId
 *         schema:
 *           type: string
 *         description: Filter files by student ID
 *     responses:
 *       200:
 *         description: List of files retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/", verifyToken, listBerkasMahasiswa);

/**
 * @swagger
 * /api/berkas-mahasiswa/{id}:
 *   get:
 *     summary: Get details of a student file by ID
 *     tags: [Berkas Mahasiswa]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Berkas Mahasiswa ID
 *     responses:
 *       200:
 *         description: File details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: File not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id", verifyToken, getBerkasMahasiswaById);

/**
 * @swagger
 * /api/berkas-mahasiswa:
 *   post:
 *     summary: Upload a new student file (SKL, Transkrip, Dokumen Validasi Skta, etc.)
 *     tags: [Berkas Mahasiswa]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *               - studentId
 *               - berkas
 *             properties:
 *               name:
 *                 type: string
 *                 example: Dokumen Validasi Kelayakan TA
 *               category:
 *                 type: string
 *                 example: Dokumen Validasi Skta
 *               studentId:
 *                 type: string
 *                 description: Target student ID (UUID)
 *               berkas:
 *                 type: string
 *                 format: binary
 *                 description: PDF file to upload
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Student not found
 *       500:
 *         description: Internal server error
 */
router.post(
  "/",
  verifyToken,
  upload("berkas-mahasiswa").single("berkas"),
  createBerkasMahasiswa
);

/**
 * @swagger
 * /api/berkas-mahasiswa/{id}:
 *   delete:
 *     summary: Delete a student file by ID
 *     tags: [Berkas Mahasiswa]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Berkas Mahasiswa ID
 *     responses:
 *       200:
 *         description: File deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: File not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", verifyToken, deleteBerkasMahasiswa);

/**
 * @swagger
 * /api/berkas-mahasiswa/download/{id}:
 *   get:
 *     summary: Download student file by ID
 *     tags: [Berkas Mahasiswa]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Berkas Mahasiswa ID
 *     responses:
 *       200:
 *         description: File streamed successfully
 *       404:
 *         description: File not found
 *       500:
 *         description: Internal server error
 */
router.get("/download/:id", downloadBerkasMahasiswa);

export default router;
