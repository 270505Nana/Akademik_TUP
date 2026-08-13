import asyncHandler from 'express-async-handler';
import prisma from "../config/prisma.js";
import { sendValidationError, isNil, isValidISO8601, parseBoolean } from '../utils/validationHelper.js';

// Sidang Registration Period List
const listSidangRegistrationPeriods = asyncHandler(async (req, res) => {
  const sidangRegistrationPeriods =
    await prisma.sidangRegistrationPeriod.findMany({
      where: { deletedAt: null },
      orderBy: {
        createdAt: "desc",
      },
    });

  res.json({
    data: sidangRegistrationPeriods,
  });
});

// Ambil Detail Sidang Register Period by ID
const getSidangRegistrationPeriodById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const sidangRegistrationPeriod =
    await prisma.sidangRegistrationPeriod.findFirst({
      where: {
        id: parseInt(id),
        deletedAt: null,
      },
    });

  if (!sidangRegistrationPeriod) {
    res.status(404);
    throw new Error("Periode sidang tidak ditemukan");
  }

  res.json({
    data: sidangRegistrationPeriod,
  });
});

// Buat Sidang Register Period Baru
const createSidangRegistrationPeriod = asyncHandler(async (req, res) => {
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

  const sidangRegistrationPeriod = await prisma.sidangRegistrationPeriod.create(
    {
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isOpen: parsedIsOpen !== undefined ? parsedIsOpen : false,
      },
    },
  );

  res.status(201).json({
    message: "Sidang period created successfully",
    data: sidangRegistrationPeriod,
  });
});

// Update Sidang Register Period
const updateSidangRegistrationPeriod = asyncHandler(async (req, res) => {
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

  // Cek apakah sidang period ada
  const sidangRegistrationPeriodExists =
    await prisma.sidangRegistrationPeriod.findFirst({
      where: {
        id: parseInt(id),
        deletedAt: null,
      },
    });

  if (!sidangRegistrationPeriodExists) {
    res.status(404);
    throw new Error("Periode sidang tidak ditemukan");
  }

  if (!isNil(endDate)) {
    if (!isValidISO8601(endDate)) {
      errors.push({ field: "endDate", message: "Tanggal selesai harus berupa tanggal yang valid (format ISO 8601)" });
    } else {
      const compareStartDate = startDate || sidangRegistrationPeriodExists.startDate;
      if (new Date(endDate) <= new Date(compareStartDate)) {
        errors.push({ field: "endDate", message: "Tanggal selesai harus setelah tanggal mulai" });
      }
    }
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  const sidangRegistrationPeriod = await prisma.sidangRegistrationPeriod.update(
    {
      where: {
        id: parseInt(id),
      },
      data: {
        ...(name && { name }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(parsedIsOpen !== undefined && { isOpen: parsedIsOpen }),
      },
    },
  );

  res.json({
    message: "Sidang period updated successfully",
    data: sidangRegistrationPeriod,
  });
});

// Hapus Sidang Register Period
const deleteSidangRegistrationPeriod = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Cek apakah sidang registration period ada
  const sidangRegistrationPeriodExists =
    await prisma.sidangRegistrationPeriod.findUnique({
      where: {
        id: parseInt(id),
      },
    });

  if (!sidangRegistrationPeriodExists) {
    res.status(404);
    throw new Error("Periode pendaftaran sidang tidak ditemukan");
  }

  await prisma.sidangRegistrationPeriod.update({
    where: { id: parseInt(id) },
    data: { deletedAt: new Date() },
  });

  res.json({
    message: "Sidang registration period deleted successfully",
  });
});

export { listSidangRegistrationPeriods,
  getSidangRegistrationPeriodById,
  createSidangRegistrationPeriod,
  updateSidangRegistrationPeriod,
  deleteSidangRegistrationPeriod, };
