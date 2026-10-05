import asyncHandler from "express-async-handler";
import { ZipArchive } from "archiver";
import {
  getPaginationParams,
  formatPaginationResponse,
} from "../utils/paginationHelper.js";
import {
  sendValidationError,
  isNil,
  isValidISO8601,
} from "../utils/validationHelper.js";
import { serveDownload, getFileStream } from "../services/storageService.js";
import { mapPermohonanToFrontend } from "../mappers/index.js";
import * as sktaService from "../services/sktaService.js";

const getUploadedFile = (files, fieldName) => files?.[fieldName]?.[0];

const buildDownloadUrl = (req, berkasId) => {
  if (!berkasId) return null;
  return `${req.protocol}://${req.get("host")}/api/permohonan-skta/download/validasi/${berkasId}`;
};

/**
 * [Route] Mendapatkan Semua Permohonan SKTA
 */
const listPermohonanSkta = asyncHandler(async (req, res) => {
  const paginationParams = getPaginationParams(req.query);
  const { total, data } =
    await sktaService.getPermohonanSktas(paginationParams);
  const enriched = data.map((item) => mapPermohonanToFrontend(item, req));
  res.json(formatPaginationResponse(enriched, total, paginationParams));
});

/**
 * [Route] Menyimpan Draft Permohonan SKTA (Save Draft)
 */
const createPermohonanSkta = asyncHandler(async (req, res) => {
  const category =
    req.query.category || req.body.category || "Permohonan Baru";
  const {
    id,
    mahasiswaId,
    judulProposalIndonesia,
    judulProposalInggris,
    dosenPembimbing1Id,
    dosenPembimbing2Id,
  } = req.body;

  const evidenceFile = getUploadedFile(req.files, "evidence");

  const permohonan = await sktaService.saveDraftPermohonanSkta({
    id,
    mahasiswaId,
    category,
    judulProposalIndonesia,
    judulProposalInggris,
    dosenPembimbing1Id,
    dosenPembimbing2Id,
    evidenceFile,
  });

  res.status(200).json({
    message: "Permohonan SKTA berhasil disimpan sebagai draft",
    data: mapPermohonanToFrontend(permohonan, req),
  });
});

/**
 * [Route] Submit Permohonan SKTA
 */
const submitPermohonanSkta = asyncHandler(async (req, res) => {
  const category =
    req.query.category || req.body.category || "Permohonan Baru";
  const {
    id,
    mahasiswaId,
    judulProposalIndonesia,
    judulProposalInggris,
    dosenPembimbing1Id,
    dosenPembimbing2Id,
  } = req.body;

  const evidenceFile = getUploadedFile(req.files, "evidence");

  const errors = [];
  if (isNil(id)) {
    errors.push({ field: "id", message: "ID wajib diisi untuk submit" });
  } else if (typeof id !== "string") {
    errors.push({ field: "id", message: "ID harus berupa string" });
  }

  if (isNil(mahasiswaId)) {
    errors.push({ field: "mahasiswaId", message: "Mahasiswa ID wajib diisi" });
  }
  if (isNil(judulProposalIndonesia)) {
    errors.push({
      field: "judulProposalIndonesia",
      message: "Judul proposal (Indonesia) wajib diisi",
    });
  }
  if (isNil(judulProposalInggris)) {
    errors.push({
      field: "judulProposalInggris",
      message: "Judul proposal (Inggris) wajib diisi",
    });
  }
  if (isNil(dosenPembimbing1Id)) {
    errors.push({
      field: "dosenPembimbing1Id",
      message: "Dosen Pembimbing 1 wajib diisi",
    });
  }
  if (isNil(dosenPembimbing2Id)) {
    errors.push({
      field: "dosenPembimbing2Id",
      message: "Dosen Pembimbing 2 wajib diisi",
    });
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors, req);
  }

  try {
    const result = await sktaService.submitPermohonanSkta({
      id,
      mahasiswaId,
      category,
      judulProposalIndonesia,
      judulProposalInggris,
      dosenPembimbing1Id,
      dosenPembimbing2Id,
      evidenceFile,
    });

    res.status(200).json({
      message: "Permohonan SKTA berhasil diajukan",
      data: mapPermohonanToFrontend(result, req),
    });
  } catch (err) {
    if (err.errors) {
      return sendValidationError(res, err.errors, req);
    }
    throw err;
  }
});

/**
 * [Route] Mengedit Permohonan SKTA
 */
const updatePermohonanSkta = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    judulProposalIndonesia,
    judulProposalInggris,
    dosenPembimbing1Id,
    dosenPembimbing2Id,
  } = req.body;

  const evidenceFile = getUploadedFile(req.files, "evidence");

  const data = await sktaService.updatePermohonanSktaData(id, {
    judulProposalIndonesia,
    judulProposalInggris,
    dosenPembimbing1Id,
    dosenPembimbing2Id,
    evidenceFile,
  });

  res.json({
    message: "Permohonan SKTA berhasil diubah",
    data: mapPermohonanToFrontend(data, req),
  });
});

/**
 * [Route] Mendapatkan Permohonan SKTA berdasarkan ID Permohonan
 */
const getPermohonanSktaById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = await sktaService.getPermohonanSktaById(id);

  if (!data) {
    res.status(404);
    throw new Error("Permohonan SKTA tidak ditemukan");
  }

  res.json({ data: mapPermohonanToFrontend(data, req) });
});

/**
 * [Route] Mendapatkan Permohonan SKTA Terbaru Berdasarkan ID Mahasiswa (atau User Login)
 */
const getLatestPermohonanSktaByMahasiswaId = asyncHandler(async (req, res) => {
  const targetId = req.params.mahasiswaId || req.user?.id;

  if (!targetId) {
    res.status(400);
    throw new Error("ID mahasiswa atau sesi login tidak valid");
  }

  const data = await sktaService.getLatestPermohonanByMahasiswaId(targetId);

  if (!data) {
    res.status(404);
    throw new Error("Data permohonan SKTA untuk mahasiswa ini tidak ditemukan");
  }

  res.json({ data: mapPermohonanToFrontend(data, req) });
});

/**
 * [Route] Unduh Berkas SKTA
 */
const downloadSkta = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const downloadInfo = await sktaService.getSktaDownloadInfo(id);

  await serveDownload(res, downloadInfo);
});

/**
 * [Route] Unduh Berkas Evidence
 */
const downloadEvidence = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const downloadInfo = await sktaService.getEvidenceDownloadInfo(id);

  await serveDownload(res, downloadInfo);
});

/**
 * [Route] Menyetujui Permohonan SKTA (Approve)
 */
const approvePermohonanSkta = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { hasUploadedFinalProposal, hasTakenLanguageTest, expDate, adminId } =
    req.body;

  const sktaFile = getUploadedFile(req.files, "skta");

  const data = await sktaService.approvePermohonanSkta({
    id,
    hasUploadedFinalProposal,
    hasTakenLanguageTest,
    expDate,
    adminId,
    sktaFile,
    currentUser: req.user,
  });

  res.json({
    message: "Permohonan SKTA berhasil disetujui",
    data: mapPermohonanToFrontend(data, req),
  });
});

/**
 * [Route] Menolak / Meminta Revisi Permohonan SKTA (Reject / Revision Request)
 */
const rejectPermohonanSkta = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { message, adminId, isEdit } = req.body;

  const errors = [];
  if (isNil(adminId)) {
    errors.push({ field: "adminId", message: "ID staf akademik wajib diisi" });
  }
  if (isNil(message)) {
    errors.push({ field: "message", message: "Pesan penolakan wajib diisi" });
  }
  if (!isNil(isEdit) && !isValidISO8601(isEdit)) {
    errors.push({
      field: "isEdit",
      message: "isEdit harus berupa tanggal yang valid (format ISO 8601)",
    });
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  const data = await sktaService.rejectPermohonanSkta({
    id,
    message,
    adminId,
    isEdit,
    currentUser: req.user,
  });

  res.json({
    message: "Permohonan SKTA berhasil ditolak / diminta revisi",
    data: mapPermohonanToFrontend(data, req),
  });
});

/**
 * [Route] Get Existing Dokumen Validasi SKTA
 */
const generateDokumenValidasiSkta = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existingBerkas =
    await sktaService.getBerkasByPermohonanIdAndCategory({
      permohonanId: id,
      category: "Dokumen Validasi Skta",
      notFoundMessage: "Berkas validasi SKTA belum ditemukan di database",
    });

  res.json({
    message: "Berkas validasi SKTA berhasil ditemukan",
    data: {
      ...existingBerkas,
      downloadUrl: buildDownloadUrl(req, existingBerkas.id),
    },
  });
});

/**
 * [Route] Upload Dokumen Validasi SKTA (dibuat dari Frontend)
 */
const uploadDokumenValidasiSkta = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const file =
    getUploadedFile(req.files, "dokumenFile") ||
    getUploadedFile(req.files, "file") ||
    req.file;

  if (!file) {
    res.status(400);
    throw new Error("File dokumen validasi wajib diunggah");
  }

  if (file.mimetype !== "application/pdf") {
    res.status(400);
    throw new Error("Tipe file tidak valid (hanya diperbolehkan PDF)");
  }

  const berkasRecord = await sktaService.uploadBerkasMahasiswaForSkta({
    permohonanId: id,
    category: "Dokumen Validasi Skta",
    file,
    filePrefix: "Dokumen_Validasi_SKTA_",
  });

  res.status(201).json({
    message: "Berkas validasi SKTA berhasil diunggah",
    data: {
      ...berkasRecord,
      downloadUrl: buildDownloadUrl(req, berkasRecord.id),
    },
  });
});

/**
 * [Route] Get Existing Formulir SKTA
 */
const generateFormulirSkta = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existingBerkas =
    await sktaService.getBerkasByPermohonanIdAndCategory({
      permohonanId: id,
      category: "Formulir Penerbitan Skta",
      notFoundMessage: "Berkas formulir SKTA belum ditemukan di database",
    });

  res.json({
    message: "Berkas formulir SKTA berhasil ditemukan",
    data: {
      ...existingBerkas,
      downloadUrl: buildDownloadUrl(req, existingBerkas.id),
    },
  });
});

/**
 * [Route] Upload Formulir SKTA (dibuat dari Frontend)
 */
const uploadFormulirSkta = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const file =
    getUploadedFile(req.files, "dokumenFile") ||
    getUploadedFile(req.files, "file") ||
    req.file;

  if (!file) {
    res.status(400);
    throw new Error("File dokumen formulir wajib diunggah");
  }

  if (file.mimetype !== "application/pdf") {
    res.status(400);
    throw new Error("Tipe file tidak valid (hanya diperbolehkan PDF)");
  }

  const berkasRecord = await sktaService.uploadBerkasMahasiswaForSkta({
    permohonanId: id,
    category: "Formulir Penerbitan Skta",
    file,
    filePrefix: "Formulir_SK_TA_",
  });

  res.status(201).json({
    message: "Berkas formulir SKTA berhasil diunggah",
    data: {
      ...berkasRecord,
      downloadUrl: buildDownloadUrl(req, berkasRecord.id),
    },
  });
});

/**
 * [Route] Download Dokumen Validasi SKTA
 */
const downloadValidasi = asyncHandler(async (req, res) => {
  const { berkasId } = req.params;
  const upload = await sktaService.getBerkasMahasiswaById(berkasId);

  await serveDownload(res, {
    filepath: upload.filepath,
    downloadName: upload.name,
    mimeType: "application/pdf",
  });
});

/**
 * [Route] Export Berkas SKTA sebagai ZIP dengan Filter
 */
const exportSktaZip = asyncHandler(async (req, res) => {
  const {
    startDate,
    endDate,
    dateField = "createdAt",
    studyProgram,
    studyProgramId,
    tahunAngkatan,
    kelasAsal,
    category,
  } = req.query;

  const validFiles = await sktaService.getSktaFilesForExport({
    startDate,
    endDate,
    dateField,
    studyProgram,
    studyProgramId,
    tahunAngkatan,
    kelasAsal,
    category,
  });

  const timestamp = new Date().toISOString().slice(0, 10);
  const zipFileName = `Export_SKTA_${timestamp}.zip`;

  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="${zipFileName}"`);

  const archive = new ZipArchive({
    zlib: { level: 6 },
  });

  archive.on("error", (err) => {
    throw err;
  });

  archive.pipe(res);

  for (const file of validFiles) {
    try {
      const fileData = await getFileStream(file.filepath);
      archive.append(fileData.stream, { name: file.entryName });
    } catch (err) {
      console.warn(
        `[exportSktaZip] Gagal menambahkan berkas ${file.filepath} ke archive:`,
        err.message,
      );
    }
  }

  await archive.finalize();
});

export {
  listPermohonanSkta,
  createPermohonanSkta,
  submitPermohonanSkta,
  updatePermohonanSkta,
  getPermohonanSktaById,
  getLatestPermohonanSktaByMahasiswaId,
  downloadSkta,
  downloadEvidence,
  approvePermohonanSkta,
  rejectPermohonanSkta,
  generateDokumenValidasiSkta,
  uploadDokumenValidasiSkta,
  generateFormulirSkta,
  uploadFormulirSkta,
  downloadValidasi,
  exportSktaZip,
};
