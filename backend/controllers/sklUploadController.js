const asyncHandler = require("express-async-handler");
const prisma = require("../prisma/client");
const fs = require("fs");
const path = require("path");

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

  // If user is STUDENT, they can only see their own SKL uploads
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

  const sklUploads = await prisma.sklUpload.findMany({
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

  const data = sklUploads.map((item) => withDownloadUrl(req, item));

  res.json({ data });
});

// Get SKL upload by ID
const getSklUploadById = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);

  const sklUpload = await prisma.sklUpload.findFirst({
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

  if (!sklUpload) {
    res.status(404);
    throw new Error("Unggahan SKL tidak ditemukan");
  }

  // If user is STUDENT, check ownership
  if (req.user.role === "STUDENT") {
    const student = await prisma.student.findUnique({
      where: { userId: req.user.id },
    });
    if (!student || sklUpload.studentId !== student.id) {
      res.status(403);
      throw new Error("Akses ditolak");
    }
  }

  res.json({ data: withDownloadUrl(req, sklUpload) });
});

// Create SKL upload
const createSklUpload = asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) {
    res.status(400);
    throw new Error("File SKL wajib diunggah");
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

    const createdSklUpload = await prisma.sklUpload.create({
      data: {
        name,
        filename: file.filename,
        path: file.path,
        studentId,
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

    const oldPath = sklUpload.path;

    const updatedSklUpload = await prisma.sklUpload.update({
      where: { id },
      data: {
        name: name !== undefined ? name : sklUpload.name,
        studentId: studentId !== undefined ? parseInt(studentId) : sklUpload.studentId,
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
  listSklUploads,
  getSklUploadById,
  createSklUpload,
  updateSklUpload,
  deleteSklUpload,
  downloadSklUpload,
};
