const asyncHandler = require("express-async-handler");
const prisma = require("../prisma/client");

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
    throw new Error("Yudisium registration period not found");
  }

  res.json({
    data: yudisiumRegistrationPeriod,
  });
});

// Buat Yudisium Register Period Baru
const createYudisiumRegistrationPeriod = asyncHandler(async (req, res) => {
  const { name, startDate, endDate, isOpen } = req.body;

  const yudisiumRegistrationPeriod =
    await prisma.sidangRegistrationPeriod.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isOpen: isOpen !== undefined ? isOpen : false,
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
    throw new Error("Yudisium registration period not found");
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
        ...(isOpen !== undefined && { isOpen }),
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
    throw new Error("Yudisium registration period not found");
  }

  await prisma.sidangRegistrationPeriod.update({
    where: { id: parseInt(id) },
    data: { deletedAt: new Date() },
  });

  res.json({
    message: "Yudisium registration period deleted successfully",
  });
});

module.exports = {
  listYudisiumRegistrationPeriods,
  getYudisiumRegistrationPeriodById,
  createYudisiumRegistrationPeriod,
  updateYudisiumRegistrationPeriod,
  deleteYudisiumRegistrationPeriod,
};
