import asyncHandler from 'express-async-handler';
import prisma from "../config/prisma.js";
import fs from 'fs';
import path from 'path';
import { sendValidationError, isNil, parseBoolean, isValidISO8601 } from '../utils/validationHelper.js';

// Constants for File Validation
const REQUIRED_SLUGS = [];


const mapMahasiswa = (mahasiswa) => {
  if (!mahasiswa) return null;
  return {
    id: mahasiswa.id,
    nim: mahasiswa.nim || '',
    kelasAsal: mahasiswa.kelasAsal || '',
    tahunAngkatan: mahasiswa.tahunAngkatan,
    sks: mahasiswa.sks,
    ipk: mahasiswa.ipk,
    tak: mahasiswa.tak,
    studyProgramId: mahasiswa.studyProgramId,
    dosenWaliId: mahasiswa.dosenWaliId,
    name: mahasiswa.user?.name || '',
    email: mahasiswa.user?.email || '',
    phone: mahasiswa.user?.phone || null,
    studyProgram: mahasiswa.studyProgram
      ? {
          id: mahasiswa.studyProgram.id,
          name: mahasiswa.studyProgram.name,
          isActive: mahasiswa.studyProgram.isActive,
          facultyId: mahasiswa.studyProgram.facultyId,
        }
      : null,
  };
};

const mapDosen = (dosen) => {
  if (!dosen) return null;
  return {
    id: dosen.id,
    nip: dosen.nip,
    nidn: dosen.nidn,
    kodeDosen: dosen.kodeDosen,
    researchGroupId: dosen.researchGroupId,
    userId: dosen.userId,
    name: dosen.user?.name || '',
    email: dosen.user?.email || '',
    phone: dosen.user?.phone || null,
  };
};

const mapAdmin = (admin) => {
  if (!admin) return null;
  return {
    id: admin.id,
    userId: admin.userId,
    name: admin.user?.name || '',
    email: admin.user?.email || '',
    phone: admin.user?.phone || null,
  };
};

const mapYudisiumRegistrationToFrontend = (item, req) => {
  if (!item) return null;
  return {
    id: item.id,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    isDraft: item.isDraft,
    mahasiswaId: item.mahasiswaId,
    program: item.program,
    dosenWaliId: item.dosenWaliId,
    judulTugasAkhirIndonesia: item.judulTugasAkhirIndonesia,
    judulTugasAkhirInggris: item.judulTugasAkhirInggris,
    tak: item.tak,
    skemaSidang: item.skemaSidang,
    pengajuanCumlaude: item.pengajuanCumlaude,
    skemaCumlaude: item.skemaCumlaude,
    evidenCumlaude: item.evidenCumlaude,
    dosenPembimbing1Id: item.dosenPembimbing1Id,
    dosenPembimbing2Id: item.dosenPembimbing2Id,
    submittedAt: item.submittedAt,
    yudisiumRegistrationPeriodId: item.yudisiumRegistrationPeriodId,
    yudisiumPeriodId: item.yudisiumPeriodId,
    message: item.message,
    isEdit: item.isEdit,
    adminId: item.adminId,
    mahasiswa: mapMahasiswa(item.mahasiswa),
    dosenWali: mapDosen(item.dosenWali),
    dosenPembimbing1: mapDosen(item.dosenPembimbing1),
    dosenPembimbing2: mapDosen(item.dosenPembimbing2),
    admin: mapAdmin(item.admin),
    yudisiumRegistrationPeriod: item.yudisiumRegistrationPeriod
      ? {
          id: item.yudisiumRegistrationPeriod.id,
          name: item.yudisiumRegistrationPeriod.name,
          category: item.yudisiumRegistrationPeriod.category,
          period: item.yudisiumRegistrationPeriod.period,
          startDate: item.yudisiumRegistrationPeriod.startDate,
          endDate: item.yudisiumRegistrationPeriod.endDate,
          isOpen: item.yudisiumRegistrationPeriod.isOpen,
        }
      : null,
    yudisiumPeriod: item.yudisiumPeriod
      ? {
          id: item.yudisiumPeriod.id,
          name: item.yudisiumPeriod.name,
          category: item.yudisiumPeriod.category,
          period: item.yudisiumPeriod.period,
          startDate: item.yudisiumPeriod.startDate,
          endDate: item.yudisiumPeriod.endDate,
          isOpen: item.yudisiumPeriod.isOpen,
        }
      : null,
    yudisiumRegistrationUploads: item.yudisiumRegistrationUploads
      ? item.yudisiumRegistrationUploads.map((upload) => ({
          id: upload.id,
          name: upload.name,
          category: upload.category,
          filepath: upload.filepath,
          isValid: upload.isValid,
          yudisiumRegistrationId: upload.yudisiumRegistrationId,
          downloadUrl: `${req.protocol}://${req.get("host")}/api/yudisium-registrations/uploads/${upload.id}/download`,
        }))
      : [],
  };
};

const yudisiumInclude = {
  mahasiswa: {
    include: {
      studyProgram: true,
      user: true,
    },
  },
  dosenWali: {
    include: {
      user: true,
    },
  },
  dosenPembimbing1: {
    include: {
      user: true,
    },
  },
  dosenPembimbing2: {
    include: {
      user: true,
    },
  },
  admin: {
    include: {
      user: true,
    },
  },
  yudisiumRegistrationPeriod: true,
  yudisiumPeriod: true,
  yudisiumRegistrationUploads: true,
};

const checkYudisiumEditable = async (registrationId) => {
  const registration = await prisma.yudisiumRegistration.findUnique({
    where: { id: registrationId },
  });

  if (!registration) {
    return { exists: false, editable: false, reason: "Pendaftaran yudisium tidak ditemukan." };
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

// Yudisium Registration List
const listYudisiumRegistrations = asyncHandler(async (req, res) => {
  const yudisiumRegistrations = await prisma.yudisiumRegistration.findMany({
    include: yudisiumInclude,
    orderBy: {
      createdAt: "desc",
    },
  });

  const data = yudisiumRegistrations.map((reg) => mapYudisiumRegistrationToFrontend(reg, req));

  res.json({
    data,
  });
});

// Get Yudisium Registration by ID
const getYudisiumRegistrationById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const yudisiumRegistration = await prisma.yudisiumRegistration.findUnique({
    where: {
      id,
    },
    include: yudisiumInclude,
  });

  if (!yudisiumRegistration) {
    res.status(404);
    throw new Error("Pendaftaran yudisium tidak ditemukan");
  }

  res.json({
    data: mapYudisiumRegistrationToFrontend(yudisiumRegistration, req),
  });
});

// Get Yudisium Registration by Mahasiswa ID
const getYudisiumRegistrationByMahasiswaId = asyncHandler(async (req, res) => {
  const { mahasiswaId } = req.params;

  const yudisiumRegistration = await prisma.yudisiumRegistration.findFirst({
    where: {
      mahasiswaId,
    },
    include: yudisiumInclude,
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!yudisiumRegistration) {
    res.status(404);
    throw new Error("Pendaftaran yudisium tidak ditemukan");
  }

  res.json({
    data: mapYudisiumRegistrationToFrontend(yudisiumRegistration, req),
  });
});

// Save Draft Yudisium Registration (Upsert)
const saveYudisiumRegistration = asyncHandler(async (req, res) => {
  const {
    id,
    programType,
    tak,
    thesisTitleId,
    thesisTitleEn,
    isConfirmed,
    sidangScheme,
    cumlaudeScheme,
    jalurNonYudisium,
    eviden_cumlaude,
    mahasiswaId,
    dosenPembimbing1Id,
    dosenPembimbing2Id,
    yudisiumPeriodId,
    yudisiumRegistrationPeriodId,
  } = req.body;

  const errors = [];

  if (!isNil(id) && typeof id !== "string") {
    errors.push({ field: "id", message: "ID harus berupa string" });
  }

  if (!isNil(programType) && typeof programType !== "string") {
    errors.push({ field: "programType", message: "Tipe program harus berupa string" });
  }

  if (!isNil(tak) && isNaN(parseInt(tak))) {
    errors.push({ field: "tak", message: "TAK harus berupa integer" });
  }

  if (!isNil(thesisTitleId) && typeof thesisTitleId !== "string") {
    errors.push({ field: "thesisTitleId", message: "Judul TA (ID) harus berupa string" });
  }

  if (!isNil(thesisTitleEn) && typeof thesisTitleEn !== "string") {
    errors.push({ field: "thesisTitleEn", message: "Judul TA (EN) harus berupa string" });
  }

  const parsedIsConfirmed = parseBoolean(isConfirmed);
  if (!isNil(isConfirmed) && parsedIsConfirmed === undefined) {
    errors.push({ field: "isConfirmed", message: "Konfirmasi harus berupa boolean" });
  }

  if (!isNil(sidangScheme) && typeof sidangScheme !== "string") {
    errors.push({ field: "sidangScheme", message: "Skema sidang harus berupa string jika diisi" });
  }

  if (!isNil(cumlaudeScheme) && typeof cumlaudeScheme !== "string") {
    errors.push({ field: "cumlaudeScheme", message: "Skema cumlaude harus berupa string jika diisi" });
  }

  if (!isNil(jalurNonYudisium) && !Array.isArray(jalurNonYudisium)) {
    errors.push({ field: "jalurNonYudisium", message: "Jalur non yudisium harus berupa array jika diisi" });
  }

  if (!isNil(eviden_cumlaude) && typeof eviden_cumlaude !== "string") {
    errors.push({ field: "eviden_cumlaude", message: "Eviden cumlaude harus berupa string" });
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

  if (!isNil(yudisiumPeriodId) && typeof yudisiumPeriodId !== "string") {
    errors.push({ field: "yudisiumPeriodId", message: "ID periode yudisium harus berupa string" });
  }

  if (!isNil(yudisiumRegistrationPeriodId) && typeof yudisiumRegistrationPeriodId !== "string") {
    errors.push({ field: "yudisiumRegistrationPeriodId", message: "ID periode pendaftaran yudisium harus berupa string" });
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
  const activePeriod = await prisma.yudisiumPeriod.findFirst({
    where: { category: "pendaftaran yudisium", isOpen: true, deletedAt: null },
  });

  // Check edit permission if updating an existing registration by ID
  if (id) {
    const editCheck = await checkYudisiumEditable(id);
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
    tak: tak !== undefined ? parseInt(tak) : undefined,
    thesisTitleId: thesisTitleId !== undefined ? thesisTitleId : undefined,
    thesisTitleEn: thesisTitleEn !== undefined ? thesisTitleEn : undefined,
    isConfirmed: parsedIsConfirmed !== undefined ? parsedIsConfirmed : undefined,
    sidangScheme: sidangScheme !== undefined ? sidangScheme : undefined,
    cumlaudeScheme: cumlaudeScheme !== undefined ? cumlaudeScheme : undefined,
    jalurNonYudisium:
      jalurNonYudisium !== undefined ? jalurNonYudisium : undefined,
    eviden_cumlaude:
      eviden_cumlaude !== undefined ? eviden_cumlaude : undefined,
    mahasiswaId: mahasiswaId !== undefined ? mahasiswaId : undefined,
    dosenPembimbing1Id:
      dosenPembimbing1Id !== undefined
        ? dosenPembimbing1Id
        : undefined,
    dosenPembimbing2Id:
      dosenPembimbing2Id !== undefined
        ? dosenPembimbing2Id
        : undefined,
    yudisiumPeriodId:
      yudisiumPeriodId !== undefined ? yudisiumPeriodId : undefined,
    yudisiumRegistrationPeriodId:
      yudisiumRegistrationPeriodId !== undefined
        ? yudisiumRegistrationPeriodId
        : (activePeriod ? activePeriod.id : undefined),
    isDraft: true,
  };

  let yudisiumRegistration;

  if (id) {
    yudisiumRegistration = await prisma.yudisiumRegistration.update({
      where: { id },
      data: upsertData,
      include: yudisiumInclude,
    });
  } else if (mahasiswaId) {
    const existing = await prisma.yudisiumRegistration.findFirst({
      where: { mahasiswaId },
      orderBy: { createdAt: "desc" },
    });

    if (existing && existing.isDraft) {
      const editCheck = await checkYudisiumEditable(existing.id);
      if (!editCheck.editable) {
        res.status(403);
        throw new Error(editCheck.reason);
      }

      yudisiumRegistration = await prisma.yudisiumRegistration.update({
        where: { id: existing.id },
        data: upsertData,
        include: yudisiumInclude,
      });
    } else {
      // Check active period
      const targetPeriodId = upsertData.yudisiumRegistrationPeriodId;
      if (!targetPeriodId) {
        res.status(400);
        throw new Error("Tidak ada periode pendaftaran yudisium yang aktif saat ini.");
      }

      // Check if student is already registered in this period
      const existingInPeriod = await prisma.yudisiumRegistration.findFirst({
        where: {
          mahasiswaId,
          yudisiumRegistrationPeriodId: targetPeriodId,
          deletedAt: null,
        },
      });

      if (existingInPeriod) {
        res.status(400);
        throw new Error("Mahasiswa sudah terdaftar pada periode pendaftaran yudisium ini.");
      }

      yudisiumRegistration = await prisma.yudisiumRegistration.create({
        data: upsertData,
        include: yudisiumInclude,
      });
    }
  } else {
    // Check active period
    const targetPeriodId = upsertData.yudisiumRegistrationPeriodId;
    if (!targetPeriodId) {
      res.status(400);
      throw new Error("Tidak ada periode pendaftaran yudisium yang aktif saat ini.");
    }

    yudisiumRegistration = await prisma.yudisiumRegistration.create({
      data: upsertData,
      include: yudisiumInclude,
    });
  }

  res.status(200).json({
    message: "Yudisium registration saved as draft successfully",
    data: mapYudisiumRegistrationToFrontend(yudisiumRegistration, req),
  });
});

// Submit Yudisium Registration (Update isDraft to false with Validation)
const submitYudisiumRegistration = asyncHandler(async (req, res) => {
  const {
    id,
    programType,
    tak,
    thesisTitleId,
    thesisTitleEn,
    isConfirmed,
    sidangScheme,
    cumlaudeScheme,
    jalurNonYudisium,
    eviden_cumlaude,
    mahasiswaId,
    dosenPembimbing1Id,
    dosenPembimbing2Id,
    yudisiumPeriodId,
    yudisiumRegistrationPeriodId,
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

  if (isNil(tak)) {
    errors.push({ field: "tak", message: "TAK wajib diisi" });
  } else if (isNaN(parseInt(tak))) {
    errors.push({ field: "tak", message: "TAK harus berupa integer" });
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

  const parsedIsConfirmed = parseBoolean(isConfirmed);
  if (isNil(isConfirmed)) {
    errors.push({ field: "isConfirmed", message: "Konfirmasi wajib diisi" });
  } else if (parsedIsConfirmed === undefined) {
    errors.push({ field: "isConfirmed", message: "Konfirmasi harus berupa boolean" });
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

  if (!isNil(sidangScheme) && typeof sidangScheme !== "string") {
    errors.push({ field: "sidangScheme", message: "Skema sidang harus berupa string jika diisi" });
  }

  if (!isNil(cumlaudeScheme) && typeof cumlaudeScheme !== "string") {
    errors.push({ field: "cumlaudeScheme", message: "Skema cumlaude harus berupa string jika diisi" });
  }

  if (!isNil(jalurNonYudisium) && !Array.isArray(jalurNonYudisium)) {
    errors.push({ field: "jalurNonYudisium", message: "Jalur non yudisium harus berupa array jika diisi" });
  }

  if (!isNil(eviden_cumlaude) && typeof eviden_cumlaude !== "string") {
    errors.push({ field: "eviden_cumlaude", message: "Eviden cumlaude harus berupa string" });
  }

  if (!isNil(yudisiumPeriodId) && typeof yudisiumPeriodId !== "string") {
    errors.push({ field: "yudisiumPeriodId", message: "ID periode yudisium harus berupa string" });
  }

  if (!isNil(yudisiumRegistrationPeriodId) && typeof yudisiumRegistrationPeriodId !== "string") {
    errors.push({ field: "yudisiumRegistrationPeriodId", message: "ID periode pendaftaran yudisium harus berupa string" });
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  const existingRegistration = await prisma.yudisiumRegistration.findUnique({
    where: { id },
    include: {
      yudisiumRegistrationUploads: true,
    },
  });

  if (!existingRegistration) {
    res.status(404);
    throw new Error("Pendaftaran yudisium tidak ditemukan");
  }

  const editCheck = await checkYudisiumEditable(id);
  if (!editCheck.editable) {
    res.status(403);
    throw new Error(editCheck.reason);
  }

  const updateData = {
    programType: programType !== undefined ? programType : undefined,
    tak: tak !== undefined ? parseInt(tak) : undefined,
    thesisTitleId: thesisTitleId !== undefined ? thesisTitleId : undefined,
    thesisTitleEn: thesisTitleEn !== undefined ? thesisTitleEn : undefined,
    isConfirmed: parsedIsConfirmed !== undefined ? parsedIsConfirmed : undefined,
    sidangScheme: sidangScheme !== undefined ? sidangScheme : undefined,
    cumlaudeScheme: cumlaudeScheme !== undefined ? cumlaudeScheme : undefined,
    jalurNonYudisium:
      jalurNonYudisium !== undefined ? jalurNonYudisium : undefined,
    eviden_cumlaude:
      eviden_cumlaude !== undefined ? eviden_cumlaude : undefined,
    mahasiswaId: mahasiswaId !== undefined ? mahasiswaId : undefined,
    dosenPembimbing1Id:
      dosenPembimbing1Id !== undefined
        ? dosenPembimbing1Id
        : undefined,
    dosenPembimbing2Id:
      dosenPembimbing2Id !== undefined
        ? dosenPembimbing2Id
        : undefined,
    yudisiumPeriodId:
      yudisiumPeriodId !== undefined ? yudisiumPeriodId : undefined,
    isEdit: null,
    message: null,
  };

  const activePeriod = await prisma.yudisiumPeriod.findFirst({
    where: { category: "pendaftaran yudisium", isOpen: true, deletedAt: null },
  });

  const periodIdToCheck = yudisiumRegistrationPeriodId
    ? yudisiumRegistrationPeriodId
    : (existingRegistration.yudisiumRegistrationPeriodId || (activePeriod ? activePeriod.id : null));

  if (periodIdToCheck) {
    const period = await prisma.yudisiumPeriod.findUnique({
      where: { id: periodIdToCheck },
    });
    if (!period || !period.isOpen) {
      res.status(400);
      throw new Error("Periode pendaftaran yudisium ini sudah ditutup.");
    }
    updateData.yudisiumRegistrationPeriodId = periodIdToCheck;
  } else {
    res.status(400);
    throw new Error("Tidak ada periode pendaftaran yudisium yang aktif saat ini.");
  }

  const mergedData = { ...existingRegistration, ...updateData };

  const requiredFields = [
    "programType",
    "tak",
    "thesisTitleId",
    "thesisTitleEn",
    "isConfirmed",
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

  const uploadedCategories = (existingRegistration.yudisiumRegistrationUploads || []).map(
    (upload) => upload.category,
  );

  const missingFiles = [];

  for (const slug of REQUIRED_SLUGS) {
    if (!uploadedCategories.includes(slug)) missingFiles.push(slug);
  }

  if (missingFiles.length > 0) {
    res.status(400);
    throw new Error(
      `Tidak dapat submit. Berkas wajib belum lengkap: ${missingFiles.join(", ")}`,
    );
  }

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

  updateData.isDraft = false;
  updateData.submittedAt = new Date(); // Record student submission time

  const updatedYudisiumRegistration = await prisma.yudisiumRegistration.update({
    where: { id },
    data: updateData,
    include: yudisiumInclude,
  });

  res.status(200).json({
    message: "Yudisium registration submitted successfully",
    data: mapYudisiumRegistrationToFrontend(updatedYudisiumRegistration, req),
  });
});

// Delete Yudisium Registration (soft delete)
const deleteYudisiumRegistration = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const yudisiumRegistrationExists =
    await prisma.yudisiumRegistration.findUnique({
      where: { id },
    });

  if (!yudisiumRegistrationExists) {
    res.status(404);
    throw new Error("Pendaftaran yudisium tidak ditemukan");
  }

  const deletedYudisiumRegistration = await prisma.yudisiumRegistration.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  });

  res.json({
    message: "Yudisium registration deleted successfully",
    data: deletedYudisiumRegistration,
  });
});

// Upload Dokumen Persyaratan Yudisium
const uploadYudisiumRegistrationFile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { slug, category, name } = req.body;
  const fileCategory = category || slug;
  const file = req.files?.file?.[0] || req.file;

  if (!file) {
    res.status(400);
    throw new Error("Tidak ada file yang diunggah");
  }

  if (!fileCategory || !name) {
    if (file.path) fs.unlink(file.path, () => {});
    res.status(400);
    throw new Error("Kategori (slug) dan nama berkas wajib diisi");
  }

  const editCheck = await checkYudisiumEditable(id);
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

  const existingUpload = await prisma.yudisiumRegistrationUpload.findFirst({
    where: {
      yudisiumRegistrationId: id,
      category: fileCategory,
    },
  });

  let uploadRecord;

  if (existingUpload) {
    if (existingUpload.filepath && fs.existsSync(existingUpload.filepath)) {
      fs.unlink(existingUpload.filepath, () => {});
    }

    uploadRecord = await prisma.yudisiumRegistrationUpload.update({
      where: { id: existingUpload.id },
      data: {
        name,
        filepath: file.path,
        isValid: null,
      },
    });
  } else {
    uploadRecord = await prisma.yudisiumRegistrationUpload.create({
      data: {
        name,
        category: fileCategory,
        filepath: file.path,
        yudisiumRegistrationId: id,
        isValid: null,
      },
    });
  }

  const responseData = {
    id: uploadRecord.id,
    name: uploadRecord.name,
    category: uploadRecord.category,
    filepath: uploadRecord.filepath,
    isValid: uploadRecord.isValid,
    yudisiumRegistrationId: uploadRecord.yudisiumRegistrationId,
    downloadUrl: `${req.protocol}://${req.get("host")}/api/yudisium-registrations/uploads/${uploadRecord.id}/download`,
  };

  res.status(200).json({
    message: existingUpload
      ? "File updated successfully"
      : "File uploaded successfully",
    data: responseData,
  });
});

// Get All Uploaded Files by Yudisium Registration ID
const getYudisiumRegistrationFiles = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const uploads = await prisma.yudisiumRegistrationUpload.findMany({
    where: { yudisiumRegistrationId: id },
  });

  const data = uploads.map((upload) => ({
    id: upload.id,
    name: upload.name,
    category: upload.category,
    filepath: upload.filepath,
    isValid: upload.isValid,
    yudisiumRegistrationId: upload.yudisiumRegistrationId,
    downloadUrl: `${req.protocol}://${req.get(
      "host",
    )}/api/yudisium-registrations/uploads/${upload.id}/download`,
  }));

  res.json({ data });
});

// Download Yudisium Registration Upload
const downloadYudisiumRegistrationFile = asyncHandler(async (req, res) => {
  const uploadId = req.params.uploadId;

  const upload = await prisma.yudisiumRegistrationUpload.findFirst({
    where: { id: uploadId },
  });

  if (!upload) {
    res.status(404);
    throw new Error("Unggahan tidak ditemukan");
  }

  const filePath = path.resolve(process.cwd(), upload.filepath);

  if (!fs.existsSync(filePath)) {
    res.status(404);
    throw new Error("File tidak ditemukan");
  }

  res.download(filePath, path.basename(upload.filepath));
});

// Approve Yudisium Registration (Admin Response)
const approveYudisiumRegistration = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { adminId, yudisiumPeriodId, yudisiumRegistrationUploadIds } = req.body;

  const errors = [];
  if (isNil(adminId)) {
    errors.push({ field: "adminId", message: "ID staf akademik wajib diisi" });
  }
  if (isNil(yudisiumPeriodId)) {
    errors.push({ field: "yudisiumPeriodId", message: "ID periode yudisium wajib diisi" });
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  const registration = await prisma.yudisiumRegistration.findUnique({
    where: { id },
  });

  if (!registration) {
    res.status(404);
    throw new Error("Pendaftaran yudisium tidak ditemukan");
  }

  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
  });

  if (!admin) {
    res.status(404);
    throw new Error("Staf akademik tidak ditemukan");
  }

  const period = await prisma.yudisiumPeriod.findUnique({
    where: { id: yudisiumPeriodId },
  });

  if (!period) {
    res.status(404);
    throw new Error("Periode yudisium tidak ditemukan");
  }

  if (Array.isArray(yudisiumRegistrationUploadIds)) {
    await prisma.yudisiumRegistrationUpload.updateMany({
      where: {
        yudisiumRegistrationId: id,
        id: { in: yudisiumRegistrationUploadIds },
      },
      data: { isValid: true },
    });

    await prisma.yudisiumRegistrationUpload.updateMany({
      where: {
        yudisiumRegistrationId: id,
        id: { notIn: yudisiumRegistrationUploadIds },
      },
      data: { isValid: false },
    });
  }

  const updatedRegistration = await prisma.yudisiumRegistration.update({
    where: { id },
    data: {
      adminId,
      yudisiumPeriodId,
      message: null,
      isEdit: null,
    },
    include: yudisiumInclude,
  });

  res.json({
    message: "Pendaftaran yudisium berhasil disetujui",
    data: mapYudisiumRegistrationToFrontend(updatedRegistration, req),
  });
});

// Reject/Request Revision for Yudisium Registration (Admin Response)
const rejectYudisiumRegistration = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { adminId, message, isEdit, yudisiumRegistrationUploadIds } = req.body;

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

  const registration = await prisma.yudisiumRegistration.findUnique({
    where: { id },
  });

  if (!registration) {
    res.status(404);
    throw new Error("Pendaftaran yudisium tidak ditemukan");
  }

  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
  });

  if (!admin) {
    res.status(404);
    throw new Error("Staf akademik tidak ditemukan");
  }

  if (Array.isArray(yudisiumRegistrationUploadIds)) {
    await prisma.yudisiumRegistrationUpload.updateMany({
      where: {
        yudisiumRegistrationId: id,
        id: { in: yudisiumRegistrationUploadIds },
      },
      data: { isValid: true },
    });

    await prisma.yudisiumRegistrationUpload.updateMany({
      where: {
        yudisiumRegistrationId: id,
        id: { notIn: yudisiumRegistrationUploadIds },
      },
      data: { isValid: false },
    });
  }

  const updatedRegistration = await prisma.yudisiumRegistration.update({
    where: { id },
    data: {
      adminId,
      message,
      isEdit: isEdit ? new Date(isEdit) : null,
      yudisiumPeriodId: null,
      isDraft: isEdit ? true : false,
      submittedAt: isEdit ? null : undefined,
    },
    include: yudisiumInclude,
  });

  res.json({
    message: "Pendaftaran yudisium berhasil ditolak / diminta revisi",
    data: mapYudisiumRegistrationToFrontend(updatedRegistration, req),
  });
});

export {
  listYudisiumRegistrations,
  getYudisiumRegistrationById,
  getYudisiumRegistrationByMahasiswaId,
  saveYudisiumRegistration,
  submitYudisiumRegistration,
  deleteYudisiumRegistration,
  uploadYudisiumRegistrationFile,
  getYudisiumRegistrationFiles,
  downloadYudisiumRegistrationFile,
  approveYudisiumRegistration,
  rejectYudisiumRegistration,
};
