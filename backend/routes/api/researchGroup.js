const express = require("express");

const router = express.Router();

const {
  getResearchGroups,
} = require("../../controllers/researchGroupController");

const { verifyToken } = require("../../middlewares/auth");

const { validate } = require("../../middlewares/validate");

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
router.get("/", verifyToken, getResearchGroups);

module.exports = router;
