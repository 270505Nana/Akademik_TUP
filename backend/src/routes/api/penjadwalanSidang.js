import express from 'express';
const router = express.Router();
import { verifyToken } from '../../middlewares/auth.js';
import { listPenjadwalanSidang } from '../../controllers/penjadwalanSidangController.js';

/**
 * @swagger
 * tags:
 *   name: Penjadwalan Sidang
 *   description: Penjadwalan sidang endpoints
 */

/**
 * @swagger
 * /api/penjadwalan-sidang:
 *   get:
 *     summary: Get all penjadwalan sidang (paginated)
 *     tags: [Penjadwalan Sidang]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pageQueryParam'
 *       - $ref: '#/components/parameters/limitQueryParam'
 *     responses:
 *       200:
 *         description: Penjadwalan sidang data retrieved successfully with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                       mahasiswa:
 *                         type: object
 *                       dosenPembimbing1:
 *                         type: object
 *                       dosenPembimbing2:
 *                         type: object
 *                       dosenPenguji1:
 *                         type: object
 *                       dosenPenguji2:
 *                         type: object
 *                       tglSidang:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       ruanganSidang:
 *                         type: object
 *                         nullable: true
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 */
router.get("/", verifyToken, listPenjadwalanSidang);

export default router;
