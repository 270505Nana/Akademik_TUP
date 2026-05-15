const asyncHandler = require("express-async-handler");
const prisma = require("../prisma/client");

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

  const sidangRegistrationPeriod = await prisma.sidangRegistrationPeriod.create(
    {
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isOpen: isOpen !== undefined ? isOpen : false,
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

  const sidangRegistrationPeriod = await prisma.sidangRegistrationPeriod.update(
    {
      where: {
        id: parseInt(id),
      },
      data: {
        ...(name && { name }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(isOpen !== undefined && { isOpen }),
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

module.exports = {
  listSidangRegistrationPeriods,
  getSidangRegistrationPeriodById,
  createSidangRegistrationPeriod,
  updateSidangRegistrationPeriod,
  deleteSidangRegistrationPeriod,
};
