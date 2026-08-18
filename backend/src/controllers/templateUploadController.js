import asyncHandler from 'express-async-handler';
import prisma from "../config/prisma.js";
import { sendValidationError, isNil } from '../utils/validationHelper.js';
import fs from 'fs';
import path from 'path';

const allowedMimeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const sanitizeFilename = (value) =>
  String(value || "template")
    .trim()
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ");

const buildDownloadUrl = (req, id) => {
  if (!id) return null; 
    return `${req.protocol}://${req.get("host")}/templates/download/${id}`;
};

const buildPreviewUrl = (req, id) => {
  if (!id) return null; 
    return `${req.protocol}://${req.get("host")}/templates/preview/${id}`;
};

const withFileUrl = (req, data) => ({
  ...data,
  url: buildDownloadUrl(req, data.id),
  download: buildDownloadUrl(req, data.id),
  preview: buildPreviewUrl(req, data.id),
});

// Get all template uploads
const listTemplateUploads = asyncHandler(async (req, res) => {
  const { category } = req.query;
  const templateUploads = await prisma.dokumenPersyaratanBerkas.findMany({
    where: { 
      deletedAt: null,
      ...(category && { category}),
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

    const createdTemplateUpload = await prisma.dokumenPersyaratanBerkas.create({
      data: {
        name,
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

// Get template upload by ID
const findTemplateUploadById = asyncHandler(async (req, res) => {
  const id = req.params.id;

  const templateUpload = await prisma.dokumenPersyaratanBerkas.findFirst({
    where: { id, deletedAt: null },
  });
  if (!templateUpload) {
    res.status(404);
    throw new Error("Unggahan template tidak ditemukan");
  }

  const data = withFileUrl(req, templateUpload);

  res.json({ data });
});

// Update template upload
const updateTemplateUpload = asyncHandler(async (req, res) => {
  try {
    const id = req.params.id;
    const { name, category, isPublish } = req.body;
    const file = req.file;

    const errors = [];
   // if (isNil(name)) errors.push({ field: 'name', message: 'name wajib diisi' });
  //  if (isNil(category)) errors.push({ field: 'category', message: 'category wajib diisi' });
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

    const updatedTemplateUpload = await prisma.dokumenPersyaratanBerkas.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
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

// Delete template upload
const deleteTemplateUpload = asyncHandler(async (req, res) => {
  const id = req.params.id;

  const templateUpload = await prisma.dokumenPersyaratanBerkas.findFirst({
    where: { id },
  });
  if (!templateUpload) {
    res.status(404);
    throw new Error("Unggahan template tidak ditemukan");
  }

  await prisma.dokumenPersyaratanBerkas.delete({
    where: { id },
  });

  if (templateUpload.filepath && fs.existsSync(templateUpload.filepath)) {
    fs.unlink(templateUpload.filepath, () => {});
  }

  res.json({ message: "Template upload deleted successfully" });
});

// Download template
const downloadTemplateUpload = asyncHandler(async (req, res) => {
  const id = req.params.id;

  const template = await prisma.dokumenPersyaratanBerkas.findUnique({
    where: { id },
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

// Preview template (serve inline, e.g. for PDF)
const previewTemplateUpload = asyncHandler(async (req, res) => {
  const id = req.params.id;

  const template = await prisma.dokumenPersyaratanBerkas.findUnique({
    where: { id },
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
  }

  const displayName = `${sanitizeFilename(template.name)}${ext}`;

  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(displayName)}"`);

  res.sendFile(filePath);
});

export { 
  listTemplateUploads,
  createTemplateUpload,
  findTemplateUploadById,
  updateTemplateUpload,
  deleteTemplateUpload,
  downloadTemplateUpload,
  previewTemplateUpload, 
};
