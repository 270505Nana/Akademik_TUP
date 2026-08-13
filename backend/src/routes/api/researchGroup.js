import express from 'express';

const router = express.Router();

import { listResearchGroups, } from '../../controllers/researchGroupController.js';

import { verifyToken } from '../../middlewares/auth.js';

/**
 * @swagger
 * tags:
 *   name: Research Group
 *   description: Research group endpoints
 */

/**
 * @swagger
 * /api/research-groups:
 *   get:
 *     summary: Get all research group data
 *     tags: [Research Group]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Research group data retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 */
router.get("/", verifyToken, listResearchGroups);

export default router;
