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
const listTemplateUploads = async (req, res) => {
  try {
    const templateUploads = await prisma.templateUpload.findMany({
      orderBy: { createdAt: "desc" },
    });
    const data = templateUploads.map((item) => withFileUrl(req, item));

    res.json({ data });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Create template upload
const createTemplateUpload = async (req, res) => {
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

    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get template upload by slug
const findTemplateUploadBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const templateUpload = await prisma.templateUpload.findUnique({
      where: { slug },
    });
    if (!templateUpload) {
      return res.status(404).json({ message: "Template upload not found" });
    }

    const data = withFileUrl(req, templateUpload);

    res.json({ data });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update template upload
const updateTemplateUpload = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, slug } = req.body;
    const file = req.file;

    const templateUpload = await prisma.templateUpload.findFirst({
      where: { id },
    });
    if (!templateUpload) {
      if (file?.path) {
        fs.unlink(file.path, () => {});
      }

      return res.status(404).json({ message: "Template upload not found" });
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

    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Delete template upload
const deleteTemplateUpload = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const templateUpload = await prisma.templateUpload.findFirst({
      where: { id },
    });
    if (!templateUpload) {
      return res.status(404).json({ message: "Template upload not found" });
    }

    await prisma.templateUpload.delete({ where: { id } });

    if (templateUpload.path && fs.existsSync(templateUpload.path)) {
      fs.unlink(templateUpload.path, () => {});
    }

    res.json({ message: "Template upload deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Download template
const downloadTemplateUpload = async (req, res) => {
  try {
    const slug = req.params.slug;

    const template = await prisma.templateUpload.findUnique({
      where: { slug },
    });

    if (!template) {
      return res.status(404).json({
        message: "Template not found",
      });
    }

    const filePath = path.resolve(process.cwd(), template.path);
    const ext = path.extname(template.filename || template.path || "") || "";
    const downloadName = `${sanitizeFilename(template.name)}${ext}`;

    res.download(filePath, downloadName);
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  listTemplateUploads,
  createTemplateUpload,
  findTemplateUploadBySlug,
  updateTemplateUpload,
  deleteTemplateUpload,
  downloadTemplateUpload,
};
