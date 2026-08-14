import asyncHandler from 'express-async-handler';
import prisma from "../config/prisma.js";
import fs from 'fs';
import path from 'path';
import { sendValidationError, isNil } from '../utils/validationHelper.js';

import { v4 as uuidv4 } from 'uuid';

const buildDownloadUrl = (req, berkasId) => {
  if (!berkasId) return null;
  return `${req.protocol}://${req.get("host")}/api/berkas-mahasiswa/download/${berkasId}`;
};

const withDownloadUrl = (req, berkas) => ({
  ...berkas,
  downloadUrl: buildDownloadUrl(req, berkas.id),
});

// List all BerkasMahasiswa uploads
const listBerkasMahasiswa = asyncHandler(async (req, res) => {
  let whereClause = { deletedAt: null };

  const { category, mahasiswaId } = req.query;

  if (category) {
    whereClause.category = category;
  }

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
  } else if (mahasiswaId) {
    whereClause.mahasiswaId = mahasiswaId;
  }

  const uploads = await prisma.berkasMahasiswa.findMany({
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
    orderBy: { updatedAt: "desc" },
  });

  const data = uploads.map((item) => withDownloadUrl(req, item));

  res.json({ data });
});

// Get BerkasMahasiswa upload by ID
const getBerkasMahasiswaById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const upload = await prisma.berkasMahasiswa.findFirst({
    where: { id, deletedAt: null },
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

  if (!upload) {
    res.status(404);
    throw new Error("Berkas mahasiswa tidak ditemukan");
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

// Create/Upload BerkasMahasiswa
const createBerkasMahasiswa = asyncHandler(async (req, res) => {
  const file = req.file;
  const errors = {};

  if (isNil(req.body.name)) {
    errors.name = "name wajib diisi";
  }
  if (isNil(req.body.category)) {
    errors.category = "category wajib diisi";
  }
  
  const reqMahasiswaId = req.body.mahasiswaId;
  if (isNil(reqMahasiswaId)) {
    errors.mahasiswaId = "mahasiswaId wajib diisi";
  }

  if (!file) {
    errors.berkas = "berkas wajib diunggah";
  } else if (!["application/pdf"].includes(file.mimetype)) {
    errors.berkas = "Tipe file tidak valid (hanya diperbolehkan PDF)";
  }

  if (Object.keys(errors).length > 0) {
    if (file?.path) fs.unlink(file.path, () => {});
    return sendValidationError(res, errors, req);
  }

  try {
    const { name, category } = req.body;
    const studentExists = await prisma.mahasiswa.findUnique({
      where: { id: reqMahasiswaId },
    });
    if (!studentExists) {
      res.status(404);
      throw new Error("Mahasiswa tidak ditemukan");
    }

    const existingBerkas = await prisma.berkasMahasiswa.findFirst({
      where: {
        mahasiswaId: reqMahasiswaId,
        category: category,
        deletedAt: null,
      },
    });

    let resultUpload;
    if (existingBerkas) {
      if (existingBerkas.filepath && fs.existsSync(existingBerkas.filepath)) {
        fs.unlink(existingBerkas.filepath, () => {});
      }

      resultUpload = await prisma.berkasMahasiswa.update({
        where: { id: existingBerkas.id },
        data: {
          name,
          filepath: file.path,
        },
      });
    } else {
      resultUpload = await prisma.berkasMahasiswa.create({
        data: {
          id: uuidv4(),
          name,
          category,
          filepath: file.path,
          mahasiswaId: reqMahasiswaId,
        },
      });
    }

    res.status(existingBerkas ? 200 : 201).json({
      message: existingBerkas
        ? "Berkas mahasiswa successfully updated (overwritten)"
        : "Berkas mahasiswa uploaded successfully",
      data: withDownloadUrl(req, resultUpload),
    });
  } catch (error) {
    if (file?.path) {
      fs.unlink(file.path, () => {});
    }
    throw error;
  }
});

// Delete BerkasMahasiswa upload (soft delete)
const deleteBerkasMahasiswa = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const uploadRecord = await prisma.berkasMahasiswa.findFirst({
    where: { id, deletedAt: null },
  });

  if (!uploadRecord) {
    res.status(404);
    throw new Error("Berkas mahasiswa tidak ditemukan");
  }

  await prisma.berkasMahasiswa.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  res.json({ message: "Berkas mahasiswa deleted successfully" });
});

// Download BerkasMahasiswa upload file
const downloadBerkasMahasiswa = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const upload = await prisma.berkasMahasiswa.findFirst({
    where: { id, deletedAt: null },
  });

  if (!upload) {
    res.status(404);
    throw new Error("File dokumen tidak ditemukan");
  }

  const filePath = path.resolve(process.cwd(), upload.filepath);

  if (!fs.existsSync(filePath)) {
    res.status(404);
    throw new Error("File fisik tidak ditemukan di server");
  }

  res.download(filePath, upload.name);
});

export {
  listBerkasMahasiswa,
  getBerkasMahasiswaById,
  createBerkasMahasiswa,
  deleteBerkasMahasiswa,
  downloadBerkasMahasiswa,
};
