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

const mapSklUpload = (item, req) => {
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
    downloadUrl: `${req.protocol}://${req.get("host")}/api/skl/uploads/${item.id}/download`,
  };
};

const sklInclude = {
  mahasiswa: {
    include: {
      studyProgram: true,
      user: true,
    },
  },
};

// List all SKL uploads (from BerkasMahasiswa with category "SKL")
const listSklUploads = asyncHandler(async (req, res) => {
  const paginationParams = getPaginationParams(req.query);
  let whereClause = { deletedAt: null, category: "SKL" };

  // If user is MAHASISWA, they can only see their own SKL uploads
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

  const [total, sklUploads] = await Promise.all([
    prisma.berkasMahasiswa.count({
      where: whereClause,
    }),
    prisma.berkasMahasiswa.findMany({
      where: whereClause,
      skip: paginationParams.skip,
      take: paginationParams.take,
      include: sklInclude,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const data = sklUploads.map((item) => mapSklUpload(item, req));
  res.json(formatPaginationResponse(data, total, paginationParams));
});

// Get SKL upload by ID
const getSklUploadById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const sklUpload = await prisma.berkasMahasiswa.findFirst({
    where: { id, deletedAt: null, category: "SKL" },
    include: sklInclude,
  });

  if (!sklUpload) {
    res.status(404);
    throw new Error("Unggahan SKL tidak ditemukan");
  }

  // If user is MAHASISWA, check ownership
  if (req.user?.role === "MAHASISWA") {
    const student = await prisma.mahasiswa.findUnique({
      where: { userId: req.user.id },
    });
    if (!student || sklUpload.mahasiswaId !== student.id) {
      res.status(403);
      throw new Error("Akses ditolak");
    }
  }

  res.json({ data: mapSklUpload(sklUpload, req) });
});

// Create SKL upload
const createSklUpload = asyncHandler(async (req, res) => {
  const file = req.file;
  const errors = [];

  if (isNil(req.body.name)) {
    errors.push({ field: "name", message: "name wajib diisi" });
  }
  if (isNil(req.body.mahasiswaId)) {
    errors.push({ field: "mahasiswaId", message: "mahasiswaId wajib diisi" });
  }
  if (!file) {
    errors.push({ field: "sklFile", message: "sklFile wajib diunggah" });
  } else if (!["application/pdf"].includes(file.mimetype)) {
    errors.push({ field: "sklFile", message: "Tipe file tidak valid (hanya diperbolehkan PDF)" });
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

  // Check if there is an existing SKL for this student and category "SKL"
  const existingSkl = await prisma.berkasMahasiswa.findFirst({
    where: {
      mahasiswaId,
      category: "SKL",
      deletedAt: null,
    },
  });

  let resultUpload;
  if (existingSkl) {
    // 1. Delete old upload
    if (existingSkl.filepath) {
      await deleteFile(existingSkl.filepath);
    }

    // 2. Update record in the database
    resultUpload = await prisma.berkasMahasiswa.update({
      where: { id: existingSkl.id },
      data: {
        name,
        filepath: uploaded.filepath,
      },
      include: sklInclude,
    });
  } else {
    // Create new record
    resultUpload = await prisma.berkasMahasiswa.create({
      data: {
        id: uuidv4(),
        name,
        category: "SKL",
        filepath: uploaded.filepath,
        mahasiswaId,
      },
      include: sklInclude,
    });
  }

  res.status(existingSkl ? 200 : 201).json({
    message: "SKL uploaded successfully",
    data: mapSklUpload(resultUpload, req),
  });
});

// Update SKL upload
const updateSklUpload = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const file = req.file;

  const errors = [];

  if (!isNil(req.body.name) && req.body.name === "") {
    errors.push({ field: "name", message: "name tidak boleh kosong jika diisi" });
  }
  if (file && !["application/pdf"].includes(file.mimetype)) {
    errors.push({ field: "sklFile", message: "Tipe file tidak valid (hanya diperbolehkan PDF)" });
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors, req);
  }

  const sklUpload = await prisma.berkasMahasiswa.findFirst({
    where: { id, deletedAt: null, category: "SKL" },
  });

  if (!sklUpload) {
    res.status(404);
    throw new Error("Unggahan SKL tidak ditemukan");
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

  const oldPath = sklUpload.filepath;
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

  const updatedSklUpload = await prisma.berkasMahasiswa.update({
    where: { id },
    data: {
      name: name !== undefined ? name : sklUpload.name,
      mahasiswaId: mahasiswaId !== undefined ? mahasiswaId : sklUpload.mahasiswaId,
      ...(newFilepath ? { filepath: newFilepath } : {}),
    },
    include: sklInclude,
  });

  if (file && oldPath) {
    await deleteFile(oldPath);
  }

  res.json({
    message: "SKL updated successfully",
    data: mapSklUpload(updatedSklUpload, req),
  });
});

// Delete SKL upload (soft delete)
const deleteSklUpload = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const sklUpload = await prisma.berkasMahasiswa.findFirst({
    where: { id, deletedAt: null, category: "SKL" },
  });

  if (!sklUpload) {
    res.status(404);
    throw new Error("Unggahan SKL tidak ditemukan");
  }

  await prisma.berkasMahasiswa.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  res.json({ message: "SKL deleted successfully" });
});

// Download SKL upload file
const downloadSklUpload = asyncHandler(async (req, res) => {
  const { uploadId } = req.params;

  const upload = await prisma.berkasMahasiswa.findFirst({
    where: { id: uploadId, deletedAt: null, category: "SKL" },
  });

  if (!upload) {
    res.status(404);
    throw new Error("File SKL tidak ditemukan");
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
  const baseName = (upload.name || "").replace(/[\\/:*?"<>|]/g, "-").trim() || "skl";
  const downloadName = baseName.toLowerCase().endsWith(ext.toLowerCase()) ? baseName : `${baseName}${ext}`;

  await serveDownload(res, {
    filepath: upload.filepath,
    downloadName,
    mimeType: "application/pdf",
  });
});

export {
  listSklUploads,
  getSklUploadById,
  createSklUpload,
  updateSklUpload,
  deleteSklUpload,
  downloadSklUpload,
};
