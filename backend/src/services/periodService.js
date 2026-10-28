import prisma from "../config/prisma.js";
import { parseBoolean } from "../utils/validationHelper.js";
import {
  getPaginationParams,
  formatPaginationResponse,
} from "../utils/paginationHelper.js";
import { mapPeriod, mapPeriodPair } from "../mappers/periodMapper.js";

/**
 * Helper untuk mengelompokkan periode berdasarkan pasangan (name, period)
 * menjadi objek { pendaftaran, pelaksanaan }
 *
 * @param {Array} periods
 * @returns {Array}
 */
export const pairPeriods = (periods = []) => {
  const pairMap = new Map();
  for (const p of periods) {
    const key = `${p.name}___${p.period}`;
    if (!pairMap.has(key)) {
      pairMap.set(key, { pendaftaran: null, pelaksanaan: null });
    }
    const pair = pairMap.get(key);
    const catLower = (p.category || "").toLowerCase();
    if (catLower.includes("pendaftaran")) {
      pair.pendaftaran = p;
    } else {
      pair.pelaksanaan = p;
    }
  }
  return Array.from(pairMap.values());
};

// ==========================================
// SIDANG PERIOD
// ==========================================

/**
 * Mengambil daftar periode sidang (dipasangkan pendaftaran & pelaksanaan) dengan pagination & filter
 */
export const listSidangPeriods = async (query = {}) => {
  const paginationParams = getPaginationParams(query);
  const { search, category, sortBy = "startDate", sortOrder = "desc" } = query;

  const where = { deletedAt: null };

  const categoryTerm = (category || "").trim();
  if (categoryTerm) {
    where.category = { contains: categoryTerm, mode: "insensitive" };
  }

  const searchTerm = (search || "").trim();
  if (searchTerm) {
    where.OR = [
      { name: { contains: searchTerm, mode: "insensitive" } },
      { period: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  const validSortFields = ["startDate", "endDate", "createdAt", "name", "period"];
  const orderField = validSortFields.includes(sortBy) ? sortBy : "startDate";
  const orderDirection = (sortOrder || "desc").toLowerCase() === "asc" ? "asc" : "desc";

  const allPeriods = await prisma.sidangPeriod.findMany({
    where,
    orderBy: {
      [orderField]: orderDirection,
    },
  });

  const pairedData = pairPeriods(allPeriods).map(mapPeriodPair);
  const total = pairedData.length;

  const paginatedData = paginationParams.isPaginated
    ? pairedData.slice(
        paginationParams.skip,
        paginationParams.skip + paginationParams.take,
      )
    : pairedData;

  return formatPaginationResponse(paginatedData, total, paginationParams);
};

/**
 * Mengambil detail periode sidang berdasarkan ID
 */
export const getSidangPeriodById = async (id) => {
  const sidangPeriod = await prisma.sidangPeriod.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!sidangPeriod) {
    const error = new Error("Periode sidang tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  return mapPeriod(sidangPeriod);
};

/**
 * Membuat periode sidang baru
 */
export const createSidangPeriod = async (data) => {
  const { name, category, period, startDate, endDate, isOpen } = data;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (end < start) {
    const error = new Error("Validation error");
    error.statusCode = 400;
    error.errors = [
      { field: "endDate", message: "Tanggal selesai tidak boleh sebelum tanggal mulai" },
    ];
    throw error;
  }

  const parsedIsOpen = parseBoolean(isOpen);

  const newSidangPeriod = await prisma.sidangPeriod.create({
    data: {
      name: name.trim(),
      category: category.trim().toLowerCase(),
      period: period.trim(),
      startDate: start,
      endDate: end,
      isOpen: parsedIsOpen !== undefined ? parsedIsOpen : false,
    },
  });

  return mapPeriod(newSidangPeriod);
};

/**
 * Memperbarui periode sidang
 */
export const updateSidangPeriod = async (id, data) => {
  const existingPeriod = await prisma.sidangPeriod.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!existingPeriod) {
    const error = new Error("Periode sidang tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const { name, category, period, startDate, endDate, isOpen } = data;

  const startToCompare = startDate ? new Date(startDate) : existingPeriod.startDate;
  const endToCompare = endDate ? new Date(endDate) : existingPeriod.endDate;

  if (endDate && endToCompare < startToCompare) {
    const error = new Error("Validation error");
    error.statusCode = 400;
    error.errors = [
      { field: "endDate", message: "Tanggal selesai tidak boleh sebelum tanggal mulai" },
    ];
    throw error;
  }

  if (startDate && !endDate && endToCompare < startToCompare) {
    const error = new Error("Validation error");
    error.statusCode = 400;
    error.errors = [
      { field: "endDate", message: "Tanggal selesai tidak boleh sebelum tanggal mulai" },
    ];
    throw error;
  }

  const updateData = {};
  if (name !== undefined) updateData.name = name.trim();
  if (category !== undefined) updateData.category = category.trim().toLowerCase();
  if (period !== undefined) updateData.period = period.trim();
  if (startDate !== undefined) updateData.startDate = new Date(startDate);
  if (endDate !== undefined) updateData.endDate = new Date(endDate);
  if (isOpen !== undefined) {
    const parsed = parseBoolean(isOpen);
    if (parsed !== undefined) updateData.isOpen = parsed;
  }

  const updatedPeriod = await prisma.sidangPeriod.update({
    where: { id },
    data: updateData,
  });

  return mapPeriod(updatedPeriod);
};

/**
 * Menghapus periode sidang (soft delete)
 */
export const deleteSidangPeriod = async (id) => {
  const existingPeriod = await prisma.sidangPeriod.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!existingPeriod) {
    const error = new Error("Periode sidang tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  await prisma.sidangPeriod.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return true;
};

/**
 * Mengambil periode sidang aktif
 */
export const getActiveSidangPeriod = async () => {
  const period = await prisma.sidangPeriod.findFirst({
    where: { isOpen: true, deletedAt: null },
    orderBy: { updatedAt: "desc" },
  });
  return mapPeriod(period);
};

/**
 * Mengambil list periode sidang dasar (legacy helper)
 */
export const getSidangPeriods = async ({ skip, take } = {}) => {
  const where = { deletedAt: null };
  const [total, periods] = await Promise.all([
    prisma.sidangPeriod.count({ where }),
    prisma.sidangPeriod.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return { total, periods: periods.map(mapPeriod) };
};

// ==========================================
// YUDISIUM PERIOD
// ==========================================

/**
 * Mengambil daftar periode yudisium (dipasangkan pendaftaran & pelaksanaan) dengan pagination & filter
 */
export const listYudisiumPeriods = async (query = {}) => {
  const paginationParams = getPaginationParams(query);
  const { search, category, sortBy = "startDate", sortOrder = "desc" } = query;

  const where = { deletedAt: null };

  const categoryTerm = (category || "").trim();
  if (categoryTerm) {
    where.category = { contains: categoryTerm, mode: "insensitive" };
  }

  const searchTerm = (search || "").trim();
  if (searchTerm) {
    where.OR = [
      { name: { contains: searchTerm, mode: "insensitive" } },
      { period: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  const validSortFields = ["startDate", "endDate", "createdAt", "name", "period"];
  const orderField = validSortFields.includes(sortBy) ? sortBy : "startDate";
  const orderDirection = (sortOrder || "desc").toLowerCase() === "asc" ? "asc" : "desc";

  const allPeriods = await prisma.yudisiumPeriod.findMany({
    where,
    orderBy: {
      [orderField]: orderDirection,
    },
  });

  const pairedData = pairPeriods(allPeriods).map(mapPeriodPair);
  const total = pairedData.length;

  const paginatedData = paginationParams.isPaginated
    ? pairedData.slice(
        paginationParams.skip,
        paginationParams.skip + paginationParams.take,
      )
    : pairedData;

  return formatPaginationResponse(paginatedData, total, paginationParams);
};

/**
 * Mengambil detail periode yudisium berdasarkan ID
 */
export const getYudisiumPeriodById = async (id) => {
  const yudisiumPeriod = await prisma.yudisiumPeriod.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!yudisiumPeriod) {
    const error = new Error("Periode yudisium tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  return mapPeriod(yudisiumPeriod);
};

/**
 * Membuat periode yudisium baru
 */
export const createYudisiumPeriod = async (data) => {
  const { name, category, period, startDate, endDate, isOpen } = data;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (end < start) {
    const error = new Error("Validation error");
    error.statusCode = 400;
    error.errors = [
      { field: "endDate", message: "Tanggal selesai tidak boleh sebelum tanggal mulai" },
    ];
    throw error;
  }

  const parsedIsOpen = parseBoolean(isOpen);

  const newYudisiumPeriod = await prisma.yudisiumPeriod.create({
    data: {
      name: name.trim(),
      category: category.trim().toLowerCase(),
      period: period.trim(),
      startDate: start,
      endDate: end,
      isOpen: parsedIsOpen !== undefined ? parsedIsOpen : false,
    },
  });

  return mapPeriod(newYudisiumPeriod);
};

/**
 * Memperbarui periode yudisium
 */
export const updateYudisiumPeriod = async (id, data) => {
  const existingPeriod = await prisma.yudisiumPeriod.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!existingPeriod) {
    const error = new Error("Periode yudisium tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const { name, category, period, startDate, endDate, isOpen } = data;

  const startToCompare = startDate ? new Date(startDate) : existingPeriod.startDate;
  const endToCompare = endDate ? new Date(endDate) : existingPeriod.endDate;

  if (endDate && endToCompare < startToCompare) {
    const error = new Error("Validation error");
    error.statusCode = 400;
    error.errors = [
      { field: "endDate", message: "Tanggal selesai tidak boleh sebelum tanggal mulai" },
    ];
    throw error;
  }

  if (startDate && !endDate && endToCompare < startToCompare) {
    const error = new Error("Validation error");
    error.statusCode = 400;
    error.errors = [
      { field: "endDate", message: "Tanggal selesai tidak boleh sebelum tanggal mulai" },
    ];
    throw error;
  }

  const updateData = {};
  if (name !== undefined) updateData.name = name.trim();
  if (category !== undefined) updateData.category = category.trim().toLowerCase();
  if (period !== undefined) updateData.period = period.trim();
  if (startDate !== undefined) updateData.startDate = new Date(startDate);
  if (endDate !== undefined) updateData.endDate = new Date(endDate);
  if (isOpen !== undefined) {
    const parsed = parseBoolean(isOpen);
    if (parsed !== undefined) updateData.isOpen = parsed;
  }

  const updatedPeriod = await prisma.yudisiumPeriod.update({
    where: { id },
    data: updateData,
  });

  return mapPeriod(updatedPeriod);
};

/**
 * Menghapus periode yudisium (soft delete)
 */
export const deleteYudisiumPeriod = async (id) => {
  const existingPeriod = await prisma.yudisiumPeriod.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!existingPeriod) {
    const error = new Error("Periode yudisium tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  await prisma.yudisiumPeriod.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return true;
};

/**
 * Mengambil periode yudisium aktif
 */
export const getActiveYudisiumPeriod = async () => {
  const period = await prisma.yudisiumPeriod.findFirst({
    where: { isOpen: true, deletedAt: null },
    orderBy: { updatedAt: "desc" },
  });
  return mapPeriod(period);
};

/**
 * Mengambil list periode yudisium dasar (legacy helper)
 */
export const getYudisiumPeriods = async ({ skip, take } = {}) => {
  const where = { deletedAt: null };
  const [total, periods] = await Promise.all([
    prisma.yudisiumPeriod.count({ where }),
    prisma.yudisiumPeriod.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return { total, periods: periods.map(mapPeriod) };
};
