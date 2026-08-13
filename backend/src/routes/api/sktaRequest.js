import express from 'express';

const router = express.Router();

import { listSktaRequests,
  createSktaRequest,
  updateSktaRequest,
  findSktaRequestByMahasiswaId,
  downloadSktaRequestUpload, } from '../../controllers/sktaRequestController.js';

import { verifyToken } from '../../middlewares/auth.js';
import { upload } from '../../middlewares/upload.js';

import { isMahasiswa } from '../../middlewares/authorize.js';

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
 *               - mahasiswaId
 *               - dosenPembimbing1Id
 *               - dosenPembimbing2Id
 *               - evidence
 *             properties:
 *               proposalTitleId:
 *                 type: string
 *                 example: Sistem Informasi Akademik Berbasis Web
 *               proposalTitleEn:
 *                 type: string
 *                 example: Web Based Academic Information System
 *               mahasiswaId:
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
 *         description: Mahasiswa or lecturer not found
 *       500:
 *         description: Internal server error
 */
router.post(
  "/",
  verifyToken,
  isMahasiswa,
  upload("skta-evidence").fields([{ name: "evidence", maxCount: 1 }]),
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
 *               - mahasiswaId
 *               - dosenPembimbing1Id
 *               - dosenPembimbing2Id
 *               - evidence
 *             properties:
 *               proposalTitleId:
 *                 type: string
 *                 example: Sistem Informasi Akademik Berbasis Web
 *               proposalTitleEn:
 *                 type: string
 *                 example: Web Based Academic Information System
 *               mahasiswaId:
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
  isMahasiswa,
  upload("skta-evidence").fields([{ name: "evidence", maxCount: 1 }]),
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
 * /api/skta-requests/{mahasiswaId}:
 *   get:
 *     summary: Get SKTA request data by student ID
 *     tags: [SKTA Request]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mahasiswaId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Mahasiswa ID
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
router.get("/:mahasiswaId", verifyToken, findSktaRequestByMahasiswaId);

export default router;
