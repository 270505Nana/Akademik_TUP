const asyncHandler = require("express-async-handler");
const prisma = require("../prisma/client");

// Daftar Semua Periode Sidang
const listSidangPeriods = asyncHandler(async (req, res) => {
  const sidangPeriods = await prisma.sidangPeriod.findMany({
    where: { deletedAt: null },
    orderBy: {
      createdAt: "desc",
    },
  });

  res.json({
    data: sidangPeriods,
  });
});

// Ambil Detail Sidang Period by ID
const getSidangPeriodById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const sidangPeriod = await prisma.sidangPeriod.findFirst({
    where: {
      id: parseInt(id),
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
  const { name, startDate, endDate, isOpen } = req.body;

  const sidangPeriod = await prisma.sidangPeriod.create({
    data: {
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isOpen: isOpen !== undefined ? isOpen : false,
    },
  });

  res.status(201).json({
    message: "Sidang period created successfully",
    data: sidangPeriod,
  });
});

// Update Sidang Period
const updateSidangPeriod = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, startDate, endDate, isOpen } = req.body;

  // Cek apakah sidang period ada
  const sidangPeriodExists = await prisma.sidangPeriod.findFirst({
    where: {
      id: parseInt(id),
      deletedAt: null,
    },
  });

  if (!sidangPeriodExists) {
    res.status(404);
    throw new Error("Periode sidang tidak ditemukan");
  }

  const sidangPeriod = await prisma.sidangPeriod.update({
    where: {
      id: parseInt(id),
    },
    data: {
      ...(name && { name }),
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) }),
      ...(isOpen !== undefined && { isOpen }),
    },
  });

  res.json({
    message: "Sidang period updated successfully",
    data: sidangPeriod,
  });
});

// Hapus Sidang Period
const deleteSidangPeriod = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Cek apakah sidang period ada
  const sidangPeriodExists = await prisma.sidangPeriod.findUnique({
    where: {
      id: parseInt(id),
    },
  });

  if (!sidangPeriodExists) {
    res.status(404);
    throw new Error("Periode sidang tidak ditemukan");
  }

  await prisma.sidangPeriod.update({
    where: { id: parseInt(id) },
    data: { deletedAt: new Date() },
  });

  res.json({
    message: "Sidang period deleted successfully",
  });
});

module.exports = {
  listSidangPeriods,
  getSidangPeriodById,
  createSidangPeriod,
  updateSidangPeriod,
  deleteSidangPeriod,
};
