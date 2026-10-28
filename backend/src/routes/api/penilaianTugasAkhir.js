import express from "express";
import {
  getPenilaianBySidangRegistrationId,
  getAllPenilaianBySidangRegistrationId,
  savePenilaianTugasAkhir,
  tutupSidang,
} from "../../controllers/penilaianTugasAkhirController.js";
import { verifyToken } from "../../middlewares/auth.js";
import { authorize } from "../../middlewares/authorize.js";
import { validate } from "../../middlewares/validate.js";
import {
  savePenilaianTugasAkhirSchema,
  tutupSidangSchema,
} from "../../schemas/penilaianTugasAkhirSchema.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Penilaian Tugas Akhir
 *   description: Manajemen penilaian sidang tugas akhir oleh dosen pembimbing dan penguji
 */

/**
 * @swagger
 * /api/penilaian-tugas-akhir/sidang-registration/{sidangRegistrationId}/all:
 *   get:
 *     summary: Get All Penilaian Sidang dan Kalkulasi Berita Acara
 *     description: Mengambil seluruh data penilaian dari dosen pembimbing dan penguji pada sidang tersebut, serta menghitung matriks skemaPerhitunganNilai, total nilai akhir, dan status kelulusan untuk Berita Acara Sidang Tugas Akhir.
 *     tags: [Penilaian Tugas Akhir]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sidangRegistrationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID Pendaftaran Sidang (UUID)
 *     responses:
 *       200:
 *         description: Data seluruh penilaian sidang dan kalkulasi berita acara berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Data seluruh penilaian sidang dan kalkulasi berita acara berhasil diambil"
 *                 data:
 *                   type: object
 *                   properties:
 *                     sidangRegistrationId:
 *                       type: string
 *                     mahasiswa:
 *                       type: object
 *                     jadwalSidang:
 *                       type: object
 *                     statusPenilaian:
 *                       type: object
 *                       properties:
 *                         totalPenilai:
 *                           type: integer
 *                         submittedCount:
 *                           type: integer
 *                         isAllSubmitted:
 *                           type: boolean
 *                     penilaianList:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           penilaiRole:
 *                             type: string
 *                             example: "pembimbing_1"
 *                           penilaiType:
 *                             type: string
 *                             example: "pembimbing"
 *                           bobotPenilai:
 *                             type: number
 *                             example: 0.6
 *                           isSubmitted:
 *                             type: boolean
 *                           penilaianId:
 *                             type: string
 *                             nullable: true
 *                           dosen:
 *                             type: object
 *                           catatanRevisi:
 *                             type: string
 *                           nilai:
 *                             type: array
 *                           skorPerClo:
 *                             type: array
 *                     beritaAcaraCalculation:
 *                       type: object
 *                       properties:
 *                         skemaPerhitunganNilai:
 *                           type: array
 *                           description: Data yang akan menjadi isi skemaPerhitunganNilai di model BeritaAcaraSidangTugasAkhir
 *                           items:
 *                             type: object
 *                             properties:
 *                               cloProdiId:
 *                                 type: string
 *                               cloName:
 *                                 type: string
 *                                 example: "CLO 7"
 *                               deskripsi:
 *                                 type: string
 *                               bobotClo:
 *                                 type: number
 *                                 example: 0.20
 *                               bobotPembimbing:
 *                                 type: number
 *                                 example: 0.60
 *                               bobotPenguji:
 *                                 type: number
 *                                 example: 0.40
 *                               nilaiPembimbing1:
 *                                 type: number
 *                                 nullable: true
 *                               nilaiPembimbing2:
 *                                 type: number
 *                                 nullable: true
 *                               rataRataPembimbing:
 *                                 type: number
 *                                 nullable: true
 *                               nilaiPenguji1:
 *                                 type: number
 *                                 nullable: true
 *                               nilaiPenguji2:
 *                                 type: number
 *                                 nullable: true
 *                               rataRataPenguji:
 *                                 type: number
 *                                 nullable: true
 *                               nilaiHasilPerhitungan:
 *                                 type: number
 *                                 nullable: true
 *                               nilaiTertimbang:
 *                                 type: number
 *                                 nullable: true
 *                         totalNilaiAngka:
 *                           type: number
 *                           nullable: true
 *                           example: 85.4
 *                         nilaiAkhir:
 *                           type: string
 *                           example: "A"
 *                         keterangan:
 *                           type: string
 *                           example: "Lulus"
 *                         catatanRevisiList:
 *                           type: array
 *       401:
 *         description: Token tidak valid atau tidak ditemukan
 *       403:
 *         description: Akses ditolak
 *       404:
 *         description: Pendaftaran sidang tidak ditemukan
 */
router.get(
  "/sidang-registration/:sidangRegistrationId/all",
  verifyToken,
  authorize("ADMIN", "DOSEN"),
  getAllPenilaianBySidangRegistrationId,
);

/**
 * @swagger
 * /api/penilaian-tugas-akhir/sidang-registration/{sidangRegistrationId}:
 *   get:
 *     summary: Get Penilaian Sidang Tugas Akhir by Sidang Registration ID
 *     description: Mengembalikan data penilaian jika sudah ada (snapshot), atau template formulir kosong dari kurikulum master data prodi jika belum pernah dinilai (id null).
 *     tags: [Penilaian Tugas Akhir]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sidangRegistrationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID Pendaftaran Sidang (UUID)
 *     responses:
 *       200:
 *         description: Data penilaian tugas akhir atau template formulir berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   nullable: true
 *                   example: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
 *                 bobotPenilai:
 *                   type: number
 *                   example: 0.6
 *                 nilai:
 *                   type: array
 *                   description: Hierarchical snapshot CLO, Sub-CLO, dan Asesmen
 *                   items:
 *                     type: object
 *                     properties:
 *                       cloProdiId:
 *                         type: string
 *                       cloName:
 *                         type: string
 *                         example: "CLO7"
 *                       deskripsi:
 *                         type: string
 *                       subClo:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             name:
 *                               type: string
 *                             deskripsi:
 *                               type: string
 *                       asesmen:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             jenisAsesmenId:
 *                               type: string
 *                             content:
 *                               type: string
 *                             bobot:
 *                               type: number
 *                               example: 0.1
 *                             nilai:
 *                               type: number
 *                               nullable: true
 *                               example: 85.0
 *                 catatanRevisi:
 *                   type: string
 *                   example: "Perbaiki format penulisan bab 4"
 *                 sidangRegistrationId:
 *                   type: string
 *                   example: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
 *                 penilaiType:
 *                   type: string
 *                   enum: ["pembimbing", "penguji"]
 *                   example: "pembimbing"
 *                 dosenPenilai:
 *                   type: object
 *                 dosenKaprodi:
 *                   type: object
 *       401:
 *         description: Token tidak valid atau tidak ditemukan
 *       403:
 *         description: Akses ditolak atau dosen tidak terdaftar sebagai pembimbing/penguji
 *       404:
 *         description: Pendaftaran sidang tidak ditemukan
 */
router.get(
  "/sidang-registration/:sidangRegistrationId",
  verifyToken,
  authorize("DOSEN"),
  getPenilaianBySidangRegistrationId,
);

/**
 * @swagger
 * /api/penilaian-tugas-akhir/sidang-registration/{sidangRegistrationId}:
 *   put:
 *     summary: Create or Update Penilaian Sidang Tugas Akhir
 *     tags: [Penilaian Tugas Akhir]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sidangRegistrationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID Pendaftaran Sidang (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nilai
 *             properties:
 *               nilai:
 *                 type: array
 *                 description: Daftar nilai per jenis asesmen
 *                 items:
 *                   type: object
 *                   required:
 *                     - jenisAsesmenId
 *                     - nilai
 *                   properties:
 *                     jenisAsesmenId:
 *                       type: string
 *                       format: uuid
 *                       example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *                     nilai:
 *                       type: number
 *                       format: float
 *                       minimum: 0
 *                       maximum: 100
 *                       example: 85.0
 *               catatanRevisi:
 *                 type: string
 *                 description: Catatan revisi untuk mahasiswa
 *                 example: "Perbaiki format sitasi daftar pustaka"
 *     responses:
 *       200:
 *         description: Penilaian tugas akhir berhasil disimpan / diperbarui
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Penilaian tugas akhir berhasil disimpan"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     bobotPenilai:
 *                       type: number
 *                     nilai:
 *                       type: array
 *                     catatanRevisi:
 *                       type: string
 *                     sidangRegistrationId:
 *                       type: string
 *                     penilaiType:
 *                       type: string
 *                       enum: ["pembimbing", "penguji"]
 *                     dosenPenilai:
 *                       type: object
 *                     dosenKaprodi:
 *                       type: object
 *       400:
 *         description: Validasi error atau komponen belum lengkap
 *       401:
 *         description: Token tidak valid atau tidak ditemukan
 *       403:
 *         description: Akses ditolak atau dosen tidak terdaftar sebagai pembimbing/penguji
 *       404:
 *         description: Pendaftaran sidang atau Dosen tidak ditemukan
 */
router.put(
  "/sidang-registration/:sidangRegistrationId",
  verifyToken,
  authorize("DOSEN"),
  validate(savePenilaianTugasAkhirSchema),
  savePenilaianTugasAkhir,
);

/**
 * @swagger
 * /api/penilaian-tugas-akhir/sidang-registration/{sidangRegistrationId}/tutup-sidang:
 *   post:
 *     summary: Menutup Sidang Tugas Akhir dan Menerbitkan Berita Acara (Khusus Dosen Pembimbing 1)
 *     description: Endpoint untuk menutup sidang tugas akhir. Hanya dapat diakses oleh Dosen Pembimbing 1 setelah seluruh dosen penilai (Pembimbing 1, Pembimbing 2 jika ada, Penguji 1, Penguji 2 jika ada) telah menyimpan penilaian. Menentukan batas waktu revisi (deadlineRevisi), status kelulusan (keterangan), nilai akhir (default sesuai hasil perhitungan rubrik), justifikasi (jika nilai akhir berbeda), serta secara otomatis menentukan nilaiHuruf dan menyetujui revisi.
 *     tags: [Penilaian Tugas Akhir]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sidangRegistrationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID Pendaftaran Sidang (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deadlineRevisi
 *               - keterangan
 *             properties:
 *               deadlineRevisi:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-11-05T00:00:00.000Z"
 *                 description: Batas waktu maksimal penyelesaian revisi oleh mahasiswa
 *               keterangan:
 *                 type: string
 *                 enum: ["Lulus", "Lulus Bersyarat", "Tidak Lulus"]
 *                 example: "Lulus"
 *                 description: Status keputusan hasil sidang dewan penguji
 *               nilaiAkhir:
 *                 type: number
 *                 format: float
 *                 example: 85.40
 *                 description: Nilai akhir sidang. Jika dikosongkan, otomatis menggunakan nilai hasil perhitungan matriks rubrik
 *               justifikasi:
 *                 type: string
 *                 example: "Perubahan nilai berdasarkan kesepakatan dewan penguji atas kontribusi prototipe"
 *                 description: Wajib diisi jika nilaiAkhir berbeda dari nilai hasil perhitungan
 *     responses:
 *       201:
 *         description: Sidang tugas akhir berhasil ditutup dan Berita Acara telah diterbitkan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Sidang tugas akhir berhasil ditutup dan Berita Acara telah diterbitkan"
 *                 data:
 *                   type: object
 *                   properties:
 *                     beritaAcara:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         sidangRegistrationId:
 *                           type: string
 *                         nilaiAkhir:
 *                           type: string
 *                           example: "85.40"
 *                         nilaiHuruf:
 *                           type: string
 *                           example: "A"
 *                         keterangan:
 *                           type: string
 *                           example: "Lulus"
 *                         justifikasi:
 *                           type: string
 *                           nullable: true
 *                         skemaPerhitunganNilai:
 *                           type: array
 *                         createdAt:
 *                           type: string
 *                     revisiTugasAkhir:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         deadlineRevisi:
 *                           type: string
 *                         tglSetujuiUntukRevisi:
 *                           type: string
 *                         setujuiUntukRevisiId:
 *                           type: string
 *       400:
 *         description: Validasi error, masih ada dosen belum menilai, sidang sudah ditutup, atau justifikasi belum diisi
 *       401:
 *         description: Token tidak valid atau tidak ditemukan
 *       403:
 *         description: Akses ditolak, hanya Dosen Pembimbing 1 yang dapat menutup sidang
 *       404:
 *         description: Pendaftaran sidang tidak ditemukan
 */
router.post(
  "/sidang-registration/:sidangRegistrationId/tutup-sidang",
  verifyToken,
  authorize("DOSEN"),
  validate(tutupSidangSchema),
  tutupSidang,
);

export default router;
