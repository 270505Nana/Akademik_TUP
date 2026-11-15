import express from "express";
const router = express.Router();
import { verifyToken } from "../../middlewares/auth.js";
import { authorize } from "../../middlewares/authorize.js";
import { upload } from "../../middlewares/upload.js";
import { validate } from "../../middlewares/validate.js";
import {
  listSidangQuerySchema,
  saveSidangDraftSchema,
  adminEditSidangSchema,
  submitSidangSchema,
  approveSidangSchema,
  rejectSidangSchema,
  cekKelompokCapstoneQuerySchema,
} from "../../schemas/sidangSchema.js";
import {
  listSidangRegistrations,
  getSidangRegistrationById,
  getSidangRegistrationByMahasiswaId,
  saveSidangRegistration,
  editSidangRegistrationByAdmin,
  submitSidangRegistration,
  deleteSidangRegistration,
  uploadSidangRegistrationFile,
  getSidangRegistrationFiles,
  downloadSidangRegistrationFile,
  approveSidangRegistration,
  rejectSidangRegistration,
  toggleLockSidangRegistration,
  cekKelompokCapstone,
} from "../../controllers/sidangRegistrationController.js";

/**
 * @swagger
 * tags:
 *   name: Sidang Registration
 *   description: Sidang registration endpoints
 */

/**
 * @swagger
 * /api/sidang-registrations:
 *   get:
 *     summary: Get all sidang registrations (with search, studyProgramId, skemaSidang, status filter, sort, and pagination)
 *     tags: [Sidang Registration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search keyword across mahasiswa name, NIM, or judul tugas akhir (Indonesia / Inggris)
 *       - in: query
 *         name: studyProgramId
 *         schema:
 *           type: string
 *         description: Filter by Study Program ID
 *       - in: query
 *         name: skemaSidang
 *         schema:
 *           type: string
 *           example: Capstone
 *         description: Filter pendaftaran sidang berdasarkan skema sidang (mengutamakan skemaSidangFinal jika sudah diisi/disetujui)
 *       - in: query
 *         name: jalurNonSidang
 *         schema:
 *           type: string
 *           example: "Publikasi Jurnal"
 *         description: Filter pendaftaran sidang berdasarkan jalur non sidang (mengutamakan jalurNonSidangFinal jika sudah diisi/disetujui)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *             - "Dalam Proses"
 *             - "Perlu Revisi"
 *             - "Revisi Diajukan"
 *             - "Pendaftaran Diterima"
 *             - "Siap Sidang"
 *         description: Filter pendaftaran sidang berdasarkan status
 *       - in: query
 *         name: sidangRegistrationPeriodId
 *         schema:
 *           type: string
 *         description: Filter pendaftaran sidang berdasarkan ID periode pendaftaran sidang. Jika tidak disertakan, otomatis menampilkan pendaftaran pada periode pendaftaran aktif atau kemarin terdekat.
 *       - in: query
 *         name: sidangPeriodId
 *         schema:
 *           type: string
 *         description: Filter pendaftaran sidang berdasarkan ID periode pelaksanaan sidang (yang sudah disetujui / dijadwalkan).
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [newest, oldest]
 *           default: newest
 *         description: Sort option (newest atau oldest)
 *       - $ref: '#/components/parameters/pageQueryParam'
 *       - $ref: '#/components/parameters/limitQueryParam'
 *     responses:
 *       200:
 *         description: Sidang registrations data retrieved successfully with pagination
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
router.get(
  "/",
  verifyToken,
  validate(listSidangQuerySchema, "query"),
  listSidangRegistrations,
);

/**
 * @swagger
 * /api/sidang-registrations/cek-kelompok-capstone:
 *   get:
 *     summary: Cek anggota kelompok capstone berdasarkan judul tugas akhir pada periode pendaftaran aktif
 *     tags: [Sidang Registration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: judul
 *         required: true
 *         schema:
 *           type: string
 *         description: Judul tugas akhir Capstone yang dicari (Bahasa Indonesia atau Inggris).
 *         example: Rancang Bangun Sistem Monitoring IoT
 *     responses:
 *       200:
 *         description: Data kelompok capstone berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Data kelompok capstone berhasil diambil
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: N**** D**** M******
 *                       nim:
 *                         type: string
 *                         example: "*******019"
 *       400:
 *         description: Validation error
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 */
router.get(
  "/cek-kelompok-capstone",
  verifyToken,
  validate(cekKelompokCapstoneQuerySchema, "query"),
  cekKelompokCapstone,
);

/**
 * @swagger
 * /api/sidang-registrations/{id}:
 *   get:
 *     summary: Get sidang registration by ID
 *     tags: [Sidang Registration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sidang registration ID (UUID)
 *     responses:
 *       200:
 *         description: Sidang registration data retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: Sidang registration not found
 */
router.get("/:id", verifyToken, getSidangRegistrationById);

/**
 * @swagger
 * /api/sidang-registrations/student/{mahasiswaId}:
 *   get:
 *     summary: Get sidang registration by student ID
 *     tags: [Sidang Registration]
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
 *         description: Sidang registration data retrieved successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: Sidang registration not found
 */
router.get(
  "/student/:mahasiswaId",
  verifyToken,
  getSidangRegistrationByMahasiswaId,
);

/**
 * @swagger
 * /api/sidang-registrations/:
 *   post:
 *     summary: Save draft sidang registration
 *     tags: [Sidang Registration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               programType:
 *                 type: string
 *               sidangScheme:
 *                 type: string
 *               jalurNonSidang:
 *                 type: array
 *                 items:
 *                   type: string
 *               lulusTesBahasa:
 *                 type: boolean
 *               sks:
 *                 type: integer
 *               ipk:
 *                 type: number
 *               tak:
 *                 type: integer
 *               sktaExpDate:
 *                 type: string
 *                 format: date-time
 *               thesisTitleId:
 *                 type: string
 *               thesisTitleEn:
 *                 type: string
 *               mahasiswaId:
 *                 type: string
 *               dosenPembimbing1Id:
 *                 type: string
 *               dosenPembimbing2Id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sidang registration saved as draft successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: Mahasiswa or lecturer not found
 *       500:
 *         description: Internal server error
 */
router.post(
  "/",
  verifyToken,
  authorize("MAHASISWA"),
  validate(saveSidangDraftSchema),
  saveSidangRegistration,
);

/**
 * @swagger
 * /api/sidang-registrations/{id}/admin-edit:
 *   put:
 *     summary: Edit sidang registration (Admin only)
 *     tags: [Sidang Registration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sidang registration ID (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Same fields as the draft endpoint, without id
 *             properties:
 *               mahasiswaId:
 *                 type: string
 *                 format: uuid
 *                 description: ID mahasiswa
 *               program:
 *                 type: string
 *                 example: Reguler
 *               skemaSidang:
 *                 type: string
 *                 example: Reguler
 *               jalurNonSidang:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: []
 *               lulusTesBahasa:
 *                 type: boolean
 *                 example: true
 *               sks:
 *                 type: integer
 *                 example: 144
 *               ipk:
 *                 type: number
 *                 format: float
 *                 example: 3.75
 *               tak:
 *                 type: integer
 *                 example: 85
 *               sktaExpDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-12-31T23:59:59.000Z"
 *               judulTugasAkhirIndonesia:
 *                 type: string
 *                 example: Sistem Informasi Akademik Terintegrasi
 *               judulTugasAkhirInggris:
 *                 type: string
 *                 example: Integrated Academic Information System
 *               dosenPembimbing1Id:
 *                 type: string
 *                 format: uuid
 *                 description: ID dosen pembimbing 1
 *               dosenPembimbing2Id:
 *                 type: string
 *                 format: uuid
 *                 description: ID dosen pembimbing 2
 *             example:
 *               mahasiswaId: "00000000-0000-0000-0000-000000000001"
 *               program: Reguler
 *               skemaSidang: Reguler
 *               jalurNonSidang: []
 *               lulusTesBahasa: true
 *               sks: 144
 *               ipk: 3.75
 *               tak: 85
 *               sktaExpDate: "2026-12-31T23:59:59.000Z"
 *               judulTugasAkhirIndonesia: Sistem Informasi Akademik Terintegrasi
 *               judulTugasAkhirInggris: Integrated Academic Information System
 *               dosenPembimbing1Id: "00000000-0000-0000-0000-000000000002"
 *               dosenPembimbing2Id: "00000000-0000-0000-0000-000000000003"
 *     responses:
 *       200:
 *         description: Sidang registration updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied (Admin only)
 *       404:
 *         description: Sidang registration or referenced entity not found
 */
router.put(
  "/:id/admin-edit",
  verifyToken,
  authorize("ADMIN"),
  validate(adminEditSidangSchema),
  editSidangRegistrationByAdmin,
);

/**
 * @swagger
 * /api/sidang-registrations/submit:
 *   post:
 *     summary: Submit sidang registration
 *     tags: [Sidang Registration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - programType
 *               - sks
 *               - ipk
 *               - tak
 *               - sktaExpDate
 *               - thesisTitleId
 *               - thesisTitleEn
 *               - mahasiswaId
 *               - dosenPembimbing1Id
 *               - dosenPembimbing2Id
 *             properties:
 *               id:
 *                 type: string
 *               programType:
 *                 type: string
 *               sidangScheme:
 *                 type: string
 *               jalurNonSidang:
 *                 type: array
 *                 items:
 *                   type: string
 *               lulusTesBahasa:
 *                 type: boolean
 *               sks:
 *                 type: integer
 *               ipk:
 *                 type: number
 *               tak:
 *                 type: integer
 *               sktaExpDate:
 *                 type: string
 *                 format: date-time
 *               thesisTitleId:
 *                 type: string
 *               thesisTitleEn:
 *                 type: string
 *               mahasiswaId:
 *                 type: string
 *               dosenPembimbing1Id:
 *                 type: string
 *               dosenPembimbing2Id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sidang registration submitted successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: Mahasiswa or lecturer not found
 *       500:
 *         description: Internal server error
 */
router.post(
  "/submit",
  verifyToken,
  authorize("MAHASISWA"),
  validate(submitSidangSchema),
  submitSidangRegistration,
);

/**
 * @swagger
 * /api/sidang-registrations/{id}:
 *   delete:
 *     summary: Delete sidang registration
 *     tags: [Sidang Registration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sidang registration ID (UUID)
 *     responses:
 *       200:
 *         description: Sidang registration deleted successfully
 *       401:
 *         description: Token not found
 *       403:
 *         description: Invalid token
 *       404:
 *         description: Sidang registration not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", verifyToken, authorize("ADMIN"), deleteSidangRegistration);

/**
 * @swagger
 * /api/sidang-registrations/{id}/uploads:
 *   post:
 *     summary: Upload a file for a sidang registration
 *     tags: [Sidang Registration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sidang registration ID (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - slug
 *               - name
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The file to upload
 *               slug:
 *                 type: string
 *                 description: The unique identifier for this file type
 *               name:
 *                 type: string
 *                 description: Human readable name of the file
 *     responses:
 *       200:
 *         description: File uploaded/updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Token not found
 *       404:
 *         description: Sidang registration not found
 *       500:
 *         description: Internal server error
 */
router.post(
  "/:id/uploads",
  verifyToken,
  authorize("MAHASISWA", "ADMIN"),
  upload("sidang-requirements").single("file"),
  uploadSidangRegistrationFile,
);

/**
 * @swagger
 * /api/sidang-registrations/{id}/uploads:
 *   get:
 *     summary: Get all uploaded files for a sidang registration
 *     tags: [Sidang Registration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sidang registration ID (UUID)
 *     responses:
 *       200:
 *         description: Files retrieved successfully
 *       401:
 *         description: Token not found
 *       404:
 *         description: Sidang registration not found
 */
router.get("/:id/uploads", verifyToken, getSidangRegistrationFiles);

/**
 * @swagger
 * /api/sidang-registrations/uploads/{uploadId}/download:
 *   get:
 *     summary: Download an uploaded file
 *     tags: [Sidang Registration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uploadId
 *         required: true
 *         schema:
 *           type: string
 *         description: Upload ID (UUID)
 *     responses:
 *       200:
 *         description: File downloaded successfully
 *       401:
 *         description: Token not found
 *       404:
 *         description: Upload not found
 */
router.get(
  "/uploads/:uploadId/download",
  verifyToken,
  downloadSidangRegistrationFile,
);

/**
 * @swagger
 * /api/sidang-registrations/{id}/approve:
 *   put:
 *     summary: Approve sidang registration
 *     tags: [Sidang Registration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sidang registration ID (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - adminId
 *               - sidangPeriodId
 *             properties:
 *               adminId:
 *                 type: string
 *               sidangPeriodId:
 *                 type: string
 *               skemaSidangFinal:
 *                 type: string
 *                 description: Skema sidang final yang disetujui (opsional)
 *               jalurNonSidangFinal:
 *                 type: string
 *                 description: Jalur non sidang final yang disetujui (opsional)
 *               sidangRegistrationUploadIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Daftar ID berkas yang valid
 *     responses:
 *       200:
 *         description: Sidang registration approved successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Token not found
 *       404:
 *         description: Registration, admin or period not found
 */
router.put(
  "/:id/approve",
  verifyToken,
  authorize("ADMIN"),
  validate(approveSidangSchema),
  approveSidangRegistration,
);

/**
 * @swagger
 * /api/sidang-registrations/{id}/reject:
 *   put:
 *     summary: Reject / request revision for sidang registration
 *     tags: [Sidang Registration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sidang registration ID (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - adminId
 *               - message
 *             properties:
 *               adminId:
 *                 type: string
 *               message:
 *                 type: string
 *               isEdit:
 *                 type: string
 *                 format: date-time
 *               sidangRegistrationUploadIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Daftar ID berkas yang valid (berkas di luar list ini akan ditandai isValid = false / perlu revisi)
 *     responses:
 *       200:
 *         description: Sidang registration rejected / revision requested successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Token not found
 *       404:
 *         description: Registration or admin not found
 */
router.put(
  "/:id/reject",
  verifyToken,
  authorize("ADMIN"),
  validate(rejectSidangSchema),
  rejectSidangRegistration,
);

/**
 * @swagger
 * /api/sidang-registrations/{id}/toggle-lock:
 *   patch:
 *     summary: Toggle lock status of sidang registration (Admin only)
 *     tags: [Sidang Registration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sidang registration ID (UUID)
 *     responses:
 *       200:
 *         description: Status kunci pendaftaran sidang berhasil diperbarui
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       401:
 *         description: Token not found
 *       403:
 *         description: Access denied (Hanya admin yang dapat mengakses)
 *       404:
 *         description: Sidang registration not found
 */
router.patch(
  "/:id/toggle-lock",
  verifyToken,
  authorize("ADMIN"),
  toggleLockSidangRegistration,
);

export default router;
