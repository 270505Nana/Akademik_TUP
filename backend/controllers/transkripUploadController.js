const asyncHandler = require("express-async-handler");
const prisma = require("../prisma/client");
const fs = require("fs");
const path = require("path");

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

  // If user is STUDENT, they can only see their own transkrip uploads
  if (req.user.role === "STUDENT") {
    const student = await prisma.student.findUnique({
      where: { userId: req.user.id },
    });
    if (!student) {
      res.status(404);
      throw new Error("Data mahasiswa tidak ditemukan");
    }
    whereClause.studentId = student.id;
  }

  const transkripUploads = await prisma.transkripUpload.findMany({
    where: whereClause,
    include: {
      student: {
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
      student: {
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

  // If user is STUDENT, check ownership
  if (req.user.role === "STUDENT") {
    const student = await prisma.student.findUnique({
      where: { userId: req.user.id },
    });
    if (!student || transkripUpload.studentId !== student.id) {
      res.status(403);
      throw new Error("Akses ditolak");
    }
  }

  res.json({ data: withDownloadUrl(req, transkripUpload) });
});

// Create Transkrip upload
const createTranskripUpload = asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) {
    res.status(400);
    throw new Error("File transkrip wajib diunggah");
  }

  try {
    const { name } = req.body;
    const studentId = parseInt(req.body.studentId);

    const studentExists = await prisma.student.findUnique({
      where: { id: studentId },
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
        studentId,
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

    const { name, studentId } = req.body;

    if (studentId) {
      const studentExists = await prisma.student.findUnique({
        where: { id: parseInt(studentId) },
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
        studentId: studentId !== undefined ? parseInt(studentId) : transkripUpload.studentId,
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

  // Check ownership if STUDENT
  if (req.user.role === "STUDENT") {
    const student = await prisma.student.findUnique({
      where: { userId: req.user.id },
    });
    if (!student || upload.studentId !== student.id) {
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

module.exports = {
  listTranskripUploads,
  getTranskripUploadById,
  createTranskripUpload,
  updateTranskripUpload,
  deleteTranskripUpload,
  downloadTranskripUpload,
};
