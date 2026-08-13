import asyncHandler from 'express-async-handler';
import prisma from "../config/prisma.js";
import { sendValidationError, isNil, isValidISO8601, parseBoolean } from '../utils/validationHelper.js';

// Daftar Semua Periode Yudisium
const listYudisiumPeriods = asyncHandler(async (req, res) => {
  const yudisiumPeriods = await prisma.sidangPeriod.findMany({
    where: { deletedAt: null },
    orderBy: {
      createdAt: "desc",
    },
  });

  res.json({
    data: yudisiumPeriods,
  });
});

// Ambil Detail Yudisium Period by ID
const getYudisiumPeriodById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const yudisiumPeriod = await prisma.sidangPeriod.findFirst({
    where: {
      id: parseInt(id),
      deletedAt: null,
    },
  });

  if (!yudisiumPeriod) {
    res.status(404);
    throw new Error("Periode yudisium tidak ditemukan");
  }

  res.json({
    data: yudisiumPeriod,
  });
});

// Buat Yudisium Period Baru
const createYudisiumPeriod = asyncHandler(async (req, res) => {
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

  const yudisiumPeriod = await prisma.sidangPeriod.create({
    data: {
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isOpen: parsedIsOpen !== undefined ? parsedIsOpen : false,
    },
  });

  res.status(201).json({
    message: "Yudisium period created successfully",
    data: yudisiumPeriod,
  });
});

// Update Yudisium Period
const updateYudisiumPeriod = asyncHandler(async (req, res) => {
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

  // Cek apakah yudisium period ada
  const yudisiumPeriodExists = await prisma.sidangPeriod.findFirst({
    where: {
      id: parseInt(id),
      deletedAt: null,
    },
  });

  if (!yudisiumPeriodExists) {
    res.status(404);
    throw new Error("Periode yudisium tidak ditemukan");
  }

  if (!isNil(endDate)) {
    if (!isValidISO8601(endDate)) {
      errors.push({ field: "endDate", message: "Tanggal selesai harus berupa tanggal yang valid (format ISO 8601)" });
    } else {
      const compareStartDate = startDate || yudisiumPeriodExists.startDate;
      if (new Date(endDate) <= new Date(compareStartDate)) {
        errors.push({ field: "endDate", message: "Tanggal selesai harus setelah tanggal mulai" });
      }
    }
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  const yudisiumPeriod = await prisma.sidangPeriod.update({
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
    message: "Yudisium period updated successfully",
    data: yudisiumPeriod,
  });
});

// Hapus Yudisium Period
const deleteYudisiumPeriod = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Cek apakah yudisium period ada
  const yudisiumPeriodExists = await prisma.sidangPeriod.findUnique({
    where: {
      id: parseInt(id),
    },
  });

  if (!yudisiumPeriodExists) {
    res.status(404);
    throw new Error("Periode yudisium tidak ditemukan");
  }

  await prisma.sidangPeriod.update({
    where: { id: parseInt(id) },
    data: { deletedAt: new Date() },
  });

  res.json({
    message: "Yudisium period deleted successfully",
  });
});

export { listYudisiumPeriods,
  getYudisiumPeriodById,
  createYudisiumPeriod,
  updateYudisiumPeriod,
  deleteYudisiumPeriod, };
