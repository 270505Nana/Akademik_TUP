const express = require("express");

const router = express.Router();

const {
  listFaculties,
  createFaculty,
  findFacultyById,
  updateFaculty,
  deleteFaculty,
  toggleFacultyPublish,
} = require("../../controllers/facultyController");

const { verifyToken } = require("../../middlewares/auth");
const { authorize } = require("../../middlewares/authorize");

const { validate } = require("../../middlewares/validate");
const {
  createFacultyValidator,
  updateFacultyValidator,
} = require("../../validators/facultyValidator");

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
router.get("/", verifyToken, listFaculties);

/**
 * @swagger
 * /api/faculties:
 *   post:
 *     summary: Create new faculty
 *     tags: [Faculty]
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
 *     responses:
 *       201:
 *         description: Faculty created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Token not found
 */
router.post(
  "/",
  verifyToken,
  authorize("ACADEMIC_STAFF"),
  createFacultyValidator,
  validate,
  createFaculty,
);

/**
 * @swagger
 * /api/faculties/{id}:
 *   get:
 *     summary: Get faculty by ID
 *     tags: [Faculty]
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
 *         description: Faculty data retrieved successfully
 *       404:
 *         description: Faculty not found
 */
router.get("/:id", verifyToken, findFacultyById);

/**
 * @swagger
 * /api/faculties/{id}:
 *   put:
 *     summary: Update faculty
 *     tags: [Faculty]
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
 *     responses:
 *       200:
 *         description: Faculty updated successfully
 *       404:
 *         description: Faculty not found
 */
router.put(
  "/:id",
  verifyToken,
  authorize("ACADEMIC_STAFF"),
  updateFacultyValidator,
  validate,
  updateFaculty,
);

/**
 * @swagger
 * /api/faculties/{id}:
 *   delete:
 *     summary: Delete faculty (soft delete)
 *     tags: [Faculty]
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
 *         description: Faculty deleted successfully
 *       404:
 *         description: Faculty not found
 */
router.delete("/:id", verifyToken, authorize("ACADEMIC_STAFF"), deleteFaculty);

/**
 * @swagger
 * /api/faculties/{id}/toggle-publish:
 *   patch:
 *     summary: Toggle faculty publish status (hide/show)
 *     tags: [Faculty]
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
 *         description: Faculty status updated successfully
 *       404:
 *         description: Faculty not found
 */
router.patch(
  "/:id/toggle-publish",
  verifyToken,
  authorize("ACADEMIC_STAFF"),
  toggleFacultyPublish,
);

module.exports = router;
