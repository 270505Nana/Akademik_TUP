import asyncHandler from 'express-async-handler';
import prisma from "../config/prisma.js";
import path from 'path';
import { sendValidationError, isNil } from '../utils/validationHelper.js';
import { v4 as uuidv4 } from 'uuid';
import { getPaginationParams, formatPaginationResponse } from '../utils/paginationHelper.js';
import { uploadFile, deleteFile, serveDownload } from '../services/storageService.js';

const mapMahasiswa = (mahasiswa) => {
  if (!mahasiswa) return null;
  return {
    id: mahasiswa.id,
    nim: mahasiswa.nim || '',
    kelasAsal: mahasiswa.kelasAsal || '',
    tahunAngkatan: mahasiswa.tahunAngkatan,
    sks: mahasiswa.sks,
    ipk: mahasiswa.ipk,
    tak: mahasiswa.tak,
    studyProgramId: mahasiswa.studyProgramId,
    dosenWaliId: mahasiswa.dosenWaliId,
    name: mahasiswa.user?.name || '',
    email: mahasiswa.user?.email || '',
    phone: mahasiswa.user?.phone || null,
    studyProgram: mahasiswa.studyProgram
      ? {
          id: mahasiswa.studyProgram.id,
          name: mahasiswa.studyProgram.name,
          isActive: mahasiswa.studyProgram.isActive,
          facultyId: mahasiswa.studyProgram.facultyId,
        }
      : null,
  };
};

const mapTranskripUpload = (item, req) => {
  if (!item) return null;
  return {
    id: item.id,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    name: item.name,
    category: item.category,
    filepath: item.filepath,
    mahasiswaId: item.mahasiswaId,
    mahasiswa: mapMahasiswa(item.mahasiswa),
    downloadUrl: `${req.protocol}://${req.get("host")}/api/transkrip/uploads/${item.id}/download`,
  };
};

const transkripInclude = {
  mahasiswa: {
    include: {
      studyProgram: true,
      user: true,
    },
  },
};

// List all Transkrip uploads (from BerkasMahasiswa with category "Transkrip")
const listTranskripUploads = asyncHandler(async (req, res) => {
  const paginationParams = getPaginationParams(req.query);
  let whereClause = { deletedAt: null, category: "Transkrip" };

  // If user is MAHASISWA, they can only see their own Transkrip uploads
  if (req.user?.role === "MAHASISWA") {
    const student = await prisma.mahasiswa.findUnique({
      where: { userId: req.user.id },
    });
    if (!student) {
      res.status(404);
      throw new Error("Data mahasiswa tidak ditemukan");
    }
    whereClause.mahasiswaId = student.id;
  }

  const [total, transkripUploads] = await Promise.all([
    prisma.berkasMahasiswa.count({
      where: whereClause,
    }),
    prisma.berkasMahasiswa.findMany({
      where: whereClause,
      skip: paginationParams.skip,
      take: paginationParams.take,
      include: transkripInclude,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const data = transkripUploads.map((item) => mapTranskripUpload(item, req));
  res.json(formatPaginationResponse(data, total, paginationParams));
});

// Get Transkrip upload by ID
const getTranskripUploadById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const transkripUpload = await prisma.berkasMahasiswa.findFirst({
    where: { id, deletedAt: null, category: "Transkrip" },
    include: transkripInclude,
  });

  if (!transkripUpload) {
    res.status(404);
    throw new Error("Unggahan transkrip tidak ditemukan");
  }

  // If user is MAHASISWA, check ownership
  if (req.user?.role === "MAHASISWA") {
    const student = await prisma.mahasiswa.findUnique({
      where: { userId: req.user.id },
    });
    if (!student || transkripUpload.mahasiswaId !== student.id) {
      res.status(403);
      throw new Error("Akses ditolak");
    }
  }

  res.json({ data: mapTranskripUpload(transkripUpload, req) });
});

// Create Transkrip upload
const createTranskripUpload = asyncHandler(async (req, res) => {
  const file = req.file;
  const errors = [];

  if (isNil(req.body.name)) {
    errors.push({ field: "name", message: "name wajib diisi" });
  }
  if (isNil(req.body.mahasiswaId)) {
    errors.push({ field: "mahasiswaId", message: "mahasiswaId wajib diisi" });
  }
  if (!file) {
    errors.push({ field: "transkripFile", message: "transkripFile wajib diunggah" });
  } else if (!["application/pdf"].includes(file.mimetype)) {
    errors.push({ field: "transkripFile", message: "Tipe file tidak valid (hanya diperbolehkan PDF)" });
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors, req);
  }

  const { name, mahasiswaId } = req.body;

  const studentExists = await prisma.mahasiswa.findUnique({
    where: { id: mahasiswaId },
  });
  if (!studentExists) {
    res.status(404);
    throw new Error("Mahasiswa tidak ditemukan");
  }

  // Upload file via Storage Service (R2 atau Local)
  const uploaded = await uploadFile({
    buffer: file.buffer,
    originalname: file.originalname,
    folder: "berkas-mahasiswa",
    mimetype: file.mimetype,
  });

  // Check if there is an existing Transkrip for this student and category "Transkrip"
  const existingTranskrip = await prisma.berkasMahasiswa.findFirst({
    where: {
      mahasiswaId,
      category: "Transkrip",
      deletedAt: null,
    },
  });

  let resultUpload;
  if (existingTranskrip) {
    // 1. Delete physical file of the old upload
    if (existingTranskrip.filepath) {
      await deleteFile(existingTranskrip.filepath);
    }

    // 2. Update record in the database
    resultUpload = await prisma.berkasMahasiswa.update({
      where: { id: existingTranskrip.id },
      data: {
        name,
        filepath: uploaded.filepath,
      },
      include: transkripInclude,
    });
  } else {
    // Create new record
    resultUpload = await prisma.berkasMahasiswa.create({
      data: {
        id: uuidv4(),
        name,
        category: "Transkrip",
        filepath: uploaded.filepath,
        mahasiswaId,
      },
      include: transkripInclude,
    });
  }

  res.status(existingTranskrip ? 200 : 201).json({
    message: "Transkrip uploaded successfully",
    data: mapTranskripUpload(resultUpload, req),
  });
});

// Update Transkrip upload
const updateTranskripUpload = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const file = req.file;

  const errors = [];

  if (!isNil(req.body.name) && req.body.name === "") {
    errors.push({ field: "name", message: "name tidak boleh kosong jika diisi" });
  }
  if (file && !["application/pdf"].includes(file.mimetype)) {
    errors.push({ field: "transkripFile", message: "Tipe file tidak valid (hanya diperbolehkan PDF)" });
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors, req);
  }

  const transkripUpload = await prisma.berkasMahasiswa.findFirst({
    where: { id, deletedAt: null, category: "Transkrip" },
  });

  if (!transkripUpload) {
    res.status(404);
    throw new Error("Unggahan transkrip tidak ditemukan");
  }

  const { name, mahasiswaId } = req.body;

  if (mahasiswaId) {
    const studentExists = await prisma.mahasiswa.findUnique({
      where: { id: mahasiswaId },
    });
    if (!studentExists) {
      res.status(404);
      throw new Error("Mahasiswa tidak ditemukan");
    }
  }

  const oldPath = transkripUpload.filepath;
  let newFilepath = undefined;

  if (file) {
    const uploaded = await uploadFile({
      buffer: file.buffer,
      originalname: file.originalname,
      folder: "berkas-mahasiswa",
      mimetype: file.mimetype,
    });
    newFilepath = uploaded.filepath;
  }

  const updatedTranskripUpload = await prisma.berkasMahasiswa.update({
    where: { id },
    data: {
      name: name !== undefined ? name : transkripUpload.name,
      mahasiswaId: mahasiswaId !== undefined ? mahasiswaId : transkripUpload.mahasiswaId,
      ...(newFilepath ? { filepath: newFilepath } : {}),
    },
    include: transkripInclude,
  });

  if (file && oldPath) {
    await deleteFile(oldPath);
  }

  res.json({
    message: "Transkrip updated successfully",
    data: mapTranskripUpload(updatedTranskripUpload, req),
  });
});

// Delete Transkrip upload (soft delete)
const deleteTranskripUpload = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const transkripUpload = await prisma.berkasMahasiswa.findFirst({
    where: { id, deletedAt: null, category: "Transkrip" },
  });

  if (!transkripUpload) {
    res.status(404);
    throw new Error("Unggahan transkrip tidak ditemukan");
  }

  await prisma.berkasMahasiswa.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  res.json({ message: "Transkrip deleted successfully" });
});

// Download Transkrip upload file
const downloadTranskripUpload = asyncHandler(async (req, res) => {
  const { uploadId } = req.params;

  const upload = await prisma.berkasMahasiswa.findFirst({
    where: { id: uploadId, deletedAt: null, category: "Transkrip" },
  });

  if (!upload) {
    res.status(404);
    throw new Error("File transkrip tidak ditemukan");
  }

  // Check ownership if MAHASISWA
  if (req.user?.role === "MAHASISWA") {
    const student = await prisma.mahasiswa.findUnique({
      where: { userId: req.user.id },
    });
    if (!student || upload.mahasiswaId !== student.id) {
      res.status(403);
      throw new Error("Akses ditolak");
    }
  }

  const ext = path.extname(upload.filepath || "") || ".pdf";
  const baseName = (upload.name || "").replace(/[\\/:*?"<>|]/g, "-").trim() || "transkrip";
  const downloadName = baseName.toLowerCase().endsWith(ext.toLowerCase()) ? baseName : `${baseName}${ext}`;

  await serveDownload(res, {
    filepath: upload.filepath,
    downloadName,
    mimeType: "application/pdf",
  });
});

export {
  listTranskripUploads,
  getTranskripUploadById,
  createTranskripUpload,
  updateTranskripUpload,
  deleteTranskripUpload,
  downloadTranskripUpload,
};
