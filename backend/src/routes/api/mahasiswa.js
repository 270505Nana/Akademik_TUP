import express from 'express';

const router = express.Router();

import { listMahasiswa,
  upsertMahasiswa,
  findMahasiswaByUserId,
  findMahasiswaById, } from '../../controllers/mahasiswaController.js';

import { verifyToken } from '../../middlewares/auth.js';

import { validate } from '../../middlewares/validate.js';

import { upsertMahasiswaValidator } from '../../validators/mahasiswaValidator.js';
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
 *     summary: Get all mahasiswa data
 *     tags: [Mahasiswa]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Mahasiswa data retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 */
router.get("/", verifyToken, listMahasiswa);

/**
 * @swagger
 * /api/mahasiswa/{userId}:
 *   put:
 *     summary: Create or update mahasiswa data by user ID
 *     tags: [Mahasiswa]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID with MAHASISWA role
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
  "/:userId",
  verifyToken,
  isMahasiswa,
  upsertMahasiswaValidator,
  validate,
  upsertMahasiswa,
);

/**
 * @swagger
 * /api/mahasiswa/{userId}:
 *   get:
 *     summary: Get mahasiswa data by user ID
 *     tags: [Mahasiswa]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID of mahasiswa
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
router.get("/:userId", verifyToken, findMahasiswaByUserId);

/**
 * @swagger
 * /api/mahasiswa/id/{id}:
 *   get:
 *     summary: Get mahasiswa data by student ID
 *     tags: [Mahasiswa]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Mahasiswa ID (not userId) of mahasiswa
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
router.get("/id/:id", verifyToken, findMahasiswaById);

export default router;
