import express from "express";
import { listMahasiswaBimbingan } from "../../controllers/mahasiswaBimbinganController.js";
import { verifyToken } from "../../middlewares/auth.js";
import { authorize } from "../../middlewares/authorize.js";
import { validate } from "../../middlewares/validate.js";
import { listMahasiswaBimbinganQuerySchema } from "../../schemas/mahasiswaBimbinganSchema.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Mahasiswa Bimbingan
 *   description: Endpoints for managing and viewing supervised students (Dosen only)
 */

/**
 * @swagger
 * /api/mahasiswa-bimbingan:
 *   get:
 *     summary: Get all supervised student sidang registrations for logged in dosen (with search, filter, sort, and pagination)
 *     tags: [Mahasiswa Bimbingan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search keyword across student name, NIM, and thesis titles (Indonesian & English)
 *       - in: query
 *         name: studyProgramId
 *         schema:
 *           type: string
 *         description: Filter by Study Program ID (UUID)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [newest, oldest, studyProgramAsc, studyProgramDesc, nameAsc, nameDesc, nimAsc, nimDesc, createdAt, name, nim, studyProgram]
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort direction
 *       - $ref: '#/components/parameters/pageQueryParam'
 *       - $ref: '#/components/parameters/limitQueryParam'
 *     responses:
 *       200:
 *         description: Mahasiswa bimbingan registrations retrieved successfully with pagination
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
 *         description: Access denied (Dosen role required)
 *       404:
 *         description: Data Dosen not found
 *       500:
 *         description: Internal server error
 */
router.get(
  "/",
  verifyToken,
  authorize("DOSEN"),
  validate(listMahasiswaBimbinganQuerySchema, "query"),
  listMahasiswaBimbingan
);

export default router;
