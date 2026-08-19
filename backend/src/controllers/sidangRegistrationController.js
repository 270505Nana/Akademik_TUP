import asyncHandler from 'express-async-handler';
import prisma from "../config/prisma.js";
import fs from 'fs';
import path from 'path';
import { sendValidationError, isNil, isValidISO8601 } from '../utils/validationHelper.js';

// Constants for File Validation
const REQUIRED_SLUGS = [
  "berkasFormValidasiDosenWali",
  "berkasRekomendasiSidangPembimbing",
  "berkasScanPernyataanBiodataIjazahBermaterai",
  "berkasDummyIjazahBermaterai",
  "berkasScanAktaKelahiran",
  "berkasScanIjazahTerakhir",
  "berkasScanKhsDenganTtdDoswalKaprodi",
  "berkasLogBimbingan",
  "berkasSertifikatTak",
  "berkasRekomendasiBerkasEvidenceTaPaIgraciasPembimbing",
  "uploadDraftBukuTaSiapSidang",
];

const NON_SIDANG_SLUGS = {
  "Publikasi Jurnal": [
    "berkasLoaJurnal",
    "berkasPersetujuanPublikasiTaSebagaiPenggantiSidangJurnal",
    "berkasCameraReadyPaperYangSudahTerbit",
    "berkasCameraReadyPaperJurnal",
    "berkasRiwayatReviewOlehReviewers",
    "berkasResponseJurnal",
  ],
  "Proceeding International": [
    "berkasLoaProceeding",
    "berkasPersetujuanPublikasiTaSebagaiPenggantiSidangProceeding",
    "berkasCameraReadyPaperProceeding",
    "berkasPaktaIntegritas",
    "berkasResponseProceeding",
  ],
  HKI: [
    "sertifikatHki",
    "sertifikatDariMitraDudi",
    "sertifikatPendukungLainnya",
  ],
};

const checkSidangEditable = async (registrationId) => {
  const registration = await prisma.sidangRegistration.findUnique({
    where: { id: registrationId },
  });

  if (!registration) {
    return { exists: false, editable: false, reason: "Pendaftaran sidang tidak ditemukan." };
  }

  if (!registration.isDraft) {
    const hasActiveEditPermission = registration.isEdit && new Date(registration.isEdit) > new Date();

    if (!hasActiveEditPermission) {
      return { exists: true, editable: false, reason: "Pendaftaran sudah dikirim dan tidak memiliki izin edit yang aktif." };
    }
  }

  if (registration.isEdit) {
    const isEditExpired = new Date(registration.isEdit) < new Date();
    if (isEditExpired) {
      return { exists: true, editable: false, reason: "Batas waktu izin edit dari admin telah kedaluwarsa." };
    }
  }

  return { exists: true, editable: true };
};

// Sidang Registration List
const listSidangRegistrations = asyncHandler(async (req, res) => {
  const sidangRegistrations = await prisma.sidangRegistration.findMany({
    include: {
      mahasiswa: {
        select: {
          id: true,
          nim: true,
          name: true,
          studyProgramId: true,
          studyProgram: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      dosenPembimbing1: {
        select: {
          id: true,
          nip: true,
          name: true,
        },
      },
      dosenPembimbing2: {
        select: {
          id: true,
          nip: true,
          name: true,
        },
      },
      sidangRegistrationUploads: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Append downloadUrls
  const data = sidangRegistrations.map((reg) => ({
    ...reg,
    sidangRegistrationUploads: reg.sidangRegistrationUploads.map((upload) => ({
      ...upload,
      downloadUrl: `${req.protocol}://${req.get("host")}/api/sidang-registrations/uploads/${upload.id}/download`,
    })),
  }));

  res.json({
    data,
  });
});

// Get Sidang Registration by ID
const getSidangRegistrationById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const sidangRegistration = await prisma.sidangRegistration.findUnique({
    where: {
      id,
    },
    include: {
      mahasiswa: {
        select: {
          id: true,
          nim: true,
          name: true,
          studyProgramId: true,
          studyProgram: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      dosenPembimbing1: {
        select: {
          id: true,
          nip: true,
          name: true,
        },
      },
      dosenPembimbing2: {
        select: {
          id: true,
          nip: true,
          name: true,
        },
      },
      sidangRegistrationUploads: true,
    },
  });

  if (!sidangRegistration) {
    res.status(404);
    throw new Error("Pendaftaran sidang tidak ditemukan");
  }

  sidangRegistration.sidangRegistrationUploads =
    sidangRegistration.sidangRegistrationUploads.map((upload) => ({
      ...upload,
      downloadUrl: `${req.protocol}://${req.get("host")}/api/sidang-registrations/uploads/${upload.id}/download`,
    }));

  res.json({
    data: sidangRegistration,
  });
});

// Get Sidang Registration by Mahasiswa ID
const getSidangRegistrationByMahasiswaId = asyncHandler(async (req, res) => {
  const { mahasiswaId } = req.params;

  const sidangRegistration = await prisma.sidangRegistration.findFirst({
    where: {
      mahasiswaId,
    },
    include: {
      mahasiswa: {
        select: {
          id: true,
          nim: true,
          name: true,
          studyProgramId: true,
          studyProgram: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      dosenPembimbing1: {
        select: {
          id: true,
          nip: true,
          name: true,
        },
      },
      dosenPembimbing2: {
        select: {
          id: true,
          nip: true,
          name: true,
        },
      },
      sidangRegistrationUploads: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!sidangRegistration) {
    res.status(404);
    throw new Error("Pendaftaran sidang tidak ditemukan");
  }

  sidangRegistration.sidangRegistrationUploads =
    sidangRegistration.sidangRegistrationUploads.map((upload) => ({
      ...upload,
      downloadUrl: `${req.protocol}://${req.get("host")}/api/sidang-registrations/uploads/${upload.id}/download`,
    }));

  res.json({
    data: sidangRegistration,
  });
});

// Save Draft Sidang Registration (Upsert)
const saveSidangRegistration = asyncHandler(async (req, res) => {
  const {
    id,
    programType,
    sidangScheme,
    jalurNonSidang,
    sks,
    ipk,
    tak,
    sktaExpDate,
    thesisTitleId,
    thesisTitleEn,
    mahasiswaId,
    dosenPembimbing1Id,
    dosenPembimbing2Id,
  } = req.body;

  const errors = [];
  
  if (!isNil(id) && typeof id !== "string") {
    errors.push({ field: "id", message: "ID harus berupa string" });
  }
  
  if (!isNil(programType) && typeof programType !== "string") {
    errors.push({ field: "programType", message: "Tipe program harus berupa string" });
  }

  if (!isNil(jalurNonSidang) && !Array.isArray(jalurNonSidang)) {
    errors.push({ field: "jalurNonSidang", message: "Jalur non sidang harus berupa array jika diisi" });
  }

  if (!isNil(sks) && isNaN(parseInt(sks))) {
    errors.push({ field: "sks", message: "SKS harus berupa integer" });
  }

  if (!isNil(ipk) && isNaN(parseFloat(ipk))) {
    errors.push({ field: "ipk", message: "IPK harus berupa float" });
  }

  if (!isNil(tak) && isNaN(parseInt(tak))) {
    errors.push({ field: "tak", message: "TAK harus berupa integer" });
  }

  if (!isNil(sktaExpDate) && !isValidISO8601(sktaExpDate)) {
    errors.push({ field: "sktaExpDate", message: "Tanggal berlaku SKTA harus berupa tanggal yang valid (format ISO 8601)" });
  }

  if (!isNil(thesisTitleId) && typeof thesisTitleId !== "string") {
    errors.push({ field: "thesisTitleId", message: "Judul TA (ID) harus berupa string" });
  }

  if (!isNil(thesisTitleEn) && typeof thesisTitleEn !== "string") {
    errors.push({ field: "thesisTitleEn", message: "Judul TA (EN) harus berupa string" });
  }

  if (!isNil(mahasiswaId) && typeof mahasiswaId !== "string") {
    errors.push({ field: "mahasiswaId", message: "ID mahasiswa harus berupa string" });
  }

  if (!isNil(dosenPembimbing1Id) && typeof dosenPembimbing1Id !== "string") {
    errors.push({ field: "dosenPembimbing1Id", message: "ID dosen pembimbing 1 harus berupa string" });
  }

  if (!isNil(dosenPembimbing2Id) && typeof dosenPembimbing2Id !== "string") {
    errors.push({ field: "dosenPembimbing2Id", message: "ID dosen pembimbing 2 harus berupa string" });
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  // Validate references if provided
  if (mahasiswaId) {
    const studentExists = await prisma.mahasiswa.findUnique({
      where: { id: mahasiswaId },
    });
    if (!studentExists) {
      res.status(404);
      throw new Error("Mahasiswa tidak ditemukan");
    }
  }

  if (dosenPembimbing1Id) {
    const dosenExists = await prisma.dosen.findUnique({
      where: { id: dosenPembimbing1Id },
    });
    if (!dosenExists) {
      res.status(404);
      throw new Error("Dosen pembimbing 1 tidak ditemukan");
    }
  }

  if (dosenPembimbing2Id) {
    const dosenExists = await prisma.dosen.findUnique({
      where: { id: dosenPembimbing2Id },
    });
    if (!dosenExists) {
      res.status(404);
      throw new Error("Dosen pembimbing 2 tidak ditemukan");
    }
  }

  // Get active registration period
  const activePeriod = await prisma.sidangPeriod.findFirst({
    where: { category: "pendaftaran sidang", isOpen: true, deletedAt: null },
  });

  // Check edit permission if updating an existing registration by ID
  if (id) {
    const editCheck = await checkSidangEditable(id);
    if (!editCheck.exists) {
      res.status(404);
      throw new Error(editCheck.reason);
    }
    if (!editCheck.editable) {
      res.status(403);
      throw new Error(editCheck.reason);
    }
  }

  const upsertData = {
    programType: programType !== undefined ? programType : undefined,
    sidangScheme: sidangScheme !== undefined ? sidangScheme : undefined,
    jalurNonSidang: jalurNonSidang !== undefined ? jalurNonSidang : undefined,
    sks: sks !== undefined ? parseInt(sks) : undefined,
    ipk: ipk !== undefined ? parseFloat(ipk) : undefined,
    tak: tak !== undefined ? parseInt(tak) : undefined,
    sktaExpDate: sktaExpDate ? new Date(sktaExpDate) : undefined,
    thesisTitleId: thesisTitleId !== undefined ? thesisTitleId : undefined,
    thesisTitleEn: thesisTitleEn !== undefined ? thesisTitleEn : undefined,
    mahasiswaId: mahasiswaId !== undefined ? mahasiswaId : undefined,
    dosenPembimbing1Id:
      dosenPembimbing1Id !== undefined
        ? dosenPembimbing1Id
        : undefined,
    dosenPembimbing2Id:
      dosenPembimbing2Id !== undefined
        ? dosenPembimbing2Id
        : undefined,
    isDraft: true,
  };

  let sidangRegistration;

  if (id) {
    // Update existing
    sidangRegistration = await prisma.sidangRegistration.update({
      where: { id },
      data: upsertData,
      include: {
        mahasiswa: { select: { id: true, nim: true, name: true } },
        dosenPembimbing1: { select: { id: true, nip: true, name: true } },
        dosenPembimbing2: { select: { id: true, nip: true, name: true } },
      },
    });
  } else if (mahasiswaId) {
    // Look for existing draft
    const existing = await prisma.sidangRegistration.findFirst({
      where: { mahasiswaId },
      orderBy: { createdAt: "desc" },
    });

    if (existing && existing.isDraft) {
      const editCheck = await checkSidangEditable(existing.id);
      if (!editCheck.editable) {
        res.status(403);
        throw new Error(editCheck.reason);
      }

      sidangRegistration = await prisma.sidangRegistration.update({
        where: { id: existing.id },
        data: upsertData,
        include: {
          mahasiswa: { select: { id: true, nim: true, name: true } },
          dosenPembimbing1: { select: { id: true, nip: true, name: true } },
          dosenPembimbing2: { select: { id: true, nip: true, name: true } },
        },
      });
    } else {
      // Creating a new registration: Must have an active open period
      if (!activePeriod) {
        res.status(400);
        throw new Error("Tidak ada periode pendaftaran sidang yang aktif saat ini.");
      }

      // Check if student is already registered in this active period
      const existingInPeriod = await prisma.sidangRegistration.findFirst({
        where: {
          mahasiswaId,
          sidangRegistrationPeriodId: activePeriod.id,
          deletedAt: null,
        },
      });

      if (existingInPeriod) {
        res.status(400);
        throw new Error("Mahasiswa sudah terdaftar pada periode pendaftaran sidang yang aktif.");
      }

      upsertData.sidangRegistrationPeriodId = activePeriod.id;

      sidangRegistration = await prisma.sidangRegistration.create({
        data: upsertData,
        include: {
          mahasiswa: { select: { id: true, nim: true, name: true } },
          dosenPembimbing1: { select: { id: true, nip: true, name: true } },
          dosenPembimbing2: { select: { id: true, nip: true, name: true } },
        },
      });
    }
  } else {
    // Create new
    if (!activePeriod) {
      res.status(400);
      throw new Error("Tidak ada periode pendaftaran sidang yang aktif saat ini.");
    }

    upsertData.sidangRegistrationPeriodId = activePeriod.id;

    sidangRegistration = await prisma.sidangRegistration.create({
      data: upsertData,
      include: {
        mahasiswa: { select: { id: true, nim: true, name: true } },
        dosenPembimbing1: { select: { id: true, nip: true, name: true } },
        dosenPembimbing2: { select: { id: true, nip: true, name: true } },
      },
    });
  }

  res.status(200).json({
    message: "Sidang registration saved as draft successfully",
    data: sidangRegistration,
  });
});

// Submit Sidang Registration (Update isDraft to false with Validation)
const submitSidangRegistration = asyncHandler(async (req, res) => {
  const {
    id,
    programType,
    sidangScheme,
    jalurNonSidang,
    sks,
    ipk,
    tak,
    sktaExpDate,
    thesisTitleId,
    thesisTitleEn,
    mahasiswaId,
    dosenPembimbing1Id,
    dosenPembimbing2Id,
  } = req.body;

  const errors = [];
  
  if (isNil(id)) {
    errors.push({ field: "id", message: "ID wajib diisi untuk submit" });
  } else if (typeof id !== "string") {
    errors.push({ field: "id", message: "ID harus berupa string" });
  }

  if (isNil(programType)) {
    errors.push({ field: "programType", message: "Tipe program wajib diisi" });
  } else if (typeof programType !== "string") {
    errors.push({ field: "programType", message: "Tipe program harus berupa string" });
  }

  if (!isNil(jalurNonSidang) && !Array.isArray(jalurNonSidang)) {
    errors.push({ field: "jalurNonSidang", message: "Jalur non sidang harus berupa array jika diisi" });
  }

  if (isNil(sks)) {
    errors.push({ field: "sks", message: "SKS wajib diisi" });
  } else if (isNaN(parseInt(sks))) {
    errors.push({ field: "sks", message: "SKS harus berupa integer" });
  }

  if (isNil(ipk)) {
    errors.push({ field: "ipk", message: "IPK wajib diisi" });
  } else if (isNaN(parseFloat(ipk))) {
    errors.push({ field: "ipk", message: "IPK harus berupa float" });
  }

  if (isNil(tak)) {
    errors.push({ field: "tak", message: "TAK wajib diisi" });
  } else if (isNaN(parseInt(tak))) {
    errors.push({ field: "tak", message: "TAK harus berupa integer" });
  }

  if (isNil(sktaExpDate)) {
    errors.push({ field: "sktaExpDate", message: "Tanggal berlaku SKTA wajib diisi" });
  } else if (!isValidISO8601(sktaExpDate)) {
    errors.push({ field: "sktaExpDate", message: "Tanggal berlaku SKTA harus berupa tanggal yang valid (format ISO 8601)" });
  }

  if (isNil(thesisTitleId)) {
    errors.push({ field: "thesisTitleId", message: "Judul TA (ID) wajib diisi" });
  } else if (typeof thesisTitleId !== "string") {
    errors.push({ field: "thesisTitleId", message: "Judul TA (ID) harus berupa string" });
  }

  if (isNil(thesisTitleEn)) {
    errors.push({ field: "thesisTitleEn", message: "Judul TA (EN) wajib diisi" });
  } else if (typeof thesisTitleEn !== "string") {
    errors.push({ field: "thesisTitleEn", message: "Judul TA (EN) harus berupa string" });
  }

  if (isNil(mahasiswaId)) {
    errors.push({ field: "mahasiswaId", message: "ID mahasiswa wajib diisi" });
  } else if (typeof mahasiswaId !== "string") {
    errors.push({ field: "mahasiswaId", message: "ID mahasiswa harus berupa string" });
  }

  if (isNil(dosenPembimbing1Id)) {
    errors.push({ field: "dosenPembimbing1Id", message: "ID dosen pembimbing 1 wajib diisi" });
  } else if (typeof dosenPembimbing1Id !== "string") {
    errors.push({ field: "dosenPembimbing1Id", message: "ID dosen pembimbing 1 harus berupa string" });
  }

  if (isNil(dosenPembimbing2Id)) {
    errors.push({ field: "dosenPembimbing2Id", message: "ID dosen pembimbing 2 wajib diisi" });
  } else if (typeof dosenPembimbing2Id !== "string") {
    errors.push({ field: "dosenPembimbing2Id", message: "ID dosen pembimbing 2 harus berupa string" });
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  const existingRegistration = await prisma.sidangRegistration.findUnique({
    where: { id },
    include: {
      sidangRegistrationUploads: true,
    },
  });

  if (!existingRegistration) {
    res.status(404);
    throw new Error("Pendaftaran sidang tidak ditemukan");
  }

  const editCheck = await checkSidangEditable(id);
  if (!editCheck.editable) {
    res.status(403);
    throw new Error(editCheck.reason);
  }

  // Update field sebelum validasi (supaya merge)
  const updateData = {
    programType: programType !== undefined ? programType : undefined,
    sidangScheme: sidangScheme !== undefined ? sidangScheme : undefined,
    jalurNonSidang: jalurNonSidang !== undefined ? jalurNonSidang : undefined,
    sks: sks !== undefined ? parseInt(sks) : undefined,
    ipk: ipk !== undefined ? parseFloat(ipk) : undefined,
    tak: tak !== undefined ? parseInt(tak) : undefined,
    sktaExpDate: sktaExpDate ? new Date(sktaExpDate) : undefined,
    thesisTitleId: thesisTitleId !== undefined ? thesisTitleId : undefined,
    thesisTitleEn: thesisTitleEn !== undefined ? thesisTitleEn : undefined,
    mahasiswaId: mahasiswaId !== undefined ? mahasiswaId : undefined,
    dosenPembimbing1Id:
      dosenPembimbing1Id !== undefined
        ? dosenPembimbing1Id
        : undefined,
    dosenPembimbing2Id:
      dosenPembimbing2Id !== undefined
        ? dosenPembimbing2Id
        : undefined,
    isEdit: null,
    message: null,
  };

  const activePeriod = await prisma.sidangPeriod.findFirst({
    where: { category: "pendaftaran sidang", isOpen: true, deletedAt: null },
  });

  if (existingRegistration.sidangRegistrationPeriodId) {
    const period = await prisma.sidangPeriod.findUnique({
      where: { id: existingRegistration.sidangRegistrationPeriodId },
    });
    if (!period || !period.isOpen) {
      res.status(400);
      throw new Error("Periode pendaftaran sidang ini sudah ditutup.");
    }
  } else {
    if (!activePeriod) {
      res.status(400);
      throw new Error("Tidak ada periode pendaftaran sidang yang aktif saat ini.");
    }
    updateData.sidangRegistrationPeriodId = activePeriod.id;
  }

  const mergedData = { ...existingRegistration, ...updateData };

  // 1. Validasi Field Required
  const requiredFields = [
    "programType",
    "sks",
    "ipk",
    "tak",
    "sktaExpDate",
    "thesisTitleId",
    "thesisTitleEn",
    "mahasiswaId",
    "dosenPembimbing1Id",
    "dosenPembimbing2Id",
  ];

  const missingFields = requiredFields.filter(
    (field) => mergedData[field] === null || mergedData[field] === undefined,
  );

  if (missingFields.length > 0) {
    res.status(400);
    throw new Error(
      `Tidak dapat submit. Field wajib belum lengkap: ${missingFields.join(", ")}`,
    );
  }

  // 2. Validasi Uploaded Files
  const uploadedSlugs = existingRegistration.sidangRegistrationUploads.map(
    (upload) => upload.slug,
  );

  const missingFiles = [];

  // Wajib
  for (const slug of REQUIRED_SLUGS) {
    if (!uploadedSlugs.includes(slug)) missingFiles.push(slug);
  }

  // Jalur Non Sidang
  if (mergedData.jalurNonSidang && Array.isArray(mergedData.jalurNonSidang)) {
    for (const jalur of mergedData.jalurNonSidang) {
      if (NON_SIDANG_SLUGS[jalur]) {
        for (const slug of NON_SIDANG_SLUGS[jalur]) {
          if (!uploadedSlugs.includes(slug)) missingFiles.push(slug);
        }
      }
    }
  }

  if (missingFiles.length > 0) {
    res.status(400);
    throw new Error(
      `Tidak dapat submit. Berkas wajib belum lengkap: ${missingFiles.join(", ")}`,
    );
  }

  // Validasi referensi eksis
  if (mergedData.mahasiswaId) {
    const s = await prisma.mahasiswa.findUnique({
      where: { id: mergedData.mahasiswaId },
    });
    if (!s) {
      res.status(404);
      throw new Error("Mahasiswa tidak ditemukan");
    }
  }
  if (mergedData.dosenPembimbing1Id) {
    const d1 = await prisma.dosen.findUnique({
      where: { id: mergedData.dosenPembimbing1Id },
    });
    if (!d1) {
      res.status(404);
      throw new Error("Dosen pembimbing 1 tidak ditemukan");
    }
  }
  if (mergedData.dosenPembimbing2Id) {
    const d2 = await prisma.dosen.findUnique({
      where: { id: mergedData.dosenPembimbing2Id },
    });
    if (!d2) {
      res.status(404);
      throw new Error("Dosen pembimbing 2 tidak ditemukan");
    }
  }

  updateData.isDraft = false; // Finalize submit
  updateData.submittedAt = new Date(); // Record student submission time

  const updatedSidangRegistration = await prisma.sidangRegistration.update({
    where: { id },
    data: updateData,
    include: {
      mahasiswa: { select: { id: true, nim: true, name: true } },
      dosenPembimbing1: { select: { id: true, nip: true, name: true } },
      dosenPembimbing2: { select: { id: true, nip: true, name: true } },
    },
  });

  res.status(200).json({
    message: "Sidang registration submitted successfully",
    data: updatedSidangRegistration,
  });
});

// Delete Sidang Registration (soft delete)
const deleteSidangRegistration = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const sidangRegistrationExists = await prisma.sidangRegistration.findUnique({
    where: { id },
  });

  if (!sidangRegistrationExists) {
    res.status(404);
    throw new Error("Pendaftaran sidang tidak ditemukan");
  }

  const deletedSidangRegistration = await prisma.sidangRegistration.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  });

  res.json({
    message: "Sidang registration deleted successfully",
    data: deletedSidangRegistration,
  });
});

// Upload Dokumen Persyaratan Sidang
const uploadSidangRegistrationFile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { slug, name } = req.body;
  const file = req.files?.file?.[0] || req.file;

  if (!file) {
    res.status(400);
    throw new Error("Tidak ada file yang diunggah");
  }

  if (!slug || !name) {
    if (file.path) fs.unlink(file.path, () => {});
    res.status(400);
    throw new Error("Slug dan nama wajib diisi");
  }

  const editCheck = await checkSidangEditable(id);
  if (!editCheck.exists) {
    if (file.path) fs.unlink(file.path, () => {});
    res.status(404);
    throw new Error(editCheck.reason);
  }

  if (!editCheck.editable) {
    if (file.path) fs.unlink(file.path, () => {});
    res.status(403);
    throw new Error(editCheck.reason);
  }

  const existingUpload = await prisma.sidangRegistrationUpload.findFirst({
    where: {
      sidangRegistrationId: id,
      slug: slug,
    },
  });

  let uploadRecord;

  if (existingUpload) {
    if (existingUpload.path && fs.existsSync(existingUpload.path)) {
      fs.unlinkSync(existingUpload.path);
    }

    uploadRecord = await prisma.sidangRegistrationUpload.update({
      where: { id: existingUpload.id },
      data: {
        name,
        filename: file.filename,
        path: file.path,
        isValid: false,
      },
    });
  } else {
    uploadRecord = await prisma.sidangRegistrationUpload.create({
      data: {
        name,
        slug,
        filename: file.filename,
        path: file.path,
        sidangRegistrationId: id,
        isValid: false,
      },
    });
  }

  uploadRecord.downloadUrl = `${req.protocol}://${req.get(
    "host",
  )}/api/sidang-registrations/uploads/${uploadRecord.id}/download`;

  res.status(200).json({
    message: existingUpload
      ? "File updated successfully"
      : "File uploaded successfully",
    data: uploadRecord,
  });
});

// Get All Uploaded Files by Sidang Registration ID
const getSidangRegistrationFiles = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const uploads = await prisma.sidangRegistrationUpload.findMany({
    where: { sidangRegistrationId: id },
  });

  const data = uploads.map((upload) => ({
    ...upload,
    downloadUrl: `${req.protocol}://${req.get(
      "host",
    )}/api/sidang-registrations/uploads/${upload.id}/download`,
  }));

  res.json({ data });
});

// Download Sidang Registration Upload
const downloadSidangRegistrationFile = asyncHandler(async (req, res) => {
  const uploadId = req.params.uploadId;

  const upload = await prisma.sidangRegistrationUpload.findFirst({
    where: { id: uploadId },
  });

  if (!upload) {
    res.status(404);
    throw new Error("Unggahan tidak ditemukan");
  }

  const filePath = path.resolve(process.cwd(), upload.path);

  if (!fs.existsSync(filePath)) {
    res.status(404);
    throw new Error("File tidak ditemukan");
  }

  res.download(filePath, upload.filename);
});

// Approve Sidang Registration (Admin Response)
const approveSidangRegistration = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { adminId, sidangPeriodId, sidangRegistrationUploadIds } = req.body;

  const errors = [];
  if (isNil(adminId)) {
    errors.push({ field: "adminId", message: "ID staf akademik wajib diisi" });
  }
  if (isNil(sidangPeriodId)) {
    errors.push({ field: "sidangPeriodId", message: "ID periode sidang wajib diisi" });
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  const registration = await prisma.sidangRegistration.findUnique({
    where: { id },
  });

  if (!registration) {
    res.status(404);
    throw new Error("Pendaftaran sidang tidak ditemukan");
  }

  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
  });

  if (!admin) {
    res.status(404);
    throw new Error("Staf akademik tidak ditemukan");
  }

  const period = await prisma.sidangPeriod.findUnique({
    where: { id: sidangPeriodId },
  });

  if (!period) {
    res.status(404);
    throw new Error("Periode sidang tidak ditemukan");
  }

  if (Array.isArray(sidangRegistrationUploadIds)) {
    await prisma.sidangRegistrationUpload.updateMany({
      where: {
        sidangRegistrationId: id,
        id: { in: sidangRegistrationUploadIds },
      },
      data: { isValid: true },
    });

    await prisma.sidangRegistrationUpload.updateMany({
      where: {
        sidangRegistrationId: id,
        id: { notIn: sidangRegistrationUploadIds },
      },
      data: { isValid: false },
    });
  }

  const updatedRegistration = await prisma.sidangRegistration.update({
    where: { id },
    data: {
      adminId,
      sidangPeriodId,
      message: null,
      isEdit: null,
    },
    include: {
      mahasiswa: {
        select: {
          id: true,
          nim: true,
          name: true,
        },
      },
    },
  });

  res.json({
    message: "Pendaftaran sidang berhasil disetujui",
    data: updatedRegistration,
  });
});

// Reject/Request Revision for Sidang Registration (Admin Response)
const rejectSidangRegistration = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { adminId, message, isEdit, sidangRegistrationUploadIds } = req.body;

  const errors = [];
  if (isNil(adminId)) {
    errors.push({ field: "adminId", message: "ID staf akademik wajib diisi" });
  }
  if (isNil(message)) {
    errors.push({ field: "message", message: "Pesan penolakan wajib diisi" });
  }
  if (!isNil(isEdit) && !isValidISO8601(isEdit)) {
    errors.push({ field: "isEdit", message: "isEdit harus berupa tanggal yang valid (format ISO 8601)" });
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  const registration = await prisma.sidangRegistration.findUnique({
    where: { id },
  });

  if (!registration) {
    res.status(404);
    throw new Error("Pendaftaran sidang tidak ditemukan");
  }

  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
  });

  if (!admin) {
    res.status(404);
    throw new Error("Staf akademik tidak ditemukan");
  }

  if (Array.isArray(sidangRegistrationUploadIds)) {
    await prisma.sidangRegistrationUpload.updateMany({
      where: {
        sidangRegistrationId: id,
        id: { in: sidangRegistrationUploadIds },
      },
      data: { isValid: true },
    });

    await prisma.sidangRegistrationUpload.updateMany({
      where: {
        sidangRegistrationId: id,
        id: { notIn: sidangRegistrationUploadIds },
      },
      data: { isValid: false },
    });
  }

  const updatedRegistration = await prisma.sidangRegistration.update({
    where: { id },
    data: {
      adminId,
      message,
      isEdit: isEdit ? new Date(isEdit) : null,
      sidangPeriodId: null,
      isDraft: isEdit ? true : false,
      submittedAt: isEdit ? null : undefined,
    },
    include: {
      mahasiswa: {
        select: {
          id: true,
          nim: true,
          name: true,
        },
      },
    },
  });

  res.json({
    message: "Pendaftaran sidang berhasil ditolak / diminta revisi",
    data: updatedRegistration,
  });
});

export {
  listSidangRegistrations,
  getSidangRegistrationById,
  getSidangRegistrationByMahasiswaId,
  saveSidangRegistration,
  submitSidangRegistration,
  deleteSidangRegistration,
  uploadSidangRegistrationFile,
  getSidangRegistrationFiles,
  downloadSidangRegistrationFile,
  approveSidangRegistration,
  rejectSidangRegistration,
};
