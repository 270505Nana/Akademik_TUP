import express from "express";
const router = express.Router();
import {
  createRuangan,
  getRuangans,
  getRuanganById,
  updateRuangan,
  deleteRuangan,
} from "../../controllers/ruanganController.js";

import { verifyToken } from "../../middlewares/auth.js";
import { isAdmin } from "../../middlewares/authorize.js";
import { validate } from "../../middlewares/validate.js";
import {
  createRuanganSchema,
  updateRuanganSchema,
  listRuanganQuerySchema,
} from "../../schemas/index.js";

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
 *             required:
 *               - name
 *               - gedung
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Ruang A302"
 *               gedung:
 *                 type: string
 *                 example: "Gedung IoT"
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Data ruangan berhasil ditambahkan
 *       400:
 *         description: Nama ruangan dan gedung wajib diisi
 */
router.post(
  "/",
  verifyToken,
  isAdmin,
  validate(createRuanganSchema),
  createRuangan,
);

/**
 * @swagger
 * /api/ruangan:
 *   get:
 *     summary: Mengambil semua data ruangan
 *     tags: [Ruangan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Keyword pencarian berdasarkan nama ruangan atau gedung
 *       - in: query
 *         name: gedung
 *         schema:
 *           type: string
 *         description: Filter berdasarkan nama gedung
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter status aktif (true/false)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, gedung, isActive, createdAt]
 *           default: gedung
 *         description: Field untuk sorting
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Arah sorting (asc atau desc)
 *     responses:
 *       200:
 *         description: Berhasil mengambil data ruangan
 */
router.get(
  "/",
  verifyToken,
  validate(listRuanganQuerySchema, "query"),
  getRuangans,
);

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
router.get("/:id", verifyToken, getRuanganById);

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
router.put(
  "/:id",
  verifyToken,
  isAdmin,
  validate(updateRuanganSchema),
  updateRuangan,
);

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
router.delete("/:id", verifyToken, isAdmin, deleteRuangan);

export default router;