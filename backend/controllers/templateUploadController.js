const asyncHandler = require("express-async-handler");
const prisma = require("../prisma/client");
const fs = require("fs");
const path = require("path");

const sanitizeFilename = (value) =>
  String(value || "template")
    .trim()
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ");

const buildFileUrl = (req, slug) => {
  if (!slug) {
    return null;
  }

  return `${req.protocol}://${req.get("host")}/templates/download/${slug}`;
};

const withFileUrl = (req, data) => ({
  ...data,
  url: buildFileUrl(req, data.slug),
});

// Get all template uploads
const listTemplateUploads = asyncHandler(async (req, res) => {
  const templateUploads = await prisma.templateUpload.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
  const data = templateUploads.map((item) => withFileUrl(req, item));

  res.json({ data });
});

// Create template upload
const createTemplateUpload = asyncHandler(async (req, res) => {
  try {
    const { name, slug } = req.body;
    const file = req.file;

    const createdTemplateUpload = await prisma.templateUpload.create({
      data: {
        name,
        slug,
        filename: file.filename,
        path: file.path,
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

// Get template upload by slug
const findTemplateUploadBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const templateUpload = await prisma.templateUpload.findFirst({
    where: { slug, deletedAt: null },
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
    const id = parseInt(req.params.id);
    const { name, slug } = req.body;
    const file = req.file;

    const templateUpload = await prisma.templateUpload.findFirst({
      where: { id, deletedAt: null },
    });
    if (!templateUpload) {
      if (file?.path) {
        fs.unlink(file.path, () => {});
      }

      res.status(404);
      throw new Error("Unggahan template tidak ditemukan");
    }

    const updatedTemplateUpload = await prisma.templateUpload.update({
      where: { id },
      data: {
        name,
        slug,
        ...(file
          ? {
              filename: file.filename,
              path: file.path,
            }
          : {}),
      },
    });
    const data = withFileUrl(req, updatedTemplateUpload);

    if (file && templateUpload.path && fs.existsSync(templateUpload.path)) {
      fs.unlink(templateUpload.path, () => {});
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
  const id = parseInt(req.params.id);

  const templateUpload = await prisma.templateUpload.findFirst({
    where: { id },
  });
  if (!templateUpload) {
    res.status(404);
    throw new Error("Unggahan template tidak ditemukan");
  }

  await prisma.templateUpload.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  res.json({ message: "Template upload deleted successfully" });
});

// Download template
const downloadTemplateUpload = asyncHandler(async (req, res) => {
  const slug = req.params.slug;

  const template = await prisma.templateUpload.findUnique({
    where: { slug },
  });

  if (!template) {
    res.status(404);
    throw new Error("Template tidak ditemukan");
  }

  const filePath = path.resolve(process.cwd(), template.path);
  const ext = path.extname(template.filename || template.path || "") || "";
  const downloadName = `${sanitizeFilename(template.name)}${ext}`;

  res.download(filePath, downloadName);
});

module.exports = {
  listTemplateUploads,
  createTemplateUpload,
  findTemplateUploadBySlug,
  updateTemplateUpload,
  deleteTemplateUpload,
  downloadTemplateUpload,
};
