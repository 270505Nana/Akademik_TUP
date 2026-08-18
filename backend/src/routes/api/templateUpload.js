import express from 'express';

const router = express.Router();

import { 
  listTemplateUploads,
  createTemplateUpload,
  findTemplateUploadByCode,
  updateTemplateUpload,
  deleteTemplateUpload,
  downloadTemplateUpload,
  previewTemplateUpload, 
} from '../../controllers/templateUploadController.js';

import { verifyToken } from '../../middlewares/auth.js';
import { upload } from '../../middlewares/upload.js';
import { isAdmin } from '../../middlewares/authorize.js';

/**
 * @swagger
 * tags:
 *   name: Template Upload
 *   description: Template upload endpoints
 */

/**
 * @swagger
 * /api/templates:
 *   get:
 *     summary: Get all template uploads
 *     tags: [Template Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category (e.g. Yudisium, Sidang, etc.)
 *     responses:
 *       200:
 *         description: Template upload data retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       500:
 *         description: Internal server error
 */
router.get("/", verifyToken, listTemplateUploads);

/**
 * @swagger
 * /api/templates:
 *   post:
 *     summary: Create template upload
 *     tags: [Template Upload]
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
 *               - code
 *               - category
 *               - templateFile
 *             properties:
 *               name:
 *                 type: string
 *                 example: Template Surat TA
 *               code:
 *                 type: string
 *                 example: evidence-dosen-pembimbing
 *               category:
 *                 type: string
 *                 example: Kategori dokumen (Yudisium, Sidang, dll)
 *               isPublish:
 *                 type: boolean
 *               templateFile:
 *                 type: string
 *                 format: binary
 *                 description: Template file (pdf/doc/docx)
 *     responses:
 *       200:
 *         description: Template upload created successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       422:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
router.post(
  "/",
  verifyToken,
  isAdmin,
  upload("templates").single("templateFile"),
  createTemplateUpload,
);

/**
 * @swagger
 * /api/templates/{code}:
 *   get:
 *     summary: Get template upload by Code
 *     tags: [Template Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Template upload Code
 *     responses:
 *       200:
 *         description: Template upload data retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: Template upload not found
 *       500:
 *         description: Internal server error
 */
router.get("/:code", verifyToken, findTemplateUploadByCode);

/**
 * @swagger
 * /api/templates/download/{code}:
 *   get:
 *     summary: Download template
 *     tags: [Template Upload]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File downloaded successfully
 */
router.get("/download/:code", downloadTemplateUpload);

/**
 * @swagger
 * /api/templates/preview/{code}:
 *   get:
 *     summary: Preview template upload by code
 *     tags: [Template Upload]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Template upload preview retrieved successfully
 */
router.get("/preview/:code", previewTemplateUpload);

/**
 * @swagger
 * /api/templates/{id}:
 *   patch:
 *     summary: Update template upload by id
 *     tags: [Template Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Template upload ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Template Surat TA Revisi
 *               code:
 *                 type: string
 *                 example: evidence-dosen-pembimbing
 *               category:
 *                 type: string
 *                 example: Yudisium
 *               isPublish:
 *                 type: boolean
 *               templateFile:
 *                 type: string
 *                 format: binary
 *                 description: Optional template file (pdf/doc/docx)
 *     responses:
 *       200:
 *         description: Template upload updated successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: Template upload not found
 *       422:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
router.patch(
  "/:id",
  verifyToken,
  isAdmin,
  upload("templates").single("templateFile"),
  updateTemplateUpload,
);

/**
 * @swagger
 * /api/templates/{id}:
 *   delete:
 *     summary: Delete template upload by id
 *     tags: [Template Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Template upload ID
 *     responses:
 *       200:
 *         description: Template upload deleted successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: Template upload not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", verifyToken, isAdmin, deleteTemplateUpload);

export default router;
