const express = require("express");

const router = express.Router();

const {
  getLecturers,
  upsertLecturer,
  getLecturerByUserId,
} = require("../../controllers/lecturerController");

const { verifyToken } = require("../../middlewares/auth");

const { validate } = require("../../middlewares/validate");

const {
  upsertLecturerValidator,
} = require("../../validators/lecturerValidator");

/**
 * @swagger
 * tags:
 *   name: Lecturer
 *   description: Lecturer endpoints
 */

/**
 * @swagger
 * /api/lecturers:
 *   get:
 *     summary: Get all lecturer data
 *     tags: [Lecturer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lecturer data retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 */
router.get("/", verifyToken, getLecturers);

/**
 * @swagger
 * /api/lecturers/{userId}:
 *   put:
 *     summary: Create or update lecturer data by user ID
 *     tags: [Lecturer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID with LECTURER role
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nip, nidn, lecturerCode, name, researchGroupId]
 *             properties:
 *               nip:
 *                 type: string
 *                 example: 20000505201901001
 *               nidn:
 *                 type: string
 *                 example: 1122334455
 *               lecturerCode:
 *                 type: string
 *                 example: JDO
 *               name:
 *                 type: string
 *                 example: John Doe
 *               researchGroupId:
 *                 type: int
 *                 example: 1
 *     responses:
 *       200:
 *         description: Lecturer data created or updated successfully
 *       400:
 *         description: User is not an lecturer
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
  upsertLecturerValidator,
  validate,
  upsertLecturer,
);

/**
 * @swagger
 * /api/lecturers/{userId}:
 *   get:
 *     summary: Get lecturer data by user ID
 *     tags: [Lecturer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID of lecturer
 *     responses:
 *       200:
 *         description: Lecturer data retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: Lecturer data not found
 *       500:
 *         description: Internal server error
 */
router.get("/:userId", verifyToken, getLecturerByUserId);

module.exports = router;
