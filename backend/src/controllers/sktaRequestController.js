import asyncHandler from 'express-async-handler';
import prisma from "../config/prisma.js";
import fs from 'fs';
import path from 'path';
import { sendValidationError, isNil, isValidISO8601, parseBoolean } from '../utils/validationHelper.js';


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

// [Route] Membuat Permohonan SKTA
const listSktaRequests = asyncHandler(async (req, res) => {
  const sktaRequests = await prisma.sktaRequest.findMany({
    include: {
      mahasiswa: true,
      dosenPembimbing1: true,
      dosenPembimbing2: true,
      sktaRequestUploads: true,
    },
  });

  const data = sktaRequests.map((sktaRequest) =>
    withSktaRequestDownloadUrls(req, sktaRequest),
  );

  res.json({
    data,
  });
});

// [Route] Membuat Permohonan SKTA
const createSktaRequest = asyncHandler(async (req, res) => {
  try {
    const {
      proposalTitleId,
      proposalTitleEn,
      mahasiswaId,
      dosenPembimbing1Id,
      dosenPembimbing2Id,
    } = req.body;

    const evidenceFile = getUploadedFile(req.files, "evidence");
    
    const errors = {};
    if (isNil(proposalTitleId)) {
      errors.proposalTitleId = "proposalTitleId wajib diisi";
    }
    if (isNil(proposalTitleEn)) {
      errors.proposalTitleEn = "proposalTitleEn wajib diisi";
    }
    if (isNil(mahasiswaId)) {
      errors.mahasiswaId = "mahasiswaId wajib diisi";
    } else if (isNaN(parseInt(mahasiswaId))) {
      errors.mahasiswaId = "mahasiswaId wajib diisi"; // validator isInt message was "mahasiswaId wajib diisi" in original, wait, it was just "mahasiswaId wajib diisi"
    }
    if (isNil(dosenPembimbing1Id)) {
      errors.dosenPembimbing1Id = "dosenPembimbing1Id wajib diisi";
    } else if (isNaN(parseInt(dosenPembimbing1Id))) {
      errors.dosenPembimbing1Id = "dosenPembimbing1Id wajib diisi";
    }
    if (isNil(dosenPembimbing2Id)) {
      errors.dosenPembimbing2Id = "dosenPembimbing2Id wajib diisi";
    } else if (isNaN(parseInt(dosenPembimbing2Id))) {
      errors.dosenPembimbing2Id = "dosenPembimbing2Id wajib diisi";
    }
    if (!evidenceFile) {
      errors.evidence = "evidence wajib diunggah";
    } else if (!["application/pdf"].includes(evidenceFile.mimetype)) {
      errors.evidence = "Tipe file tidak valid";
    }
    
    if (Object.keys(errors).length > 0) {
      removeUploadedFiles(req.file || req.files);
      return sendValidationError(res, errors, req);
    }
    

    // Cek apakah ada data mahasiswa
    const student = await prisma.mahasiswa.findFirst({
      where: { id: mahasiswaId },
    });
    if (!student) {
      res.status(404);
      throw new Error("Mahasiswa tidak ditemukan");
    }

    // cek pengajuan MHS sebelumnya, udh ada atau belum
    const existingRequest = await prisma.sktaRequest.findFirst({
      where: { mahasiswaId: parseInt(mahasiswaId) },
    });
    if (existingRequest) {
      res.status(409);
      throw new Error(
        "Mahasiswa sudah memiliki pengajuan SK. Untuk pembaruan SK yang expired, gunakan fitur perbarui SK.",
      );
    }
    // Cek apakah ada data dospem 1
    const dosenPembimbing1 = await prisma.dosen.findFirst({
      where: { id: dosenPembimbing1Id },
    });
    if (!dosenPembimbing1) {
      res.status(404);
      throw new Error("Dosen pembimbing 1 tidak ditemukan");
    }

    // Cek apakah ada data dospem 2
    const dosenPembimbing2 = await prisma.dosen.findFirst({
      where: { id: dosenPembimbing2Id },
    });
    if (!dosenPembimbing2) {
      res.status(404);
      throw new Error("Dosen pembimbing 2 tidak ditemukan");
    }

    const data = await prisma.sktaRequest.create({
      data: {
        proposalTitleId,
        proposalTitleEn,
        mahasiswaId,
        dosenPembimbing1Id,
        dosenPembimbing2Id,

        sktaRequestUploads: {
          create: [
            {
              name: `Evidence_SKTA_${student?.nim}_${student?.name}`,
              filename: evidenceFile.filename,
              path: evidenceFile.path,
              mahasiswaId,
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
    throw error;
  }
});

// [Route] Update Permohonan SKTA
const updateSktaRequest = asyncHandler(async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const sktaRequest = await prisma.sktaRequest.findFirst({ where: { id } });
    if (!sktaRequest) {
      res.status(404);
      throw new Error("SKTA request tidak ditemukan");
    }

    // const editableResponse = await prisma.sktaResponse.findFirst({
    //   where: {
    //     sktaRequestId: id,
    //     isEdit: {
    //       gt: new Date(),
    //     },
    //   },
    // });

    // if (!editableResponse) {
    //   res.status(403);
    //   throw new Error("You cannot edit this SKTA request because it is already submitted and no edit permission is available.");
    // }

    const sktaResponse = await prisma.sktaResponse.findFirst({
      where: { sktaRequestId: id },
    });

    const isExpired =
      sktaResponse?.expDate && new Date(sktaResponse.expDate) < new Date();
    const isEditable =
      sktaResponse?.isEdit && new Date(sktaResponse.isEdit) > new Date();

    if (!isExpired && !isEditable) {
      res.status(403);
      throw new Error(
        "Tidak dapat mengubah pengajuan SK ini. SK masih aktif atau belum mendapat izin edit.",
      );
    }

    const {
      proposalTitleId,
      proposalTitleEn,
      mahasiswaId,
      dosenPembimbing1Id,
      dosenPembimbing2Id,
    } = req.body;

    const evidenceFile = getUploadedFile(req.files, "evidence");
    
    const errors = {};
    if (isNil(proposalTitleId)) {
      errors.proposalTitleId = "proposalTitleId wajib diisi";
    }
    if (isNil(proposalTitleEn)) {
      errors.proposalTitleEn = "proposalTitleEn wajib diisi";
    }
    if (isNil(mahasiswaId)) {
      errors.mahasiswaId = "mahasiswaId wajib diisi";
    } else if (isNaN(parseInt(mahasiswaId))) {
      errors.mahasiswaId = "mahasiswaId wajib diisi"; 
    }
    if (isNil(dosenPembimbing1Id)) {
      errors.dosenPembimbing1Id = "dosenPembimbing1Id wajib diisi";
    } else if (isNaN(parseInt(dosenPembimbing1Id))) {
      errors.dosenPembimbing1Id = "dosenPembimbing1Id wajib diisi";
    }
    if (isNil(dosenPembimbing2Id)) {
      errors.dosenPembimbing2Id = "dosenPembimbing2Id wajib diisi";
    } else if (isNaN(parseInt(dosenPembimbing2Id))) {
      errors.dosenPembimbing2Id = "dosenPembimbing2Id wajib diisi";
    }
    if (!evidenceFile) {
      errors.evidence = "evidence wajib diunggah";
    } else if (!["application/pdf"].includes(evidenceFile.mimetype)) {
      errors.evidence = "Tipe file tidak valid";
    }
    
    if (Object.keys(errors).length > 0) {
      removeUploadedFiles(req.file || req.files);
      return sendValidationError(res, errors, req);
    }
    

    // Cek apakah ada data mahasiswa
    const student = await prisma.mahasiswa.findFirst({
      where: { id: mahasiswaId },
    });
    if (!student) {
      res.status(404);
      throw new Error("Mahasiswa tidak ditemukan");
    }

    // Cek apakah ada data dospem 1
    const dosenPembimbing1 = await prisma.dosen.findFirst({
      where: { id: dosenPembimbing1Id },
    });
    if (!dosenPembimbing1) {
      res.status(404);
      throw new Error("Dosen pembimbing 1 tidak ditemukan");
    }

    // Cek apakah ada data dospem 2
    const dosenPembimbing2 = await prisma.dosen.findFirst({
      where: { id: dosenPembimbing2Id },
    });
    if (!dosenPembimbing2) {
      res.status(404);
      throw new Error("Dosen pembimbing 2 tidak ditemukan");
    }

    const data = await prisma.sktaRequest.update({
      where: { id },
      data: {
        proposalTitleId,
        proposalTitleEn,
        mahasiswaId,
        dosenPembimbing1Id,
        dosenPembimbing2Id,
        sktaRequestUploads: {
          deleteMany: {},
          create: [
            {
              name: `Evidence_SKTA_${student?.nim}_${student?.name}`,
              filename: evidenceFile.filename,
              path: evidenceFile.path,
              mahasiswaId,
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
    throw error;
  }
});

// [Route] Find SKTA Request By Mahasiswa Id
const findSktaRequestByMahasiswaId = asyncHandler(async (req, res) => {
  const mahasiswaId = parseInt(req.params.mahasiswaId);

  const sktaRequest = await prisma.sktaRequest.findFirst({
    where: { mahasiswaId },
    include: {
      mahasiswa: {
        include: {
          studyProgram: {
            select: {
              name: true,
            },
          },
        },
      },
      dosenPembimbing1: true,
      dosenPembimbing2: true,
      sktaRequestUploads: true,
    },
  });

  if (!sktaRequest) {
    res.status(404);
    throw new Error("Data pengajuan SKTA tidak ditemukan");
  }

  res.json({ data: withSktaRequestDownloadUrls(req, sktaRequest) });
});

// [Route] Download SKTA Request Upload (Evidence)
const downloadSktaRequestUpload = asyncHandler(async (req, res) => {
  const uploadId = parseInt(req.params.uploadId);

  const upload = await prisma.sktaRequestUpload.findFirst({
    where: { id: uploadId },
  });

  if (!upload) {
    res.status(404);
    throw new Error("Unggahan pengajuan SKTA tidak ditemukan");
  }

  const filePath = path.resolve(process.cwd(), upload.path);

  if (!fs.existsSync(filePath)) {
    res.status(404);
    throw new Error("File tidak ditemukan");
  }

  res.download(filePath, upload.filename);
});

export { listSktaRequests,
  createSktaRequest,
  updateSktaRequest,
  findSktaRequestByMahasiswaId,
  downloadSktaRequestUpload, };
