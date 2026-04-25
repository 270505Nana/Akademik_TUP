const express = require("express");

const router = express.Router();

const {
  listStudyPrograms,
} = require("../../controllers/studyProgramController");

const { verifyToken } = require("../../middlewares/auth");

const { validate } = require("../../middlewares/validate");

/**
 * @swagger
 * tags:
 *   name: Study Program
 *   description: Study program endpoints
 */

/**
 * @swagger
 * /api/study-programs:
 *   get:
 *     summary: Get all study program data
 *     tags: [Study Program]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Study program data retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 */
router.get("/", verifyToken, listStudyPrograms);

module.exports = router;
