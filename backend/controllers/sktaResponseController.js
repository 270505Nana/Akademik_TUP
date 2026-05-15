const asyncHandler = require("express-async-handler");
const prisma = require("../prisma/client");
const fs = require("fs");

// Membuat Respon Permohonan SKTA
const listSktaResponses = asyncHandler(async (req, res) => {
  const data = await prisma.sktaResponse.findMany();

  res.json({
    data,
  });
});

// Membuat Respon Permohonan SKTA
const createSktaResponse = asyncHandler(async (req, res) => {
  try {
    const {
      hasUploadedFinalProposal,
      hasTakenLanguageTest,
      message,
      expDate,
      isEdit,
      academicStaffId,
      sktaRequestId,
    } = req.body;

    const file = req.file;

    // Cek apakah ada data admin akademik
    const academicStaff = await prisma.academicStaff.findFirst({
      where: { id: academicStaffId },
    });
    if (!academicStaff) {
      res.status(404);
      throw new Error("Staf akademik tidak ditemukan");
    }

    // Cek apakah ada data request
    const sktaRequest = await prisma.sktaRequest.findFirst({
      where: { id: sktaRequestId },
    });
    if (!sktaRequest) {
      res.status(404);
      throw new Error("Pengajuan SKTA tidak ditemukan");
    }

    const data = await prisma.sktaResponse.create({
      data: {
        hasUploadedFinalProposal,
        hasTakenLanguageTest,
        message,
        expDate: expDate ? new Date(expDate) : null,
        isEdit: isEdit ? new Date(isEdit) : null,
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
    throw error;
  }
});

// Update Respon Permohonan SKTA
const updateSktaResponse = asyncHandler(async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const sktaResponse = await prisma.sktaResponse.findFirst({ where: { id } });
    if (!sktaResponse) {
      res.status(404);
      throw new Error("Respon SKTA tidak ditemukan");
    }

    const {
      hasUploadedFinalProposal,
      hasTakenLanguageTest,
      message,
      expDate,
      isEdit,
      academicStaffId,
      sktaRequestId,
    } = req.body;

    const file = req.file;

    // Cek apakah ada data admin akademik
    const academicStaff = await prisma.academicStaff.findFirst({
      where: { id: academicStaffId },
    });
    if (!academicStaff) {
      res.status(404);
      throw new Error("Staf akademik tidak ditemukan");
    }

    // Cek apakah ada data request
    const sktaRequest = await prisma.sktaRequest.findFirst({
      where: { id: sktaRequestId },
    });
    if (!sktaRequest) {
      res.status(404);
      throw new Error("Pengajuan SKTA tidak ditemukan");
    }

    const data = await prisma.sktaResponse.update({
      where: { id },
      data: {
        hasUploadedFinalProposal,
        hasTakenLanguageTest,
        message,
        expDate: expDate ? new Date(expDate) : null,
        isEdit: isEdit ? new Date(isEdit) : null,
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
    throw error;
  }
});

// Find SKTA Response By SKTA Request Id
const findSktaResponseBySktaRequestId = asyncHandler(async (req, res) => {
  const sktaRequestId = parseInt(req.params.sktaRequestId);

  // const sktaResponse = await prisma.sktaResponse.findUnique({
  //   where: { sktaRequestId },
  // });
  // update karna error, ngga bisa kalau findUniqueId waktu dimplementasi di fe, ada perbedaan sm prisma
  const sktaResponse = await prisma.sktaResponse.findFirst({
    where: {
      sktaRequestId: sktaRequestId,
      deletedAt: null,
    },
  });

  if (!sktaResponse) {
    res.status(404);
    throw new Error("Data respon SKTA tidak ditemukan");
  }

  res.json({ data: sktaResponse });
});

module.exports = {
  listSktaResponses,
  createSktaResponse,
  updateSktaResponse,
  findSktaResponseBySktaRequestId,
};
