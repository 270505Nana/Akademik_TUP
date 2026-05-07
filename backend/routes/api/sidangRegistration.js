const express = require("express");
const router = express.Router();
const { verifyToken } = require("../../middlewares/auth");
const { validate } = require("../../middlewares/validate");
const {
  listSidangRegistrations,
  getSidangRegistrationById,
  getSidangRegistrationByStudentId,
  createSidangRegistration,
  updateSidangRegistration,
  deleteSidangRegistration,
} = require("../../controllers/sidangRegistrationController");
const {
  createSidangRegistrationValidator,
  updateSidangRegistrationValidator,
} = require("../../validators/sidangRegistrationValidator");

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
 * /api/sidang-registrations:
 *   post:
 *     summary: Create new sidang registration
 *     tags: [Sidang Registration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - programType
 *               - sks
 *               - ipk
 *               - tak
 *               - sktaExpDate
 *               - thesisTitleId
 *               - thesisTitleEn
 *               - studentId
 *               - dosenPembimbing1Id
 *               - dosenPembimbing2Id
 *             properties:
 *               programType:
 *                 type: string
 *                 example: "S2"
 *               sidangScheme:
 *                 type: array
 *                 nullable: true
 *                 items:
 *                   type: string
 *                 example: ["Publikasi Jurnal", "Proceeding International", "HKI"]
 *               sks:
 *                 type: integer
 *                 example: 6
 *               ipk:
 *                 type: number
 *                 example: 3.5
 *               tak:
 *                 type: integer
 *                 example: 2
 *               sktaExpDate:
 *                 type: string
 *                 format: date
 *                 example: "2026-12-31"
 *               thesisTitleId:
 *                 type: string
 *                 example: "Sistem Informasi Manajemen Akademik"
 *               thesisTitleEn:
 *                 type: string
 *                 example: "Academic Management Information System"
 *               studentId:
 *                 type: integer
 *                 example: 1
 *               dosenPembimbing1Id:
 *                 type: integer
 *                 example: 1
 *               dosenPembimbing2Id:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       201:
 *         description: Sidang registration created successfully
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
  "/",
  verifyToken,
  createSidangRegistrationValidator,
  validate,
  createSidangRegistration,
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
 *             properties:
 *               programType:
 *                 type: string
 *               sidangScheme:
 *                 type: array
 *                 nullable: true
 *                 items:
 *                   type: string
 *               sks:
 *                 type: integer
 *               ipk:
 *                 type: number
 *               tak:
 *                 type: integer
 *               sktaExpDate:
 *                 type: string
 *                 format: date
 *               thesisTitleId:
 *                 type: string
 *               thesisTitleEn:
 *                 type: string
 *               studentId:
 *                 type: integer
 *               dosenPembimbing1Id:
 *                 type: integer
 *               dosenPembimbing2Id:
 *                 type: integer
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
router.delete("/:id", verifyToken, deleteSidangRegistration);

module.exports = router;
