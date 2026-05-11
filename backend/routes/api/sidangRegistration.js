const express = require("express");
const router = express.Router();
const { verifyToken } = require("../../middlewares/auth");
const { validate } = require("../../middlewares/validate");
const {
  listSidangRegistrations,
  getSidangRegistrationById,
  getSidangRegistrationByStudentId,
  saveSidangRegistration,
  submitSidangRegistration,
  updateSidangRegistration,
  deleteSidangRegistration,
} = require("../../controllers/sidangRegistrationController");
const {
  saveSidangRegistrationValidator,
  submitSidangRegistrationValidator,
  updateSidangRegistrationValidator,
} = require("../../validators/sidangRegistrationValidator");
const { isStudent, isAcademicStaff } = require("../../middlewares/authorize");

/**
 * @swagger
 * tags:
 *   name: Sidang Registration
 *   description: Sidang registration endpoints
 */

/**
 * @swagger
 * /api/sidang-registrations:
 *   get:
 *     summary: Get all sidang registrations
 *     tags: [Sidang Registration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sidang registrations data retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 */
router.get("/", verifyToken, listSidangRegistrations);

/**
 * @swagger
 * /api/sidang-registrations/{id}:
 *   get:
 *     summary: Get sidang registration by ID
 *     tags: [Sidang Registration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Sidang registration ID
 *     responses:
 *       200:
 *         description: Sidang registration data retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: Sidang registration not found
 */
router.get("/:id", verifyToken, getSidangRegistrationById);

/**
 * @swagger
 * /api/sidang-registrations/student/{studentId}:
 *   get:
 *     summary: Get sidang registration by student ID
 *     tags: [Sidang Registration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Student ID
 *     responses:
 *       200:
 *         description: Sidang registration data retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: Sidang registration not found
 */
router.get(
  "/student/:studentId",
  verifyToken,
  getSidangRegistrationByStudentId,
);

/**
 * @swagger
 * /api/sidang-registrations/save:
 *   post:
 *     summary: Save draft sidang registration
 *     tags: [Sidang Registration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Sidang registration saved as draft successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: Student or lecturer not found
 *       500:
 *         description: Internal server error
 */
router.post(
  "/save",
  verifyToken,
  isStudent,
  saveSidangRegistrationValidator,
  validate,
  saveSidangRegistration,
);

/**
 * @swagger
 * /api/sidang-registrations/submit:
 *   post:
 *     summary: Submit sidang registration
 *     tags: [Sidang Registration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Sidang registration submitted successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: Student or lecturer not found
 *       500:
 *         description: Internal server error
 */
router.post(
  "/submit",
  verifyToken,
  isStudent,
  submitSidangRegistrationValidator,
  validate,
  submitSidangRegistration,
);

/**
 * @swagger
 * /api/sidang-registrations/{id}:
 *   put:
 *     summary: Update sidang registration
 *     tags: [Sidang Registration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Sidang registration ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Sidang registration updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: Sidang registration or reference data not found
 *       500:
 *         description: Internal server error
 */
router.put(
  "/:id",
  verifyToken,
  isStudent,
  updateSidangRegistrationValidator,
  validate,
  updateSidangRegistration,
);

/**
 * @swagger
 * /api/sidang-registrations/{id}:
 *   delete:
 *     summary: Delete sidang registration
 *     tags: [Sidang Registration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Sidang registration ID
 *     responses:
 *       200:
 *         description: Sidang registration deleted successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: Sidang registration not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", verifyToken, isAcademicStaff, deleteSidangRegistration);

module.exports = router;
