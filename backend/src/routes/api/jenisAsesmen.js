import express from "express";
import {
  createJenisAsesmen,
  getJenisAsesmens,
  getJenisAsesmenById,
  updateJenisAsesmen,
  deleteJenisAsesmen,
} from "../../controllers/jenisAsesmenController.js";
import { verifyToken } from "../../middlewares/auth.js";
import { isAdminOrKetuaKKOrKetuaProdi } from "../../middlewares/authorize.js";
import { validate } from "../../middlewares/validate.js";
import {
  listJenisAsesmenQuerySchema,
  createJenisAsesmenSchema,
  updateJenisAsesmenSchema,
} from "../../schemas/jenisAsesmenSchema.js";

const router = express.Router();

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
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [content, bobot, createdAt]
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
 *         description: Jenis Asesmen data retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token or access denied
 */
router.get(
  "/",
  verifyToken,
  validate(listJenisAsesmenQuerySchema, "query"),
  getJenisAsesmens
);

/**
 * @swagger
 * /api/jenis-asesmen:
 *   post:
 *     summary: Create new Jenis Asesmen (Admin, Ketua KK, atau Ketua Prodi)
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
 *         description: Jenis Asesmen created successfully (Admin / Ketua KK)
 *       202:
 *         description: Approval request submitted successfully (Ketua Prodi)
 *       400:
 *         description: Validation error
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied (Admin, Ketua KK, atau Ketua Prodi prodi sama)
 *       404:
 *         description: CLO tidak ditemukan
 */
router.post(
  "/",
  verifyToken,
  isAdminOrKetuaKKOrKetuaProdi,
  validate(createJenisAsesmenSchema),
  createJenisAsesmen
);

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
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied
 *       404:
 *         description: Jenis Asesmen tidak ditemukan
 */
router.get("/:id", verifyToken, getJenisAsesmenById);

/**
 * @swagger
 * /api/jenis-asesmen/{id}:
 *   put:
 *     summary: Update Jenis Asesmen (Admin, Ketua KK, atau Ketua Prodi)
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
 *         description: Jenis Asesmen updated successfully (Admin/Ketua KK) or existing request updated (Ketua Prodi)
 *       202:
 *         description: Approval request submitted successfully (Ketua Prodi)
 *       400:
 *         description: Validation error
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied
 *       404:
 *         description: Jenis Asesmen tidak ditemukan
 *       409:
 *         description: Pending approval request conflict
 */
router.put(
  "/:id",
  verifyToken,
  isAdminOrKetuaKKOrKetuaProdi,
  validate(updateJenisAsesmenSchema),
  updateJenisAsesmen
);

/**
 * @swagger
 * /api/jenis-asesmen/{id}:
 *   delete:
 *     summary: Delete Jenis Asesmen (soft delete) (Admin, Ketua KK, atau Ketua Prodi)
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
 *         description: Jenis Asesmen deleted successfully (Admin/Ketua KK) or existing request updated to delete (Ketua Prodi)
 *       202:
 *         description: Delete approval request submitted successfully (Ketua Prodi)
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied
 *       404:
 *         description: Jenis Asesmen tidak ditemukan
 *       409:
 *         description: Pending approval request conflict
 */
router.delete(
  "/:id",
  verifyToken,
  isAdminOrKetuaKKOrKetuaProdi,
  deleteJenisAsesmen
);

export default router;
