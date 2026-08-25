import express from 'express';
const router = express.Router();

import { listTranskripUploads,
  getTranskripUploadById,
  createTranskripUpload,
  updateTranskripUpload,
  deleteTranskripUpload,
  downloadTranskripUpload, } from '../../controllers/transkripUploadController.js';

import { verifyToken } from '../../middlewares/auth.js';
import { upload } from '../../middlewares/upload.js';
import { isAdmin } from '../../middlewares/authorize.js';


/**
 * @swagger
 * tags:
 *   name: Transkrip Upload
 *   description: Transkrip upload and management endpoints
 */

/**
 * @swagger
 * /api/transkrip:
 *   get:
 *     summary: Retrieve list of transkrip uploads (paginated)
 *     tags: [Transkrip Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pageQueryParam'
 *       - $ref: '#/components/parameters/limitQueryParam'
 *     responses:
 *       200:
 *         description: List of transkrip uploads retrieved successfully with pagination
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
 *       500:
 *         description: Internal server error
 */
router.get("/", verifyToken, listTranskripUploads);

/**
 * @swagger
 * /api/transkrip/{id}:
 *   get:
 *     summary: Get details of an transkrip upload by ID
 *     tags: [Transkrip Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transkrip upload ID (UUID)
 *     responses:
 *       200:
 *         description: Transkrip upload details retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied or invalid token
 *       404:
 *         description: Transkrip upload not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id", verifyToken, getTranskripUploadById);

/**
 * @swagger
 * /api/transkrip:
 *   post:
 *     summary: Upload a new Transkrip
 *     tags: [Transkrip Upload]
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
 *               - mahasiswaId
 *               - transkripFile
 *             properties:
 *               name:
 *                 type: string
 *                 example: Transkrip Nilai Akademik
 *               mahasiswaId:
 *                 type: string
 *                 description: Required student ID (only academic staff can upload).
 *                 example: aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee
 *               transkripFile:
 *                 type: string
 *                 format: binary
 *                 description: PDF file containing the Transkrip
 *     responses:
 *       201:
 *         description: Transkrip uploaded successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token or Access denied (Admin only)
 *       404:
 *         description: Mahasiswa not found
 *       500:
 *         description: Internal server error
 */
router.post(
  "/",
  verifyToken,
  isAdmin,
  upload("transkrip").single("transkripFile"),
  createTranskripUpload,
);

/**
 * @swagger
 * /api/transkrip/{id}:
 *   patch:
 *     summary: Update an existing transkrip upload
 *     tags: [Transkrip Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transkrip upload ID (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Updated Transkrip Name
 *               mahasiswaId:
 *                 type: string
 *                 description: Target student ID if updating owner.
 *                 example: aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee
 *               transkripFile:
 *                 type: string
 *                 format: binary
 *                 description: PDF file containing the new transkrip to replace the old one
 *     responses:
 *       200:
 *         description: Transkrip updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied or invalid token (Admin only)
 *       404:
 *         description: Transkrip upload or Mahasiswa not found
 *       500:
 *         description: Internal server error
 */
router.patch(
  "/:id",
  verifyToken,
  isAdmin,
  upload("transkrip").single("transkripFile"),
  updateTranskripUpload,
);

/**
 * @swagger
 * /api/transkrip/{id}:
 *   delete:
 *     summary: Soft-delete an transkrip upload
 *     tags: [Transkrip Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transkrip upload ID (UUID)
 *     responses:
 *       200:
 *         description: Transkrip deleted successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied or invalid token (Admin only)
 *       404:
 *         description: Transkrip upload not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", verifyToken, isAdmin, deleteTranskripUpload);

/**
 * @swagger
 * /api/transkrip/uploads/:uploadId/download:
 *   get:
 *     summary: Download an transkrip upload file
 *     tags: [Transkrip Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uploadId
 *         required: true
 *         schema:
 *           type: string
 *         description: Transkrip upload ID (UUID)
 *     responses:
 *       200:
 *         description: File downloaded successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied or invalid token
 *       404:
 *         description: Transkrip upload file not found
 *       500:
 *         description: Internal server error
 */
router.get("/uploads/:uploadId/download", verifyToken, downloadTranskripUpload);

export default router;
