import asyncHandler from 'express-async-handler';
import prisma from "../config/prisma.js";
import { sendValidationError, isNil, isValidISO8601, parseBoolean } from '../utils/validationHelper.js';
import { getPaginationParams, formatPaginationResponse } from '../utils/paginationHelper.js';

// Daftar Semua Periode Yudisium
const listYudisiumPeriods = asyncHandler(async (req, res) => {
  const paginationParams = getPaginationParams(req.query);
  const { category } = req.query;

  const whereClause = { deletedAt: null };
  if (category) {
    whereClause.category = category;
  }

  const [total, yudisiumPeriods] = await Promise.all([
    prisma.yudisiumPeriod.count({
      where: whereClause,
    }),
    prisma.yudisiumPeriod.findMany({
      where: whereClause,
      skip: paginationParams.skip,
      take: paginationParams.take,
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  res.json(formatPaginationResponse(yudisiumPeriods, total, paginationParams));
});

// Ambil Detail Yudisium Period by ID
const getYudisiumPeriodById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const yudisiumPeriod = await prisma.yudisiumPeriod.findFirst({
    where: {
      id,
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
  const { name, category, period, startDate, endDate, isOpen } = req.body;
  const errors = [];

  if (isNil(name)) {
    errors.push({ field: "name", message: "Nama wajib diisi" });
  } else if (typeof name !== 'string') {
    errors.push({ field: "name", message: "Nama harus berupa string" });
  }

  if (isNil(category)) {
    errors.push({ field: "category", message: "Category wajib diisi" });
  } else if (typeof category !== 'string') {
    errors.push({ field: "category", message: "Category harus berupa string" });
  }

  if (isNil(period)) {
    errors.push({ field: "period", message: "Period wajib diisi" });
  } else if (typeof period !== 'string') {
    errors.push({ field: "period", message: "Period harus berupa string" });
  }
  
  if (isNil(startDate)) {
    errors.push({ field: "startDate", message: "Tanggal mulai wajib diisi" });
  } else if (!isValidISO8601(startDate)) {
    errors.push({ field: "startDate", message: "Tanggal mulai harus berupa tanggal yang valid (format ISO 8601)" });
  }
  
  if (isNil(endDate)) {
    errors.push({ field: "endDate", message: "Tanggal selesai wajib diisi" });
  } else if (!isValidISO8601(endDate)) {
    errors.push({ field: "endDate", message: "Tanggal selesai harus berupa tanggal yang valid (format ISO 8601)" });
  } else if (startDate && new Date(endDate) < new Date(startDate)) {
    errors.push({ field: "endDate", message: "Tanggal selesai tidak boleh sebelum tanggal mulai" });
  }
  
  const parsedIsOpen = parseBoolean(isOpen);
  if (!isNil(isOpen) && parsedIsOpen === undefined) {
    errors.push({ field: "isOpen", message: "isOpen harus berupa boolean" });
  }
  
  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  const newYudisiumPeriod = await prisma.yudisiumPeriod.create({
    data: {
      name,
      category,
      period,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isOpen: parsedIsOpen !== undefined ? parsedIsOpen : false,
    },
  });

  res.status(201).json({
    message: "Yudisium period created successfully",
    data: newYudisiumPeriod,
  });
});

// Update Yudisium Period
const updateYudisiumPeriod = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, category, period, startDate, endDate, isOpen } = req.body;
  const errors = [];

  if (!isNil(name) && typeof name !== 'string') {
    errors.push({ field: "name", message: "Nama harus berupa string" });
  }

  if (!isNil(category) && typeof category !== 'string') {
    errors.push({ field: "category", message: "Category harus berupa string" });
  }

  if (!isNil(period) && typeof period !== 'string') {
    errors.push({ field: "period", message: "Period harus berupa string" });
  }
  
  if (!isNil(startDate)) {
    if (!isValidISO8601(startDate)) {
      errors.push({ field: "startDate", message: "Tanggal mulai harus berupa tanggal yang valid (format ISO 8601)" });
    }
  }
  
  if (!isNil(endDate)) {
    if (!isValidISO8601(endDate)) {
      errors.push({ field: "endDate", message: "Tanggal selesai harus berupa tanggal yang valid (format ISO 8601)" });
    }
  }
  
  const parsedIsOpen = parseBoolean(isOpen);
  if (!isNil(isOpen) && parsedIsOpen === undefined) {
    errors.push({ field: "isOpen", message: "isOpen harus berupa boolean" });
  }
  
  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  // Cek apakah yudisium period ada
  const yudisiumPeriodExists = await prisma.yudisiumPeriod.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!yudisiumPeriodExists) {
    res.status(404);
    throw new Error("Periode yudisium tidak ditemukan");
  }

  if (!isNil(endDate)) {
    const startToCompare = startDate || yudisiumPeriodExists.startDate;
    if (new Date(endDate) < new Date(startToCompare)) {
      errors.push({ field: "endDate", message: "Tanggal selesai tidak boleh sebelum tanggal mulai" });
      return sendValidationError(res, errors);
    }
  }
  
  const updatedYudisiumPeriod = await prisma.yudisiumPeriod.update({
    where: {
      id,
    },
    data: {
      ...(name !== undefined && { name }),
      ...(category !== undefined && { category }),
      ...(period !== undefined && { period }),
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) }),
      ...(parsedIsOpen !== undefined && { isOpen: parsedIsOpen }),
    },
  });

  res.json({
    message: "Yudisium period updated successfully",
    data: updatedYudisiumPeriod,
  });
});

// Hapus Yudisium Period
const deleteYudisiumPeriod = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Cek apakah yudisium period ada
  const yudisiumPeriodExists = await prisma.yudisiumPeriod.findUnique({
    where: {
      id,
    },
  });

  if (!yudisiumPeriodExists) {
    res.status(404);
    throw new Error("Periode yudisium tidak ditemukan");
  }

  await prisma.yudisiumPeriod.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  res.json({
    message: "Yudisium period deleted successfully",
  });
});

export {
  listYudisiumPeriods,
  getYudisiumPeriodById,
  createYudisiumPeriod,
  updateYudisiumPeriod,
  deleteYudisiumPeriod,
};
