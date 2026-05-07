const express = require("express");

const router = express.Router();

const {
  listAcademicStaff,
  upsertAcademicStaff,
  findAcademicStaffByUserId,
} = require("../../controllers/academicStaffController");

const { verifyToken } = require("../../middlewares/auth");

const { validate } = require("../../middlewares/validate");

const {
  upsertAcademicStaffValidator,
} = require("../../validators/academicStaffValidator");

/**
 * @swagger
 * tags:
 *   name: Academic Staff
 *   description: Academic staff endpoints
 */

/**
 * @swagger
 * /api/academic-staff:
 *   get:
 *     summary: Get all academic staff data
 *     tags: [Academic Staff]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Academic staff data retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 */
router.get("/", verifyToken, listAcademicStaff);

/**
 * @swagger
 * /api/academic-staff/{userId}:
 *   put:
 *     summary: Create or update academic staff data by user ID
 *     tags: [Academic Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID with ACADEMIC_STAFF role
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
 *         description: Academic staff data created or updated successfully
 *       400:
 *         description: User is not an academic staff
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
  upsertAcademicStaffValidator,
  validate,
  upsertAcademicStaff,
);

/**
 * @swagger
 * /api/academic-staff/{userId}:
 *   get:
 *     summary: Get academic staff data by user ID
 *     tags: [Academic Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID of academic staff
 *     responses:
 *       200:
 *         description: Academic staff data retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: Academic staff data not found
 *       500:
 *         description: Internal server error
 */
router.get("/:userId", verifyToken, findAcademicStaffByUserId);

module.exports = router;
