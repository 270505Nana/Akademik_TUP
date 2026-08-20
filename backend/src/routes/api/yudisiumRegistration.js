import express from 'express';
const router = express.Router();
import { verifyToken } from '../../middlewares/auth.js';
import { upload } from '../../middlewares/upload.js';
import {
  listYudisiumRegistrations,
  getYudisiumRegistrationById,
  getYudisiumRegistrationByMahasiswaId,
  saveYudisiumRegistration,
  submitYudisiumRegistration,
  deleteYudisiumRegistration,
  uploadYudisiumRegistrationFile,
  getYudisiumRegistrationFiles,
  downloadYudisiumRegistrationFile,
  approveYudisiumRegistration,
  rejectYudisiumRegistration,
} from '../../controllers/yudisiumRegistrationController.js';
import { isMahasiswa, isAdmin } from '../../middlewares/authorize.js';

/**
 * @swagger
 * tags:
 *   name: Yudisium Registration
 *   description: Yudisium registration endpoints
 */

/**
 * @swagger
 * /api/yudisium-registrations:
 *   get:
 *     summary: Get all yudisium registrations
 *     tags: [Yudisium Registration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Yudisium registrations data retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 */
router.get("/", verifyToken, listYudisiumRegistrations);

/**
 * @swagger
 * /api/yudisium-registrations/{id}:
 *   get:
 *     summary: Get yudisium registration by ID
 *     tags: [Yudisium Registration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Yudisium registration ID (UUID)
 *     responses:
 *       200:
 *         description: Yudisium registration data retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: Yudisium registration not found
 */
router.get("/:id", verifyToken, getYudisiumRegistrationById);

/**
 * @swagger
 * /api/yudisium-registrations/student/{mahasiswaId}:
 *   get:
 *     summary: Get yudisium registration by student ID
 *     tags: [Yudisium Registration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mahasiswaId
 *         required: true
 *         schema:
 *           type: string
 *         description: Mahasiswa ID (UUID)
 *     responses:
 *       200:
 *         description: Yudisium registration data retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: Yudisium registration not found
 */
router.get(
  "/student/:mahasiswaId",
  verifyToken,
  getYudisiumRegistrationByMahasiswaId,
);

/**
 * @swagger
 * /api/yudisium-registrations/:
 *   post:
 *     summary: Save draft yudisium registration
 *     tags: [Yudisium Registration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               programType:
 *                 type: string
 *               tak:
 *                 type: integer
 *               thesisTitleId:
 *                 type: string
 *               thesisTitleEn:
 *                 type: string
 *               isConfirmed:
 *                 type: boolean
 *               sidangScheme:
 *                 type: string
 *               cumlaudeScheme:
 *                 type: string
 *               jalurNonYudisium:
 *                 type: array
 *                 items:
 *                   type: string
 *               eviden_cumlaude:
 *                 type: string
 *               mahasiswaId:
 *                 type: string
 *               dosenPembimbing1Id:
 *                 type: string
 *               dosenPembimbing2Id:
 *                 type: string
 *               yudisiumPeriodId:
 *                 type: string
 *               yudisiumRegistrationPeriodId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Yudisium registration saved as draft successfully
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
  saveYudisiumRegistration,
);

/**
 * @swagger
 * /api/yudisium-registrations/submit:
 *   post:
 *     summary: Submit yudisium registration
 *     tags: [Yudisium Registration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               programType:
 *                 type: string
 *               tak:
 *                 type: integer
 *               thesisTitleId:
 *                 type: string
 *               thesisTitleEn:
 *                 type: string
 *               isConfirmed:
 *                 type: boolean
 *               sidangScheme:
 *                 type: string
 *               cumlaudeScheme:
 *                 type: string
 *               jalurNonYudisium:
 *                 type: array
 *                 items:
 *                   type: string
 *               eviden_cumlaude:
 *                 type: string
 *               mahasiswaId:
 *                 type: string
 *               dosenPembimbing1Id:
 *                 type: string
 *               dosenPembimbing2Id:
 *                 type: string
 *               yudisiumPeriodId:
 *                 type: string
 *               yudisiumRegistrationPeriodId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Yudisium registration submitted successfully
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
  "/submit",
  verifyToken,
  isMahasiswa,
  submitYudisiumRegistration,
);

/**
 * @swagger
 * /api/yudisium-registrations/{id}:
 *   delete:
 *     summary: Delete yudisium registration
 *     tags: [Yudisium Registration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Yudisium registration ID (UUID)
 *     responses:
 *       200:
 *         description: Yudisium registration deleted successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: Yudisium registration not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", verifyToken, isAdmin, deleteYudisiumRegistration);

/**
 * @swagger
 * /api/yudisium-registrations/{id}/uploads:
 *   post:
 *     summary: Upload a file for a yudisium registration
 *     tags: [Yudisium Registration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Yudisium registration ID (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - slug
 *               - name
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The file to upload
 *               slug:
 *                 type: string
 *                 description: The unique identifier for this file type
 *               name:
 *                 type: string
 *                 description: Human readable name of the file
 *     responses:
 *       200:
 *         description: File uploaded/updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Token not found
 *       404:
 *         description: Yudisium registration not found
 *       500:
 *         description: Internal server error
 */
router.post(
  "/:id/uploads",
  verifyToken,
  isMahasiswa,
  upload("yudisium-requirements").single("file"),
  uploadYudisiumRegistrationFile,
);

/**
 * @swagger
 * /api/yudisium-registrations/{id}/uploads:
 *   get:
 *     summary: Get uploaded files for a yudisium registration
 *     tags: [Yudisium Registration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Yudisium registration ID (UUID)
 *     responses:
 *       200:
 *         description: Uploaded files retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: Yudisium registration not found
 */
router.get("/:id/uploads", verifyToken, getYudisiumRegistrationFiles);

/**
 * @swagger
 * /api/yudisium-registrations/uploads/{uploadId}/download:
 *   get:
 *     summary: Download yudisium registration upload by ID
 *     tags: [Yudisium Registration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uploadId
 *         required: true
 *         schema:
 *           type: string
 *         description: Upload ID (UUID)
 *     responses:
 *       200:
 *         description: File download
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: Upload not found
 */
router.get(
  "/uploads/:uploadId/download",
  verifyToken,
  downloadYudisiumRegistrationFile,
);

/**
 * @swagger
 * /api/yudisium-registrations/{id}/approve:
 *   put:
 *     summary: Approve yudisium registration
 *     tags: [Yudisium Registration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Yudisium registration ID (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - adminId
 *               - yudisiumPeriodId
 *             properties:
 *               adminId:
 *                 type: string
 *               yudisiumPeriodId:
 *                 type: string
 *               yudisiumRegistrationUploadIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Yudisium registration approved successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Token not found
 *       404:
 *         description: Registration, admin or period not found
 */
router.put("/:id/approve", verifyToken, isAdmin, approveYudisiumRegistration);

/**
 * @swagger
 * /api/yudisium-registrations/{id}/reject:
 *   put:
 *     summary: Reject / request revision for yudisium registration
 *     tags: [Yudisium Registration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Yudisium registration ID (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - adminId
 *               - message
 *             properties:
 *               adminId:
 *                 type: string
 *               message:
 *                 type: string
 *               isEdit:
 *                 type: string
 *                 format: date-time
 *               yudisiumRegistrationUploadIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Yudisium registration rejected / revision requested successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Token not found
 *       404:
 *         description: Registration or admin not found
 */
router.put("/:id/reject", verifyToken, isAdmin, rejectYudisiumRegistration);

export default router;
