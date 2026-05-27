const express = require("express");
const router = express.Router();

const {
  listTranskripUploads,
  getTranskripUploadById,
  createTranskripUpload,
  updateTranskripUpload,
  deleteTranskripUpload,
  downloadTranskripUpload,
} = require("../../controllers/transkripUploadController");

const { verifyToken } = require("../../middlewares/auth");
const { validate } = require("../../middlewares/validate");
const { upload } = require("../../middlewares/upload");
const { isAcademicStaff } = require("../../middlewares/authorize");

const {
  createTranskripUploadValidator,
  updateTranskripUploadValidator,
} = require("../../validators/transkripUploadValidator");

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
 *     summary: Retrieve list of transkrip uploads
 *     tags: [Transkrip Upload]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of transkrip uploads retrieved successfully
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
 *           type: integer
 *         description: Transkrip upload ID
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
 *               - studentId
 *               - transkripFile
 *             properties:
 *               name:
 *                 type: string
 *                 example: Transkrip Nilai Akademik
 *               studentId:
 *                 type: integer
 *                 description: Required student ID (only academic staff can upload).
 *                 example: 1
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
 *         description: Invalid token or Access denied (Academic Staff only)
 *       404:
 *         description: Student not found
 *       500:
 *         description: Internal server error
 */
router.post(
  "/",
  verifyToken,
  isAcademicStaff,
  upload("transkrip").single("transkripFile"),
  createTranskripUploadValidator,
  validate,
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
 *           type: integer
 *         description: Transkrip upload ID
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
 *               studentId:
 *                 type: integer
 *                 description: Target student ID if updating owner.
 *                 example: 1
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
 *         description: Access denied or invalid token (Academic Staff only)
 *       404:
 *         description: Transkrip upload or Student not found
 *       500:
 *         description: Internal server error
 */
router.patch(
  "/:id",
  verifyToken,
  isAcademicStaff,
  upload("transkrip").single("transkripFile"),
  updateTranskripUploadValidator,
  validate,
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
 *           type: integer
 *         description: Transkrip upload ID
 *     responses:
 *       200:
 *         description: Transkrip deleted successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied or invalid token (Academic Staff only)
 *       404:
 *         description: Transkrip upload not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", verifyToken, isAcademicStaff, deleteTranskripUpload);

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
 *           type: integer
 *         description: Transkrip upload ID
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

module.exports = router;
