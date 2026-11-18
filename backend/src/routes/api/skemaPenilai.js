import express from "express";
import {
  createSkemaPenilai,
  getSkemaPenilais,
  getSkemaPenilaiById,
  updateSkemaPenilai,
  deleteSkemaPenilai,
} from "../../controllers/skemaPenilaiController.js";
import { verifyToken } from "../../middlewares/auth.js";
import { authorize } from "../../middlewares/authorize.js";
import { validate } from "../../middlewares/validate.js";
import {
  listSkemaPenilaiQuerySchema,
  createSkemaPenilaiSchema,
  updateSkemaPenilaiSchema,
} from "../../schemas/skemaPenilaiSchema.js";

const router = express.Router();

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
 *         description: Search by peran (e.g. dosenPembimbing1)
 *       - in: query
 *         name: studyProgramId
 *         schema:
 *           type: string
 *         description: Filter Skema Penilai by Study Program ID
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [peran, bobot, createdAt]
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort direction
 *       - $ref: '#/components/parameters/pageQueryParam'
 *       - $ref: '#/components/parameters/limitQueryParam'
 *     responses:
 *       200:
 *         description: Skema Penilai data retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Invalid token
 */
router.get(
  "/",
  verifyToken,
  validate(listSkemaPenilaiQuerySchema, "query"),
  getSkemaPenilais,
);

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
 *               - peran
 *               - bobot
 *               - studyProgramId
 *             properties:
 *               peran:
 *                 type: string
 *                 enum: [dosenPembimbing1, dosenPembimbing2, dosenPenguji1, dosenPenguji2]
 *                 example: dosenPembimbing1
 *               bobot:
 *                 type: number
 *                 format: float
 *                 example: 0.6
 *               studyProgramId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Skema Penilai created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied (Admin only)
 *       404:
 *         description: Program Studi tidak ditemukan
 */
router.post(
  "/",
  verifyToken,
  authorize("ADMIN"),
  validate(createSkemaPenilaiSchema),
  createSkemaPenilai,
);

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
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Skema Penilai tidak ditemukan
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
 *               peran:
 *                 type: string
 *                 enum: [dosenPembimbing1, dosenPembimbing2, dosenPenguji1, dosenPenguji2]
 *                 example: dosenPembimbing1
 *               bobot:
 *                 type: number
 *                 format: float
 *                 example: 0.6
 *     responses:
 *       200:
 *         description: Skema Penilai updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied (Admin only)
 *       404:
 *         description: Skema Penilai tidak ditemukan
 */
router.put(
  "/:id",
  verifyToken,
  authorize("ADMIN"),
  validate(updateSkemaPenilaiSchema),
  updateSkemaPenilai,
);

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
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied (Admin only)
 *       404:
 *         description: Skema Penilai tidak ditemukan
 */
router.delete("/:id", verifyToken, authorize("ADMIN"), deleteSkemaPenilai);

export default router;
