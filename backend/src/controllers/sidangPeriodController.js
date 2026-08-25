import asyncHandler from 'express-async-handler';
import prisma from "../config/prisma.js";
import { sendValidationError, isNil, isValidISO8601, parseBoolean } from '../utils/validationHelper.js';
import { getPaginationParams, formatPaginationResponse } from '../utils/paginationHelper.js';

// Daftar Semua Periode Sidang
const listSidangPeriods = asyncHandler(async (req, res) => {
  const paginationParams = getPaginationParams(req.query);
  const { category } = req.query;

  const whereClause = { deletedAt: null };
  if (category) {
    whereClause.category = category;
  }

  const [total, sidangPeriods] = await Promise.all([
    prisma.sidangPeriod.count({
      where: whereClause,
    }),
    prisma.sidangPeriod.findMany({
      where: whereClause,
      skip: paginationParams.skip,
      take: paginationParams.take,
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  res.json(formatPaginationResponse(sidangPeriods, total, paginationParams));
});

// Ambil Detail Sidang Period by ID
const getSidangPeriodById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const sidangPeriod = await prisma.sidangPeriod.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!sidangPeriod) {
    res.status(404);
    throw new Error("Periode sidang tidak ditemukan");
  }

  res.json({
    data: sidangPeriod,
  });
});

// Buat Sidang Period Baru
const createSidangPeriod = asyncHandler(async (req, res) => {
  const { name, category, period, startDate, endDate, isOpen } = req.body;
  const errors = {};

  if (isNil(name)) {
    errors.name = "Nama wajib diisi";
  } else if (typeof name !== 'string') {
    errors.name = "Nama harus berupa string";
  }

  if (isNil(category)) {
    errors.category = "Category wajib diisi";
  } else if (typeof category !== 'string') {
    errors.category = "Category harus berupa string";
  }

  if (isNil(period)) {
    errors.period = "Period wajib diisi";
  } else if (typeof period !== 'string') {
    errors.period = "Period harus berupa string";
  }
  
  if (isNil(startDate)) {
    errors.startDate = "Tanggal mulai wajib diisi";
  } else if (!isValidISO8601(startDate)) {
    errors.startDate = "Tanggal mulai harus berupa tanggal yang valid (format ISO 8601)";
  }
  
  if (isNil(endDate)) {
    errors.endDate = "Tanggal selesai wajib diisi";
  } else if (!isValidISO8601(endDate)) {
    errors.endDate = "Tanggal selesai harus berupa tanggal yang valid (format ISO 8601)";
  } else if (startDate && new Date(endDate) < new Date(startDate)) {
    errors.endDate = "Tanggal selesai tidak boleh sebelum tanggal mulai";
  }
  
  if (!isNil(isOpen)) {
    const p = parseBoolean(isOpen);
    if (p === null) {
      errors.isOpen = "isOpen harus berupa boolean";
    }
  }
  
  if (Object.keys(errors).length > 0) {
    return sendValidationError(res, errors, req);
  }

  const newSidangPeriod = await prisma.sidangPeriod.create({
    data: {
      name,
      category,
      period,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isOpen: isOpen !== undefined ? parseBoolean(isOpen) : false,
    },
  });

  res.status(201).json({
    message: "Sidang period created successfully",
    data: newSidangPeriod,
  });
});

// Update Sidang Period
const updateSidangPeriod = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, category, period, startDate, endDate, isOpen } = req.body;
  const errors = {};

  if (!isNil(name) && typeof name !== 'string') {
    errors.name = "Nama harus berupa string";
  }

  if (!isNil(category) && typeof category !== 'string') {
    errors.category = "Category harus berupa string";
  }

  if (!isNil(period) && typeof period !== 'string') {
    errors.period = "Period harus berupa string";
  }
  
  if (!isNil(startDate)) {
    if (!isValidISO8601(startDate)) {
      errors.startDate = "Tanggal mulai harus berupa tanggal yang valid (format ISO 8601)";
    }
  }
  
  if (!isNil(endDate)) {
    if (!isValidISO8601(endDate)) {
      errors.endDate = "Tanggal selesai harus berupa tanggal yang valid (format ISO 8601)";
    }
  }
  
  if (!isNil(isOpen)) {
    const p = parseBoolean(isOpen);
    if (p === null) {
      errors.isOpen = "isOpen harus berupa boolean";
    }
  }
  
  if (Object.keys(errors).length > 0) {
    return sendValidationError(res, errors, req);
  }

  // Cek apakah sidang period ada
  const sidangPeriodExists = await prisma.sidangPeriod.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!sidangPeriodExists) {
    res.status(404);
    throw new Error("Periode sidang tidak ditemukan");
  }

  if (!isNil(endDate) && !errors.endDate) {
    const startToCompare = req.body.startDate || sidangPeriodExists.startDate;
    if (new Date(endDate) < new Date(startToCompare)) {
      errors.endDate = "Tanggal selesai tidak boleh sebelum tanggal mulai";
      return sendValidationError(res, errors, req);
    }
  }
  
  const updatedSidangPeriod = await prisma.sidangPeriod.update({
    where: {
      id,
    },
    data: {
      ...(name !== undefined && { name }),
      ...(category !== undefined && { category }),
      ...(period !== undefined && { period }),
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) }),
      ...(isOpen !== undefined && { isOpen: parseBoolean(isOpen) }),
    },
  });

  res.json({
    message: "Sidang period updated successfully",
    data: updatedSidangPeriod,
  });
});

// Hapus Sidang Period
const deleteSidangPeriod = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Cek apakah sidang period ada
  const sidangPeriodExists = await prisma.sidangPeriod.findUnique({
    where: {
      id,
    },
  });

  if (!sidangPeriodExists) {
    res.status(404);
    throw new Error("Periode sidang tidak ditemukan");
  }

  await prisma.sidangPeriod.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  res.json({
    message: "Sidang period deleted successfully",
  });
});

export {
  listSidangPeriods,
  getSidangPeriodById,
  createSidangPeriod,
  updateSidangPeriod,
  deleteSidangPeriod,
};
