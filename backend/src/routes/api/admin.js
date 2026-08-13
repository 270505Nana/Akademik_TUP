import express from 'express';

const router = express.Router();

import { listAdmins,
  upsertAdmin,
  findAdminByUserId, } from '../../controllers/adminController.js';

import { verifyToken } from '../../middlewares/auth.js';

import { validate } from '../../middlewares/validate.js';

import { upsertAdminValidator, } from '../../validators/adminValidator.js';
import { isAdmin } from '../../middlewares/authorize.js';

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin endpoints
 */

/**
 * @swagger
 * /api/admin:
 *   get:
 *     summary: Get all admin data
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin data retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 */
router.get("/", verifyToken, isAdmin, listAdmins);

/**
 * @swagger
 * /api/admin/{userId}:
 *   put:
 *     summary: Create or update admin data by user ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID with ADMIN role
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *     responses:
 *       200:
 *         description: Admin data created or updated successfully
 *       400:
 *         description: User is not an admin
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
  isAdmin,
  upsertAdminValidator,
  validate,
  upsertAdmin,
);

/**
 * @swagger
 * /api/admin/{userId}:
 *   get:
 *     summary: Get admin data by user ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID of admin
 *     responses:
 *       200:
 *         description: Admin data retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: Admin data not found
 *       500:
 *         description: Internal server error
 */
router.get("/:userId", verifyToken, isAdmin, findAdminByUserId);

export default router;
