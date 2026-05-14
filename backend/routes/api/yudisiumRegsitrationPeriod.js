const express = require("express");
const router = express.Router();
const { verifyToken } = require("../../middlewares/auth");
const { validate } = require("../../middlewares/validate");
const {
  listYudisiumRegistrationPeriods,
  getYudisiumRegistrationPeriodById,
  createYudisiumRegistrationPeriod,
  updateYudisiumRegistrationPeriod,
  deleteYudisiumRegistrationPeriod,
} = require("../../controllers/yudisiumRegistrationPeriodController");
const {
  createYudisiumRegistrationPeriodValidator,
  updateYudisiumRegistrationPeriodValidator,
} = require("../../validators/yudisiumRegistrationPeriodValidator");
const { isAcademicStaff } = require("../../middlewares/authorize");

/**
 * @swagger
 * tags:
 *   name: Yudisium Registration Period
 *   description: Yudisium registration period endpoints
 */

/**
 * @swagger
 * /api/yudisium-registration-periods:
 *   get:
 *     summary: Get all yudisium registration periods
 *     tags: [Yudisium Registration Period]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sidang registration period data retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 */
router.get("/", verifyToken, listYudisiumRegistrationPeriods);

/**
 * @swagger
 * /api/yudisium-registration-periods/{id}:
 *   get:
 *     summary: Get yudisium registration period by ID
 *     tags: [Yudisium Registration Period]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Sidang registration period ID
 *     responses:
 *       200:
 *         description: Sidang registration period retrieved successfully
 *       404:
 *         description: Sidang registration period not found
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 */
router.get("/:id", verifyToken, getYudisiumRegistrationPeriodById);

/**
 * @swagger
 * /api/yudisium-registration-periods:
 *   post:
 *     summary: Create new yudisium registration period
 *     tags: [Yudisium Registration Period]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - startDate
 *               - endDate
 *             properties:
 *               name:
 *                 type: string
 *                 example: Periode Yudisium 2026
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-05-15T00:00:00.000Z
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-06-15T00:00:00.000Z
 *               isOpen:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       201:
 *         description: Sidang registration period created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 */
router.post(
  "/",
  verifyToken,
  isAcademicStaff,
  createYudisiumRegistrationPeriodValidator,
  validate,
  createYudisiumRegistrationPeriod,
);

/**
 * @swagger
 * /api/yudisium-registration-periods/{id}:
 *   patch:
 *     summary: Update yudisium registration period
 *     tags: [Yudisium Registration Period]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Sidang registration period ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Updated Period Name
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-05-20T00:00:00.000Z
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-06-20T00:00:00.000Z
 *               isOpen:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Sidang registration period updated successfully
 *       404:
 *         description: Sidang registration period not found
 *       400:
 *         description: Validation error
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 */
router.patch(
  "/:id",
  verifyToken,
  isAcademicStaff,
  updateYudisiumRegistrationPeriodValidator,
  validate,
  updateYudisiumRegistrationPeriod,
);

/**
 * @swagger
 * /api/yudisium-registration-periods/{id}:
 *   delete:
 *     summary: Delete yudisium registration period
 *     tags: [Yudisium Registration Period]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Sidang registration period ID
 *     responses:
 *       200:
 *         description: Sidang registration period deleted successfully
 *       404:
 *         description: Sidang registration period not found
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 */
router.delete(
  "/:id",
  verifyToken,
  isAcademicStaff,
  deleteYudisiumRegistrationPeriod,
);

module.exports = router;
