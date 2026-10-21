import express from "express";
const router = express.Router();
import { verifyToken } from "../../middlewares/auth.js";
import { isAdmin } from "../../middlewares/authorize.js";
import { validate } from "../../middlewares/validate.js";
import {
  listPeriodQuerySchema,
  createPeriodSchema,
  updatePeriodSchema,
} from "../../schemas/periodSchema.js";
import {
  listYudisiumPeriods,
  getYudisiumPeriodById,
  createYudisiumPeriod,
  updateYudisiumPeriod,
  deleteYudisiumPeriod,
} from "../../controllers/yudisiumPeriodController.js";

/**
 * @swagger
 * tags:
 *   name: Yudisium Period
 *   description: Consolidated Yudisium Period CRUD endpoints
 */

/**
 * @swagger
 * /api/yudisium-periods:
 *   get:
 *     summary: Get all yudisium periods (with filter and pagination)
 *     tags: [Yudisium Period]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Keyword pencarian berdasarkan nama periode atau period
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [pendaftaran, pelaksanaan]
 *         description: Filter periods by category (pendaftaran / pelaksanaan)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [startDate, endDate, createdAt, name, period]
 *           default: startDate
 *         description: Field untuk pengurutan
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Arah pengurutan (asc / desc)
 *       - $ref: '#/components/parameters/pageQueryParam'
 *       - $ref: '#/components/parameters/limitQueryParam'
 *     responses:
 *       200:
 *         description: Yudisium period data retrieved successfully with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 */
router.get(
  "/",
  verifyToken,
  validate(listPeriodQuerySchema, "query"),
  listYudisiumPeriods,
);

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
 *           type: string
 *         required: true
 *         description: Yudisium period ID (UUID)
 *     responses:
 *       200:
 *         description: Yudisium period retrieved successfully
 *       404:
 *         description: Yudisium period not found
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
 *               - category
 *               - period
 *               - startDate
 *               - endDate
 *             properties:
 *               name:
 *                 type: string
 *                 example: Ganjil 2026/2027
 *                 description: Period name
 *               category:
 *                 type: string
 *                 enum: [pendaftaran, pelaksanaan]
 *                 example: pendaftaran
 *                 description: Type of activity (pendaftaran / pelaksanaan)
 *               period:
 *                 type: string
 *                 example: "1"
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
 *         description: Yudisium period created successfully
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
  validate(createPeriodSchema),
  createYudisiumPeriod,
);

/**
 * @swagger
 * /api/yudisium-periods/{id}:
 *   put:
 *     summary: Update yudisium period
 *     tags: [Yudisium Period]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Yudisium period ID (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Ganjil 2026/2027
 *               category:
 *                 type: string
 *                 enum: [pendaftaran, pelaksanaan]
 *                 example: pelaksanaan
 *                 description: Type of activity (pendaftaran / pelaksanaan)
 *               period:
 *                 type: string
 *                 example: "1"
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
 *         description: Yudisium period updated successfully
 *       404:
 *         description: Yudisium period not found
 *       400:
 *         description: Validation error
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 */
router.put(
  "/:id",
  verifyToken,
  isAdmin,
  validate(updatePeriodSchema),
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
 *           type: string
 *         required: true
 *         description: Yudisium period ID (UUID)
 *     responses:
 *       200:
 *         description: Yudisium period deleted successfully
 *       404:
 *         description: Yudisium period not found
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 */
router.delete("/:id", verifyToken, isAdmin, deleteYudisiumPeriod);

export default router;
