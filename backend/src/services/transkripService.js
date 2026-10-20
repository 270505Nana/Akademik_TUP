import path from "path";
import { v4 as uuidv4 } from "uuid";
import prisma from "../config/prisma.js";
import { getPaginationParams } from "../utils/paginationHelper.js";
import { uploadFile, deleteFile } from "./storageService.js";

const transkripInclude = {
  mahasiswa: {
    include: {
      studyProgram: true,
      user: true,
    },
  },
};

const throwError = (statusCode, message, errors) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  if (errors) error.errors = errors;
  throw error;
};

export const listTranskripUploads = async (query = {}, user = null) => {
  const paginationParams = getPaginationParams(query);
  const whereClause = { deletedAt: null, category: "Transkrip" };

  if (user?.role === "MAHASISWA") {
    const student = await prisma.mahasiswa.findUnique({
      where: { userId: user.id },
    });
    if (!student) {
      throwError(404, "Data mahasiswa tidak ditemukan");
    }
    whereClause.mahasiswaId = student.id;
  } else if (query.mahasiswaId) {
    whereClause.mahasiswaId = query.mahasiswaId;
  }

  if (query.search) {
    whereClause.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { mahasiswa: { name: { contains: query.search, mode: "insensitive" } } },
      { mahasiswa: { nim: { contains: query.search, mode: "insensitive" } } },
    ];
  }

  const sortBy = (query.sortBy || "createdAt").trim();
  const sortOrder =
    (query.sortOrder || "desc").toLowerCase() === "asc" ? "asc" : "desc";
  const orderBy = { [sortBy]: sortOrder };

  const [total, transkripUploads] = await Promise.all([
    prisma.berkasMahasiswa.count({ where: whereClause }),
    prisma.berkasMahasiswa.findMany({
      where: whereClause,
      skip: paginationParams.skip,
      take: paginationParams.take,
      include: transkripInclude,
      orderBy,
    }),
  ]);

  return {
    data: transkripUploads,
    total,
    paginationParams,
  };
};

export const getTranskripUploadById = async (id, user = null) => {
  const transkripUpload = await prisma.berkasMahasiswa.findFirst({
    where: {
      deletedAt: null,
      category: "Transkrip",
      OR: [{ id }, { mahasiswaId: id }],
    },
    include: transkripInclude,
    orderBy: { createdAt: "desc" },
  });

  if (!transkripUpload) {
    throwError(404, "Unggahan transkrip tidak ditemukan");
  }

  if (user?.role === "MAHASISWA") {
    const student = await prisma.mahasiswa.findUnique({
      where: { userId: user.id },
    });
    if (!student || transkripUpload.mahasiswaId !== student.id) {
      throwError(403, "Akses ditolak");
    }
  }

  return transkripUpload;
};

export const createTranskripUpload = async (body, file) => {
  if (!file) {
    throwError(400, "Validation error", [
      { field: "transkripFile", message: "transkripFile wajib diunggah" },
    ]);
  } else if (file.mimetype !== "application/pdf") {
    throwError(400, "Validation error", [
      {
        field: "transkripFile",
        message: "Tipe file tidak valid (hanya diperbolehkan PDF)",
      },
    ]);
  }

  const { name, mahasiswaId } = body;

  const studentExists = await prisma.mahasiswa.findUnique({
    where: { id: mahasiswaId },
  });
  if (!studentExists) {
    throwError(404, "Mahasiswa tidak ditemukan");
  }

  const uploaded = await uploadFile({
    buffer: file.buffer,
    originalname: file.originalname,
    folder: "berkas-mahasiswa",
    mimetype: file.mimetype,
  });

  const existingTranskrip = await prisma.berkasMahasiswa.findFirst({
    where: {
      mahasiswaId,
      category: "Transkrip",
      deletedAt: null,
    },
  });

  let resultUpload;
  if (existingTranskrip) {
    if (existingTranskrip.filepath) {
      await deleteFile(existingTranskrip.filepath);
    }

    resultUpload = await prisma.berkasMahasiswa.update({
      where: { id: existingTranskrip.id },
      data: {
        name,
        filepath: uploaded.filepath,
      },
      include: transkripInclude,
    });

    return {
      isExisting: true,
      data: resultUpload,
    };
  }

  resultUpload = await prisma.berkasMahasiswa.create({
    data: {
      id: uuidv4(),
      name,
      category: "Transkrip",
      filepath: uploaded.filepath,
      mahasiswaId,
    },
    include: transkripInclude,
  });

  return {
    isExisting: false,
    data: resultUpload,
  };
};

export const updateTranskripUpload = async (id, body, file) => {
  if (file && file.mimetype !== "application/pdf") {
    throwError(400, "Validation error", [
      {
        field: "transkripFile",
        message: "Tipe file tidak valid (hanya diperbolehkan PDF)",
      },
    ]);
  }

  const transkripUpload = await prisma.berkasMahasiswa.findFirst({
    where: {
      deletedAt: null,
      category: "Transkrip",
      OR: [{ id }, { mahasiswaId: id }],
    },
    orderBy: { createdAt: "desc" },
  });

  if (!transkripUpload) {
    throwError(404, "Unggahan transkrip tidak ditemukan");
  }

  const { name, mahasiswaId } = body;

  if (mahasiswaId) {
    const studentExists = await prisma.mahasiswa.findUnique({
      where: { id: mahasiswaId },
    });
    if (!studentExists) {
      throwError(404, "Mahasiswa tidak ditemukan");
    }
  }

  const oldPath = transkripUpload.filepath;
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

  const updatedTranskripUpload = await prisma.berkasMahasiswa.update({
    where: { id: transkripUpload.id },
    data: {
      name: name !== undefined ? name : transkripUpload.name,
      mahasiswaId:
        mahasiswaId !== undefined ? mahasiswaId : transkripUpload.mahasiswaId,
      ...(newFilepath ? { filepath: newFilepath } : {}),
    },
    include: transkripInclude,
  });

  if (file && oldPath) {
    await deleteFile(oldPath);
  }

  return updatedTranskripUpload;
};

export const deleteTranskripUpload = async (id) => {
  const transkripUpload = await prisma.berkasMahasiswa.findFirst({
    where: {
      deletedAt: null,
      category: "Transkrip",
      OR: [{ id }, { mahasiswaId: id }],
    },
    orderBy: { createdAt: "desc" },
  });

  if (!transkripUpload) {
    throwError(404, "Unggahan transkrip tidak ditemukan");
  }

  await prisma.berkasMahasiswa.update({
    where: { id: transkripUpload.id },
    data: { deletedAt: new Date() },
  });

  return true;
};

export const getTranskripForDownload = async (id, user = null) => {
  const upload = await prisma.berkasMahasiswa.findFirst({
    where: {
      deletedAt: null,
      category: "Transkrip",
      OR: [{ id }, { mahasiswaId: id }],
    },
    orderBy: { createdAt: "desc" },
  });

  if (!upload) {
    throwError(404, "File transkrip tidak ditemukan");
  }

  if (user?.role === "MAHASISWA") {
    const student = await prisma.mahasiswa.findUnique({
      where: { userId: user.id },
    });
    if (!student || upload.mahasiswaId !== student.id) {
      throwError(403, "Akses ditolak");
    }
  }

  const ext = path.extname(upload.filepath || "") || ".pdf";
  const baseName =
    (upload.name || "").replace(/[\\/:*?"<>|]/g, "-").trim() || "transkrip";
  const downloadName = baseName.toLowerCase().endsWith(ext.toLowerCase())
    ? baseName
    : `${baseName}${ext}`;

  return {
    filepath: upload.filepath,
    downloadName,
    mimeType: "application/pdf",
  };
};
