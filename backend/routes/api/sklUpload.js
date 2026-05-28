const express = require("express");
const router = express.Router();

const {
  listSklUploads,
  getSklUploadById,
  createSklUpload,
  updateSklUpload,
  deleteSklUpload,
  downloadSklUpload,
} = require("../../controllers/sklUploadController");

const { verifyToken } = require("../../middlewares/auth");
const { validate } = require("../../middlewares/validate");
const { upload } = require("../../middlewares/upload");
const { isAcademicStaff } = require("../../middlewares/authorize");

const {
  createSklUploadValidator,
  updateSklUploadValidator,
} = require("../../validators/sklUploadValidator");

/**
 * @swagger
 * tags:
 *   name: SKL Upload
 *   description: SKL upload and management endpoints
 */

/**
 * @swagger
 * /api/skl:
 *   get:
 *     summary: Retrieve list of SKL uploads
 *     tags: [SKL Upload]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of SKL uploads retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       500:
 *         description: Internal server error
 */
router.get("/", verifyToken, listSklUploads);

/**
 * @swagger
 * /api/skl/{id}:
 *   get:
 *     summary: Get details of an SKL upload by ID
 *     tags: [SKL Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: SKL upload ID
 *     responses:
 *       200:
 *         description: SKL upload details retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied or invalid token
 *       404:
 *         description: SKL upload not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id", verifyToken, getSklUploadById);

/**
 * @swagger
 * /api/skl:
 *   post:
 *     summary: Upload a new SKL
 *     tags: [SKL Upload]
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
 *               - sklFile
 *             properties:
 *               name:
 *                 type: string
 *                 example: Surat Keterangan Lulus (SKL)
 *               studentId:
 *                 type: integer
 *                 description: Required student ID (only academic staff can upload).
 *                 example: 1
 *               sklFile:
 *                 type: string
 *                 format: binary
 *                 description: PDF file containing the SKL
 *     responses:
 *       201:
 *         description: SKL uploaded successfully
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
  upload("skl").single("sklFile"),
  createSklUploadValidator,
  validate,
  createSklUpload,
);

/**
 * @swagger
 * /api/skl/{id}:
 *   patch:
 *     summary: Update an existing SKL upload
 *     tags: [SKL Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: SKL upload ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Updated SKL Name
 *               studentId:
 *                 type: integer
 *                 description: Target student ID if updating owner.
 *                 example: 1
 *               sklFile:
 *                 type: string
 *                 format: binary
 *                 description: PDF file containing the new SKL to replace the old one
 *     responses:
 *       200:
 *         description: SKL updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied or invalid token (Academic Staff only)
 *       404:
 *         description: SKL upload or Student not found
 *       500:
 *         description: Internal server error
 */
router.patch(
  "/:id",
  verifyToken,
  isAcademicStaff,
  upload("skl").single("sklFile"),
  updateSklUploadValidator,
  validate,
  updateSklUpload,
);

/**
 * @swagger
 * /api/skl/{id}:
 *   delete:
 *     summary: Soft-delete an SKL upload
 *     tags: [SKL Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: SKL upload ID
 *     responses:
 *       200:
 *         description: SKL deleted successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied or invalid token (Academic Staff only)
 *       404:
 *         description: SKL upload not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", verifyToken, isAcademicStaff, deleteSklUpload);

/**
 * @swagger
 * /api/skl/uploads/:uploadId/download:
 *   get:
 *     summary: Download an SKL upload file
 *     tags: [SKL Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uploadId
 *         required: true
 *         schema:
 *           type: integer
 *         description: SKL upload ID
 *     responses:
 *       200:
 *         description: File downloaded successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied or invalid token
 *       404:
 *         description: SKL upload file not found
 *       500:
 *         description: Internal server error
 */
router.get("/uploads/:uploadId/download", verifyToken, downloadSklUpload);

module.exports = router;
