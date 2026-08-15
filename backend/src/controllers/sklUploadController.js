import asyncHandler from 'express-async-handler';
import prisma from "../config/prisma.js";
import fs from 'fs';
import path from 'path';
import { sendValidationError, isNil } from '../utils/validationHelper.js';
import { v4 as uuidv4 } from 'uuid';

const buildDownloadUrl = (req, uploadId) => {
  if (!uploadId) return null;
  return `${req.protocol}://${req.get("host")}/api/skl/uploads/${uploadId}/download`;
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

// List all SKL uploads (from BerkasMahasiswa with category "SKL")
const listSklUploads = asyncHandler(async (req, res) => {
  let whereClause = { deletedAt: null, category: "SKL" };

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

  const sklUploads = await prisma.berkasMahasiswa.findMany({
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
  const data = sklUploads.map((item) => {
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

// Get SKL upload by ID
const getSklUploadById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const sklUpload = await prisma.berkasMahasiswa.findFirst({
    where: { id, deletedAt: null, category: "SKL" },
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

  const formattedItem = {
    ...sklUpload,
    mahasiswa: {
      id: sklUpload.mahasiswa.id,
      nim: sklUpload.mahasiswa.nim,
      name: sklUpload.mahasiswa.user?.name || "",
    }
  };

  res.json({ data: withDownloadUrl(req, formattedItem) });
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
    const mahasiswaId = req.body.mahasiswaId;

    const studentExists = await prisma.mahasiswa.findUnique({
      where: { id: mahasiswaId },
    });
    if (!studentExists) {
      res.status(404);
      throw new Error("Mahasiswa tidak ditemukan");
    }

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
      // 1. Delete physical file of the old upload
      if (existingSkl.filepath && fs.existsSync(existingSkl.filepath)) {
        fs.unlink(existingSkl.filepath, () => {});
      }

      // 2. Update record in the database
      resultUpload = await prisma.berkasMahasiswa.update({
        where: { id: existingSkl.id },
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
          category: "SKL",
          filepath: file.path,
          mahasiswaId,
        },
      });
    }

    res.status(existingSkl ? 200 : 201).json({
      message: "SKL uploaded successfully",
      data: withDownloadUrl(req, resultUpload),
    });
  } catch (error) {
    if (file?.path) {
      fs.unlink(file.path, () => {});
    }
    throw error;
  }
});

// Update SKL upload
const updateSklUpload = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const file = req.file;

  const errors = {};

  if (!isNil(req.body.name) && req.body.name === "") {
    errors.name = "name tidak boleh kosong jika diisi";
  }
  if (file && !["application/pdf"].includes(file.mimetype)) {
    errors.sklFile = "Tipe file tidak valid (hanya diperbolehkan PDF)";
  }

  if (Object.keys(errors).length > 0) {
    if (file?.path) fs.unlink(file.path, () => {});
    return sendValidationError(res, errors, req);
  }

  try {
    const sklUpload = await prisma.berkasMahasiswa.findFirst({
      where: { id, deletedAt: null, category: "SKL" },
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

    const oldPath = sklUpload.filepath;

    const updatedSklUpload = await prisma.berkasMahasiswa.update({
      where: { id },
      data: {
        name: name !== undefined ? name : sklUpload.name,
        mahasiswaId: mahasiswaId !== undefined ? mahasiswaId : sklUpload.mahasiswaId,
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
  listSklUploads,
  getSklUploadById,
  createSklUpload,
  updateSklUpload,
  deleteSklUpload,
  downloadSklUpload,
};
