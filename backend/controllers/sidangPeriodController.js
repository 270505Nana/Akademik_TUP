const prisma = require("../prisma/client");

// Daftar Semua Periode Sidang
const listSidangPeriods = async (req, res) => {
  try {
    const sidangPeriods = await prisma.sidangPeriod.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      data: sidangPeriods,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Ambil Detail Sidang Period by ID
const getSidangPeriodById = async (req, res) => {
  try {
    const { id } = req.params;

    const sidangPeriod = await prisma.sidangPeriod.findUnique({
      where: {
        id: parseInt(id),
      },
    });

    if (!sidangPeriod) {
      return res.status(404).json({
        message: "Sidang period not found",
      });
    }

    res.json({
      data: sidangPeriod,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Buat Sidang Period Baru
const createSidangPeriod = async (req, res) => {
  try {
    const { name, startDate, endDate, isOpen } = req.body;

    const newSidangPeriod = await prisma.sidangPeriod.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isOpen: isOpen !== undefined ? isOpen : false,
      },
    });

    res.status(201).json({
      message: "Sidang period created successfully",
      data: newSidangPeriod,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Update Sidang Period
const updateSidangPeriod = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, startDate, endDate, isOpen } = req.body;

    // Cek apakah sidang period ada
    const sidangPeriodExists = await prisma.sidangPeriod.findUnique({
      where: {
        id: parseInt(id),
      },
    });

    if (!sidangPeriodExists) {
      return res.status(404).json({
        message: "Sidang period not found",
      });
    }

    const updatedSidangPeriod = await prisma.sidangPeriod.update({
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
      data: updatedSidangPeriod,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Hapus Sidang Period
const deleteSidangPeriod = async (req, res) => {
  try {
    const { id } = req.params;

    // Cek apakah sidang period ada
    const sidangPeriodExists = await prisma.sidangPeriod.findUnique({
      where: {
        id: parseInt(id),
      },
    });

    if (!sidangPeriodExists) {
      return res.status(404).json({
        message: "Sidang period not found",
      });
    }

    await prisma.sidangPeriod.delete({
      where: {
        id: parseInt(id),
      },
    });

    res.json({
      message: "Sidang period deleted successfully",
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

module.exports = {
  listSidangPeriods,
  getSidangPeriodById,
  createSidangPeriod,
  updateSidangPeriod,
  deleteSidangPeriod,
};
