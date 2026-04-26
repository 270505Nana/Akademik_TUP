const express = require("express");

const router = express.Router();

const {
  listSktaResponses,
  createSktaResponse,
  updateSktaResponse,
  findSktaResponseBySktaRequestId,
} = require("../../controllers/sktaResponseController");

const { verifyToken } = require("../../middlewares/auth");
const { validate } = require("../../middlewares/validate");
const { upload } = require("../../middlewares/upload");

const {
  createSktaResponsetValidator,
  updateSktaResponsetValidator,
} = require("../../validators/sktaResponseValidator");

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
  upload("skta").single("sktaFile"),
  createSktaResponsetValidator,
  validate,
  createSktaResponse,
);

/**
 * @swagger
 * /api/skta-responses/{id}:
 *   put:
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

router.put(
  "/:id",
  verifyToken,
  upload("skta").single("sktaFile"),
  updateSktaResponsetValidator,
  validate,
  updateSktaResponse,
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
