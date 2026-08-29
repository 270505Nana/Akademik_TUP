import express from 'express';

const router = express.Router();

import { listAdmins,
  upsertAdmin,
  findAdminById, } from '../../controllers/adminController.js';

import { verifyToken } from '../../middlewares/auth.js';

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
 *     summary: Get all admin data (paginated)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pageQueryParam'
 *       - $ref: '#/components/parameters/limitQueryParam'
 *     responses:
 *       200:
 *         description: Admin data retrieved successfully with pagination
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
router.get("/", verifyToken, isAdmin, listAdmins);

/**
 * @swagger
 * /api/admin/{id}:
 *   put:
 *     summary: Create or update admin data by Admin ID or User ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Admin ID or User ID
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
  "/:id",
  verifyToken,
  isAdmin,
  upsertAdmin,
);

/**
 * @swagger
 * /api/admin/{id}:
 *   get:
 *     summary: Get admin data by Admin ID or User ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Admin ID or User ID
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
router.get("/:id", verifyToken, isAdmin, findAdminById);

export default router;
