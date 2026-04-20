const express = require("express");

const router = express.Router();

const { getFaculties } = require("../../controllers/facultyController");

const { verifyToken } = require("../../middlewares/auth");

const { validate } = require("../../middlewares/validate");

/**
 * @swagger
 * tags:
 *   name: Faculty
 *   description: Faculty endpoints
 */

/**
 * @swagger
 * /api/faculties:
 *   get:
 *     summary: Get all faculty data
 *     tags: [Faculty]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Faculty data retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 */
router.get("/", verifyToken, getFaculties);

module.exports = router;
