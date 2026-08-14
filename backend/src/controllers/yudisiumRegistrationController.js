import asyncHandler from 'express-async-handler';
import prisma from "../config/prisma.js";
import fs from 'fs';
import path from 'path';
import { sendValidationError, isNil, parseBoolean } from '../utils/validationHelper.js';

// Constants for File Validation
const REQUIRED_SLUGS = [];

const checkYudisiumEditable = async (registrationId) => {
  const registration = await prisma.yudisiumRegistration.findUnique({
    where: { id: parseInt(registrationId) },
  });

  if (!registration) {
    return { exists: false, editable: false, reason: "Pendaftaran yudisium tidak ditemukan." };
  }

  if (!registration.isDraft) {
    const latestResponse = await prisma.yudisiumRegistrationResponse.findFirst({
      where: { yudisiumRegistrationId: registration.id, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });

    const hasActiveEditPermission = latestResponse && latestResponse.isEdit && new Date(latestResponse.isEdit) > new Date();

    if (!hasActiveEditPermission) {
      return { exists: true, editable: false, reason: "Pendaftaran sudah dikirim dan tidak memiliki izin edit yang aktif." };
    }
  }

  const latestResponse = await prisma.yudisiumRegistrationResponse.findFirst({
    where: { yudisiumRegistrationId: registration.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (latestResponse && latestResponse.isEdit) {
    const isEditExpired = new Date(latestResponse.isEdit) < new Date();
    if (isEditExpired) {
      return { exists: true, editable: false, reason: "Batas waktu izin edit dari admin telah kedaluwarsa." };
    }
  }

  return { exists: true, editable: true };
};

// Yudisium Registration List
const listYudisiumRegistrations = asyncHandler(async (req, res) => {
  const yudisiumRegistrations = await prisma.yudisiumRegistration.findMany({
    include: {
      mahasiswa: {
        select: {
          id: true,
          nim: true,
          name: true,
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
      yudisiumRegistrationUploads: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const data = yudisiumRegistrations.map((reg) => ({
    ...reg,
    yudisiumRegistrationUploads: reg.yudisiumRegistrationUploads.map(
      (upload) => ({
        ...upload,
        downloadUrl: `${req.protocol}://${req.get("host")}/api/yudisium-registrations/uploads/${upload.id}/download`,
      }),
    ),
  }));

  res.json({
    data,
  });
});

// Get Yudisium Registration by ID
const getYudisiumRegistrationById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const yudisiumRegistration = await prisma.yudisiumRegistration.findUnique({
    where: {
      id: parseInt(id),
    },
    include: {
      mahasiswa: {
        select: {
          id: true,
          nim: true,
          name: true,
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
      yudisiumRegistrationUploads: true,
    },
  });

  if (!yudisiumRegistration) {
    res.status(404);
    throw new Error("Pendaftaran yudisium tidak ditemukan");
  }

  yudisiumRegistration.yudisiumRegistrationUploads =
    yudisiumRegistration.yudisiumRegistrationUploads.map((upload) => ({
      ...upload,
      downloadUrl: `${req.protocol}://${req.get("host")}/api/yudisium-registrations/uploads/${upload.id}/download`,
    }));

  res.json({
    data: yudisiumRegistration,
  });
});

// Get Yudisium Registration by Mahasiswa ID
const getYudisiumRegistrationByMahasiswaId = asyncHandler(async (req, res) => {
  const { mahasiswaId } = req.params;

  const yudisiumRegistration = await prisma.yudisiumRegistration.findFirst({
    where: {
      mahasiswaId: parseInt(mahasiswaId),
    },
    include: {
      mahasiswa: {
        select: {
          id: true,
          nim: true,
          name: true,
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
      yudisiumRegistrationUploads: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!yudisiumRegistration) {
    res.status(404);
    throw new Error("Pendaftaran yudisium tidak ditemukan");
  }

  yudisiumRegistration.yudisiumRegistrationUploads =
    yudisiumRegistration.yudisiumRegistrationUploads.map((upload) => ({
      ...upload,
      downloadUrl: `${req.protocol}://${req.get("host")}/api/yudisium-registrations/uploads/${upload.id}/download`,
    }));

  res.json({
    data: yudisiumRegistration,
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

  if (!isNil(id) && isNaN(parseInt(id))) {
    errors.push({ field: "id", message: "ID harus berupa integer" });
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

  if (!isNil(mahasiswaId) && isNaN(parseInt(mahasiswaId))) {
    errors.push({ field: "mahasiswaId", message: "ID mahasiswa harus berupa integer" });
  }

  if (!isNil(dosenPembimbing1Id) && isNaN(parseInt(dosenPembimbing1Id))) {
    errors.push({ field: "dosenPembimbing1Id", message: "ID dosen pembimbing 1 harus berupa integer" });
  }

  if (!isNil(dosenPembimbing2Id) && isNaN(parseInt(dosenPembimbing2Id))) {
    errors.push({ field: "dosenPembimbing2Id", message: "ID dosen pembimbing 2 harus berupa integer" });
  }

  if (!isNil(yudisiumPeriodId) && isNaN(parseInt(yudisiumPeriodId))) {
    errors.push({ field: "yudisiumPeriodId", message: "ID periode yudisium harus berupa integer" });
  }

  if (!isNil(yudisiumRegistrationPeriodId) && isNaN(parseInt(yudisiumRegistrationPeriodId))) {
    errors.push({ field: "yudisiumRegistrationPeriodId", message: "ID periode pendaftaran yudisium harus berupa integer" });
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  // Validate references if provided
  if (mahasiswaId) {
    const studentExists = await prisma.mahasiswa.findUnique({
      where: { id: parseInt(mahasiswaId) },
    });
    if (!studentExists) {
      res.status(404);
      throw new Error("Mahasiswa tidak ditemukan");
    }
  }

  if (dosenPembimbing1Id) {
    const dosenExists = await prisma.dosen.findUnique({
      where: { id: parseInt(dosenPembimbing1Id) },
    });
    if (!dosenExists) {
      res.status(404);
      throw new Error("Dosen pembimbing 1 tidak ditemukan");
    }
  }

  if (dosenPembimbing2Id) {
    const dosenExists = await prisma.dosen.findUnique({
      where: { id: parseInt(dosenPembimbing2Id) },
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
    tak: tak !== undefined ? tak : undefined,
    thesisTitleId: thesisTitleId !== undefined ? thesisTitleId : undefined,
    thesisTitleEn: thesisTitleEn !== undefined ? thesisTitleEn : undefined,
    isConfirmed: parsedIsConfirmed !== undefined ? parsedIsConfirmed : undefined,
    sidangScheme: sidangScheme !== undefined ? sidangScheme : undefined,
    cumlaudeScheme: cumlaudeScheme !== undefined ? cumlaudeScheme : undefined,
    jalurNonYudisium:
      jalurNonYudisium !== undefined ? jalurNonYudisium : undefined,
    eviden_cumlaude:
      eviden_cumlaude !== undefined ? eviden_cumlaude : undefined,
    mahasiswaId: mahasiswaId !== undefined ? parseInt(mahasiswaId) : undefined,
    dosenPembimbing1Id:
      dosenPembimbing1Id !== undefined
        ? parseInt(dosenPembimbing1Id)
        : undefined,
    dosenPembimbing2Id:
      dosenPembimbing2Id !== undefined
        ? parseInt(dosenPembimbing2Id)
        : undefined,
    yudisiumPeriodId:
      yudisiumPeriodId !== undefined ? parseInt(yudisiumPeriodId) : undefined,
    yudisiumRegistrationPeriodId:
      yudisiumRegistrationPeriodId !== undefined
        ? parseInt(yudisiumRegistrationPeriodId)
        : (activePeriod ? activePeriod.id : undefined),
    isDraft: true,
  };

  let yudisiumRegistration;

  if (id) {
    yudisiumRegistration = await prisma.yudisiumRegistration.update({
      where: { id: parseInt(id) },
      data: upsertData,
      include: {
        mahasiswa: { select: { id: true, nim: true, name: true } },
        dosenPembimbing1: { select: { id: true, nip: true, name: true } },
        dosenPembimbing2: { select: { id: true, nip: true, name: true } },
      },
    });
  } else if (mahasiswaId) {
    const existing = await prisma.yudisiumRegistration.findFirst({
      where: { mahasiswaId: parseInt(mahasiswaId) },
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
        include: {
          mahasiswa: { select: { id: true, nim: true, name: true } },
          dosenPembimbing1: { select: { id: true, nip: true, name: true } },
          dosenPembimbing2: { select: { id: true, nip: true, name: true } },
        },
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
          mahasiswaId: parseInt(mahasiswaId),
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
        include: {
          mahasiswa: { select: { id: true, nim: true, name: true } },
          dosenPembimbing1: { select: { id: true, nip: true, name: true } },
          dosenPembimbing2: { select: { id: true, nip: true, name: true } },
        },
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
      include: {
        mahasiswa: { select: { id: true, nim: true, name: true } },
        dosenPembimbing1: { select: { id: true, nip: true, name: true } },
        dosenPembimbing2: { select: { id: true, nip: true, name: true } },
      },
    });
  }

  res.status(200).json({
    message: "Yudisium registration saved as draft successfully",
    data: yudisiumRegistration,
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
  } else if (isNaN(parseInt(id))) {
    errors.push({ field: "id", message: "ID harus berupa integer" });
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
  } else if (isNaN(parseInt(mahasiswaId))) {
    errors.push({ field: "mahasiswaId", message: "ID mahasiswa harus berupa integer" });
  }

  if (isNil(dosenPembimbing1Id)) {
    errors.push({ field: "dosenPembimbing1Id", message: "ID dosen pembimbing 1 wajib diisi" });
  } else if (isNaN(parseInt(dosenPembimbing1Id))) {
    errors.push({ field: "dosenPembimbing1Id", message: "ID dosen pembimbing 1 harus berupa integer" });
  }

  if (isNil(dosenPembimbing2Id)) {
    errors.push({ field: "dosenPembimbing2Id", message: "ID dosen pembimbing 2 wajib diisi" });
  } else if (isNaN(parseInt(dosenPembimbing2Id))) {
    errors.push({ field: "dosenPembimbing2Id", message: "ID dosen pembimbing 2 harus berupa integer" });
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

  if (!isNil(yudisiumPeriodId) && isNaN(parseInt(yudisiumPeriodId))) {
    errors.push({ field: "yudisiumPeriodId", message: "ID periode yudisium harus berupa integer" });
  }

  if (!isNil(yudisiumRegistrationPeriodId) && isNaN(parseInt(yudisiumRegistrationPeriodId))) {
    errors.push({ field: "yudisiumRegistrationPeriodId", message: "ID periode pendaftaran yudisium harus berupa integer" });
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  const existingRegistration = await prisma.yudisiumRegistration.findUnique({
    where: { id: parseInt(id) },
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
    tak: tak !== undefined ? tak : undefined,
    thesisTitleId: thesisTitleId !== undefined ? thesisTitleId : undefined,
    thesisTitleEn: thesisTitleEn !== undefined ? thesisTitleEn : undefined,
    isConfirmed: parsedIsConfirmed !== undefined ? parsedIsConfirmed : undefined,
    sidangScheme: sidangScheme !== undefined ? sidangScheme : undefined,
    cumlaudeScheme: cumlaudeScheme !== undefined ? cumlaudeScheme : undefined,
    jalurNonYudisium:
      jalurNonYudisium !== undefined ? jalurNonYudisium : undefined,
    eviden_cumlaude:
      eviden_cumlaude !== undefined ? eviden_cumlaude : undefined,
    mahasiswaId: mahasiswaId !== undefined ? parseInt(mahasiswaId) : undefined,
    dosenPembimbing1Id:
      dosenPembimbing1Id !== undefined
        ? parseInt(dosenPembimbing1Id)
        : undefined,
    dosenPembimbing2Id:
      dosenPembimbing2Id !== undefined
        ? parseInt(dosenPembimbing2Id)
        : undefined,
    yudisiumPeriodId:
      yudisiumPeriodId !== undefined ? parseInt(yudisiumPeriodId) : undefined,
    yudisiumRegistrationPeriodId:
      yudisiumRegistrationPeriodId !== undefined
        ? parseInt(yudisiumRegistrationPeriodId)
        : undefined,
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

  const uploadedSlugs = existingRegistration.yudisiumRegistrationUploads.map(
    (upload) => upload.slug,
  );

  const missingFiles = [];

  for (const slug of REQUIRED_SLUGS) {
    if (!uploadedSlugs.includes(slug)) missingFiles.push(slug);
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

  // Clear isEdit permission on response
  await prisma.yudisiumRegistrationResponse.updateMany({
    where: {
      yudisiumRegistrationId: parseInt(id),
      isEdit: { not: null },
      deletedAt: null,
    },
    data: {
      isEdit: null,
    },
  });

  const updatedYudisiumRegistration = await prisma.yudisiumRegistration.update({
    where: { id: parseInt(id) },
    data: updateData,
    include: {
      mahasiswa: { select: { id: true, nim: true, name: true } },
      dosenPembimbing1: { select: { id: true, nip: true, name: true } },
      dosenPembimbing2: { select: { id: true, nip: true, name: true } },
    },
  });

  res.status(200).json({
    message: "Yudisium registration submitted successfully",
    data: updatedYudisiumRegistration,
  });
});

// Delete Yudisium Registration (soft delete)
const deleteYudisiumRegistration = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const yudisiumRegistrationExists =
    await prisma.yudisiumRegistration.findUnique({
      where: { id: parseInt(id) },
    });

  if (!yudisiumRegistrationExists) {
    res.status(404);
    throw new Error("Pendaftaran yudisium tidak ditemukan");
  }

  const deletedYudisiumRegistration = await prisma.yudisiumRegistration.update({
    where: { id: parseInt(id) },
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
      yudisiumRegistrationId: parseInt(id),
      slug: slug,
    },
  });

  let uploadRecord;

  if (existingUpload) {
    if (existingUpload.path && fs.existsSync(existingUpload.path)) {
      fs.unlinkSync(existingUpload.path);
    }

    uploadRecord = await prisma.yudisiumRegistrationUpload.update({
      where: { id: existingUpload.id },
      data: {
        name,
        filename: file.filename,
        path: file.path,
      },
    });
  } else {
    uploadRecord = await prisma.yudisiumRegistrationUpload.create({
      data: {
        name,
        slug,
        filename: file.filename,
        path: file.path,
        yudisiumRegistrationId: parseInt(id),
      },
    });
  }

  uploadRecord.downloadUrl = `${req.protocol}://${req.get("host")}/api/yudisium-registrations/uploads/${uploadRecord.id}/download`;

  res.status(200).json({
    message: existingUpload
      ? "File updated successfully"
      : "File uploaded successfully",
    data: uploadRecord,
  });
});

// Get All Uploaded Files by Yudisium Registration ID
const getYudisiumRegistrationFiles = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const uploads = await prisma.yudisiumRegistrationUpload.findMany({
    where: { yudisiumRegistrationId: parseInt(id) },
  });

  const data = uploads.map((upload) => ({
    ...upload,
    downloadUrl: `${req.protocol}://${req.get("host")}/api/yudisium-registrations/uploads/${upload.id}/download`,
  }));

  res.json({ data });
});

// Download Yudisium Registration Upload
const downloadYudisiumRegistrationFile = asyncHandler(async (req, res) => {
  const uploadId = parseInt(req.params.uploadId);

  const upload = await prisma.yudisiumRegistrationUpload.findFirst({
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

export { listYudisiumRegistrations,
  getYudisiumRegistrationById,
  getYudisiumRegistrationByMahasiswaId,
  saveYudisiumRegistration,
  submitYudisiumRegistration,
  deleteYudisiumRegistration,
  uploadYudisiumRegistrationFile,
  getYudisiumRegistrationFiles,
  downloadYudisiumRegistrationFile, };
