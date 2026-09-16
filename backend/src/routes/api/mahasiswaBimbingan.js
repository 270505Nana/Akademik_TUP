import express from "express";
import { listMahasiswaBimbingan } from "../../controllers/mahasiswaBimbinganController.js";
import { verifyToken } from "../../middlewares/auth.js";
import { isDosen } from "../../middlewares/authorize.js";

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
 *           enum: [newest, oldest, studyProgramAsc, studyProgramDesc, nameAsc, nameDesc, nimAsc, nimDesc]
 *         description: Sort option (newest for baru-lama, oldest for lama-baru, studyProgramAsc for nama prodi A-Z, studyProgramDesc for nama prodi Z-A, nameAsc, nameDesc, nimAsc, nimDesc)
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
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                       mahasiswa:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           nim:
 *                             type: string
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                           phone:
 *                             type: string
 *                           kelasAsal:
 *                             type: string
 *                           tahunAngkatan:
 *                             type: integer
 *                           sks:
 *                             type: integer
 *                           ipk:
 *                             type: number
 *                           tak:
 *                             type: integer
 *                           studyProgram:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               isActive:
 *                                 type: boolean
 *                               facultyId:
 *                                 type: string
 *                       judulTugasAkhirIndonesia:
 *                         type: string
 *                         nullable: true
 *                       judulTugasAkhirInggris:
 *                         type: string
 *                         nullable: true
 *                       status:
 *                         type: string
 *                         enum: [SK Terbit, SK Belum Terbit, Dalam Proses, Mengirim Revisi, Kadaluarsa]
 *                       sktaDownloadUrl:
 *                         type: string
 *                         nullable: true
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
router.get("/", verifyToken, isDosen, listMahasiswaBimbingan);

export default router;
