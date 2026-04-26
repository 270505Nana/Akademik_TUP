const prisma = require("../prisma/client");
const fs = require("fs");

// Membuat Respon Permohonan SKTA
const listSktaResponses = async (req, res) => {
  try {
    const data = await prisma.sktaResponse.findMany();

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

// Membuat Respon Permohonan SKTA
const createSktaResponse = async (req, res) => {
  try {
    const {
      hasUploadedFinalProposal,
      hasTakenLanguageTest,
      message,
      expDate,
      academicStaffId,
      sktaRequestId,
    } = req.body;

    const file = req.file;

    // Cek apakah ada data admin akademik
    const academicStaff = await prisma.academicStaff.findFirst({
      where: { id: academicStaffId },
    });
    if (!academicStaff)
      return res.status(404).json({ message: "Academic staff not found" });

    // Cek apakah ada data request
    const sktaRequest = await prisma.sktaRequest.findFirst({
      where: { id: sktaRequestId },
    });
    if (!sktaRequest)
      return res.status(404).json({ message: "SKTA request not found" });

    const data = await prisma.sktaResponse.create({
      data: {
        hasUploadedFinalProposal,
        hasTakenLanguageTest,
        message,
        expDate,
        academicStaffId,
        sktaRequestId,
        ...(file
          ? {
              sktaResponseUploads: {
                create: {
                  name: `SKTA_${sktaRequest.id}_${academicStaff.id}`,
                  filename: file.filename,
                  path: file.path,
                },
              },
            }
          : {}),
      },
    });

    res.json({
      message: "SKTA response submitted successful",
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

// Update Respon Permohonan SKTA
const updateSktaResponse = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const sktaResponse = await prisma.sktaResponse.findFirst({ where: { id } });
    if (!sktaResponse)
      return res.status(404).json({ message: "SKTA response not found" });

    const {
      hasUploadedFinalProposal,
      hasTakenLanguageTest,
      message,
      expDate,
      academicStaffId,
      sktaRequestId,
    } = req.body;

    const file = req.file;

    // Cek apakah ada data admin akademik
    const academicStaff = await prisma.academicStaff.findFirst({
      where: { id: academicStaffId },
    });
    if (!academicStaff)
      return res.status(404).json({ message: "Academic staff not found" });

    // Cek apakah ada data request
    const sktaRequest = await prisma.sktaRequest.findFirst({
      where: { id: sktaRequestId },
    });
    if (!sktaRequest)
      return res.status(404).json({ message: "SKTA request not found" });

    const data = await prisma.sktaResponse.update({
      where: { id },
      data: {
        hasUploadedFinalProposal,
        hasTakenLanguageTest,
        message,
        expDate,
        academicStaffId,
        sktaRequestId,
        ...(file
          ? {
              sktaResponseUploads: {
                create: {
                  name: `SKTA_${sktaRequest.id}_${academicStaff.id}`,
                  filename: file.filename,
                  path: file.path,
                },
              },
            }
          : {}),
      },
    });

    res.json({
      message: "SKTA response updated successful",
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

// Find SKTA Response By SKTA Request Id
const findSktaResponseBySktaRequestId = async (req, res) => {
  try {
    const sktaRequestId = parseInt(req.params.sktaRequestId);

    const sktaResponse = await prisma.sktaResponse.findUnique({
      where: { sktaRequestId },
    });

    if (!sktaResponse) {
      return res.status(404).json({ message: "SKTA response data not found" });
    }

    res.json({ data: sktaResponse });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

module.exports = {
  listSktaResponses,
  createSktaResponse,
  updateSktaResponse,
  findSktaResponseBySktaRequestId,
};
