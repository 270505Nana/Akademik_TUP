import asyncHandler from 'express-async-handler';
import prisma from "../config/prisma.js";
import { sendValidationError, isNil } from '../utils/validationHelper.js';
import fs from 'fs';
import path from 'path';

const allowedMimeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/zip",
  "application/x-zip-compressed",
];

const sanitizeFilename = (value) =>
  String(value || "template")
    .trim()
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ");

const generateCodeFromName = (text) => {
  return text
  .toString()
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)+/g, '');
}

const buildDownloadUrl = (req, code) => {
  if (!code) return null; 
  return `${req.protocol}://${req.get("host")}/api/templates/download/${code}`;
};

const buildPreviewUrl = (req, code) => {
  if (!code) return null; 
  return `${req.protocol}://${req.get("host")}/api/templates/preview/${code}`;
};

const withFileUrl = (req, data) => {
  if (!data) return null;
  const downloadUrl = buildDownloadUrl(req, data.code);
  const previewUrl = buildPreviewUrl(req, data.code);
  return {
    id: data.id,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    name: data.name,
    code: data.code,
    category: data.category,
    filepath: data.filepath,
    isPublish: data.isPublish,
    downloadUrl,
    previewUrl,
    url: downloadUrl,
  };
};

// Get all template uploads
const listTemplateUploads = asyncHandler(async (req, res) => {
  const { category } = req.query;
  const templateUploads = await prisma.dokumenPersyaratanBerkas.findMany({
    where: { 
      deletedAt: null,
      ...(category && { category }),
    },
    orderBy: { createdAt: "desc" },
  });
  const data = templateUploads.map((item) => withFileUrl(req, item));
  res.json({ data });
});

// Create template upload
const createTemplateUpload = asyncHandler(async (req, res) => {
  try {
    const { name, category, isPublish } = req.body;
    const file = req.file;

    const errors = [];
    if (isNil(name)) errors.push({ field: 'name', message: 'name wajib diisi' });
    if (isNil(category)) errors.push({ field: 'category', message: 'category wajib diisi' });
    if (!file) {
      errors.push({ field: 'templateFile', message: 'templateFile wajib diunggah' });
    } else if (!allowedMimeTypes.includes(file.mimetype)) {
      errors.push({ field: 'templateFile', message: 'Tipe file tidak valid' });
    }

    if (errors.length > 0) return sendValidationError(res, errors, req);

    const autoCode = generateCodeFromName(name);
    const codeExists = await prisma.dokumenPersyaratanBerkas.findUnique({
      where: {code: autoCode},
    });

    if (codeExists) {
      if (file?.path) {
        fs.unlink(file.path, () => {});
      }
      return sendValidationError(res, [{ field: 'name', message: 'nama dokumen sudah digunakan di dokumen lain' }], req);
    }

    const createdTemplateUpload = await prisma.dokumenPersyaratanBerkas.create({
      data: {
        name,
        code: autoCode,
        category,
        isPublish: isPublish === 'true' || isPublish === true,
        filepath: file.path,
      },
    });
    const data = withFileUrl(req, createdTemplateUpload);
    res.json({
      message: "Template upload created successfully",
      data,
    });
  } catch (error) {
    if (req.file?.path) {
      fs.unlink(req.file.path, () => {});
    }
    throw error;
  }
});

// Get template upload by Code
const findTemplateUploadByCode = asyncHandler(async (req, res) => {
  const code = req.params.code;

  const templateUpload = await prisma.dokumenPersyaratanBerkas.findFirst({
    where: { code, deletedAt: null },
  });
  if (!templateUpload) {
    res.status(404);
    throw new Error("Unggahan template tidak ditemukan");
  }

  const data = withFileUrl(req, templateUpload);

  res.json({ data });
});

// Update template upload by ID (using PATCH)
const updateTemplateUpload = asyncHandler(async (req, res) => {
  try {
    const id = req.params.id;
    const { name, category, isPublish } = req.body;
    const file = req.file;

    const errors = [];
    if (file && !allowedMimeTypes.includes(file.mimetype)) {
      errors.push({ field: 'templateFile', message: 'Tipe file tidak valid' });
    }

    if (errors.length > 0) return sendValidationError(res, errors, req);

    const templateUpload = await prisma.dokumenPersyaratanBerkas.findFirst({
      where: { id, deletedAt: null },
    });
    if (!templateUpload) {
      if (file?.path) {
        fs.unlink(file.path, () => {});
      }

      res.status(404);
      throw new Error("Unggahan template tidak ditemukan");
    }

    let updatedCode = templateUpload.code;
    if (name && name !== templateUpload.name) {
      updatedCode = generateCodeFromName(name);

      const codeExists = await prisma.dokumenPersyaratanBerkas.findUnique({
        where: { code: updatedCode },
      });
      if (codeExists) {
        if (file?.path) {
          fs.unlink(file.path, () => {});
        }
          return sendValidationError(res, [{ field: 'name', message: 'nama dokumen baru sudah digunakan di dokumen lain' }], req);
      }
    }
    const updatedTemplateUpload = await prisma.dokumenPersyaratanBerkas.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        code: updatedCode,
        ...(category !== undefined && { category }),
        ...(isPublish !== undefined && { isPublish: isPublish === 'true' || isPublish === true }),
        ...(file ? { filepath: file.path }
          : {}),
      },
    });
    const data = withFileUrl(req, updatedTemplateUpload);

    if (file && templateUpload.filepath && fs.existsSync(templateUpload.filepath)) {
      fs.unlink(templateUpload.filepath, () => {});
    }

    res.json({
      message: "Template upload updated successfully",
      data,
    });
  } catch (error) {
    if (req.file?.path) {
      fs.unlink(req.file.path, () => {});
    }
    throw error;
  }
});

// Delete template upload by ID (soft delete)
const deleteTemplateUpload = asyncHandler(async (req, res) => {
  const id = req.params.id;

  const templateUpload = await prisma.dokumenPersyaratanBerkas.findFirst({
    where: { id, deletedAt: null },
  });
  if (!templateUpload) {
    res.status(404);
    throw new Error("Unggahan template tidak ditemukan");
  }

  await prisma.dokumenPersyaratanBerkas.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  res.json({ message: "Template upload deleted successfully" });
});

// Download template by Code
const downloadTemplateUpload = asyncHandler(async (req, res) => {
  const code = req.params.code;

  const template = await prisma.dokumenPersyaratanBerkas.findUnique({
    where: { code },
  });

  if (!template) {
    res.status(404);
    throw new Error("Template tidak ditemukan");
  }

  const filePath = path.resolve(process.cwd(), template.filepath);
  const ext = path.extname(template.filepath || "") || "";
  const downloadName = `${sanitizeFilename(template.name)}${ext}`;

  res.download(filePath, downloadName);
});

// Preview template (serve inline, e.g. for PDF) by Code
const previewTemplateUpload = asyncHandler(async (req, res) => {
  const code = req.params.code;

  const template = await prisma.dokumenPersyaratanBerkas.findUnique({
    where: { code },
  });

  if (!template) {
    res.status(404);
    throw new Error("Template tidak ditemukan");
  }

  const filePath = path.resolve(process.cwd(), template.filepath);

  if (!fs.existsSync(filePath)) {
    res.status(404);
    throw new Error("File template tidak ditemukan di server");
  }

  const ext = path.extname(template.filepath || "").toLowerCase();
  let contentType = "application/octet-stream";
  if (ext === ".pdf") {
    contentType = "application/pdf";
  } else if (ext === ".doc") {
    contentType = "application/msword";
  } else if (ext === ".docx") {
    contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }else if (ext === ".zip") {
    contentType = "application/zip";
  }

  const displayName = `${sanitizeFilename(template.name)}${ext}`;

  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(displayName)}"`);

  res.sendFile(filePath);
});

export { 
  listTemplateUploads,
  createTemplateUpload,
  findTemplateUploadByCode,
  updateTemplateUpload,
  deleteTemplateUpload,
  downloadTemplateUpload,
  previewTemplateUpload, 
};
