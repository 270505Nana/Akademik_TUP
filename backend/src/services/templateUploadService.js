import path from "path";
import prisma from "../config/prisma.js";
import { getPaginationParams } from "../utils/paginationHelper.js";
import {
  uploadFile,
  deleteFile,
} from "./storageService.js";
import {
  sanitizeFilename,
  generateCodeFromCategoryAndName,
} from "../utils/templateHelper.js";
import { ALLOWED_TEMPLATE_MIME_TYPES } from "../schemas/templateUploadSchema.js";

const throwError = (statusCode, message, errors) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  if (errors) error.errors = errors;
  throw error;
};

export const listTemplateUploads = async (query = {}) => {
  const paginationParams = getPaginationParams(query);
  const { category, search, sortBy, sortOrder } = query;

  const whereClause = {
    deletedAt: null,
    ...(category && { category }),
  };

  if (search) {
    whereClause.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { code: { contains: search, mode: "insensitive" } },
    ];
  }

  let orderBy = [{ category: "asc" }, { queue: "asc" }];
  const sortField = (sortBy || "").trim();
  const orderDirection =
    (sortOrder || "asc").toLowerCase() === "desc" ? "desc" : "asc";

  if (sortField === "newest") {
    orderBy = [{ createdAt: "desc" }];
  } else if (sortField === "oldest") {
    orderBy = [{ createdAt: "asc" }];
  } else if (sortField === "createdAt") {
    orderBy = [{ createdAt: orderDirection }];
  } else if (sortField === "name") {
    orderBy = [{ name: orderDirection }];
  } else if (sortField === "queue") {
    orderBy = [{ queue: orderDirection }];
  } else if (sortField === "category") {
    orderBy = [{ category: orderDirection }, { queue: "asc" }];
  }

  const [total, templateUploads] = await Promise.all([
    prisma.dokumenPersyaratanBerkas.count({ where: whereClause }),
    prisma.dokumenPersyaratanBerkas.findMany({
      where: whereClause,
      skip: paginationParams.skip,
      take: paginationParams.take,
      orderBy,
    }),
  ]);

  return {
    data: templateUploads,
    total,
    paginationParams,
  };
};

export const createTemplateUpload = async (body, file) => {
  const { name, category, isPublish, isRequired } = body;

  if (file && !ALLOWED_TEMPLATE_MIME_TYPES.includes(file.mimetype)) {
    throwError(400, "Validation error", [
      { field: "templateFile", message: "Tipe file tidak valid" },
    ]);
  }

  const autoCode = generateCodeFromCategoryAndName(category, name);
  const codeExists = await prisma.dokumenPersyaratanBerkas.findFirst({
    where: { code: autoCode, deletedAt: null },
  });

  if (codeExists) {
    throwError(400, "Validation error", [
      {
        field: "name",
        message: "Nama dan kategori dokumen sudah digunakan di dokumen lain",
      },
    ]);
  }

  const lastDoc = await prisma.dokumenPersyaratanBerkas.findFirst({
    where: { category, deletedAt: null },
    orderBy: { queue: "desc" },
    select: { queue: true },
  });
  const nextQueue = (lastDoc?.queue ?? 0) + 1;

  let savedFilePath = null;

  if (file) {
    const ext = path.extname(file.originalname || "") || ".pdf";
    const customFilename = `${autoCode}${ext}`;
    const uploaded = await uploadFile({
      buffer: file.buffer,
      originalname: file.originalname,
      customFilename,
      folder: "templates",
      mimetype: file.mimetype,
    });
    savedFilePath = uploaded.filepath;
  }

  return await prisma.dokumenPersyaratanBerkas.create({
    data: {
      name,
      code: autoCode,
      category,
      isPublish: isPublish === true,
      isRequired: isRequired !== undefined ? isRequired === true : true,
      queue: nextQueue,
      filepath: savedFilePath,
    },
  });
};

export const findTemplateUploadByCode = async (code) => {
  const templateUpload = await prisma.dokumenPersyaratanBerkas.findFirst({
    where: { code, deletedAt: null },
  });

  if (!templateUpload) {
    throwError(404, "Unggahan template tidak ditemukan");
  }

  return templateUpload;
};

export const updateTemplateUpload = async (id, body, file) => {
  const { name, category, isPublish, isRequired, queue } = body;

  if (file && !ALLOWED_TEMPLATE_MIME_TYPES.includes(file.mimetype)) {
    throwError(400, "Validation error", [
      { field: "templateFile", message: "Tipe file tidak valid" },
    ]);
  }

  const templateUpload = await prisma.dokumenPersyaratanBerkas.findFirst({
    where: { id, deletedAt: null },
  });

  if (!templateUpload) {
    throwError(404, "Unggahan template tidak ditemukan");
  }

  const newCategory =
    category !== undefined ? category : templateUpload.category;
  const newName = name !== undefined ? name : templateUpload.name;
  let updatedCode = templateUpload.code;

  if (
    newCategory !== templateUpload.category ||
    newName !== templateUpload.name
  ) {
    updatedCode = generateCodeFromCategoryAndName(newCategory, newName);

    const codeExists = await prisma.dokumenPersyaratanBerkas.findFirst({
      where: { code: updatedCode, deletedAt: null },
    });
    if (codeExists && codeExists.id !== id) {
      throwError(400, "Validation error", [
        {
          field: "name",
          message:
            "Nama dan kategori dokumen baru sudah digunakan di dokumen lain",
        },
      ]);
    }
  }

  let finalFilepath = templateUpload.filepath;

  if (file) {
    const ext = path.extname(file.originalname || "") || ".pdf";
    const customFilename = `${updatedCode}${ext}`;
    const uploaded = await uploadFile({
      buffer: file.buffer,
      originalname: file.originalname,
      customFilename,
      folder: "templates",
      mimetype: file.mimetype,
    });
    finalFilepath = uploaded.filepath;

    if (templateUpload.filepath && templateUpload.filepath !== finalFilepath) {
      await deleteFile(templateUpload.filepath);
    }
  }

  return await prisma.dokumenPersyaratanBerkas.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      code: updatedCode,
      ...(category !== undefined && { category }),
      ...(isPublish !== undefined && { isPublish }),
      ...(isRequired !== undefined && { isRequired }),
      ...(queue !== undefined && { queue }),
      filepath: finalFilepath,
    },
  });
};

export const deleteTemplateUpload = async (id) => {
  const templateUpload = await prisma.dokumenPersyaratanBerkas.findFirst({
    where: { id, deletedAt: null },
  });

  if (!templateUpload) {
    throwError(404, "Unggahan template tidak ditemukan");
  }

  if (templateUpload.filepath) {
    await deleteFile(templateUpload.filepath);
  }

  await prisma.dokumenPersyaratanBerkas.delete({
    where: { id },
  });

  return true;
};

export const getTemplateForDownload = async (code) => {
  const template = await prisma.dokumenPersyaratanBerkas.findFirst({
    where: { code, deletedAt: null },
  });

  if (!template) {
    throwError(404, "Template tidak ditemukan");
  }

  if (!template.filepath) {
    throwError(404, "File template belum diunggah atau tidak ada");
  }

  const ext = path.extname(template.filepath || "") || "";
  const downloadName = `${sanitizeFilename(template.name)}${ext}`;

  return {
    filepath: template.filepath,
    downloadName,
  };
};

export const getTemplateForPreview = async (code) => {
  const template = await prisma.dokumenPersyaratanBerkas.findFirst({
    where: { code, deletedAt: null },
  });

  if (!template) {
    throwError(404, "Template tidak ditemukan");
  }

  if (!template.filepath) {
    throwError(404, "File template belum diunggah atau tidak ada");
  }

  const ext = path.extname(template.filepath || "").toLowerCase();
  let contentType = "application/octet-stream";
  if (ext === ".pdf") {
    contentType = "application/pdf";
  } else if (ext === ".doc") {
    contentType = "application/msword";
  } else if (ext === ".docx") {
    contentType =
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  } else if (ext === ".zip") {
    contentType = "application/zip";
  }

  const displayName = `${sanitizeFilename(template.name)}${ext}`;

  return {
    filepath: template.filepath,
    filename: displayName,
    mimeType: contentType,
  };
};

export const togglePublishTemplate = async (id) => {
  const templateUpload = await prisma.dokumenPersyaratanBerkas.findFirst({
    where: { id, deletedAt: null },
  });

  if (!templateUpload) {
    throwError(404, "Unggahan template tidak ditemukan");
  }

  return await prisma.dokumenPersyaratanBerkas.update({
    where: { id },
    data: {
      isPublish: !templateUpload.isPublish,
    },
  });
};

export const toggleRequiredTemplate = async (id) => {
  const templateUpload = await prisma.dokumenPersyaratanBerkas.findFirst({
    where: { id, deletedAt: null },
  });

  if (!templateUpload) {
    throwError(404, "Unggahan template tidak ditemukan");
  }

  return await prisma.dokumenPersyaratanBerkas.update({
    where: { id },
    data: {
      isRequired: !templateUpload.isRequired,
    },
  });
};
