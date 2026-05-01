const express = require("express");

const router = express.Router();

const {
  listTemplateUploads,
  createTemplateUpload,
  findTemplateUploadBySlug,
  updateTemplateUpload,
  deleteTemplateUpload,
  downloadTemplateUpload,
} = require("../../controllers/templateUploadController");

const { verifyToken } = require("../../middlewares/auth");
const { validate } = require("../../middlewares/validate");
const { upload } = require("../../middlewares/upload");

const {
  createTemplateUploadValidator,
  updateTemplateUploadValidator,
} = require("../../validators/templateUploadValidator");

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
 *               - slug
 *               - templateFile
 *             properties:
 *               name:
 *                 type: string
 *                 example: Template Surat TA
 *               slug:
 *                 type: string
 *                 example: formulir-penerbitan-skta
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
  upload("templates").single("templateFile"),
  createTemplateUploadValidator,
  validate,
  createTemplateUpload,
);

/**
 * @swagger
 * /api/templates/{slug}:
 *   get:
 *     summary: Get template upload by slug
 *     tags: [Template Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Template upload slug
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
router.get("/slug/:slug", verifyToken, findTemplateUploadBySlug);

/**
 * @swagger
 * /api/templates/{id}:
 *   put:
 *     summary: Update template upload by id
 *     tags: [Template Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Template upload ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - slug
 *             properties:
 *               name:
 *                 type: string
 *                 example: Template Surat TA Revisi
 *               slug:
 *                 type: string
 *                 example: formulir-penerbitan-skta-revisi
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
router.put(
  "/:id",
  verifyToken,
  upload("templates").single("templateFile"),
  updateTemplateUploadValidator,
  validate,
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
 *           type: integer
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
router.delete("/:id", verifyToken, deleteTemplateUpload);

module.exports = router;
