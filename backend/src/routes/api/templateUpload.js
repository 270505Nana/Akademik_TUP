import express from "express";
import {
  listTemplateUploads,
  createTemplateUpload,
  findTemplateUploadByCode,
  updateTemplateUpload,
  deleteTemplateUpload,
  downloadTemplateUpload,
  previewTemplateUpload,
  togglePublishTemplate,
  toggleRequiredTemplate,
} from "../../controllers/templateUploadController.js";
import { verifyToken } from "../../middlewares/auth.js";
import { upload } from "../../middlewares/upload.js";
import { authorize } from "../../middlewares/authorize.js";
import { validate } from "../../middlewares/validate.js";
import {
  listTemplateUploadQuerySchema,
  createTemplateUploadSchema,
  updateTemplateUploadSchema,
} from "../../schemas/templateUploadSchema.js";

const router = express.Router();

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
 *     summary: Get all template uploads (with filter, search, sort, and pagination)
 *     tags: [Template Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum:
 *             - Permohonan SKTA
 *             - Sidang - Berkas Wajib
 *             - Sidang - Berkas Tes Bahasa (Sudah)
 *             - Sidang - Berkas Tes Bahasa (Belum)
 *             - Sidang - Evidence Non Sidang Publikasi Jurnal
 *             - Sidang - Evidence Non Sidang Proceeding International
 *             - Sidang - Evidence Non Sidang HKI
 *             - Yudisium - Berkas Wajib
 *             - Yudisium - Evidence Cumlaude Publikasi Jurnal
 *             - Yudisium - Evidence Cumlaude Pameran
 *             - Yudisium - Evidence Cumlaude Lomba
 *             - Yudisium - Evidence Cumlaude HKI
 *             - Yudisium - Evidence Wirausaha
 *         description: Filter by category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search keyword by name or code
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [category, queue, name, createdAt, newest, oldest]
 *           default: category
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
 *         description: Template upload data retrieved successfully with pagination
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
router.get(
  "/",
  verifyToken,
  validate(listTemplateUploadQuerySchema, "query"),
  listTemplateUploads
);

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
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *                 example: Template Surat TA
 *               category:
 *                 type: string
 *                 enum:
 *                   - Permohonan SKTA
 *                   - Sidang - Berkas Wajib
 *                   - Sidang - Berkas Tes Bahasa (Sudah)
 *                   - Sidang - Berkas Tes Bahasa (Belum)
 *                   - Sidang - Evidence Non Sidang Publikasi Jurnal
 *                   - Sidang - Evidence Non Sidang Proceeding International
 *                   - Sidang - Evidence Non Sidang HKI
 *                   - Yudisium - Berkas Wajib
 *                   - Yudisium - Evidence Cumlaude Publikasi Jurnal
 *                   - Yudisium - Evidence Cumlaude Pameran
 *                   - Yudisium - Evidence Cumlaude Lomba
 *                   - Yudisium - Evidence Cumlaude HKI
 *                   - Yudisium - Evidence Wirausaha
 *                 example: Sidang - Berkas Wajib
 *               isPublish:
 *                 type: boolean
 *                 default: false
 *               isRequired:
 *                 type: boolean
 *                 default: true
 *               templateFile:
 *                 type: string
 *                 format: binary
 *                 description: Template file (pdf/doc/docx/zip)
 *     responses:
 *       200:
 *         description: Template upload created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied (Admin only)
 *       500:
 *         description: Internal server error
 */
router.post(
  "/",
  verifyToken,
  authorize("ADMIN"),
  upload("templates").single("templateFile"),
  validate(createTemplateUploadSchema),
  createTemplateUpload
);

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
 *         description: Template code
 *     responses:
 *       200:
 *         description: File downloaded successfully
 *       404:
 *         description: Template tidak ditemukan atau file belum diunggah
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
 *         description: Template code
 *     responses:
 *       200:
 *         description: Template upload preview retrieved successfully
 *       404:
 *         description: Template tidak ditemukan atau file belum diunggah
 */
router.get("/preview/:code", previewTemplateUpload);

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
 *               category:
 *                 type: string
 *                 enum:
 *                   - Permohonan SKTA
 *                   - Sidang - Berkas Wajib
 *                   - Sidang - Berkas Tes Bahasa (Sudah)
 *                   - Sidang - Berkas Tes Bahasa (Belum)
 *                   - Sidang - Evidence Non Sidang Publikasi Jurnal
 *                   - Sidang - Evidence Non Sidang Proceeding International
 *                   - Sidang - Evidence Non Sidang HKI
 *                   - Yudisium - Berkas Wajib
 *                   - Yudisium - Evidence Cumlaude Publikasi Jurnal
 *                   - Yudisium - Evidence Cumlaude Pameran
 *                   - Yudisium - Evidence Cumlaude Lomba
 *                   - Yudisium - Evidence Cumlaude HKI
 *                   - Yudisium - Evidence Wirausaha
 *                 example: Yudisium - Berkas Wajib
 *               isPublish:
 *                 type: boolean
 *               isRequired:
 *                 type: boolean
 *               queue:
 *                 type: integer
 *                 example: 1
 *                 description: Urutan dokumen
 *               templateFile:
 *                 type: string
 *                 format: binary
 *                 description: Optional template file (pdf/doc/docx/zip)
 *     responses:
 *       200:
 *         description: Template upload updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied (Admin only)
 *       404:
 *         description: Template upload not found
 *       500:
 *         description: Internal server error
 */
router.patch(
  "/:id",
  verifyToken,
  authorize("ADMIN"),
  upload("templates").single("templateFile"),
  validate(updateTemplateUploadSchema),
  updateTemplateUpload
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
 *         description: Access denied (Admin only)
 *       404:
 *         description: Template upload not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", verifyToken, authorize("ADMIN"), deleteTemplateUpload);

/**
 * @swagger
 * /api/templates/{id}/toggle-publish:
 *   patch:
 *     summary: Toggle publish status of a template upload
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
 *         description: Template publish status toggled successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied (Admin only)
 *       404:
 *         description: Template upload not found
 */
router.patch(
  "/:id/toggle-publish",
  verifyToken,
  authorize("ADMIN"),
  togglePublishTemplate
);

/**
 * @swagger
 * /api/templates/{id}/toggle-required:
 *   patch:
 *     summary: Toggle required status of a template upload
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
 *         description: Template required status toggled successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied (Admin only)
 *       404:
 *         description: Template upload not found
 */
router.patch(
  "/:id/toggle-required",
  verifyToken,
  authorize("ADMIN"),
  toggleRequiredTemplate
);

export default router;
