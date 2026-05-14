const asyncHandler = require("express-async-handler");
const prisma = require("../prisma/client");

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
    throw new Error("Yudisium period not found");
  }

  res.json({
    data: yudisiumPeriod,
  });
});

// Buat Yudisium Period Baru
const createYudisiumPeriod = asyncHandler(async (req, res) => {
  const { name, startDate, endDate, isOpen } = req.body;

  const yudisiumPeriod = await prisma.sidangPeriod.create({
    data: {
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isOpen: isOpen !== undefined ? isOpen : false,
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

  // Cek apakah yudisium period ada
  const yudisiumPeriodExists = await prisma.sidangPeriod.findFirst({
    where: {
      id: parseInt(id),
      deletedAt: null,
    },
  });

  if (!yudisiumPeriodExists) {
    res.status(404);
    throw new Error("Yudisium period not found");
  }

  const yudisiumPeriod = await prisma.sidangPeriod.update({
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
    throw new Error("Yudisium period not found");
  }

  await prisma.sidangPeriod.update({
    where: { id: parseInt(id) },
    data: { deletedAt: new Date() },
  });

  res.json({
    message: "Yudisium period deleted successfully",
  });
});

module.exports = {
  listYudisiumPeriods,
  getYudisiumPeriodById,
  createYudisiumPeriod,
  updateYudisiumPeriod,
  deleteYudisiumPeriod,
};
