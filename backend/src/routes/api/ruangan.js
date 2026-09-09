import express from 'express';
const router = express.Router();
import {
  createRuangan,
  getRuangans,
  getRuanganById,
  updateRuangan,
  deleteRuangan,
} from '../../controllers/ruanganController.js';

import { verifyToken } from '../../middlewares/auth.js';
import { isAdmin } from '../../middlewares/authorize.js';

/**
 * @swagger
 * tags:
 *   name: Ruangan
 *   description: API untuk manajemen Master Data Ruangan Sidang
 */

/**
 * @swagger
 * /api/ruangan:
 *   post:
 *     summary: Menambahkan data ruangan baru
 *     tags: [Ruangan]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Ruang A302"
 *               gedung:
 *                 type: string
 *                 example: "Gedung IoT"
 *     responses:
 *       201:
 *         description: Data ruangan berhasil ditambahkan
 *       400:
 *         description: Nama ruangan dan gedung wajib diisi
 */
router.post('/', verifyToken, isAdmin, createRuangan);

/**
 * @swagger
 * /api/ruangan:
 *   get:
 *     summary: Mengambil semua data ruangan
 *     tags: [Ruangan]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil data ruangan
 */
router.get('/', verifyToken, getRuangans);

/**
 * @swagger
 * /api/ruangan/{id}:
 *   get:
 *     summary: Mengambil data ruangan berdasarkan ID
 *     tags: [Ruangan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID Ruangan
 *     responses:
 *       200:
 *         description: Data ruangan ditemukan
 *       404:
 *         description: Data ruangan tidak ditemukan
 */
router.get('/:id', verifyToken, getRuanganById);

/**
 * @swagger
 * /api/ruangan/{id}:
 *   put:
 *     summary: Mengubah data ruangan (termasuk status aktif/non-aktif)
 *     tags: [Ruangan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID Ruangan
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Ruang A302"
 *               gedung:
 *                 type: string
 *                 example: "Gedung Rektorat"
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Data ruangan berhasil diperbarui
 *       404:
 *         description: Data ruangan tidak ditemukan
 */
router.put('/:id', verifyToken, isAdmin, updateRuangan);

/**
 * @swagger
 * /api/ruangan/{id}:
 *   delete:
 *     summary: Menghapus data ruangan (Soft Delete)
 *     tags: [Ruangan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID Ruangan
 *     responses:
 *       200:
 *         description: Data ruangan berhasil dihapus
 *       404:
 *         description: Data ruangan tidak ditemukan
 */
router.delete('/:id', verifyToken, isAdmin, deleteRuangan);

export default router;