import express from "express";

const router = express.Router();

import {
  listResearchGroups,
  findResearchGroupById,
  createResearchGroup,
  updateResearchGroup,
  deleteResearchGroup,
  toggleResearchGroupActive,
} from "../../controllers/researchGroupController.js";

import { verifyToken } from "../../middlewares/auth.js";
import { isAdmin } from "../../middlewares/authorize.js";
import { validate } from "../../middlewares/validate.js";
import {
  listResearchGroupQuerySchema,
  createResearchGroupSchema,
  updateResearchGroupSchema,
} from "../../schemas/researchGroupSchema.js";

/**
 * @swagger
 * tags:
 *   name: Research Group
 *   description: Research group endpoints
 */

/**
 * @swagger
 * /api/research-groups:
 *   get:
 *     summary: Get all research group data (with filter, sort, and pagination)
 *     tags: [Research Group]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by research group name (case-insensitive substring)
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status (true/false)
 *       - in: query
 *         name: studyProgramId
 *         schema:
 *           type: string
 *         description: Filter research groups by connected Study Program ID
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, isActive, createdAt]
 *           default: name
 *         description: Field to sort research groups by (name, isActive, or createdAt)
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order direction (asc or desc)
 *       - $ref: '#/components/parameters/pageQueryParam'
 *       - $ref: '#/components/parameters/limitQueryParam'
 *     responses:
 *       200:
 *         description: Research group data retrieved successfully with pagination
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
  validate(listResearchGroupQuerySchema, "query"),
  listResearchGroups,
);

/**
 * @swagger
 * /api/research-groups:
 *   post:
 *     summary: Create new research group (or restore if previously soft-deleted)
 *     tags: [Research Group]
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
 *                 example: Rekayasa Komputasi Terdistribusi
 *               isActive:
 *                 type: boolean
 *                 example: true
 *               studyProgramIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["3fa85f64-5717-4562-b3fc-2c963f66afa6"]
 *     responses:
 *       201:
 *         description: Research group created successfully
 *       200:
 *         description: Soft-deleted research group restored successfully
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
  isAdmin,
  validate(createResearchGroupSchema),
  createResearchGroup,
);

/**
 * @swagger
 * /api/research-groups/{id}:
 *   get:
 *     summary: Get research group by ID
 *     tags: [Research Group]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Research group UUID
 *     responses:
 *       200:
 *         description: Research group data retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: Research group not found
 */
router.get("/:id", verifyToken, findResearchGroupById);

/**
 * @swagger
 * /api/research-groups/{id}:
 *   put:
 *     summary: Update research group
 *     tags: [Research Group]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Research group UUID
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
 *               studyProgramIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["3fa85f64-5717-4562-b3fc-2c963f66afa6"]
 *     responses:
 *       200:
 *         description: Research group updated successfully
 *       400:
 *         description: Validation error or duplicate name
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied (Admin only)
 *       404:
 *         description: Research group not found
 */
router.put(
  "/:id",
  verifyToken,
  isAdmin,
  validate(updateResearchGroupSchema),
  updateResearchGroup,
);

/**
 * @swagger
 * /api/research-groups/{id}:
 *   delete:
 *     summary: Delete research group (soft delete)
 *     tags: [Research Group]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Research group UUID
 *     responses:
 *       200:
 *         description: Research group deleted successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied (Admin only)
 *       404:
 *         description: Research group not found
 */
router.delete("/:id", verifyToken, isAdmin, deleteResearchGroup);

/**
 * @swagger
 * /api/research-groups/{id}/toggle-active:
 *   patch:
 *     summary: Toggle research group active status (Admin only)
 *     tags: [Research Group]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Research group UUID
 *     responses:
 *       200:
 *         description: Research group status updated successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied (Admin only)
 *       404:
 *         description: Research group not found
 */
router.patch(
  "/:id/toggle-active",
  verifyToken,
  isAdmin,
  toggleResearchGroupActive,
);

export default router;
