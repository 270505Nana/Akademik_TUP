import asyncHandler from "express-async-handler";
import prisma from "../config/prisma.js";
import { sendValidationError, isNil } from "../utils/validationHelper.js";
import {
  getPaginationParams,
  formatPaginationResponse,
} from "../utils/paginationHelper.js";
import fs from "fs";
import path from "path";

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
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
};

const buildDownloadUrl = (req, template) => {
  if (!template?.code || !template?.filepath) return null;
  return `${req.protocol}://${req.get("host")}/api/templates/download/${template.code}`;
};

const buildPreviewUrl = (req, template) => {
  if (!template?.code || !template?.filepath) return null;
  return `${req.protocol}://${req.get("host")}/api/templates/preview/${template.code}`;
};

const withFileUrl = (req, data) => {
  if (!data) return null;
  const downloadUrl = buildDownloadUrl(req, data);
  const previewUrl = buildPreviewUrl(req, data);
  return {
    id: data.id,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    name: data.name,
    code: data.code,
    category: data.category,
    filepath: data.filepath,
    isPublish: data.isPublish,
    isRequired: data.isRequired,
    downloadUrl,
    previewUrl,
    url: downloadUrl,
  };
};

// Get all template uploads
const listTemplateUploads = asyncHandler(async (req, res) => {
  const paginationParams = getPaginationParams(req.query);
  const { category } = req.query;
  const whereClause = {
    ...(category && { category }),
  };

  const [total, templateUploads] = await Promise.all([
    prisma.dokumenPersyaratanBerkas.count({ where: whereClause }),
    prisma.dokumenPersyaratanBerkas.findMany({
      where: whereClause,
      skip: paginationParams.skip,
      take: paginationParams.take,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const data = templateUploads.map((item) => withFileUrl(req, item));
  res.json(formatPaginationResponse(data, total, paginationParams));
});

// Create template upload
const createTemplateUpload = asyncHandler(async (req, res) => {
  try {
    const { name, category, isPublish, isRequired } = req.body;
    const file = req.file;

    const errors = [];
    if (isNil(name))
      errors.push({ field: "name", message: "name wajib diisi" });
    if (isNil(category))
      errors.push({ field: "category", message: "category wajib diisi" });
    if (file && !allowedMimeTypes.includes(file.mimetype)) {
      errors.push({ field: "templateFile", message: "Tipe file tidak valid" });
    }

    if (errors.length > 0) return sendValidationError(res, errors, req);

    const autoCode = generateCodeFromName(name);
    const codeExists = await prisma.dokumenPersyaratanBerkas.findUnique({
      where: { code: autoCode },
    });

    if (codeExists) {
      if (file?.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      return sendValidationError(
        res,
        [
          {
            field: "name",
            message: "nama dokumen sudah digunakan di dokumen lain",
          },
        ],
        req,
      );
    }

    let relativePosixPath = null;

    if (file) {
      // Rename file to match the code name
      const ext = path.extname(file.originalname || file.path);
      const targetFileName = `${autoCode}${ext}`;
      const targetFilePath = path.join(path.dirname(file.path), targetFileName);
      relativePosixPath = path.posix.join("uploads/templates", targetFileName);

      if (file.path !== targetFilePath) {
        if (fs.existsSync(targetFilePath)) {
          fs.unlinkSync(targetFilePath);
        }
        fs.renameSync(file.path, targetFilePath);
      }
    }

    const createdTemplateUpload = await prisma.dokumenPersyaratanBerkas.create({
      data: {
        name,
        code: autoCode,
        category,
        isPublish: isPublish === "true" || isPublish === true,
        isRequired: isRequired !== undefined ? (isRequired === "true" || isRequired === true) : true,
        filepath: relativePosixPath,
      },
    });
    const data = withFileUrl(req, createdTemplateUpload);
    res.json({
      message: "Template upload created successfully",
      data,
    });
  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    throw error;
  }
});

// Get template upload by Code
const findTemplateUploadByCode = asyncHandler(async (req, res) => {
  const code = req.params.code;

  const templateUpload = await prisma.dokumenPersyaratanBerkas.findFirst({
    where: { code },
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
    const { name, category, isPublish, isRequired } = req.body;
    const file = req.file;

    const errors = [];
    if (file && !allowedMimeTypes.includes(file.mimetype)) {
      errors.push({ field: "templateFile", message: "Tipe file tidak valid" });
    }

    if (errors.length > 0) return sendValidationError(res, errors, req);

    const templateUpload = await prisma.dokumenPersyaratanBerkas.findFirst({
      where: { id },
    });
    if (!templateUpload) {
      if (file?.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
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
      if (codeExists && codeExists.id !== id) {
        if (file?.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        return sendValidationError(
          res,
          [
            {
              field: "name",
              message: "nama dokumen baru sudah digunakan di dokumen lain",
            },
          ],
          req,
        );
      }
    }

    let finalFilepath = templateUpload.filepath;

    if (file) {
      // New file uploaded
      const ext = path.extname(file.originalname || file.path);
      const targetFileName = `${updatedCode}${ext}`;
      const targetFilePath = path.join(path.dirname(file.path), targetFileName);
      finalFilepath = path.posix.join("uploads/templates", targetFileName);

      // Remove old file if it exists and is different from target
      if (templateUpload.filepath) {
        const oldFullPath = path.resolve(
          process.cwd(),
          templateUpload.filepath,
        );
        if (
          oldFullPath !== path.resolve(process.cwd(), targetFilePath) &&
          fs.existsSync(oldFullPath)
        ) {
          fs.unlinkSync(oldFullPath);
        }
      }

      if (file.path !== targetFilePath) {
        if (fs.existsSync(targetFilePath)) {
          fs.unlinkSync(targetFilePath);
        }
        fs.renameSync(file.path, targetFilePath);
      }
    } else if (
      name &&
      name !== templateUpload.name &&
      templateUpload.filepath
    ) {
      // No new file, but name/code changed: rename existing file on disk if exists
      const oldFullPath = path.resolve(process.cwd(), templateUpload.filepath);
      const ext = path.extname(templateUpload.filepath);
      const targetFileName = `${updatedCode}${ext}`;
      const targetFilePath = path.join(
        path.dirname(oldFullPath),
        targetFileName,
      );
      finalFilepath = path.posix.join("uploads/templates", targetFileName);

      if (fs.existsSync(oldFullPath) && oldFullPath !== targetFilePath) {
        fs.renameSync(oldFullPath, targetFilePath);
      }
    }

    const updatedTemplateUpload = await prisma.dokumenPersyaratanBerkas.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        code: updatedCode,
        ...(category !== undefined && { category }),
        ...(isPublish !== undefined && {
          isPublish: isPublish === "true" || isPublish === true,
        }),
        ...(isRequired !== undefined && {
          isRequired: isRequired === "true" || isRequired === true,
        }),
        filepath: finalFilepath,
      },
    });
    const data = withFileUrl(req, updatedTemplateUpload);

    res.json({
      message: "Template upload updated successfully",
      data,
    });
  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    throw error;
  }
});

// Delete template upload by ID (hard delete)
const deleteTemplateUpload = asyncHandler(async (req, res) => {
  const id = req.params.id;

  const templateUpload = await prisma.dokumenPersyaratanBerkas.findFirst({
    where: { id },
  });
  if (!templateUpload) {
    res.status(404);
    throw new Error("Unggahan template tidak ditemukan");
  }
  if (templateUpload.filepath && fs.existsSync(templateUpload.filepath)) {
    fs.unlinkSync(templateUpload.filepath);
  }

  await prisma.dokumenPersyaratanBerkas.delete({
    where: { id },
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

  if (!template.filepath) {
    res.status(404);
    throw new Error("File template belum diunggah atau tidak ada");
  }

  const filePath = path.resolve(process.cwd(), template.filepath);
  if (!fs.existsSync(filePath)) {
    res.status(404);
    throw new Error("File template belum diunggah atau tidak ada");
  }

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

  if (!template.filepath) {
    res.status(404);
    throw new Error("File template belum diunggah atau tidak ada");
  }

  const filePath = path.resolve(process.cwd(), template.filepath);

  if (!fs.existsSync(filePath)) {
    res.status(404);
    throw new Error("File template belum diunggah atau tidak ada");
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

  res.setHeader("Content-Type", contentType);
  res.setHeader(
    "Content-Disposition",
    `inline; filename="${encodeURIComponent(displayName)}"`,
  );

  res.sendFile(filePath);
});

const togglePublishTemplate = asyncHandler(async (req, res) => {
  const id = req.params.id;

  const templateUpload = await prisma.dokumenPersyaratanBerkas.findFirst({
    where: { id },
  });
  if (!templateUpload) {
    res.status(404);
    throw new Error("Unggahan template tidak ditemukan");
  }
  const updatedTemplateUpload = await prisma.dokumenPersyaratanBerkas.update({
    where: { id },
    data: {
      isPublish: !templateUpload.isPublish,
    },
  });
  const data = withFileUrl(req, updatedTemplateUpload);

  res.json({
    message: `template status changed to ${updatedTemplateUpload.isPublish ? "published" : "unpublished"}`,
    data,
  });
});

const toggleRequiredTemplate = asyncHandler(async (req, res) => {
  const id = req.params.id;

  const templateUpload = await prisma.dokumenPersyaratanBerkas.findFirst({
    where: { id },
  });
  if (!templateUpload) {
    res.status(404);
    throw new Error("Unggahan template tidak ditemukan");
  }
  const updatedTemplateUpload = await prisma.dokumenPersyaratanBerkas.update({
    where: { id },
    data: {
      isRequired: !templateUpload.isRequired,
    },
  });
  const data = withFileUrl(req, updatedTemplateUpload);

  res.json({
    message: `template requirement status changed to ${updatedTemplateUpload.isRequired ? "required" : "optional"}`,
    data,
  });
});

export {
  listTemplateUploads,
  createTemplateUpload,
  findTemplateUploadByCode,
  updateTemplateUpload,
  deleteTemplateUpload,
  downloadTemplateUpload,
  previewTemplateUpload,
  togglePublishTemplate,
  toggleRequiredTemplate,
};
