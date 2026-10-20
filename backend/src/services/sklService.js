import path from "path";
import { v4 as uuidv4 } from "uuid";
import prisma from "../config/prisma.js";
import { getPaginationParams } from "../utils/paginationHelper.js";
import { uploadFile, deleteFile } from "./storageService.js";

const sklInclude = {
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

export const listSklUploads = async (query = {}, user = null) => {
  const paginationParams = getPaginationParams(query);
  const whereClause = { deletedAt: null, category: "SKL" };

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

  const [total, sklUploads] = await Promise.all([
    prisma.berkasMahasiswa.count({ where: whereClause }),
    prisma.berkasMahasiswa.findMany({
      where: whereClause,
      skip: paginationParams.skip,
      take: paginationParams.take,
      include: sklInclude,
      orderBy,
    }),
  ]);

  return {
    data: sklUploads,
    total,
    paginationParams,
  };
};

export const getSklUploadById = async (id, user = null) => {
  const sklUpload = await prisma.berkasMahasiswa.findFirst({
    where: {
      deletedAt: null,
      category: "SKL",
      OR: [{ id }, { mahasiswaId: id }],
    },
    include: sklInclude,
    orderBy: { createdAt: "desc" },
  });

  if (!sklUpload) {
    throwError(404, "Unggahan SKL tidak ditemukan");
  }

  if (user?.role === "MAHASISWA") {
    const student = await prisma.mahasiswa.findUnique({
      where: { userId: user.id },
    });
    if (!student || sklUpload.mahasiswaId !== student.id) {
      throwError(403, "Akses ditolak");
    }
  }

  return sklUpload;
};

export const createSklUpload = async (body, file) => {
  if (!file) {
    throwError(400, "Validation error", [
      { field: "sklFile", message: "sklFile wajib diunggah" },
    ]);
  } else if (file.mimetype !== "application/pdf") {
    throwError(400, "Validation error", [
      {
        field: "sklFile",
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

  const existingSkl = await prisma.berkasMahasiswa.findFirst({
    where: {
      mahasiswaId,
      category: "SKL",
      deletedAt: null,
    },
  });

  let resultUpload;
  if (existingSkl) {
    if (existingSkl.filepath) {
      await deleteFile(existingSkl.filepath);
    }

    resultUpload = await prisma.berkasMahasiswa.update({
      where: { id: existingSkl.id },
      data: {
        name,
        filepath: uploaded.filepath,
      },
      include: sklInclude,
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
      category: "SKL",
      filepath: uploaded.filepath,
      mahasiswaId,
    },
    include: sklInclude,
  });

  return {
    isExisting: false,
    data: resultUpload,
  };
};

export const updateSklUpload = async (id, body, file) => {
  if (file && file.mimetype !== "application/pdf") {
    throwError(400, "Validation error", [
      {
        field: "sklFile",
        message: "Tipe file tidak valid (hanya diperbolehkan PDF)",
      },
    ]);
  }

  const sklUpload = await prisma.berkasMahasiswa.findFirst({
    where: {
      deletedAt: null,
      category: "SKL",
      OR: [{ id }, { mahasiswaId: id }],
    },
    orderBy: { createdAt: "desc" },
  });

  if (!sklUpload) {
    throwError(404, "Unggahan SKL tidak ditemukan");
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

  const oldPath = sklUpload.filepath;
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

  const updatedSklUpload = await prisma.berkasMahasiswa.update({
    where: { id: sklUpload.id },
    data: {
      name: name !== undefined ? name : sklUpload.name,
      mahasiswaId:
        mahasiswaId !== undefined ? mahasiswaId : sklUpload.mahasiswaId,
      ...(newFilepath ? { filepath: newFilepath } : {}),
    },
    include: sklInclude,
  });

  if (file && oldPath) {
    await deleteFile(oldPath);
  }

  return updatedSklUpload;
};

export const deleteSklUpload = async (id) => {
  const sklUpload = await prisma.berkasMahasiswa.findFirst({
    where: {
      deletedAt: null,
      category: "SKL",
      OR: [{ id }, { mahasiswaId: id }],
    },
    orderBy: { createdAt: "desc" },
  });

  if (!sklUpload) {
    throwError(404, "Unggahan SKL tidak ditemukan");
  }

  await prisma.berkasMahasiswa.update({
    where: { id: sklUpload.id },
    data: { deletedAt: new Date() },
  });

  return true;
};

export const getSklForDownload = async (id, user = null) => {
  const upload = await prisma.berkasMahasiswa.findFirst({
    where: {
      deletedAt: null,
      category: "SKL",
      OR: [{ id }, { mahasiswaId: id }],
    },
    orderBy: { createdAt: "desc" },
  });

  if (!upload) {
    throwError(404, "File SKL tidak ditemukan");
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
    (upload.name || "").replace(/[\\/:*?"<>|]/g, "-").trim() || "skl";
  const downloadName = baseName.toLowerCase().endsWith(ext.toLowerCase())
    ? baseName
    : `${baseName}${ext}`;

  return {
    filepath: upload.filepath,
    downloadName,
    mimeType: "application/pdf",
  };
};
