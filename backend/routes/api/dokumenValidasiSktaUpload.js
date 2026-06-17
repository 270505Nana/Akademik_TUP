const express = require("express");
const router = express.Router();

const {
  listDokumenValidasiSktaUploads,
  getDokumenValidasiSktaUploadById,
  createDokumenValidasiSktaUpload,
  updateDokumenValidasiSktaUpload,
  deleteDokumenValidasiSktaUpload,
  downloadDokumenValidasiSktaUpload,
} = require("../../controllers/dokumenValidasiSktaUploadController");

const { verifyToken } = require("../../middlewares/auth");
const { validate } = require("../../middlewares/validate");
const { upload } = require("../../middlewares/upload");
const { isAcademicStaff } = require("../../middlewares/authorize");

const {
  createDokumenValidasiSktaUploadValidator,
  updateDokumenValidasiSktaUploadValidator,
} = require("../../validators/dokumenValidasiSktaUploadValidator");

/**
 * @swagger
 * tags:
 *   name: Dokumen Validasi SKTA
 *   description: Dokumen Validasi SKTA upload and management endpoints
 */

/**
 * @swagger
 * /api/dokumen-validasi-skta:
 *   get:
 *     summary: Retrieve list of Dokumen Validasi SKTA uploads
 *     tags: [Dokumen Validasi SKTA]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of uploads retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       500:
 *         description: Internal server error
 */
router.get("/", verifyToken, listDokumenValidasiSktaUploads);

/**
 * @swagger
 * /api/dokumen-validasi-skta/{id}:
 *   get:
 *     summary: Get details of a Dokumen Validasi SKTA upload by ID
 *     tags: [Dokumen Validasi SKTA]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Dokumen Validasi SKTA upload ID (UUID)
 *     responses:
 *       200:
 *         description: Upload details retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied or invalid token
 *       404:
 *         description: Document not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id", verifyToken, getDokumenValidasiSktaUploadById);

/**
 * @swagger
 * /api/dokumen-validasi-skta:
 *   post:
 *     summary: Upload a new Dokumen Validasi SKTA
 *     tags: [Dokumen Validasi SKTA]
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
 *               - studentId
 *               - dokumenFile
 *             properties:
 *               name:
 *                 type: string
 *                 example: Dokumen Validasi Kelayakan TA
 *               studentId:
 *                 type: integer
 *                 description: Target student ID (only academic staff can upload)
 *                 example: 1
 *               dokumenFile:
 *                 type: string
 *                 format: binary
 *                 description: PDF file containing the validation document
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied (Academic Staff only)
 *       404:
 *         description: Student not found
 *       500:
 *         description: Internal server error
 */
router.post(
  "/",
  verifyToken,
  isAcademicStaff,
  upload("dokumen-validasi").single("dokumenFile"),
  createDokumenValidasiSktaUploadValidator,
  validate,
  createDokumenValidasiSktaUpload,
);

/**
 * @swagger
 * /api/dokumen-validasi-skta/{id}:
 *   patch:
 *     summary: Update an existing Dokumen Validasi SKTA upload
 *     tags: [Dokumen Validasi SKTA]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Dokumen Validasi SKTA upload ID (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Updated Document Name
 *               studentId:
 *                 type: integer
 *                 description: Target student ID if updating ownership
 *                 example: 1
 *               dokumenFile:
 *                 type: string
 *                 format: binary
 *                 description: PDF file containing the new document to replace the old one
 *     responses:
 *       200:
 *         description: Document updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied (Academic Staff only)
 *       404:
 *         description: Document or Student not found
 *       500:
 *         description: Internal server error
 */
router.patch(
  "/:id",
  verifyToken,
  isAcademicStaff,
  upload("dokumen-validasi").single("dokumenFile"),
  updateDokumenValidasiSktaUploadValidator,
  validate,
  updateDokumenValidasiSktaUpload,
);

/**
 * @swagger
 * /api/dokumen-validasi-skta/{id}:
 *   delete:
 *     summary: Soft-delete a Dokumen Validasi SKTA upload
 *     tags: [Dokumen Validasi SKTA]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Dokumen Validasi SKTA upload ID (UUID)
 *     responses:
 *       200:
 *         description: Document deleted successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied (Academic Staff only)
 *       404:
 *         description: Document not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", verifyToken, isAcademicStaff, deleteDokumenValidasiSktaUpload);

/**
 * @swagger
 * /api/dokumen-validasi-skta/uploads/{uploadId}/download:
 *   get:
 *     summary: Download a Dokumen Validasi SKTA upload file
 *     tags: [Dokumen Validasi SKTA]
 *     parameters:
 *       - in: path
 *         name: uploadId
 *         required: true
 *         schema:
 *           type: string
 *         description: Dokumen Validasi SKTA upload ID (UUID)
 *     responses:
 *       200:
 *         description: File downloaded successfully
 *       404:
 *         description: File not found
 *       500:
 *         description: Internal server error
 */
router.get("/uploads/:uploadId/download", downloadDokumenValidasiSktaUpload);

module.exports = router;
