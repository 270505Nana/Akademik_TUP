const bcrypt = require("bcrypt");

const jwt = require("jwt");

const prisma = require("../prisma/client");

// Daftar Semua Periode Sidang
const listSidangPeriods = async (req, res) => {
  try {
    const sidangPeriods = await prisma.sidangPeriod.findMany();

    res.json({
      data: sidangPeriods,
    });
  } catch (e) {
    res
      .status(500)
      .json({ message: "Internal server error", error: e.message });
  }
};

module.exports = {
  listSidangPeriods,
};
