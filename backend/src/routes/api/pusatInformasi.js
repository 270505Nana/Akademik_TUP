import express from 'express';
import { getPusatInformasiPreview } from '../../controllers/pusatInformasiController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Pusat Informasi
 *   description: Pusat Informasi endpoints for public and general academic information
 */

/**
 * @swagger
 * /api/pusat-informasi/preview:
 *   get:
 *     summary: Get nearest sidang and yudisium periods preview (Public)
 *     tags: [Pusat Informasi]
 *     responses:
 *       200:
 *         description: Preview period information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 periodeSidang:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: Sidang Periode Ganjil 2026/2027
 *                     category:
 *                       type: string
 *                       example: pendaftaran sidang
 *                     period:
 *                       type: string
 *                       example: 2026/2027
 *                     startDate:
 *                       type: string
 *                       format: date-time
 *                       example: 2026-05-15T00:00:00.000Z
 *                     endDate:
 *                       type: string
 *                       format: date-time
 *                       example: 2026-06-15T00:00:00.000Z
 *                 periodeYudisium:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: Yudisium Periode Ganjil 2026/2027
 *                     category:
 *                       type: string
 *                       example: pendaftaran yudisium
 *                     period:
 *                       type: string
 *                       example: 2026/2027
 *                     startDate:
 *                       type: string
 *                       format: date-time
 *                       example: 2026-06-01T00:00:00.000Z
 *                     endDate:
 *                       type: string
 *                       format: date-time
 *                       example: 2026-07-01T00:00:00.000Z
 */
router.get("/preview", getPusatInformasiPreview);

export default router;
