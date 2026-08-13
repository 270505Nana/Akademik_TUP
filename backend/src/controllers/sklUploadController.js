import asyncHandler from 'express-async-handler';
import prisma from "../config/prisma.js";
import fs from 'fs';
import path from 'path';
import { sendValidationError, isNil } from '../utils/validationHelper.js';


const buildDownloadUrl = (req, uploadId) => {
  if (!uploadId) return null;
  return `${req.protocol}://${req.get("host")}/api/skl/uploads/${uploadId}/download`;
};

const withDownloadUrl = (req, upload) => ({
  ...upload,
  downloadUrl: buildDownloadUrl(req, upload.id),
});

// List all SKL uploads
const listSklUploads = asyncHandler(async (req, res) => {
  let whereClause = { deletedAt: null };

  // If user is MAHASISWA, they can only see their own SKL uploads
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

  const sklUploads = await prisma.sklUpload.findMany({
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

  const data = sklUploads.map((item) => withDownloadUrl(req, item));

  res.json({ data });
});

// Get SKL upload by ID
const getSklUploadById = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);

  const sklUpload = await prisma.sklUpload.findFirst({
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

  if (!sklUpload) {
    res.status(404);
    throw new Error("Unggahan SKL tidak ditemukan");
  }

  // If user is MAHASISWA, check ownership
  if (req.user.role === "MAHASISWA") {
    const student = await prisma.mahasiswa.findUnique({
      where: { userId: req.user.id },
    });
    if (!student || sklUpload.mahasiswaId !== student.id) {
      res.status(403);
      throw new Error("Akses ditolak");
    }
  }

  res.json({ data: withDownloadUrl(req, sklUpload) });
});

// Create SKL upload
const createSklUpload = asyncHandler(async (req, res) => {
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
    errors.sklFile = "sklFile wajib diunggah";
  } else if (!["application/pdf"].includes(file.mimetype)) {
    errors.sklFile = "Tipe file tidak valid (hanya diperbolehkan PDF)";
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

    const createdSklUpload = await prisma.sklUpload.create({
      data: {
        name,
        filename: file.filename,
        path: file.path,
        mahasiswaId,
      },
    });

    res.status(201).json({
      message: "SKL uploaded successfully",
      data: withDownloadUrl(req, createdSklUpload),
    });
  } catch (error) {
    if (file.path) {
      fs.unlink(file.path, () => {});
    }
    throw error;
  }
});

// Update SKL upload
const updateSklUpload = asyncHandler(async (req, res) => {
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
    errors.sklFile = "Tipe file tidak valid (hanya diperbolehkan PDF)";
  }

  if (Object.keys(errors).length > 0) {
    if (file?.path) fs.unlink(file.path, () => {});
    return sendValidationError(res, errors, req);
  }

  try {
    const sklUpload = await prisma.sklUpload.findFirst({
      where: { id, deletedAt: null },
    });

    if (!sklUpload) {
      if (file?.path) {
        fs.unlink(file.path, () => {});
      }
      res.status(404);
      throw new Error("Unggahan SKL tidak ditemukan");
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

    const oldPath = sklUpload.path;

    const updatedSklUpload = await prisma.sklUpload.update({
      where: { id },
      data: {
        name: name !== undefined ? name : sklUpload.name,
        mahasiswaId: mahasiswaId !== undefined ? parseInt(mahasiswaId) : sklUpload.mahasiswaId,
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
      message: "SKL updated successfully",
      data: withDownloadUrl(req, updatedSklUpload),
    });
  } catch (error) {
    if (file?.path) {
      fs.unlink(file.path, () => {});
    }
    throw error;
  }
});

// Delete SKL upload (soft delete)
const deleteSklUpload = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);

  const sklUpload = await prisma.sklUpload.findFirst({
    where: { id, deletedAt: null },
  });

  if (!sklUpload) {
    res.status(404);
    throw new Error("Unggahan SKL tidak ditemukan");
  }

  await prisma.sklUpload.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  res.json({ message: "SKL deleted successfully" });
});

// Download SKL upload file
const downloadSklUpload = asyncHandler(async (req, res) => {
  const uploadId = parseInt(req.params.uploadId);

  const upload = await prisma.sklUpload.findFirst({
    where: { id: uploadId, deletedAt: null },
  });

  if (!upload) {
    res.status(404);
    throw new Error("File SKL tidak ditemukan");
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

export { listSklUploads,
  getSklUploadById,
  createSklUpload,
  updateSklUpload,
  deleteSklUpload,
  downloadSklUpload, };
