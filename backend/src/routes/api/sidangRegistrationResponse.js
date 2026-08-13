import express from 'express';
const router = express.Router();
import { verifyToken } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { listSidangRegistrationResponses,
  getSidangRegistrationResponseById,
  getSidangRegistrationResponseBySidangRegistrationId,
  createSidangRegistrationResponse,
  updateSidangRegistrationResponse,
  deleteSidangRegistrationResponse,
  toggleSidangRegistrationUploadIsValid, } from '../../controllers/sidangRegistrationResponseController.js';
import { createSidangRegistrationResponseValidator,
  updateSidangRegistrationResponseValidator, } from '../../validators/sidangRegistrationResponseValidator.js';
import { isAdmin } from '../../middlewares/authorize.js';

/**
 * @swagger
 * tags:
 *   name: Sidang Registration Response
 *   description: Sidang registration response endpoints
 */

/**
 * @swagger
 * /api/sidang-registration-responses:
 *   get:
 *     summary: Get all sidang registration responses
 *     tags: [Sidang Registration Response]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sidang registration responses retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 */
router.get("/", verifyToken, listSidangRegistrationResponses);

/**
 * @swagger
 * /api/sidang-registration-responses/{id}:
 *   get:
 *     summary: Get sidang registration response by ID
 *     tags: [Sidang Registration Response]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Response ID
 *     responses:
 *       200:
 *         description: Sidang registration response retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: Response not found
 */
router.get("/:id", verifyToken, getSidangRegistrationResponseById);

/**
 * @swagger
 * /api/sidang-registration-responses/registration/{sidangRegistrationId}:
 *   get:
 *     summary: Get sidang registration response by sidang registration ID
 *     tags: [Sidang Registration Response]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sidangRegistrationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Sidang Registration ID
 *     responses:
 *       200:
 *         description: Sidang registration response retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: Response not found
 */
router.get(
  "/registration/:sidangRegistrationId",
  verifyToken,
  getSidangRegistrationResponseBySidangRegistrationId,
);

/**
 * @swagger
 * /api/sidang-registration-responses:
 *   post:
 *     summary: Create new sidang registration response
 *     tags: [Sidang Registration Response]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sidangRegistrationId
 *               - adminId
 *             properties:
 *               sidangRegistrationId:
 *                 type: integer
 *                 example: 1
 *               adminId:
 *                 type: integer
 *                 example: 1
 *               message:
 *                 type: string
 *                 nullable: true
 *                 example: "Persetujuan dengan revisi minor"
 *               isEdit:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 example: "2026-06-07T23:59:59Z"
 *               sidangPeriodId:
 *                 type: integer
 *                 nullable: true
 *                 example: 1
 *               sidangRegistrationUploadIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2, 3]
 *     responses:
 *       201:
 *         description: Sidang registration response created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: Sidang registration or academic staff not found
 *       500:
 *         description: Internal server error
 */
router.post(
  "/",
  verifyToken,
  isAdmin,
  createSidangRegistrationResponseValidator,
  validate,
  createSidangRegistrationResponse,
);

/**
 * @swagger
 * /api/sidang-registration-responses/{id}:
 *   put:
 *     summary: Update sidang registration response
 *     tags: [Sidang Registration Response]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Response ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 nullable: true
 *               isEdit:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *               adminId:
 *                 type: integer
 *               sidangRegistrationId:
 *                 type: integer
 *               sidangRegistrationUploadIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2, 3]
 *     responses:
 *       200:
 *         description: Sidang registration response updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: Response or reference data not found
 *       500:
 *         description: Internal server error
 */
router.put(
  "/:id",
  verifyToken,
  isAdmin,
  updateSidangRegistrationResponseValidator,
  validate,
  updateSidangRegistrationResponse,
);

/**
 * @swagger
 * /api/sidang-registration-responses/{id}:
 *   delete:
 *     summary: Delete sidang registration response
 *     tags: [Sidang Registration Response]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Response ID
 *     responses:
 *       200:
 *         description: Sidang registration response deleted successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: Response not found
 *       500:
 *         description: Internal server error
 */
router.delete(
  "/:id",
  verifyToken,
  isAdmin,
  deleteSidangRegistrationResponse,
);

/**
 * @swagger
 * /api/sidang-registration-responses/uploads/{uploadId}/toggle-is-valid:
 *   put:
 *     summary: Toggle isValid status of a Sidang Registration Upload
 *     tags: [Sidang Registration Response]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uploadId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Upload ID to toggle validation status
 *     responses:
 *       200:
 *         description: Sidang registration upload validation status toggled successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token / Access denied
 *       404:
 *         description: Sidang registration upload not found
 *       500:
 *         description: Internal server error
 */
router.put(
  "/uploads/:uploadId/toggle-is-valid",
  verifyToken,
  isAdmin,
  toggleSidangRegistrationUploadIsValid,
);

export default router;
