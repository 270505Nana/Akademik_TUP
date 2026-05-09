const express = require("express");

const router = express.Router();

const {
  listSktaRequests,
  createSktaRequest,
  updateSktaRequest,
  findSktaRequestByStudentId,
  downloadSktaRequestUpload,
} = require("../../controllers/sktaRequestController");

const { verifyToken } = require("../../middlewares/auth");
const { validate } = require("../../middlewares/validate");
const { upload } = require("../../middlewares/upload");

const {
  createSktaRequestValidator,
  updateSktaRequestValidator,
} = require("../../validators/sktaRequestValidator");
const { isStudent } = require("../../middlewares/authorize");

/**
 * @swagger
 * tags:
 *   name: SKTA Request
 *   description: SKTA request endpoints
 */

/**
 * @swagger
 * /api/skta-requests:
 *   get:
 *     summary: Get all SKTA request data
 *     tags: [SKTA Request]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: SKTA request data retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       500:
 *         description: Internal server error
 */
router.get("/", verifyToken, listSktaRequests);

/**
 * @swagger
 * /api/skta-requests:
 *   post:
 *     summary: Create a new SKTA request
 *     tags: [SKTA Request]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - proposalTitleId
 *               - proposalTitleEn
 *               - studentId
 *               - dosenPembimbing1Id
 *               - dosenPembimbing2Id
 *               - evidence
 *               - evidenceIgracias
 *             properties:
 *               proposalTitleId:
 *                 type: string
 *                 example: Sistem Informasi Akademik Berbasis Web
 *               proposalTitleEn:
 *                 type: string
 *                 example: Web Based Academic Information System
 *               studentId:
 *                 type: integer
 *                 example: 1
 *               dosenPembimbing1Id:
 *                 type: integer
 *                 example: 2
 *               dosenPembimbing2Id:
 *                 type: integer
 *                 example: 3
 *               evidence:
 *                 type: string
 *                 format: binary
 *                 description: Evidence file in PDF format
 *               evidenceIgracias:
 *                 type: string
 *                 format: binary
 *                 description: Evidence Igracias file in PDF format
 *     responses:
 *       200:
 *         description: SKTA request submitted successful
 *       400:
 *         description: Validation error
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: Student or lecturer not found
 *       500:
 *         description: Internal server error
 */
router.post(
  "/",
  verifyToken,
  isStudent,
  upload("skta-evidence").fields([
    { name: "evidence", maxCount: 1 },
    { name: "evidenceIgracias", maxCount: 1 },
  ]),
  createSktaRequestValidator,
  validate,
  createSktaRequest,
);

/**
 * @swagger
 * /api/skta-requests/{id}:
 *   patch:
 *     summary: Update an SKTA request
 *     tags: [SKTA Request]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: SKTA request ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - proposalTitleId
 *               - proposalTitleEn
 *               - studentId
 *               - dosenPembimbing1Id
 *               - dosenPembimbing2Id
 *               - evidence
 *               - evidenceIgracias
 *             properties:
 *               proposalTitleId:
 *                 type: string
 *                 example: Sistem Informasi Akademik Berbasis Web
 *               proposalTitleEn:
 *                 type: string
 *                 example: Web Based Academic Information System
 *               studentId:
 *                 type: integer
 *                 example: 1
 *               dosenPembimbing1Id:
 *                 type: integer
 *                 example: 2
 *               dosenPembimbing2Id:
 *                 type: integer
 *                 example: 3
 *               evidence:
 *                 type: string
 *                 format: binary
 *                 description: Evidence file in PDF format
 *               evidenceIgracias:
 *                 type: string
 *                 format: binary
 *                 description: Evidence Igracias file in PDF format
 *     responses:
 *       200:
 *         description: SKTA request updated successful
 *       400:
 *         description: Validation error
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: SKTA request, student, or lecturer not found
 *       500:
 *         description: Internal server error
 */
router.patch(
  "/:id",
  verifyToken,
  isStudent,
  upload("skta-evidence").fields([
    { name: "evidence", maxCount: 1 },
    { name: "evidenceIgracias", maxCount: 1 },
  ]),
  updateSktaRequestValidator,
  validate,
  updateSktaRequest,
);

/**
 * @swagger
 * /api/skta-requests/uploads/{uploadId}/download:
 *   get:
 *     summary: Download an SKTA request upload file
 *     tags: [SKTA Request]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uploadId
 *         required: true
 *         schema:
 *           type: integer
 *         description: SKTA request upload ID
 *     responses:
 *       200:
 *         description: File downloaded successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: SKTA request upload or file not found
 *       500:
 *         description: Internal server error
 */
router.get(
  "/uploads/:uploadId/download",
  verifyToken,
  downloadSktaRequestUpload,
);

/**
 * @swagger
 * /api/skta-requests/{studentId}:
 *   get:
 *     summary: Get SKTA request data by student ID
 *     tags: [SKTA Request]
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
 *         description: SKTA request data retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: SKTA request data not found
 *       500:
 *         description: Internal server error
 */
router.get("/:studentId", verifyToken, findSktaRequestByStudentId);

module.exports = router;
