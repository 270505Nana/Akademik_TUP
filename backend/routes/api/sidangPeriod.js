const express = require("express");
const router = express.Router();
const { verifyToken } = require("../../middlewares/auth");
const { validate } = require("../../middlewares/validate");
const {
  listSidangPeriods,
  getSidangPeriodById,
  createSidangPeriod,
  updateSidangPeriod,
  deleteSidangPeriod,
} = require("../../controllers/sidangPeriodController");
const {
  createSidangPeriodValidator,
  updateSidangPeriodValidator,
} = require("../../validators/sidangPeriodValidator");
const { isAcademicStaff } = require("../../middlewares/authorize");

/**
 * @swagger
 * tags:
 *   name: Sidang Period
 *   description: Sidang period endpoints
 */

/**
 * @swagger
 * /api/sidang-periods:
 *   get:
 *     summary: Get all sidang periods
 *     tags: [Sidang Period]
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
router.get("/", verifyToken, listSidangPeriods);

/**
 * @swagger
 * /api/sidang-periods/{id}:
 *   get:
 *     summary: Get sidang period by ID
 *     tags: [Sidang Period]
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
router.get("/:id", verifyToken, getSidangPeriodById);

/**
 * @swagger
 * /api/sidang-periods:
 *   post:
 *     summary: Create new sidang period
 *     tags: [Sidang Period]
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
  createSidangPeriodValidator,
  validate,
  createSidangPeriod,
);

/**
 * @swagger
 * /api/sidang-periods/{id}:
 *   patch:
 *     summary: Update sidang period
 *     tags: [Sidang Period]
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
  updateSidangPeriodValidator,
  validate,
  updateSidangPeriod,
);

/**
 * @swagger
 * /api/sidang-periods/{id}:
 *   delete:
 *     summary: Delete sidang period
 *     tags: [Sidang Period]
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
router.delete("/:id", verifyToken, isAcademicStaff, deleteSidangPeriod);

module.exports = router;
