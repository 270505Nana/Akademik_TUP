import express from 'express';

const router = express.Router();

import { listMahasiswa,
  upsertMahasiswa,
  findMahasiswaById, } from '../../controllers/mahasiswaController.js';

import { verifyToken } from '../../middlewares/auth.js';

import { isMahasiswa } from '../../middlewares/authorize.js';

/**
 * @swagger
 * tags:
 *   name: Mahasiswa
 *   description: Mahasiswa endpoints
 */

/**
 * @swagger
 * /api/mahasiswa:
 *   get:
 *     summary: Get all mahasiswa data (paginated)
 *     tags: [Mahasiswa]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pageQueryParam'
 *       - $ref: '#/components/parameters/limitQueryParam'
 *     responses:
 *       200:
 *         description: Mahasiswa data retrieved successfully with pagination
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
router.get("/", verifyToken, listMahasiswa);

/**
 * @swagger
 * /api/mahasiswa/{id}:
 *   put:
 *     summary: Create or update mahasiswa data by Mahasiswa ID or User ID
 *     tags: [Mahasiswa]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Mahasiswa ID or User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [
 *               nim,
 *               name,
 *               studyProgramId,
 *               dosenWaliId
 *             ]
 *             properties:
 *               nim:
 *                 type: string
 *                 example: 2011104001
 *               name:
 *                 type: string
 *                 example: John Doe
 *               className:
 *                 type: string
 *                 example: SE-07-01
 *               kelasAsal:
 *                 type: string
 *                 example: SE-07-01
 *               year:
 *                 type: integer
 *                 example: 2023
 *               tahunAngkatan:
 *                 type: integer
 *                 example: 2023
 *               sks:
 *                 type: integer
 *                 nullable: true
 *                 example: 120
 *               ipk:
 *                 type: number
 *                 format: float
 *                 nullable: true
 *                 example: 3.5
 *               tak:
 *                 type: integer
 *                 nullable: true
 *                 example: 80
 *               studyProgramId:
 *                 type: string
 *                 example: a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11
 *               dosenWaliId:
 *                 type: string
 *                 example: a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11
 *     responses:
 *       200:
 *         description: Mahasiswa data created or updated successfully
 *       400:
 *         description: User is not a mahasiswa
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.put(
  "/:id",
  verifyToken,
  isMahasiswa,
  upsertMahasiswa,
);

/**
 * @swagger
 * /api/mahasiswa/{id}:
 *   get:
 *     summary: Get mahasiswa data by Mahasiswa ID or User ID
 *     tags: [Mahasiswa]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Mahasiswa ID or User ID
 *     responses:
 *       200:
 *         description: Mahasiswa data retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: Mahasiswa data not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id", verifyToken, findMahasiswaById);

export default router;
