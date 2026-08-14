import express from 'express';
const router = express.Router();
import { verifyToken } from '../../middlewares/auth.js';
import { listSidangPeriods,
  getSidangPeriodById,
  createSidangPeriod,
  updateSidangPeriod,
  deleteSidangPeriod, } from '../../controllers/sidangPeriodController.js';
import { isAdmin } from '../../middlewares/authorize.js';

/**
 * @swagger
 * tags:
 *   name: Sidang Period
 *   description: Consolidated Sidang Period CRUD endpoints
 */

/**
 * @swagger
 * /api/sidang-periods:
 *   get:
 *     summary: Get all sidang periods
 *     tags: [Sidang Period]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter periods by category (pendaftaran sidang / sidang)
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
 *           type: string
 *         required: true
 *         description: Sidang period ID (UUID)
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
 *               - category
 *               - period
 *               - startDate
 *               - endDate
 *             properties:
 *               category:
 *                 type: string
 *                 example: pendaftaran sidang
 *                 description: Type of activity (pendaftaran sidang / sidang)
 *               period:
 *                 type: string
 *                 example: 2026/2027
 *                 description: Academic period
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
  isAdmin,
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
 *           type: string
 *         required: true
 *         description: Sidang period ID (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               category:
 *                 type: string
 *                 example: sidang
 *               period:
 *                 type: string
 *                 example: 2026/2027
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
  isAdmin,
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
 *           type: string
 *         required: true
 *         description: Sidang period ID (UUID)
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
router.delete("/:id", verifyToken, isAdmin, deleteSidangPeriod);

export default router;
