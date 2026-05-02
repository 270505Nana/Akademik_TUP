const express = require("express");
const router = express.Router();
const { verifyToken } = require("../../middlewares/auth");
const { validate } = require("../../middlewares/validate");
const {
  listSidangRegistrationPeriods,
  getSidangRegistrationPeriodById,
  createSidangRegistrationPeriod,
  updateSidangRegistrationPeriod,
  deleteSidangRegistrationPeriod,
} = require("../../controllers/sidangRegistrationPeriodController");
const {
  createSidangRegistrationPeriodValidator,
  updateSidangRegistrationPeriodValidator,
} = require("../../validators/sidangRegistrationPeriodValidator");

/**
 * @swagger
 * tags:
 *   name: Sidang Registration Period
 *   description: Sidang registration period endpoints
 */

/**
 * @swagger
 * /api/sidang-registration-periods:
 *   get:
 *     summary: Get all sidang registration periods
 *     tags: [Sidang Registration Period]
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
router.get("/", verifyToken, listSidangRegistrationPeriods);

/**
 * @swagger
 * /api/sidang-registration-periods/{id}:
 *   get:
 *     summary: Get sidang registration period by ID
 *     tags: [Sidang Registration Period]
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
router.get("/:id", verifyToken, getSidangRegistrationPeriodById);

/**
 * @swagger
 * /api/sidang-registration-periods:
 *   post:
 *     summary: Create new sidang registration period
 *     tags: [Sidang Registration Period]
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
 *                 example: Periode Sidang 2026
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
  createSidangRegistrationPeriodValidator,
  validate,
  createSidangRegistrationPeriod,
);

/**
 * @swagger
 * /api/sidang-registration-periods/{id}:
 *   patch:
 *     summary: Update sidang registration period
 *     tags: [Sidang Registration Period]
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
  updateSidangRegistrationPeriodValidator,
  validate,
  updateSidangRegistrationPeriod,
);

/**
 * @swagger
 * /api/sidang-registration-periods/{id}:
 *   delete:
 *     summary: Delete sidang registration period
 *     tags: [Sidang Registration Period]
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
router.delete("/:id", verifyToken, deleteSidangRegistrationPeriod);

module.exports = router;
