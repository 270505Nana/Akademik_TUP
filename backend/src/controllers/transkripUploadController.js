import asyncHandler from 'express-async-handler';
import prisma from "../config/prisma.js";
import fs from 'fs';
import path from 'path';
import { sendValidationError, isNil } from '../utils/validationHelper.js';


const buildDownloadUrl = (req, uploadId) => {
  if (!uploadId) return null;
  return `${req.protocol}://${req.get("host")}/api/transkrip/uploads/${uploadId}/download`;
};

const withDownloadUrl = (req, upload) => ({
  ...upload,
  downloadUrl: buildDownloadUrl(req, upload.id),
});

// List all Transkrip uploads
const listTranskripUploads = asyncHandler(async (req, res) => {
  let whereClause = { deletedAt: null };

  // If user is MAHASISWA, they can only see their own transkrip uploads
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

  const transkripUploads = await prisma.transkripUpload.findMany({
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

  const data = transkripUploads.map((item) => withDownloadUrl(req, item));

  res.json({ data });
});

// Get Transkrip upload by ID
const getTranskripUploadById = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);

  const transkripUpload = await prisma.transkripUpload.findFirst({
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

  if (!transkripUpload) {
    res.status(404);
    throw new Error("Unggahan transkrip tidak ditemukan");
  }

  // If user is MAHASISWA, check ownership
  if (req.user.role === "MAHASISWA") {
    const student = await prisma.mahasiswa.findUnique({
      where: { userId: req.user.id },
    });
    if (!student || transkripUpload.mahasiswaId !== student.id) {
      res.status(403);
      throw new Error("Akses ditolak");
    }
  }

  res.json({ data: withDownloadUrl(req, transkripUpload) });
});

// Create Transkrip upload
const createTranskripUpload = asyncHandler(async (req, res) => {
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
    errors.transkripFile = "transkripFile wajib diunggah";
  } else if (!["application/pdf"].includes(file.mimetype)) {
    errors.transkripFile = "Tipe file tidak valid (hanya diperbolehkan PDF)";
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

    const createdTranskripUpload = await prisma.transkripUpload.create({
      data: {
        name,
        filename: file.filename,
        path: file.path,
        mahasiswaId,
      },
    });

    res.status(201).json({
      message: "Transkrip uploaded successfully",
      data: withDownloadUrl(req, createdTranskripUpload),
    });
  } catch (error) {
    if (file.path) {
      fs.unlink(file.path, () => {});
    }
    throw error;
  }
});

// Update Transkrip upload
const updateTranskripUpload = asyncHandler(async (req, res) => {
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
    errors.transkripFile = "Tipe file tidak valid (hanya diperbolehkan PDF)";
  }

  if (Object.keys(errors).length > 0) {
    if (file?.path) fs.unlink(file.path, () => {});
    return sendValidationError(res, errors, req);
  }

  try {
    const transkripUpload = await prisma.transkripUpload.findFirst({
      where: { id, deletedAt: null },
    });

    if (!transkripUpload) {
      if (file?.path) {
        fs.unlink(file.path, () => {});
      }
      res.status(404);
      throw new Error("Unggahan transkrip tidak ditemukan");
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

    const oldPath = transkripUpload.path;

    const updatedTranskripUpload = await prisma.transkripUpload.update({
      where: { id },
      data: {
        name: name !== undefined ? name : transkripUpload.name,
        mahasiswaId: mahasiswaId !== undefined ? parseInt(mahasiswaId) : transkripUpload.mahasiswaId,
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
      message: "Transkrip updated successfully",
      data: withDownloadUrl(req, updatedTranskripUpload),
    });
  } catch (error) {
    if (file?.path) {
      fs.unlink(file.path, () => {});
    }
    throw error;
  }
});

// Delete Transkrip upload (soft delete)
const deleteTranskripUpload = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);

  const transkripUpload = await prisma.transkripUpload.findFirst({
    where: { id, deletedAt: null },
  });

  if (!transkripUpload) {
    res.status(404);
    throw new Error("Unggahan transkrip tidak ditemukan");
  }

  await prisma.transkripUpload.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  res.json({ message: "Transkrip deleted successfully" });
});

// Download Transkrip upload file
const downloadTranskripUpload = asyncHandler(async (req, res) => {
  const uploadId = parseInt(req.params.uploadId);

  const upload = await prisma.transkripUpload.findFirst({
    where: { id: uploadId, deletedAt: null },
  });

  if (!upload) {
    res.status(404);
    throw new Error("File transkrip tidak ditemukan");
  }

  // Check ownership if MAHASISWA
  if (req.user.role === "MAHASISWA") {
    const student = await prisma.mahasiswa.findUnique({
      where: { userId: req.user.id },
    });
    if (!student || upload.mahasiswaId !== student.id) {
      res.status(403);
      throw new Error("Akses ditolak");
    }
  }

  const filePath = path.resolve(process.cwd(), upload.path);

  if (!fs.existsSync(filePath)) {
    res.status(404);
    throw new Error("File fisik tidak ditemukan di server");
  }

  res.download(filePath, upload.filename);
});

export { listTranskripUploads,
  getTranskripUploadById,
  createTranskripUpload,
  updateTranskripUpload,
  deleteTranskripUpload,
  downloadTranskripUpload, };
