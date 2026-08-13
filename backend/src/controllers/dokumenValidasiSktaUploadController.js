import asyncHandler from 'express-async-handler';
import prisma from "../config/prisma.js";
import fs from 'fs';
import path from 'path';
import { sendValidationError, isNil } from '../utils/validationHelper.js';

import { v4 as uuidv4 } from 'uuid';

const buildDownloadUrl = (req, uploadId) => {
  if (!uploadId) return null;
  return `${req.protocol}://${req.get("host")}/api/dokumen-validasi-skta/uploads/${uploadId}/download`;
};

const withDownloadUrl = (req, upload) => ({
  ...upload,
  downloadUrl: buildDownloadUrl(req, upload.id),
});

// List all Dokumen Validasi SKTA uploads
const listDokumenValidasiSktaUploads = asyncHandler(async (req, res) => {
  let whereClause = { deletedAt: null };

  // If user is MAHASISWA, they can only see their own uploads
  if (req.user.role === "MAHASISWA") {
    const student = await prisma.mahasiswa.findUnique({
      where: { userId: req.user.id },
    });
    if (!student) {
      res.status(404);
      throw new Error("Data mahasiswa tidak ditemukan");
    }
    whereClause.mahasiswaId = student.id;
  }

  const uploads = await prisma.dokumenValidasiSktaUpload.findMany({
    where: whereClause,
    include: {
      mahasiswa: {
        select: {
          id: true,
          nim: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const data = uploads.map((item) => withDownloadUrl(req, item));

  res.json({ data });
});

// Get Dokumen Validasi SKTA upload by ID
const getDokumenValidasiSktaUploadById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const upload = await prisma.dokumenValidasiSktaUpload.findFirst({
    where: { id, deletedAt: null },
    include: {
      mahasiswa: {
        select: {
          id: true,
          nim: true,
          name: true,
        },
      },
    },
  });

  if (!upload) {
    res.status(404);
    throw new Error("Unggahan dokumen tidak ditemukan");
  }

  // If user is MAHASISWA, check ownership
  if (req.user.role === "MAHASISWA") {
    const student = await prisma.mahasiswa.findUnique({
      where: { userId: req.user.id },
    });
    if (!student || upload.mahasiswaId !== student.id) {
      res.status(403);
      throw new Error("Akses ditolak");
    }
  }

  res.json({ data: withDownloadUrl(req, upload) });
});

// Create Dokumen Validasi SKTA upload (with UUID)
const createDokumenValidasiSktaUpload = asyncHandler(async (req, res) => {
    const file = req.file;
  const errors = {};

  if (isNil(req.body.name)) {
    errors.name = "name wajib diisi";
  }
  if (isNil(req.body.mahasiswaId)) {
    errors.mahasiswaId = "mahasiswaId wajib diisi";
  } else if (isNaN(parseInt(req.body.mahasiswaId))) {
    errors.mahasiswaId = "mahasiswaId harus berupa integer";
  }
  if (!file) {
    errors.dokumenFile = "dokumenFile wajib diunggah";
  } else if (!["application/pdf"].includes(file.mimetype)) {
    errors.dokumenFile = "Tipe file tidak valid (hanya diperbolehkan PDF)";
  }

  if (Object.keys(errors).length > 0) {
    if (file?.path) fs.unlink(file.path, () => {});
    return sendValidationError(res, errors, req);
  }

  try {
    const { name } = req.body;
    const mahasiswaId = parseInt(req.body.mahasiswaId);

    const studentExists = await prisma.mahasiswa.findUnique({
      where: { id: mahasiswaId },
    });
    if (!studentExists) {
      res.status(404);
      throw new Error("Mahasiswa tidak ditemukan");
    }

    const createdUpload = await prisma.dokumenValidasiSktaUpload.create({
      data: {
        id: uuidv4(),
        name,
        filename: file.filename,
        path: file.path,
        mahasiswaId,
      },
    });

    res.status(201).json({
      message: "Dokumen validasi SKTA uploaded successfully",
      data: withDownloadUrl(req, createdUpload),
    });
  } catch (error) {
    if (file.path) {
      fs.unlink(file.path, () => {});
    }
    throw error;
  }
});

// Update Dokumen Validasi SKTA upload
const updateDokumenValidasiSktaUpload = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const file = req.file;
  const errors = {};

  if (!isNil(req.body.name) && req.body.name === "") {
    errors.name = "name tidak boleh kosong jika diisi";
  }
  if (!isNil(req.body.mahasiswaId) && isNaN(parseInt(req.body.mahasiswaId))) {
    errors.mahasiswaId = "mahasiswaId harus berupa integer";
  }
  if (file && !["application/pdf"].includes(file.mimetype)) {
    errors.dokumenFile = "Tipe file tidak valid (hanya diperbolehkan PDF)";
  }

  if (Object.keys(errors).length > 0) {
    if (file?.path) fs.unlink(file.path, () => {});
    return sendValidationError(res, errors, req);
  }

  try {
    const uploadRecord = await prisma.dokumenValidasiSktaUpload.findFirst({
      where: { id, deletedAt: null },
    });

    if (!uploadRecord) {
      if (file?.path) {
        fs.unlink(file.path, () => {});
      }
      res.status(404);
      throw new Error("Unggahan dokumen tidak ditemukan");
    }

    const { name, mahasiswaId } = req.body;

    if (mahasiswaId) {
      const studentExists = await prisma.mahasiswa.findUnique({
        where: { id: parseInt(mahasiswaId) },
      });
      if (!studentExists) {
        if (file?.path) {
          fs.unlink(file.path, () => {});
        }
        res.status(404);
        throw new Error("Mahasiswa tidak ditemukan");
      }
    }

    const oldPath = uploadRecord.path;

    const updatedUpload = await prisma.dokumenValidasiSktaUpload.update({
      where: { id },
      data: {
        name: name !== undefined ? name : uploadRecord.name,
        mahasiswaId: mahasiswaId !== undefined ? parseInt(mahasiswaId) : uploadRecord.mahasiswaId,
        ...(file
          ? {
              filename: file.filename,
              path: file.path,
            }
          : {}),
      },
    });

    if (file && oldPath && fs.existsSync(oldPath)) {
      fs.unlink(oldPath, () => {});
    }

    res.json({
      message: "Dokumen validasi SKTA updated successfully",
      data: withDownloadUrl(req, updatedUpload),
    });
  } catch (error) {
    if (file?.path) {
      fs.unlink(file.path, () => {});
    }
    throw error;
  }
});

// Delete Dokumen Validasi SKTA upload (soft delete)
const deleteDokumenValidasiSktaUpload = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const uploadRecord = await prisma.dokumenValidasiSktaUpload.findFirst({
    where: { id, deletedAt: null },
  });

  if (!uploadRecord) {
    res.status(404);
    throw new Error("Unggahan dokumen tidak ditemukan");
  }

  await prisma.dokumenValidasiSktaUpload.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  res.json({ message: "Dokumen validasi SKTA deleted successfully" });
});

// Download Dokumen Validasi SKTA upload file
const downloadDokumenValidasiSktaUpload = asyncHandler(async (req, res) => {
  const { uploadId } = req.params;

  const upload = await prisma.dokumenValidasiSktaUpload.findFirst({
    where: { id: uploadId, deletedAt: null },
  });

  if (!upload) {
    res.status(404);
    throw new Error("File dokumen tidak ditemukan");
  }

  const filePath = path.resolve(process.cwd(), upload.path);

  if (!fs.existsSync(filePath)) {
    res.status(404);
    throw new Error("File fisik tidak ditemukan di server");
  }

  res.download(filePath, upload.filename);
});

export { listDokumenValidasiSktaUploads,
  getDokumenValidasiSktaUploadById,
  createDokumenValidasiSktaUpload,
  updateDokumenValidasiSktaUpload,
  deleteDokumenValidasiSktaUpload,
  downloadDokumenValidasiSktaUpload, };
