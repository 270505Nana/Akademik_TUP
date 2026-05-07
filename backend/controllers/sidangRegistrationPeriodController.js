const prisma = require("../prisma/client");

// Sidang Registration Period List
const listSidangRegistrationPeriods = async (req, res) => {
  try {
    const sidangRegistrationPeriods =
      await prisma.sidangRegistrationPeriod.findMany({
        orderBy: {
          createdAt: "desc",
        },
      });

    res.json({
      data: sidangRegistrationPeriods,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Ambil Detail Sidang Register Period by ID
const getSidangRegistrationPeriodById = async (req, res) => {
  try {
    const { id } = req.params;

    const sidangRegistrationPeriod =
      await prisma.sidangRegistrationPeriod.findUnique({
        where: {
          id: parseInt(id),
        },
      });

    if (!sidangRegistrationPeriod) {
      return res.status(404).json({
        message: "Sidang period not found",
      });
    }

    res.json({
      data: sidangRegistrationPeriod,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Buat Sidang Register Period Baru
const createSidangRegistrationPeriod = async (req, res) => {
  try {
    const { name, startDate, endDate, isOpen } = req.body;

    const sidangRegistrationPeriod =
      await prisma.sidangRegistrationPeriod.create({
        data: {
          name,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          isOpen: isOpen !== undefined ? isOpen : false,
        },
      });

    res.status(201).json({
      message: "Sidang period created successfully",
      data: sidangRegistrationPeriod,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Update Sidang Register Period
const updateSidangRegistrationPeriod = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, startDate, endDate, isOpen } = req.body;

    // Cek apakah sidang period ada
    const sidangRegistrationPeriodExists =
      await prisma.sidangRegistrationPeriod.findUnique({
        where: {
          id: parseInt(id),
        },
      });

    if (!sidangRegistrationPeriodExists) {
      return res.status(404).json({
        message: "Sidang period not found",
      });
    }

    const sidangRegistrationPeriod =
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
      message: "Sidang period updated successfully",
      data: sidangRegistrationPeriod,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Hapus Sidang Register Period
const deleteSidangRegistrationPeriod = async (req, res) => {
  try {
    const { id } = req.params;

    // Cek apakah sidang registration period ada
    const sidangRegistrationPeriodExists =
      await prisma.sidangRegistrationPeriod.findUnique({
        where: {
          id: parseInt(id),
        },
      });

    if (!sidangRegistrationPeriodExists) {
      return res.status(404).json({
        message: "Sidang registration period not found",
      });
    }

    await prisma.sidangRegistrationPeriod.delete({
      where: {
        id: parseInt(id),
      },
    });

    res.json({
      message: "Sidang registration period deleted successfully",
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

module.exports = {
  listSidangRegistrationPeriods,
  getSidangRegistrationPeriodById,
  createSidangRegistrationPeriod,
  updateSidangRegistrationPeriod,
  deleteSidangRegistrationPeriod,
};
