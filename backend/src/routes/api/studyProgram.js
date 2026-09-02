import express from 'express';

const router = express.Router();

import {
  listStudyPrograms,
  createStudyProgram,
  findStudyProgramById,
  updateStudyProgram,
  deleteStudyProgram,
  toggleStudyProgramActive,
} from '../../controllers/studyProgramController.js';

import { verifyToken } from '../../middlewares/auth.js';
import { isAdmin, authorize } from '../../middlewares/authorize.js';

/**
 * @swagger
 * tags:
 *   name: Study Program
 *   description: Study program endpoints
 */

/**
 * @swagger
 * /api/study-programs:
 *   get:
 *     summary: Get all study program data (with filter, sort, and pagination)
 *     tags: [Study Program]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by study program name (case-insensitive substring)
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status (true/false)
 *       - in: query
 *         name: facultyId
 *         schema:
 *           type: string
 *         description: Filter by Faculty UUID or Name
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [nameAsc, nameDesc, facultyAsc, facultyDesc, activeInactive, inactiveActive, newest, oldest]
 *         description: Sort study programs by name (nameAsc, nameDesc), faculty (facultyAsc, facultyDesc), status (activeInactive, inactiveActive), or creation time (newest, oldest)
 *       - $ref: '#/components/parameters/pageQueryParam'
 *       - $ref: '#/components/parameters/limitQueryParam'
 *     responses:
 *       200:
 *         description: Study program data retrieved successfully with pagination
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
router.get("/", verifyToken, listStudyPrograms);

/**
 * @swagger
 * /api/study-programs:
 *   post:
 *     summary: Create new study program (or restore if previously soft-deleted)
 *     tags: [Study Program]
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
 *               - facultyId
 *             properties:
 *               name:
 *                 type: string
 *                 example: S1 Teknik Industri
 *               facultyId:
 *                 type: string
 *                 example: a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Study program created successfully
 *       200:
 *         description: Soft-deleted study program restored successfully
 *       400:
 *         description: Validation error or duplicate name
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied (Admin only)
 *       404:
 *         description: Faculty not found
 */
router.post(
  "/",
  verifyToken,
  authorize("ADMIN"),
  createStudyProgram,
);

/**
 * @swagger
 * /api/study-programs/{id}:
 *   get:
 *     summary: Get study program by ID
 *     tags: [Study Program]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Study program UUID
 *     responses:
 *       200:
 *         description: Study program data retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: Study program not found
 */
router.get("/:id", verifyToken, findStudyProgramById);

/**
 * @swagger
 * /api/study-programs/{id}:
 *   put:
 *     summary: Update study program
 *     tags: [Study Program]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Study program UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               facultyId:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Study program updated successfully
 *       400:
 *         description: Validation error or duplicate name
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied (Admin only)
 *       404:
 *         description: Study program or Faculty not found
 */
router.put(
  "/:id",
  verifyToken,
  authorize("ADMIN"),
  updateStudyProgram,
);

/**
 * @swagger
 * /api/study-programs/{id}:
 *   delete:
 *     summary: Delete study program (soft delete)
 *     tags: [Study Program]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Study program UUID
 *     responses:
 *       200:
 *         description: Study program deleted successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied (Admin only)
 *       404:
 *         description: Study program not found
 */
router.delete(
  "/:id",
  verifyToken,
  authorize("ADMIN"),
  deleteStudyProgram,
);

/**
 * @swagger
 * /api/study-programs/{id}/toggle-active:
 *   patch:
 *     summary: Toggle study program active status (Admin only)
 *     tags: [Study Program]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Study program UUID
 *     responses:
 *       200:
 *         description: Study program status updated successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied (Admin only)
 *       404:
 *         description: Study program not found
 */
router.patch(
  "/:id/toggle-active",
  verifyToken,
  authorize("ADMIN"),
  toggleStudyProgramActive,
);

export default router;
