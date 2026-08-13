import express from 'express';

const router = express.Router();

import { listDosens,
  upsertDosen,
  findDosenByUserId, } from '../../controllers/dosenController.js';

import { verifyToken } from '../../middlewares/auth.js';

import { isDosen } from '../../middlewares/authorize.js';

/**
 * @swagger
 * tags:
 *   name: Dosen
 *   description: Dosen endpoints
 */

/**
 * @swagger
 * /api/dosen:
 *   get:
 *     summary: Get all dosen data
 *     tags: [Dosen]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dosen data retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 */
router.get("/", verifyToken, listDosens);

/**
 * @swagger
 * /api/dosen/{userId}:
 *   put:
 *     summary: Create or update dosen data by user ID
 *     tags: [Dosen]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID with DOSEN role
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nip, name, researchGroupId]
 *             properties:
 *               nip:
 *                 type: string
 *                 example: 20000505201901001
 *               nidn:
 *                 type: string
 *                 example: 1122334455
 *               kodeDosen:
 *                 type: string
 *                 example: JDO
 *               lecturerCode:
 *                 type: string
 *                 example: JDO
 *               name:
 *                 type: string
 *                 example: John Doe
 *               researchGroupId:
 *                 type: string
 *                 example: a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11
 *     responses:
 *       200:
 *         description: Dosen data created or updated successfully
 *       400:
 *         description: User is not a dosen
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.put(
  "/:userId",
  verifyToken,
  isDosen,
  upsertDosen,
);

/**
 * @swagger
 * /api/dosen/{userId}:
 *   get:
 *     summary: Get dosen data by user ID
 *     tags: [Dosen]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID of dosen
 *     responses:
 *       200:
 *         description: Dosen data retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: Dosen data not found
 *       500:
 *         description: Internal server error
 */
router.get("/:userId", verifyToken, findDosenByUserId);

export default router;
