import express from 'express';
const router = express.Router();
import { verifyToken } from '../../middlewares/auth.js';
import { upload } from '../../middlewares/upload.js';
import {
  listSidangRegistrations,
  getSidangRegistrationById,
  getSidangRegistrationByMahasiswaId,
  saveSidangRegistration,
  submitSidangRegistration,
  deleteSidangRegistration,
  uploadSidangRegistrationFile,
  getSidangRegistrationFiles,
  downloadSidangRegistrationFile,
  approveSidangRegistration,
  rejectSidangRegistration,
} from '../../controllers/sidangRegistrationController.js';
import { isMahasiswa, isAdmin } from '../../middlewares/authorize.js';

/**
 * @swagger
 * tags:
 *   name: Sidang Registration
 *   description: Sidang registration endpoints
 */

/**
 * @swagger
 * /api/sidang-registrations:
 *   get:
 *     summary: Get all sidang registrations (paginated)
 *     tags: [Sidang Registration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pageQueryParam'
 *       - $ref: '#/components/parameters/limitQueryParam'
 *     responses:
 *       200:
 *         description: Sidang registrations data retrieved successfully with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 */
router.get("/", verifyToken, listSidangRegistrations);

/**
 * @swagger
 * /api/sidang-registrations/{id}:
 *   get:
 *     summary: Get sidang registration by ID
 *     tags: [Sidang Registration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sidang registration ID (UUID)
 *     responses:
 *       200:
 *         description: Sidang registration data retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: Sidang registration not found
 */
router.get("/:id", verifyToken, getSidangRegistrationById);

/**
 * @swagger
 * /api/sidang-registrations/student/{mahasiswaId}:
 *   get:
 *     summary: Get sidang registration by student ID
 *     tags: [Sidang Registration]
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
 *         description: Sidang registration data retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: Sidang registration not found
 */
router.get(
  "/student/:mahasiswaId",
  verifyToken,
  getSidangRegistrationByMahasiswaId,
);

/**
 * @swagger
 * /api/sidang-registrations/:
 *   post:
 *     summary: Save draft sidang registration
 *     tags: [Sidang Registration]
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
 *               sidangScheme:
 *                 type: string
 *               jalurNonSidang:
 *                 type: array
 *                 items:
 *                   type: string
 *               lulusTesBahasa:
 *                 type: boolean
 *               sks:
 *                 type: integer
 *               ipk:
 *                 type: number
 *               tak:
 *                 type: integer
 *               sktaExpDate:
 *                 type: string
 *                 format: date-time
 *               thesisTitleId:
 *                 type: string
 *               thesisTitleEn:
 *                 type: string
 *               mahasiswaId:
 *                 type: string
 *               dosenPembimbing1Id:
 *                 type: string
 *               dosenPembimbing2Id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sidang registration saved as draft successfully
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
  saveSidangRegistration,
);

/**
 * @swagger
 * /api/sidang-registrations/submit:
 *   post:
 *     summary: Submit sidang registration
 *     tags: [Sidang Registration]
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
 *               sidangScheme:
 *                 type: string
 *               jalurNonSidang:
 *                 type: array
 *                 items:
 *                   type: string
 *               lulusTesBahasa:
 *                 type: boolean
 *               sks:
 *                 type: integer
 *               ipk:
 *                 type: number
 *               tak:
 *                 type: integer
 *               sktaExpDate:
 *                 type: string
 *                 format: date-time
 *               thesisTitleId:
 *                 type: string
 *               thesisTitleEn:
 *                 type: string
 *               mahasiswaId:
 *                 type: string
 *               dosenPembimbing1Id:
 *                 type: string
 *               dosenPembimbing2Id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sidang registration submitted successfully
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
  submitSidangRegistration,
);

/**
 * @swagger
 * /api/sidang-registrations/{id}:
 *   delete:
 *     summary: Delete sidang registration
 *     tags: [Sidang Registration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sidang registration ID (UUID)
 *     responses:
 *       200:
 *         description: Sidang registration deleted successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: Sidang registration not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", verifyToken, isAdmin, deleteSidangRegistration);

/**
 * @swagger
 * /api/sidang-registrations/{id}/uploads:
 *   post:
 *     summary: Upload a file for a sidang registration
 *     tags: [Sidang Registration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sidang registration ID (UUID)
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
 *         description: Sidang registration not found
 *       500:
 *         description: Internal server error
 */
router.post(
  "/:id/uploads",
  verifyToken,
  isMahasiswa,
  upload("sidang-requirements").single("file"),
  uploadSidangRegistrationFile,
);

/**
 * @swagger
 * /api/sidang-registrations/{id}/uploads:
 *   get:
 *     summary: Get all uploaded files for a sidang registration
 *     tags: [Sidang Registration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sidang registration ID (UUID)
 *     responses:
 *       200:
 *         description: Files retrieved successfully
 *       401:
 *         description: Token not found
 *       404:
 *         description: Sidang registration not found
 */
router.get("/:id/uploads", verifyToken, getSidangRegistrationFiles);

/**
 * @swagger
 * /api/sidang-registrations/uploads/{uploadId}/download:
 *   get:
 *     summary: Download an uploaded file
 *     tags: [Sidang Registration]
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
 *         description: File downloaded successfully
 *       401:
 *         description: Token not found
 *       404:
 *         description: Upload not found
 */
router.get(
  "/uploads/:uploadId/download",
  verifyToken,
  downloadSidangRegistrationFile,
);

/**
 * @swagger
 * /api/sidang-registrations/{id}/approve:
 *   put:
 *     summary: Approve sidang registration
 *     tags: [Sidang Registration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sidang registration ID (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - adminId
 *               - sidangPeriodId
 *             properties:
 *               adminId:
 *                 type: string
 *               sidangPeriodId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sidang registration approved successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Token not found
 *       404:
 *         description: Registration, admin or period not found
 */
router.put("/:id/approve", verifyToken, isAdmin, approveSidangRegistration);

/**
 * @swagger
 * /api/sidang-registrations/{id}/reject:
 *   put:
 *     summary: Reject / request revision for sidang registration
 *     tags: [Sidang Registration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sidang registration ID (UUID)
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
 *     responses:
 *       200:
 *         description: Sidang registration rejected / revision requested successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Token not found
 *       404:
 *         description: Registration or admin not found
 */
router.put("/:id/reject", verifyToken, isAdmin, rejectSidangRegistration);

export default router;
