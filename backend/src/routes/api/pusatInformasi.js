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
import { validate } from "../../middlewares/validate.js";
import {
  listPusatInformasiQuerySchema,
  createPusatInformasiSchema,
  updatePusatInformasiSchema,
} from "../../schemas/pusatInformasiSchema.js";

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
 *           enum: [createdAt, name, category, queue, newest, oldest]
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort direction
 *       - $ref: '#/components/parameters/pageQueryParam'
 *       - $ref: '#/components/parameters/limitQueryParam'
 *     responses:
 *       200:
 *         description: Pusat informasi data retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 */
router.get(
  "/",
  verifyToken,
  validate(listPusatInformasiQuerySchema, "query"),
  listPusatInformasi
);

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
 *                 example: true
 *               showInPreview:
 *                 type: boolean
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
router.post(
  "/",
  verifyToken,
  isAdmin,
  validate(createPusatInformasiSchema),
  createPusatInformasi
);

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
 *               showInPreview:
 *                 type: boolean
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
router.put(
  "/:id",
  verifyToken,
  isAdmin,
  validate(updatePusatInformasiSchema),
  updatePusatInformasi
);

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
