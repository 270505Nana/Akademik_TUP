import express from "express";
import {
  listDosens,
  upsertDosen,
  findDosenById,
  toggleKetuaKK,
  uploadSignature,
  deleteSignature,
} from "../../controllers/dosenController.js";
import { getDosenDashboard } from "../../controllers/dashboardController.js";
import { verifyToken } from "../../middlewares/auth.js";
import { isAdmin, isDosen } from "../../middlewares/authorize.js";
import { upload } from "../../middlewares/upload.js";
import { validate } from "../../middlewares/validate.js";
import { upsertDosenSchema } from "../../schemas/index.js";

const router = express.Router();

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
 *         name: researchGroupId
 *         schema:
 *           type: string
 *         description: Filter by Research Group ID
 *       - in: query
 *         name: studyProgramId
 *         schema:
 *           type: string
 *         description: Filter by Study Program ID
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
 * /api/dosen/dashboard:
 *   get:
 *     summary: Mengambil ringkasan data dashboard untuk Dosen
 *     tags: [Dosen]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil data dashboard dosen
 */
router.get("/dashboard", verifyToken, getDosenDashboard);

/**
 * @swagger
 * /api/dosen/signature:
 *   post:
 *     summary: Upload tanda tangan elektronik dosen (Dosen login only)
 *     tags: [Dosen]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [signatureFile]
 *             properties:
 *               signatureFile:
 *                 type: string
 *                 format: binary
 *                 description: File gambar tanda tangan (PNG/JPG/JPEG)
 *     responses:
 *       200:
 *         description: Tanda tangan berhasil diunggah
 *       400:
 *         description: File tanda tangan wajib diunggah
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied (Dosen only)
 *       404:
 *         description: Data dosen tidak ditemukan
 *       500:
 *         description: Internal server error
 */
router.post(
  "/signature",
  verifyToken,
  isDosen,
  upload("signatures").single("signatureFile"),
  uploadSignature,
);

/**
 * @swagger
 * /api/dosen/signature:
 *   delete:
 *     summary: Hapus tanda tangan elektronik dosen (Dosen login only)
 *     tags: [Dosen]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tanda tangan berhasil dihapus
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied (Dosen only)
 *       404:
 *         description: Data dosen tidak ditemukan
 *       500:
 *         description: Internal server error
 */
router.delete("/signature", verifyToken, isDosen, deleteSignature);

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
 *             required: [nip, name, researchGroupId, studyProgramId]
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
 *               name:
 *                 type: string
 *                 example: John Doe
 *               researchGroupId:
 *                 type: string
 *                 example: a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11
 *               studyProgramId:
 *                 type: string
 *                 example: a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11
 *               isKetuaKK:
 *                 type: boolean
 *                 example: false
 *               isKetuaProdi:
 *                 type: boolean
 *                 example: false
 *               isKepalaUrusanAkademik:
 *                 type: string
 *                 nullable: true
 *                 example: Kepala Urusan Akademik Fakultas Informatika
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
  validate(upsertDosenSchema),
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
