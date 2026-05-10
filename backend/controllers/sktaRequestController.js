const prisma = require("../prisma/client");
const fs = require("fs");
const path = require("path");

const getUploadedFile = (files, fieldName) => files?.[fieldName]?.[0];

const buildUploadDownloadUrl = (req, uploadId) => {
  if (!uploadId) {
    return null;
  }

  return `${req.protocol}://${req.get(
    "host",
  )}/api/skta-requests/uploads/${uploadId}/download`;
};

const withDownloadUrl = (req, upload) => ({
  ...upload,
  downloadUrl: buildUploadDownloadUrl(req, upload.id),
});

const withSktaRequestDownloadUrls = (req, sktaRequest) => ({
  ...sktaRequest,
  sktaRequestUploads: (sktaRequest.sktaRequestUploads || []).map((upload) =>
    withDownloadUrl(req, upload),
  ),
});

const removeUploadedFiles = (files) => {
  if (!files) {
    return;
  }

  if (Array.isArray(files)) {
    files.forEach((file) => {
      if (file?.path) {
        fs.unlink(file.path, () => {});
      }
    });

    return;
  }

  Object.values(files).forEach((value) => {
    removeUploadedFiles(value);
  });
};

// Membuat Permohonan SKTA
const listSktaRequests = async (req, res) => {
  try {
    const sktaRequests = await prisma.sktaRequest.findMany({
      include: {
        sktaRequestUploads: true,
      },
    });

    const data = sktaRequests.map((sktaRequest) =>
      withSktaRequestDownloadUrls(req, sktaRequest),
    );

    res.json({
      data,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Membuat Permohonan SKTA
const createSktaRequest = async (req, res) => {
  try {
    const {
      proposalTitleId,
      proposalTitleEn,
      studentId,
      dosenPembimbing1Id,
      dosenPembimbing2Id,
    } = req.body;

    const evidenceFile = getUploadedFile(req.files, "evidence");

    // Cek apakah ada data mahasiswa
    const student = await prisma.student.findFirst({
      where: { id: studentId },
    });
    if (!student) return res.status(404).json({ message: "Student not found" });

    // Cek apakah ada data dospem 1
    const dosenPembimbing1 = await prisma.lecturer.findFirst({
      where: { id: dosenPembimbing1Id },
    });
    if (!dosenPembimbing1)
      return res.status(404).json({ message: "Dosen pembimbing 1 not found" });

    // Cek apakah ada data dospem 2
    const dosenPembimbing2 = await prisma.lecturer.findFirst({
      where: { id: dosenPembimbing2Id },
    });
    if (!dosenPembimbing2)
      return res.status(404).json({ message: "Dosen pembimbing 2 not found" });

    const data = await prisma.sktaRequest.create({
      data: {
        proposalTitleId,
        proposalTitleEn,
        studentId,
        dosenPembimbing1Id,
        dosenPembimbing2Id,

        sktaRequestUploads: {
          create: [
            {
              name: `Evidence_SKTA_${student?.nim}_${student?.name}`,
              filename: evidenceFile.filename,
              path: evidenceFile.path,
            },
          ],
        },
      },
    });

    res.json({
      message: "SKTA request submitted successful",
      data: withSktaRequestDownloadUrls(req, data),
    });
  } catch (error) {
    removeUploadedFiles(req.file || req.files);

    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update Permohonan SKTA
const updateSktaRequest = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const sktaRequest = await prisma.sktaRequest.findFirst({ where: { id } });
    if (!sktaRequest)
      return res.status(404).json({ message: "SKTA request not found" });

    const {
      proposalTitleId,
      proposalTitleEn,
      studentId,
      dosenPembimbing1Id,
      dosenPembimbing2Id,
    } = req.body;

    const evidenceFile = getUploadedFile(req.files, "evidence");

    // Cek apakah ada data mahasiswa
    const student = await prisma.student.findFirst({
      where: { id: studentId },
    });
    if (!student) return res.status(404).json({ message: "Student not found" });

    // Cek apakah ada data dospem 1
    const dosenPembimbing1 = await prisma.lecturer.findFirst({
      where: { id: dosenPembimbing1Id },
    });
    if (!dosenPembimbing1)
      return res.status(404).json({ message: "Lecturer 1 not found" });

    // Cek apakah ada data dospem 2
    const dosenPembimbing2 = await prisma.lecturer.findFirst({
      where: { id: dosenPembimbing2Id },
    });
    if (!dosenPembimbing2)
      return res.status(404).json({ message: "Lecturer 2 not found" });

    const data = await prisma.sktaRequest.update({
      where: { id },
      data: {
        proposalTitleId,
        proposalTitleEn,
        studentId,
        dosenPembimbing1Id,
        dosenPembimbing2Id,
        sktaRequestUploads: {
          deleteMany: {},
          create: [
            {
              name: `Evidence_SKTA_${student?.nim}_${student?.name}`,
              filename: evidenceFile.filename,
              path: evidenceFile.path,
            },
          ],
        },
      },
    });

    res.json({
      message: "SKTA request updated successful",
      data: withSktaRequestDownloadUrls(req, data),
    });
  } catch (error) {
    removeUploadedFiles(req.file || req.files);

    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Find SKTA Request By Mahasiswa Id
const findSktaRequestByStudentId = async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);

    const sktaRequest = await prisma.sktaRequest.findFirst({
      where: { studentId },
      include: {
        sktaRequestUploads: true,
      },
    });

    if (!sktaRequest) {
      return res.status(404).json({ message: "SKTA request data not found" });
    }

    res.json({ data: withSktaRequestDownloadUrls(req, sktaRequest) });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const downloadSktaRequestUpload = async (req, res) => {
  try {
    const uploadId = parseInt(req.params.uploadId);

    const upload = await prisma.sktaRequestUpload.findFirst({
      where: { id: uploadId },
    });

    if (!upload) {
      return res.status(404).json({ message: "SKTA request upload not found" });
    }

    const filePath = path.resolve(process.cwd(), upload.path);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }

    res.download(filePath, upload.filename);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

module.exports = {
  listSktaRequests,
  createSktaRequest,
  updateSktaRequest,
  findSktaRequestByStudentId,
  downloadSktaRequestUpload,
};
