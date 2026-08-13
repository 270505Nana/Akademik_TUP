import asyncHandler from 'express-async-handler';
import prisma from "../config/prisma.js";
import { sendValidationError, isNil, isValidISO8601, parseBoolean } from '../utils/validationHelper.js';

// Yudisium Registration Period List
const listYudisiumRegistrationPeriods = asyncHandler(async (req, res) => {
  const yudisiumRegistrationPeriods =
    await prisma.sidangRegistrationPeriod.findMany({
      where: { deletedAt: null },
      orderBy: {
        createdAt: "desc",
      },
    });

  res.json({
    data: yudisiumRegistrationPeriods,
  });
});

// Ambil Detail Yudisium Register Period by ID
const getYudisiumRegistrationPeriodById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const yudisiumRegistrationPeriod =
    await prisma.sidangRegistrationPeriod.findFirst({
      where: {
        id: parseInt(id),
        deletedAt: null,
      },
    });

  if (!yudisiumRegistrationPeriod) {
    res.status(404);
    throw new Error("Periode pendaftaran yudisium tidak ditemukan");
  }

  res.json({
    data: yudisiumRegistrationPeriod,
  });
});

// Buat Yudisium Register Period Baru
const createYudisiumRegistrationPeriod = asyncHandler(async (req, res) => {
  const { name, startDate, endDate, isOpen } = req.body;

  const errors = [];
  if (isNil(name)) {
    errors.push({ field: "name", message: "Nama wajib diisi" });
  } else if (typeof name !== "string") {
    errors.push({ field: "name", message: "Nama harus berupa string" });
  }

  if (isNil(startDate)) {
    errors.push({ field: "startDate", message: "Tanggal mulai wajib diisi" });
  } else if (!isValidISO8601(startDate)) {
    errors.push({ field: "startDate", message: "Tanggal mulai harus berupa tanggal yang valid (format ISO 8601)" });
  } else if (new Date(startDate) < new Date()) {
    errors.push({ field: "startDate", message: "Tanggal mulai tidak boleh di masa lalu" });
  }

  if (isNil(endDate)) {
    errors.push({ field: "endDate", message: "Tanggal selesai wajib diisi" });
  } else if (!isValidISO8601(endDate)) {
    errors.push({ field: "endDate", message: "Tanggal selesai harus berupa tanggal yang valid (format ISO 8601)" });
  } else if (new Date(endDate) <= new Date(startDate)) {
    errors.push({ field: "endDate", message: "Tanggal selesai harus setelah tanggal mulai" });
  }

  const parsedIsOpen = parseBoolean(isOpen);
  if (!isNil(isOpen) && parsedIsOpen === undefined) {
    errors.push({ field: "isOpen", message: "isOpen harus berupa boolean" });
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  const yudisiumRegistrationPeriod =
    await prisma.sidangRegistrationPeriod.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isOpen: parsedIsOpen !== undefined ? parsedIsOpen : false,
      },
    });

  res.status(201).json({
    message: "Yudisium registration period created successfully",
    data: yudisiumRegistrationPeriod,
  });
});

// Update Yudisium Register Period
const updateYudisiumRegistrationPeriod = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, startDate, endDate, isOpen } = req.body;

  const errors = [];
  if (!isNil(name) && typeof name !== "string") {
    errors.push({ field: "name", message: "Nama harus berupa string" });
  }

  if (!isNil(startDate)) {
    if (!isValidISO8601(startDate)) {
      errors.push({ field: "startDate", message: "Tanggal mulai harus berupa tanggal yang valid (format ISO 8601)" });
    } else if (new Date(startDate) < new Date()) {
      errors.push({ field: "startDate", message: "Tanggal mulai tidak boleh di masa lalu" });
    }
  }

  const parsedIsOpen = parseBoolean(isOpen);
  if (!isNil(isOpen) && parsedIsOpen === undefined) {
    errors.push({ field: "isOpen", message: "isOpen harus berupa boolean" });
  }

  // Cek apakah yudisium registration period ada
  const yudisiumRegistrationPeriodExists =
    await prisma.sidangRegistrationPeriod.findFirst({
      where: {
        id: parseInt(id),
        deletedAt: null,
      },
    });

  if (!yudisiumRegistrationPeriodExists) {
    res.status(404);
    throw new Error("Periode pendaftaran yudisium tidak ditemukan");
  }

  if (!isNil(endDate)) {
    if (!isValidISO8601(endDate)) {
      errors.push({ field: "endDate", message: "Tanggal selesai harus berupa tanggal yang valid (format ISO 8601)" });
    } else {
      const compareStartDate = startDate || yudisiumRegistrationPeriodExists.startDate;
      if (new Date(endDate) <= new Date(compareStartDate)) {
        errors.push({ field: "endDate", message: "Tanggal selesai harus setelah tanggal mulai" });
      }
    }
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  const yudisiumRegistrationPeriod =
    await prisma.sidangRegistrationPeriod.update({
      where: {
        id: parseInt(id),
      },
      data: {
        ...(name && { name }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(parsedIsOpen !== undefined && { isOpen: parsedIsOpen }),
      },
    });

  res.json({
    message: "Yudisium registration period updated successfully",
    data: yudisiumRegistrationPeriod,
  });
});

// Hapus Yudisium Register Period
const deleteYudisiumRegistrationPeriod = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Cek apakah yudisium registration period ada
  const yudisiumRegistrationPeriodExists =
    await prisma.sidangRegistrationPeriod.findUnique({
      where: {
        id: parseInt(id),
      },
    });

  if (!yudisiumRegistrationPeriodExists) {
    res.status(404);
    throw new Error("Periode pendaftaran yudisium tidak ditemukan");
  }

  await prisma.sidangRegistrationPeriod.update({
    where: { id: parseInt(id) },
    data: { deletedAt: new Date() },
  });

  res.json({
    message: "Yudisium registration period deleted successfully",
  });
});

export { listYudisiumRegistrationPeriods,
  getYudisiumRegistrationPeriodById,
  createYudisiumRegistrationPeriod,
  updateYudisiumRegistrationPeriod,
  deleteYudisiumRegistrationPeriod, };
