import asyncHandler from 'express-async-handler';
import prisma from '../prisma/client.js';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const buildDownloadUrl = (req, uploadId) => {
  if (!uploadId) return null;
  return `${req.protocol}://${req.get("host")}/api/formulir-penerbitan-skta/uploads/${uploadId}/download`;
};

const withDownloadUrl = (req, upload) => ({
  ...upload,
  downloadUrl: buildDownloadUrl(req, upload.id),
});

// List all Formulir Penerbitan SKTA uploads
const listFormulirPenerbitanSktaUploads = asyncHandler(async (req, res) => {
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

  const uploads = await prisma.formulirPenerbitanSktaUpload.findMany({
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

// Get Formulir Penerbitan SKTA upload by ID
const getFormulirPenerbitanSktaUploadById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const upload = await prisma.formulirPenerbitanSktaUpload.findFirst({
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
    throw new Error("Unggahan formulir tidak ditemukan");
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

// Create Formulir Penerbitan SKTA upload (with UUID)
const createFormulirPenerbitanSktaUpload = asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) {
    res.status(400);
    throw new Error("File formulir wajib diunggah");
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

    const createdUpload = await prisma.formulirPenerbitanSktaUpload.create({
      data: {
        id: uuidv4(),
        name,
        filename: file.filename,
        path: file.path,
        mahasiswaId,
      },
    });

    res.status(201).json({
      message: "Formulir penerbitan SKTA uploaded successfully",
      data: withDownloadUrl(req, createdUpload),
    });
  } catch (error) {
    if (file.path) {
      fs.unlink(file.path, () => {});
    }
    throw error;
  }
});

// Update Formulir Penerbitan SKTA upload
const updateFormulirPenerbitanSktaUpload = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const file = req.file;

  try {
    const uploadRecord = await prisma.formulirPenerbitanSktaUpload.findFirst({
      where: { id, deletedAt: null },
    });

    if (!uploadRecord) {
      if (file?.path) {
        fs.unlink(file.path, () => {});
      }
      res.status(404);
      throw new Error("Unggahan formulir tidak ditemukan");
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

    const updatedUpload = await prisma.formulirPenerbitanSktaUpload.update({
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
      message: "Formulir penerbitan SKTA updated successfully",
      data: withDownloadUrl(req, updatedUpload),
    });
  } catch (error) {
    if (file?.path) {
      fs.unlink(file.path, () => {});
    }
    throw error;
  }
});

// Delete Formulir Penerbitan SKTA upload (soft delete)
const deleteFormulirPenerbitanSktaUpload = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const uploadRecord = await prisma.formulirPenerbitanSktaUpload.findFirst({
    where: { id, deletedAt: null },
  });

  if (!uploadRecord) {
    res.status(404);
    throw new Error("Unggahan formulir tidak ditemukan");
  }

  await prisma.formulirPenerbitanSktaUpload.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  res.json({ message: "Formulir penerbitan SKTA deleted successfully" });
});

// Download Formulir Penerbitan SKTA upload file
const downloadFormulirPenerbitanSktaUpload = asyncHandler(async (req, res) => {
  const { uploadId } = req.params;

  const upload = await prisma.formulirPenerbitanSktaUpload.findFirst({
    where: { id: uploadId, deletedAt: null },
  });

  if (!upload) {
    res.status(404);
    throw new Error("File formulir tidak ditemukan");
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

export { listFormulirPenerbitanSktaUploads,
  getFormulirPenerbitanSktaUploadById,
  createFormulirPenerbitanSktaUpload,
  updateFormulirPenerbitanSktaUpload,
  deleteFormulirPenerbitanSktaUpload,
  downloadFormulirPenerbitanSktaUpload, };
