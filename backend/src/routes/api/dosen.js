import express from 'express';

const router = express.Router();

import { listDosens,
  upsertDosen,
  findDosenById,
  toggleKetuaKK, } from '../../controllers/dosenController.js';

import { verifyToken } from '../../middlewares/auth.js';

import { isAdmin } from '../../middlewares/authorize.js';

/**
 * @swagger
 * tags:
 *   name: Dosen
 *   description: Dosen endpoints
 */

/**
 * @swagger
 * /api/dosen:
 *   get:
 *     summary: Get all dosen data (with search, filter, sort, and pagination)
 *     tags: [Dosen]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search keyword across name, NIP, NIDN, or kode dosen
 *       - in: query
 *         name: researchGroup
 *         schema:
 *           type: string
 *         description: Filter by Research Group ID or Name
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [nameAsc, nameDesc, researchGroupAsc, researchGroupDesc, newest, oldest]
 *         description: Sort dosen by name (nameAsc, nameDesc), research group (researchGroupAsc, researchGroupDesc), or creation time (newest, oldest)
 *       - $ref: '#/components/parameters/pageQueryParam'
 *       - $ref: '#/components/parameters/limitQueryParam'
 *     responses:
 *       200:
 *         description: Dosen data retrieved successfully with pagination
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
router.get("/", verifyToken, listDosens);

/**
 * @swagger
 * /api/dosen/{id}:
 *   put:
 *     summary: Create or update dosen data by Dosen ID or User ID (Admin only)
 *     tags: [Dosen]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Dosen ID or User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nip, name, researchGroupId]
 *             properties:
 *               nip:
 *                 type: string
 *                 example: 20000505201901001
 *               nidn:
 *                 type: string
 *                 example: 1122334455
 *               kodeDosen:
 *                 type: string
 *                 example: JDO
 *               lecturerCode:
 *                 type: string
 *                 example: JDO
 *               name:
 *                 type: string
 *                 example: John Doe
 *               researchGroupId:
 *                 type: string
 *                 example: a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11
 *     responses:
 *       200:
 *         description: Dosen data created or updated successfully
 *       400:
 *         description: User is not a dosen
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied or Invalid token
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.put(
  "/:id",
  verifyToken,
  isAdmin,
  upsertDosen,
);

/**
 * @swagger
 * /api/dosen/{id}:
 *   get:
 *     summary: Get dosen data by Dosen ID or User ID
 *     tags: [Dosen]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Dosen ID or User ID
 *     responses:
 *       200:
 *         description: Dosen data retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: Dosen data not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id", verifyToken, findDosenById);

/**
 * @swagger
 * /api/dosen/{id}/toggle-ketua-kk:
 *   patch:
 *     summary: Toggle isKetuaKK status of dosen by Dosen ID or User ID (Admin only)
 *     tags: [Dosen]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Dosen ID or User ID
 *     responses:
 *       200:
 *         description: Toggle Ketua KK status successful
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied or Invalid token
 *       404:
 *         description: Dosen data not found
 *       500:
 *         description: Internal server error
 */
router.patch("/:id/toggle-ketua-kk", verifyToken, isAdmin, toggleKetuaKK);

export default router;
