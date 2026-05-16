const express = require("express");

const router = express.Router();

const {
  listSktaResponses,
  createSktaResponse,
  updateSktaResponse,
  findSktaResponseBySktaRequestId,
  getSktaResponseUploadsByStudentId,
  downloadSktaResponseUpload,
} = require("../../controllers/sktaResponseController");

const { verifyToken } = require("../../middlewares/auth");
const { validate } = require("../../middlewares/validate");
const { upload } = require("../../middlewares/upload");

const {
  createSktaResponsetValidator,
  updateSktaResponsetValidator,
} = require("../../validators/sktaResponseValidator");
const { isAcademicStaff } = require("../../middlewares/authorize");

/**
 * @swagger
 * tags:
 *   name: SKTA Response
 *   description: SKTA request endpoints
 */

/**
 * @swagger
 * /api/skta-responses:
 *   get:
 *     summary: Get all SKTA response data
 *     tags: [SKTA Response]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: SKTA response data retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       500:
 *         description: Internal server error
 */
router.get("/", verifyToken, listSktaResponses);

/**
 * @swagger
 * /api/skta-responses:
 *   post:
 *     summary: Create a new SKTA response
 *     tags: [SKTA Response]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - hasUploadedFinalProposal
 *               - hasTakenLanguageTest
 *               - academicStaffId
 *               - sktaRequestId
 *             properties:
 *               hasUploadedFinalProposal:
 *                 type: boolean
 *                 example: true
 *               hasTakenLanguageTest:
 *                 type: boolean
 *                 example: false
 *               message:
 *                 type: string
 *                 nullable: true
 *                 example: Please complete the language test first
 *               expDate:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *                 example: 2026-12-31
 *               academicStaffId:
 *                 type: integer
 *                 example: 1
 *               sktaRequestId:
 *                 type: integer
 *                 example: 5
 *               sktaFile:
 *                 type: string
 *                 format: binary
 *                 description: Optional PDF file upload
 *     responses:
 *       200:
 *         description: SKTA response submitted successful
 *       422:
 *         description: Validation error
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: Academic staff or SKTA request not found
 *       500:
 *         description: Internal server error
 */
router.post(
  "/",
  verifyToken,
  isAcademicStaff,
  // upload("skta").single("sktaFile"),
  upload("skta").fields([{ name: "sktaFile", maxCount: 1 }]),
  createSktaResponsetValidator,
  validate,
  createSktaResponse,
);

/**
 * @swagger
 * /api/skta-responses/{id}:
 *   patch:
 *     summary: Update an SKTA response
 *     tags: [SKTA Response]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: SKTA response ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - hasUploadedFinalProposal
 *               - hasTakenLanguageTest
 *               - academicStaffId
 *               - sktaRequestId
 *             properties:
 *               hasUploadedFinalProposal:
 *                 type: boolean
 *                 example: true
 *               hasTakenLanguageTest:
 *                 type: boolean
 *                 example: true
 *               message:
 *                 type: string
 *                 nullable: true
 *                 example: Response updated after review
 *               expDate:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *                 example: 2026-12-31
 *               academicStaffId:
 *                 type: integer
 *                 example: 1
 *               sktaRequestId:
 *                 type: integer
 *                 example: 5
 *               sktaFile:
 *                 type: string
 *                 format: binary
 *                 description: Optional PDF file upload
 *     responses:
 *       200:
 *         description: SKTA response updated successful
 *       422:
 *         description: Validation error
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: SKTA response, academic staff, or SKTA request not found
 *       500:
 *         description: Internal server error
 */
router.patch(
  "/:id",
  verifyToken,
  isAcademicStaff,
  upload("skta").fields([{ name: "sktaFile", maxCount: 1 }]),
  updateSktaResponsetValidator,
  validate,
  updateSktaResponse,
);

/**
 * @swagger
 * /api/skta-responses/requests/{studentId}/uploads:
 *   get:
 *     summary: Get SKTA response uploads by Student ID
 *     tags: [SKTA Response]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Student ID
 *     responses:
 *       200:
 *         description: SKTA response uploads retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: Student not found
 *       500:
 *         description: Internal server error
 */
router.get(
  "/requests/:studentId/uploads",
  verifyToken,
  getSktaResponseUploadsByStudentId,
);

/**
 * @swagger
 * /api/skta-responses/uploads/{uploadId}/download:
 *   get:
 *     summary: Download SKTA response upload by upload ID
 *     tags: [SKTA Response]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uploadId
 *         required: true
 *         schema:
 *           type: integer
 *         description: SKTA response upload ID
 *     responses:
 *       200:
 *         description: File downloaded successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: Upload not found
 *       500:
 *         description: Internal server error
 */
router.get(
  "/uploads/:uploadId/download",
  verifyToken,
  downloadSktaResponseUpload,
);

/**
 * @swagger
 * /api/skta-responses/{sktaRequestId}:
 *   get:
 *     summary: Get SKTA response data by SKTA request ID
 *     tags: [SKTA Response]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sktaRequestId
 *         required: true
 *         schema:
 *           type: integer
 *         description: SKTA request ID
 *     responses:
 *       200:
 *         description: SKTA response data retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: SKTA response data not found
 *       500:
 *         description: Internal server error
 */
router.get("/:sktaRequestId", verifyToken, findSktaResponseBySktaRequestId);

module.exports = router;
