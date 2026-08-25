import express from 'express';
const router = express.Router();

import {
  listPermohonanSkta,
  createPermohonanSkta,
  updatePermohonanSkta,
  getPermohonanSktaById,
  downloadSkta,
  downloadEvidence,
  approvePermohonanSkta,
  rejectPermohonanSkta,
  generateDokumenValidasiSkta,
  getLatestPermohonanSktaByMahasiswaId,
  downloadValidasi,
} from '../../controllers/permohonanSktaController.js';

import { verifyToken } from '../../middlewares/auth.js';
import { upload } from '../../middlewares/upload.js';
import { isMahasiswa, isAdmin } from '../../middlewares/authorize.js';

/**
 * @swagger
 * tags:
 *   name: Permohonan SKTA
 *   description: Consolidated Permohonan SKTA endpoints
 */

/**
 * @swagger
 * /api/permohonan-skta:
 *   get:
 *     summary: Get all permohonan SKTA data (paginated)
 *     tags: [Permohonan SKTA]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pageQueryParam'
 *       - $ref: '#/components/parameters/limitQueryParam'
 *     responses:
 *       200:
 *         description: Permohonan SKTA data retrieved successfully with pagination
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
 *       500:
 *         description: Internal server error
 */
router.get("/", verifyToken, listPermohonanSkta);

/**
 * @swagger
 * /api/permohonan-skta:
 *   post:
 *     summary: Create a new Permohonan SKTA
 *     tags: [Permohonan SKTA]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Category of permohonan (e.g. "Perubahan Judul", "Perubahan Dosen Pembimbing", "Perubahan Judul dan Dosen Pembimbing", "Perpanjangan SK"). Default is "Permohonan Baru".
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - mahasiswaId
 *               - judulProposalIndonesia
 *               - judulProposalInggris
 *               - dosenPembimbing1Id
 *               - dosenPembimbing2Id
 *               - researchGroupId
 *               - evidence
 *             properties:
 *               mahasiswaId:
 *                 type: string
 *               judulProposalIndonesia:
 *                 type: string
 *               judulProposalInggris:
 *                 type: string
 *               dosenPembimbing1Id:
 *                 type: string
 *               dosenPembimbing2Id:
 *                 type: string
 *               researchGroupId:
 *                 type: string
 *               evidence:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Permohonan SKTA submitted successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
router.post(
  "/",
  verifyToken,
  isMahasiswa,
  upload("skta-evidence").fields([{ name: "evidence", maxCount: 1 }]),
  createPermohonanSkta
);

/**
 * @swagger
 * /api/permohonan-skta/mahasiswa/{mahasiswaId}:
 *   get:
 *     summary: Get latest Permohonan SKTA by mahasiswa ID
 *     tags: [Permohonan SKTA]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mahasiswaId
 *         required: true
 *         schema:
 *           type: string
 *         description: Mahasiswa ID (UUID)
 *     responses:
 *       200:
 *         description: Latest Permohonan SKTA data retrieved successfully
 *       404:
 *         description: Permohonan SKTA data not found
 */
router.get("/mahasiswa/:mahasiswaId", verifyToken, getLatestPermohonanSktaByMahasiswaId);

/**
 * @swagger
 * /api/permohonan-skta/{id}:
 *   get:
 *     summary: Get Permohonan SKTA by ID
 *     tags: [Permohonan SKTA]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Permohonan SKTA ID (UUID)
 *     responses:
 *       200:
 *         description: Permohonan SKTA data retrieved successfully
 *       404:
 *         description: Permohonan SKTA data not found
 */
router.get("/:id", verifyToken, getPermohonanSktaById);

/**
 * @swagger
 * /api/permohonan-skta/{id}:
 *   put:
 *     summary: Update Permohonan SKTA details
 *     tags: [Permohonan SKTA]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               judulProposalIndonesia:
 *                 type: string
 *               judulProposalInggris:
 *                 type: string
 *               dosenPembimbing1Id:
 *                 type: string
 *               dosenPembimbing2Id:
 *                 type: string
 *               researchGroupId:
 *                 type: string
 *               evidence:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Permohonan SKTA updated successfully
 *       404:
 *         description: Permohonan SKTA not found
 */
router.put(
  "/:id",
  verifyToken,
  isMahasiswa,
  upload("skta-evidence").fields([{ name: "evidence", maxCount: 1 }]),
  updatePermohonanSkta
);

/**
 * @swagger
 * /api/permohonan-skta/{id}/download/skta:
 *   get:
 *     summary: Download published SKTA file
 *     tags: [Permohonan SKTA]
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
 *         description: File downloaded successfully
 *       404:
 *         description: File or record not found
 */
router.get("/:id/download/skta", verifyToken, downloadSkta);

/**
 * @swagger
 * /api/permohonan-skta/{id}/download/evidence:
 *   get:
 *     summary: Download evidence file
 *     tags: [Permohonan SKTA]
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
 *         description: File downloaded successfully
 *       404:
 *         description: File or record not found
 */
router.get("/:id/download/evidence", verifyToken, downloadEvidence);

/**
 * @swagger
 * /api/permohonan-skta/{id}/approve:
 *   put:
 *     summary: Approve Permohonan SKTA and issue SKTA file
 *     tags: [Permohonan SKTA]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - adminId
 *             properties:
 *               hasUploadedFinalProposal:
 *                 type: boolean
 *               hasTakenLanguageTest:
 *                 type: boolean
 *               expDate:
 *                 type: string
 *                 format: date
 *               adminId:
 *                 type: string
 *               skta:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Permohonan SKTA approved successfully
 */
router.put(
  "/:id/approve",
  verifyToken,
  isAdmin,
  upload("skta").fields([{ name: "skta", maxCount: 1 }]),
  approvePermohonanSkta
);

/**
 * @swagger
 * /api/permohonan-skta/{id}/reject:
 *   put:
 *     summary: Reject Permohonan SKTA
 *     tags: [Permohonan SKTA]
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
 *             required:
 *               - message
 *               - adminId
 *             properties:
 *               message:
 *                 type: string
 *               adminId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Permohonan SKTA rejected successfully
 */
router.put(
  "/:id/reject",
  verifyToken,
  isAdmin,
  rejectPermohonanSkta
);

/**
 * @swagger
 * /api/permohonan-skta/{id}/generate/dokumen-validasi-skta:
 *   get:
 *     summary: Generate or retrieve existing Dokumen Validasi SKTA
 *     tags: [Permohonan SKTA]
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
 *         description: Retrieve existing Dokumen Validasi SKTA
 *       201:
 *         description: Successfully generated new placeholder Dokumen Validasi SKTA
 */
router.get(
  "/:id/generate/dokumen-validasi-skta",
  verifyToken,
  isAdmin,
  generateDokumenValidasiSkta
);

/**
 * @swagger
 * /api/permohonan-skta/download/validasi/{berkasId}:
 *   get:
 *     summary: Download generated Dokumen Validasi SKTA file
 *     tags: [Permohonan SKTA]
 *     parameters:
 *       - in: path
 *         name: berkasId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File downloaded successfully
 */
router.get("/download/validasi/:berkasId", downloadValidasi);

export default router;
