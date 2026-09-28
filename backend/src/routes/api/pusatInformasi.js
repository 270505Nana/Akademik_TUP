import express from "express";
import {
  getPusatInformasiPreview,
  getPusatInformasiPublic,
  listPusatInformasi,
  getPusatInformasiById,
  createPusatInformasi,
  updatePusatInformasi,
  deletePusatInformasi,
} from "../../controllers/pusatInformasiController.js";
import { verifyToken } from "../../middlewares/auth.js";
import { isAdmin } from "../../middlewares/authorize.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Pusat Informasi
 *   description: Pusat Informasi endpoints for public and general academic information
 */

/**
 * @swagger
 * /api/pusat-informasi/preview:
 *   get:
 *     summary: Get nearest sidang, yudisium periods preview and DokumenPanduanTugasAkhir (Public)
 *     tags: [Pusat Informasi]
 *     responses:
 *       200:
 *         description: Preview period and guidance documents retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 periodeSidang:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: Sidang Periode Ganjil 2026/2027
 *                     category:
 *                       type: string
 *                       example: pendaftaran sidang
 *                     period:
 *                       type: string
 *                       example: 2026/2027
 *                     startDate:
 *                       type: string
 *                       format: date-time
 *                       example: 2026-05-15T00:00:00.000Z
 *                     endDate:
 *                       type: string
 *                       format: date-time
 *                       example: 2026-06-15T00:00:00.000Z
 *                 periodeYudisium:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: Yudisium Periode Ganjil 2026/2027
 *                     category:
 *                       type: string
 *                       example: pendaftaran yudisium
 *                     period:
 *                       type: string
 *                       example: 2026/2027
 *                     startDate:
 *                       type: string
 *                       format: date-time
 *                       example: 2026-06-01T00:00:00.000Z
 *                     endDate:
 *                       type: string
 *                       format: date-time
 *                       example: 2026-07-01T00:00:00.000Z
 *                 dokumenPanduanTugasAkhir:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       category:
 *                         type: string
 *                         example: Panduan Tugas Akhir
 *                       data:
 *                         type: array
 *                         items:
 *                           type: object
 */
router.get("/preview", getPusatInformasiPreview);

/**
 * @swagger
 * /api/pusat-informasi/public:
 *   get:
 *     summary: Get all published pusat informasi grouped by category and sorted by queue (Public)
 *     tags: [Pusat Informasi]
 *     responses:
 *       200:
 *         description: Published pusat informasi list grouped by category retrieved successfully
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
 *                       category:
 *                         type: string
 *                       data:
 *                         type: array
 *                         items:
 *                           type: object
 */
router.get("/public", getPusatInformasiPublic);

/**
 * @swagger
 * /api/pusat-informasi:
 *   get:
 *     summary: Get all pusat informasi (with search, category filter, sort, and pagination)
 *     tags: [Pusat Informasi]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, description, or category
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [newest, oldest]
 *         description: Sort pusat informasi by creation time (default newest)
 *       - $ref: '#/components/parameters/pageQueryParam'
 *       - $ref: '#/components/parameters/limitQueryParam'
 *     responses:
 *       200:
 *         description: Pusat informasi data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 */
router.get("/", verifyToken, listPusatInformasi);

/**
 * @swagger
 * /api/pusat-informasi/{id}:
 *   get:
 *     summary: Get pusat informasi detail by ID
 *     tags: [Pusat Informasi]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Pusat informasi UUID
 *     responses:
 *       200:
 *         description: Pusat informasi detail retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                     updatedAt:
 *                       type: string
 *                     category:
 *                       type: string
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     icon:
 *                       type: string
 *                     url:
 *                       type: string
 *                     isPublish:
 *                       type: boolean
 *                       nullable: true
 *                     showInPreview:
 *                       type: string
 *                       nullable: true
 *                     queue:
 *                       type: integer
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: Pusat informasi not found
 */
router.get("/:id", verifyToken, getPusatInformasiById);

/**
 * @swagger
 * /api/pusat-informasi:
 *   post:
 *     summary: Create new pusat informasi
 *     tags: [Pusat Informasi]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - category
 *               - name
 *               - url
 *             properties:
 *               category:
 *                 type: string
 *                 example: Panduan Tugas Akhir
 *               name:
 *                 type: string
 *                 example: Panduan Pengajuan SKTA
 *               description:
 *                 type: string
 *                 example: Dokumen panduan mengenai tata cara pengajuan SKTA
 *               icon:
 *                 type: string
 *                 example: document-text
 *               url:
 *                 type: string
 *                 example: https://drive.google.com/example-file
 *               isPublish:
 *                 type: boolean
 *                 nullable: true
 *                 example: true
 *               showInPreview:
 *                 type: boolean
 *                 nullable: true
 *                 example: true
 *     responses:
 *       201:
 *         description: Pusat informasi created successfully
 *       400:
 *         description: Validation error or duplicate code
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied (Admin only)
 */
router.post("/", verifyToken, isAdmin, createPusatInformasi);

/**
 * @swagger
 * /api/pusat-informasi/{id}:
 *   put:
 *     summary: Update pusat informasi by ID
 *     tags: [Pusat Informasi]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Pusat informasi UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               category:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               icon:
 *                 type: string
 *               url:
 *                 type: string
 *               isPublish:
 *                 type: boolean
 *                 nullable: true
 *               showInPreview:
 *                 type: boolean
 *                 nullable: true
 *               queue:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Pusat informasi updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied (Admin only)
 *       404:
 *         description: Pusat informasi not found
 */
router.put("/:id", verifyToken, isAdmin, updatePusatInformasi);

/**
 * @swagger
 * /api/pusat-informasi/{id}:
 *   delete:
 *     summary: Delete pusat informasi permanently by ID
 *     tags: [Pusat Informasi]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Pusat informasi UUID
 *     responses:
 *       200:
 *         description: Pusat informasi deleted successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied (Admin only)
 *       404:
 *         description: Pusat informasi not found
 */
router.delete("/:id", verifyToken, isAdmin, deletePusatInformasi);

export default router;
