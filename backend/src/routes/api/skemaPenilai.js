import express from 'express';

const router = express.Router();

import {
  createSkemaPenilai,
  getSkemaPenilais,
  getSkemaPenilaiById,
  updateSkemaPenilai,
  deleteSkemaPenilai,
} from '../../controllers/skemaPenilaiController.js';

import { verifyToken } from '../../middlewares/auth.js';
import { isAdmin } from '../../middlewares/authorize.js';

/**
 * @swagger
 * tags:
 *   name: Skema Penilai
 *   description: Pengaturan Skema Penilai Prodi endpoints
 */

/**
 * @swagger
 * /api/skema-penilai:
 *   get:
 *     summary: Get all Skema Penilai data (with filter, sort, and pagination)
 *     tags: [Skema Penilai]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by type (e.g. pembimbing_1)
 *       - in: query
 *         name: studyProgramId
 *         schema:
 *           type: string
 *         description: Filter Skema Penilai by Study Program ID
 *       - $ref: '#/components/parameters/pageQueryParam'
 *       - $ref: '#/components/parameters/limitQueryParam'
 *     responses:
 *       200:
 *         description: Skema Penilai data retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 */
router.get("/", verifyToken, getSkemaPenilais);

/**
 * @swagger
 * /api/skema-penilai:
 *   post:
 *     summary: Create new Skema Penilai
 *     tags: [Skema Penilai]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - bobot
 *               - studyProgramId
 *             properties:
 *               type:
 *                 type: string
 *                 example: pembimbing_1
 *               bobot:
 *                 type: number
 *                 format: float
 *                 example: 0.6
 *               studyProgramId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Skema Penilai created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied (Admin only)
 */
router.post("/", verifyToken, isAdmin, createSkemaPenilai); 

/**
 * @swagger
 * /api/skema-penilai/{id}:
 *   get:
 *     summary: Get Skema Penilai by ID
 *     tags: [Skema Penilai]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Skema Penilai UUID
 *     responses:
 *       200:
 *         description: Skema Penilai data retrieved successfully
 *       404:
 *         description: Skema Penilai not found
 */
router.get("/:id", verifyToken, getSkemaPenilaiById);

/**
 * @swagger
 * /api/skema-penilai/{id}:
 *   put:
 *     summary: Update Skema Penilai
 *     tags: [Skema Penilai]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 example: pembimbing_1
 *               bobot:
 *                 type: number
 *                 format: float
 *                 example: 0.6
 *     responses:
 *       200:
 *         description: Skema Penilai updated successfully
 *       404:
 *         description: Skema Penilai not found
 */
router.put("/:id", verifyToken, isAdmin, updateSkemaPenilai); 

/**
 * @swagger
 * /api/skema-penilai/{id}:
 *   delete:
 *     summary: Delete Skema Penilai (soft delete)
 *     tags: [Skema Penilai]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Skema Penilai deleted successfully
 *       404:
 *         description: Skema Penilai not found
 */
router.delete("/:id", verifyToken, isAdmin, deleteSkemaPenilai); 

export default router;