const express = require("express");

const router = express.Router();

const {
  listStudyPrograms,
  createStudyProgram,
  findStudyProgramById,
  updateStudyProgram,
  deleteStudyProgram,
  toggleStudyProgramPublish,
} = require("../../controllers/studyProgramController");

const { verifyToken } = require("../../middlewares/auth");
const { authorize } = require("../../middlewares/authorize");

const { validate } = require("../../middlewares/validate");
const {
  createStudyProgramValidator,
  updateStudyProgramValidator,
} = require("../../validators/studyProgramValidator");

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

/**
 * @swagger
 * /api/study-programs:
 *   post:
 *     summary: Create new study program
 *     tags: [Study Program]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               facultyId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Study program created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Token not found
 */
router.post(
  "/",
  verifyToken,
  authorize("ACADEMIC_STAFF"),
  createStudyProgramValidator,
  validate,
  createStudyProgram,
);

/**
 * @swagger
 * /api/study-programs/{id}:
 *   get:
 *     summary: Get study program by ID
 *     tags: [Study Program]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Study program data retrieved successfully
 *       404:
 *         description: Study program not found
 */
router.get("/:id", verifyToken, findStudyProgramById);

/**
 * @swagger
 * /api/study-programs/{id}:
 *   put:
 *     summary: Update study program
 *     tags: [Study Program]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               facultyId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Study program updated successfully
 *       404:
 *         description: Study program not found
 */
router.put(
  "/:id",
  verifyToken,
  authorize("ACADEMIC_STAFF"),
  updateStudyProgramValidator,
  validate,
  updateStudyProgram,
);

/**
 * @swagger
 * /api/study-programs/{id}:
 *   delete:
 *     summary: Delete study program (soft delete)
 *     tags: [Study Program]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Study program deleted successfully
 *       404:
 *         description: Study program not found
 */
router.delete(
  "/:id",
  verifyToken,
  authorize("ACADEMIC_STAFF"),
  deleteStudyProgram,
);

/**
 * @swagger
 * /api/study-programs/{id}/toggle-publish:
 *   patch:
 *     summary: Toggle study program publish status (hide/show)
 *     tags: [Study Program]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Study program status updated successfully
 *       404:
 *         description: Study program not found
 */
router.patch(
  "/:id/toggle-publish",
  verifyToken,
  authorize("ACADEMIC_STAFF"),
  toggleStudyProgramPublish,
);

module.exports = router;
