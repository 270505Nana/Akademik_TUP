const express = require("express");

const router = express.Router();

const {
  listStudents,
  upsertStudent,
  findStudentByUserId,
} = require("../../controllers/studentController");

const { verifyToken } = require("../../middlewares/auth");

const { validate } = require("../../middlewares/validate");

const { upsertStudentValidator } = require("../../validators/studentValidator");

/**
 * @swagger
 * tags:
 *   name: Student
 *   description: Student endpoints
 */

/**
 * @swagger
 * /api/students:
 *   get:
 *     summary: Get all student data
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student data retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 */
router.get("/", verifyToken, listStudents);

/**
 * @swagger
 * /api/students/{userId}:
 *   put:
 *     summary: Create or update student data by user ID
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID with STUDENT role
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [
 *               nim,
 *               name,
 *               className,
 *               studyProgramId,
 *               dosenWaliId
 *             ]
 *             properties:
 *               nim:
 *                 type: string
 *                 example: 2011104001
 *               name:
 *                 type: string
 *                 example: John Doe
 *               className:
 *                 type: string
 *                 example: SE-07-01
 *               sks:
 *                 type: integer
 *                 nullable: true
 *                 example: 120
 *               ipk:
 *                 type: integer
 *                 nullable: true
 *                 example: 3
 *               tak:
 *                 type: integer
 *                 nullable: true
 *                 example: 80
 *               studyProgramId:
 *                 type: integer
 *                 example: 1
 *               dosenWaliId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Student data created or updated successfully
 *       400:
 *         description: User is not an student
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
  upsertStudentValidator,
  validate,
  upsertStudent,
);

/**
 * @swagger
 * /api/students/{userId}:
 *   get:
 *     summary: Get student data by user ID
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID of student
 *     responses:
 *       200:
 *         description: Student data retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: Student data not found
 *       500:
 *         description: Internal server error
 */
router.get("/:userId", verifyToken, findStudentByUserId);

module.exports = router;
