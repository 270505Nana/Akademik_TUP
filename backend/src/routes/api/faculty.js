import express from 'express';

const router = express.Router();

import {
  listFaculties,
  createFaculty,
  findFacultyById,
  updateFaculty,
  deleteFaculty,
  toggleFacultyActive,
} from '../../controllers/facultyController.js';

import { verifyToken } from '../../middlewares/auth.js';
import { isAdmin, authorize } from '../../middlewares/authorize.js';

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
 *     summary: Get all faculty data (with filter, sort, and pagination)
 *     tags: [Faculty]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by faculty name (case-insensitive substring)
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status (true/false)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [a-z, z-a, active-inactive, inactive-active]
 *         description: Sort faculties by name or active status
 *       - $ref: '#/components/parameters/pageQueryParam'
 *       - $ref: '#/components/parameters/limitQueryParam'
 *     responses:
 *       200:
 *         description: Faculty data retrieved successfully with pagination
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
router.get("/", verifyToken, listFaculties);

/**
 * @swagger
 * /api/faculties:
 *   post:
 *     summary: Create new faculty (or restore if previously soft-deleted)
 *     tags: [Faculty]
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
 *             properties:
 *               name:
 *                 type: string
 *                 example: Fakultas Rekayasa Industri
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Faculty created successfully
 *       200:
 *         description: Soft-deleted faculty restored successfully
 *       400:
 *         description: Validation error or duplicate name
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied (Admin only)
 */
router.post(
  "/",
  verifyToken,
  authorize("ADMIN"),
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
 *           type: string
 *         description: Faculty UUID
 *     responses:
 *       200:
 *         description: Faculty data retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
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
 *           type: string
 *         description: Faculty UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Faculty updated successfully
 *       400:
 *         description: Validation error or duplicate name
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied (Admin only)
 *       404:
 *         description: Faculty not found
 */
router.put(
  "/:id",
  verifyToken,
  authorize("ADMIN"),
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
 *           type: string
 *         description: Faculty UUID
 *     responses:
 *       200:
 *         description: Faculty deleted successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied (Admin only)
 *       404:
 *         description: Faculty not found
 */
router.delete("/:id", verifyToken, authorize("ADMIN"), deleteFaculty);

/**
 * @swagger
 * /api/faculties/{id}/toggle-active:
 *   patch:
 *     summary: Toggle faculty active status (Admin only)
 *     tags: [Faculty]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Faculty UUID
 *     responses:
 *       200:
 *         description: Faculty status updated successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied (Admin only)
 *       404:
 *         description: Faculty not found
 */
router.patch(
  "/:id/toggle-active",
  verifyToken,
  authorize("ADMIN"),
  toggleFacultyActive,
);

export default router;
