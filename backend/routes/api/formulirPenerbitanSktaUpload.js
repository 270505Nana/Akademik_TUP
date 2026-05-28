const express = require("express");
const router = express.Router();

const {
  listFormulirPenerbitanSktaUploads,
  getFormulirPenerbitanSktaUploadById,
  createFormulirPenerbitanSktaUpload,
  updateFormulirPenerbitanSktaUpload,
  deleteFormulirPenerbitanSktaUpload,
  downloadFormulirPenerbitanSktaUpload,
} = require("../../controllers/formulirPenerbitanSktaUploadController");

const { verifyToken } = require("../../middlewares/auth");
const { validate } = require("../../middlewares/validate");
const { upload } = require("../../middlewares/upload");
const { isAcademicStaff } = require("../../middlewares/authorize");

const {
  createFormulirPenerbitanSktaUploadValidator,
  updateFormulirPenerbitanSktaUploadValidator,
} = require("../../validators/formulirPenerbitanSktaUploadValidator");

/**
 * @swagger
 * tags:
 *   name: Formulir Penerbitan SKTA
 *   description: Formulir Penerbitan SKTA upload and management endpoints
 */

/**
 * @swagger
 * /api/formulir-penerbitan-skta:
 *   get:
 *     summary: Retrieve list of Formulir Penerbitan SKTA uploads
 *     tags: [Formulir Penerbitan SKTA]
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
router.get("/", verifyToken, listFormulirPenerbitanSktaUploads);

/**
 * @swagger
 * /api/formulir-penerbitan-skta/{id}:
 *   get:
 *     summary: Get details of a Formulir Penerbitan SKTA upload by ID
 *     tags: [Formulir Penerbitan SKTA]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Formulir Penerbitan SKTA upload ID (UUID)
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
router.get("/:id", verifyToken, getFormulirPenerbitanSktaUploadById);

/**
 * @swagger
 * /api/formulir-penerbitan-skta:
 *   post:
 *     summary: Upload a new Formulir Penerbitan SKTA
 *     tags: [Formulir Penerbitan SKTA]
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
 *               - formulirFile
 *             properties:
 *               name:
 *                 type: string
 *                 example: Formulir Penerbitan SKTA Resmi
 *               studentId:
 *                 type: integer
 *                 description: Target student ID (only academic staff can upload)
 *                 example: 1
 *               formulirFile:
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
  upload("formulir-penerbitan").single("formulirFile"),
  createFormulirPenerbitanSktaUploadValidator,
  validate,
  createFormulirPenerbitanSktaUpload,
);

/**
 * @swagger
 * /api/formulir-penerbitan-skta/{id}:
 *   patch:
 *     summary: Update an existing Formulir Penerbitan SKTA upload
 *     tags: [Formulir Penerbitan SKTA]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Formulir Penerbitan SKTA upload ID (UUID)
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
 *               formulirFile:
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
  upload("formulir-penerbitan").single("formulirFile"),
  updateFormulirPenerbitanSktaUploadValidator,
  validate,
  updateFormulirPenerbitanSktaUpload,
);

/**
 * @swagger
 * /api/formulir-penerbitan-skta/{id}:
 *   delete:
 *     summary: Soft-delete a Formulir Penerbitan SKTA upload
 *     tags: [Formulir Penerbitan SKTA]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Formulir Penerbitan SKTA upload ID (UUID)
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
router.delete("/:id", verifyToken, isAcademicStaff, deleteFormulirPenerbitanSktaUpload);

/**
 * @swagger
 * /api/formulir-penerbitan-skta/uploads/{uploadId}/download:
 *   get:
 *     summary: Download a Formulir Penerbitan SKTA upload file
 *     tags: [Formulir Penerbitan SKTA]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uploadId
 *         required: true
 *         schema:
 *           type: string
 *         description: Formulir Penerbitan SKTA upload ID (UUID)
 *     responses:
 *       200:
 *         description: File downloaded successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied or invalid token
 *       404:
 *         description: File not found
 *       500:
 *         description: Internal server error
 */
router.get("/uploads/:uploadId/download", verifyToken, downloadFormulirPenerbitanSktaUpload);

module.exports = router;
