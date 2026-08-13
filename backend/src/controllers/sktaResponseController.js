import asyncHandler from 'express-async-handler';
import prisma from "../config/prisma.js";
import fs from 'fs';
import path from 'path';
import { sendValidationError, isNil, isValidISO8601, parseBoolean } from '../utils/validationHelper.js';


const getUploadedFile = (files, fieldName) => files?.[fieldName]?.[0];

const buildSktaResponseUploadDownloadUrl = (req, uploadId) => {
  if (!uploadId) {
    return null;
  }

  return `${req.protocol}://${req.get(
    "host",
  )}/api/skta-responses/uploads/${uploadId}/download`;
};

const withSktaResponseUploadDownloadUrl = (req, upload) => ({
  ...upload,
  downloadUrl: buildSktaResponseUploadDownloadUrl(req, upload.id),
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

// [Route] Membuat Respon Permohonan SKTA
const listSktaResponses = asyncHandler(async (req, res) => {
  const data = await prisma.sktaResponse.findMany();

  res.json({
    data,
  });
});

// [Route] Membuat Respon Permohonan SKTA
const createSktaResponse = asyncHandler(async (req, res) => {
  try {
    const {
      hasUploadedFinalProposal,
      hasTakenLanguageTest,
      message,
      expDate,
      isEdit,
      adminId,
      sktaRequestId,
    } = req.body;

    // const file = req.file;
    const sktaFile = getUploadedFile(req.files, "sktaFile");
    const errors = {};
    if (isNil(hasUploadedFinalProposal)) {
      errors.hasUploadedFinalProposal = "hasUploadedFinalProposal wajib diisi";
    } else {
      const p = parseBoolean(hasUploadedFinalProposal);
      if (p === null) {
        errors.hasUploadedFinalProposal = "hasUploadedFinalProposal harus berupa boolean";
      }
    }
    if (isNil(hasTakenLanguageTest)) {
      errors.hasTakenLanguageTest = "hasTakenLanguageTest wajib diisi";
    } else {
      const p = parseBoolean(hasTakenLanguageTest);
      if (p === null) {
        errors.hasTakenLanguageTest = "hasTakenLanguageTest harus berupa boolean";
      }
    }
    if (!isNil(message) && typeof message !== 'string') {
      errors.message = "message harus berupa string";
    }
    if (!isNil(expDate) && expDate !== "" && !isValidISO8601(expDate)) {
      errors.expDate = "expDate harus berupa tanggal yang valid";
    }
    if (isNil(adminId)) {
      errors.adminId = "adminId wajib diisi";
    } else if (isNaN(parseInt(adminId))) {
      errors.adminId = "adminId harus berupa integer";
    }
    if (isNil(sktaRequestId)) {
      errors.sktaRequestId = "sktaRequestId wajib diisi";
    } else if (isNaN(parseInt(sktaRequestId))) {
      errors.sktaRequestId = "sktaRequestId harus berupa integer";
    }
    if (sktaFile && !["application/pdf"].includes(sktaFile.mimetype)) {
      errors.sktaFile = "Tipe file tidak valid";
    }
    
    if (Object.keys(errors).length > 0) {
      removeUploadedFiles(req.file || req.files);
      return sendValidationError(res, errors, req);
    }
    

    // Cek apakah ada data admin akademik
    const academicStaff = await prisma.admin.findFirst({
      where: { id: adminId },
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
        mahasiswa: { connect: { id: sktaRequest.mahasiswaId } },
        admin: { connect: { id: adminId } },
        sktaRequest: { connect: { id: sktaRequestId } },

        ...(sktaFile
          ? {
              sktaResponseUploads: {
                create: [
                  {
                    name: `SKTA_${sktaRequest.id}_${academicStaff.id}`,
                    filename: sktaFile.filename,
                    path: sktaFile.path,
                    mahasiswaId: sktaRequest?.mahasiswaId,
                    sktaRequestId: sktaRequestId,
                  },
                ],
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
    removeUploadedFiles(req.file || req.files);
    throw error;
  }
});

// [Route] Update Respon Permohonan SKTA
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
      adminId,
      sktaRequestId,
    } = req.body;

    const sktaFile = getUploadedFile(req.files, "sktaFile");
    const errors = {};
    if (isNil(hasUploadedFinalProposal)) {
      errors.hasUploadedFinalProposal = "hasUploadedFinalProposal wajib diisi";
    } else {
      const p = parseBoolean(hasUploadedFinalProposal);
      if (p === null) {
        errors.hasUploadedFinalProposal = "hasUploadedFinalProposal harus berupa boolean";
      }
    }
    if (isNil(hasTakenLanguageTest)) {
      errors.hasTakenLanguageTest = "hasTakenLanguageTest wajib diisi";
    } else {
      const p = parseBoolean(hasTakenLanguageTest);
      if (p === null) {
        errors.hasTakenLanguageTest = "hasTakenLanguageTest harus berupa boolean";
      }
    }
    if (!isNil(message) && typeof message !== 'string') {
      errors.message = "message harus berupa string";
    }
    if (!isNil(expDate) && expDate !== "" && !isValidISO8601(expDate)) {
      errors.expDate = "expDate harus berupa tanggal yang valid";
    }
    if (isNil(adminId)) {
      errors.adminId = "adminId wajib diisi";
    } else if (isNaN(parseInt(adminId))) {
      errors.adminId = "adminId harus berupa integer";
    }
    if (isNil(sktaRequestId)) {
      errors.sktaRequestId = "sktaRequestId wajib diisi";
    } else if (isNaN(parseInt(sktaRequestId))) {
      errors.sktaRequestId = "sktaRequestId harus berupa integer";
    }
    if (sktaFile && !["application/pdf"].includes(sktaFile.mimetype)) {
      errors.sktaFile = "Tipe file tidak valid";
    }
    
    if (Object.keys(errors).length > 0) {
      removeUploadedFiles(req.file || req.files);
      return sendValidationError(res, errors, req);
    }
    

    // Cek apakah ada data admin akademik
    const academicStaff = await prisma.admin.findFirst({
      where: { id: adminId },
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
        mahasiswa: { connect: { id: sktaRequest.mahasiswaId } },
        admin: { connect: { id: adminId } },
        sktaRequest: { connect: { id: sktaRequestId } },

        ...(sktaFile
          ? {
              sktaResponseUploads: {
                deleteMany: {},
                create: [
                  {
                    name: `SKTA_${sktaRequest.id}_${academicStaff.id}`,
                    filename: sktaFile.filename,
                    path: sktaFile.path,
                    mahasiswaId: sktaRequest?.mahasiswaId,
                    sktaRequestId: sktaRequest.id,
                  },
                ],
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
    removeUploadedFiles(req.file || req.files);
    throw error;
  }
});

// [Route] Find SKTA Response By SKTA Request Id
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

// [Route] Get SKTA Response Uploads by SKTA Request ID
const getSktaResponseUploadsByMahasiswaId = asyncHandler(async (req, res) => {
  const mahasiswaId = parseInt(req.params.mahasiswaId);

  const uploads = await prisma.sktaResponseUpload.findMany({
    where: {
      mahasiswaId,
      deletedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const data = uploads.map((upload) =>
    withSktaResponseUploadDownloadUrl(req, upload),
  );

  res.json({ data });
});

// [Route] Download SKTA Response Upload (SKTA)
const downloadSktaResponseUpload = asyncHandler(async (req, res) => {
  const uploadId = parseInt(req.params.uploadId);

  const upload = await prisma.sktaResponseUpload.findFirst({
    where: { id: uploadId },
  });

  if (!upload) {
    res.status(404);
    throw new Error("Unggahan respon SKTA tidak ditemukan");
  }

  const filePath = path.resolve(process.cwd(), upload.path);

  if (!fs.existsSync(filePath)) {
    res.status(404);
    throw new Error("File tidak ditemukan");
  }

  res.download(filePath, upload.filename);
});

export { listSktaResponses,
  createSktaResponse,
  updateSktaResponse,
  findSktaResponseBySktaRequestId,
  getSktaResponseUploadsByMahasiswaId,
  downloadSktaResponseUpload, };
