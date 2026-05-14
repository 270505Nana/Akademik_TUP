const express = require("express");
const router = express.Router();
const { verifyToken } = require("../../middlewares/auth");
const { validate } = require("../../middlewares/validate");
const {
  listYudisiumPeriods,
  getYudisiumPeriodById,
  createYudisiumPeriod,
  updateYudisiumPeriod,
  deleteYudisiumPeriod,
} = require("../../controllers/yudisiumPeriodController");
const {
  createYudisiumPeriodValidator,
  updateYudisiumPeriodValidator,
} = require("../../validators/yudisiumPeriodValidator");
const { isAcademicStaff } = require("../../middlewares/authorize");

/**
 * @swagger
 * tags:
 *   name: Yudisium Period
 *   description: Yudisium period endpoints
 */

/**
 * @swagger
 * /api/yudisium-periods:
 *   get:
 *     summary: Get all yudisium periods
 *     tags: [Yudisium Period]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sidang period data retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 */
router.get("/", verifyToken, listYudisiumPeriods);

/**
 * @swagger
 * /api/yudisium-periods/{id}:
 *   get:
 *     summary: Get yudisium period by ID
 *     tags: [Yudisium Period]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Sidang period ID
 *     responses:
 *       200:
 *         description: Sidang period retrieved successfully
 *       404:
 *         description: Sidang period not found
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 */
router.get("/:id", verifyToken, getYudisiumPeriodById);

/**
 * @swagger
 * /api/yudisium-periods:
 *   post:
 *     summary: Create new yudisium period
 *     tags: [Yudisium Period]
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
 *         description: Sidang period created successfully
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
  createYudisiumPeriodValidator,
  validate,
  createYudisiumPeriod,
);

/**
 * @swagger
 * /api/yudisium-periods/{id}:
 *   patch:
 *     summary: Update yudisium period
 *     tags: [Yudisium Period]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Sidang period ID
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
 *         description: Sidang period updated successfully
 *       404:
 *         description: Sidang period not found
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
  updateYudisiumPeriodValidator,
  validate,
  updateYudisiumPeriod,
);

/**
 * @swagger
 * /api/yudisium-periods/{id}:
 *   delete:
 *     summary: Delete yudisium period
 *     tags: [Yudisium Period]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Sidang period ID
 *     responses:
 *       200:
 *         description: Sidang period deleted successfully
 *       404:
 *         description: Sidang period not found
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 */
router.delete("/:id", verifyToken, isAcademicStaff, deleteYudisiumPeriod);

module.exports = router;
