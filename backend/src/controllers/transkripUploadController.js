import asyncHandler from 'express-async-handler';
import prisma from "../config/prisma.js";
import fs from 'fs';
import path from 'path';
import { sendValidationError, isNil } from '../utils/validationHelper.js';
import { v4 as uuidv4 } from 'uuid';

const buildDownloadUrl = (req, uploadId) => {
  if (!uploadId) return null;
  return `${req.protocol}://${req.get("host")}/api/transkrip/uploads/${uploadId}/download`;
};

const withDownloadUrl = (req, upload) => {
  if (!upload) return null;
  return {
    ...upload,
    path: upload.filepath,
    filename: upload.name,
    downloadUrl: buildDownloadUrl(req, upload.id),
  };
};

// List all Transkrip uploads (from BerkasMahasiswa with category "Transkrip")
const listTranskripUploads = asyncHandler(async (req, res) => {
  let whereClause = { deletedAt: null, category: "Transkrip" };

  // If user is MAHASISWA, they can only see their own Transkrip uploads
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

  const transkripUploads = await prisma.berkasMahasiswa.findMany({
    where: whereClause,
    include: {
      mahasiswa: {
        select: {
          id: true,
          nim: true,
          user: {
            select: {
              name: true,
            }
          }
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Map to format that frontend expects
  const data = transkripUploads.map((item) => {
    const formattedItem = {
      ...item,
      mahasiswa: {
        id: item.mahasiswa.id,
        nim: item.mahasiswa.nim,
        name: item.mahasiswa.user?.name || "",
      }
    };
    return withDownloadUrl(req, formattedItem);
  });

  res.json({ data });
});

// Get Transkrip upload by ID
const getTranskripUploadById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const transkripUpload = await prisma.berkasMahasiswa.findFirst({
    where: { id, deletedAt: null, category: "Transkrip" },
    include: {
      mahasiswa: {
        select: {
          id: true,
          nim: true,
          user: {
            select: {
              name: true,
            }
          }
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

  const formattedItem = {
    ...transkripUpload,
    mahasiswa: {
      id: transkripUpload.mahasiswa.id,
      nim: transkripUpload.mahasiswa.nim,
      name: transkripUpload.mahasiswa.user?.name || "",
    }
  };

  res.json({ data: withDownloadUrl(req, formattedItem) });
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
    const mahasiswaId = req.body.mahasiswaId;

    const studentExists = await prisma.mahasiswa.findUnique({
      where: { id: mahasiswaId },
    });
    if (!studentExists) {
      res.status(404);
      throw new Error("Mahasiswa tidak ditemukan");
    }

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
      if (existingTranskrip.filepath && fs.existsSync(existingTranskrip.filepath)) {
        fs.unlink(existingTranskrip.filepath, () => {});
      }

      // 2. Update record in the database
      resultUpload = await prisma.berkasMahasiswa.update({
        where: { id: existingTranskrip.id },
        data: {
          name,
          filepath: file.path,
        },
      });
    } else {
      // Create new record
      resultUpload = await prisma.berkasMahasiswa.create({
        data: {
          id: uuidv4(),
          name,
          category: "Transkrip",
          filepath: file.path,
          mahasiswaId,
        },
      });
    }

    res.status(existingTranskrip ? 200 : 201).json({
      message: "Transkrip uploaded successfully",
      data: withDownloadUrl(req, resultUpload),
    });
  } catch (error) {
    if (file?.path) {
      fs.unlink(file.path, () => {});
    }
    throw error;
  }
});

// Update Transkrip upload
const updateTranskripUpload = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const file = req.file;

  const errors = {};

  if (!isNil(req.body.name) && req.body.name === "") {
    errors.name = "name tidak boleh kosong jika diisi";
  }
  if (file && !["application/pdf"].includes(file.mimetype)) {
    errors.transkripFile = "Tipe file tidak valid (hanya diperbolehkan PDF)";
  }

  if (Object.keys(errors).length > 0) {
    if (file?.path) fs.unlink(file.path, () => {});
    return sendValidationError(res, errors, req);
  }

  try {
    const transkripUpload = await prisma.berkasMahasiswa.findFirst({
      where: { id, deletedAt: null, category: "Transkrip" },
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
        where: { id: mahasiswaId },
      });
      if (!studentExists) {
        if (file?.path) {
          fs.unlink(file.path, () => {});
        }
        res.status(404);
        throw new Error("Mahasiswa tidak ditemukan");
      }
    }

    const oldPath = transkripUpload.filepath;

    const updatedTranskripUpload = await prisma.berkasMahasiswa.update({
      where: { id },
      data: {
        name: name !== undefined ? name : transkripUpload.name,
        mahasiswaId: mahasiswaId !== undefined ? mahasiswaId : transkripUpload.mahasiswaId,
        ...(file
          ? {
              filepath: file.path,
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
  if (req.user.role === "MAHASISWA") {
    const student = await prisma.mahasiswa.findUnique({
      where: { userId: req.user.id },
    });
    if (!student || upload.mahasiswaId !== student.id) {
      res.status(403);
      throw new Error("Akses ditolak");
    }
  }

  const filePath = path.resolve(process.cwd(), upload.filepath);

  if (!fs.existsSync(filePath)) {
    res.status(404);
    throw new Error("File fisik tidak ditemukan di server");
  }

  res.download(filePath, upload.name);
});

export {
  listTranskripUploads,
  getTranskripUploadById,
  createTranskripUpload,
  updateTranskripUpload,
  deleteTranskripUpload,
  downloadTranskripUpload,
};
