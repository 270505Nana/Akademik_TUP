const bcrypt = require("bcrypt");

const jwt = require("jsonwebtoken");

const prisma = require("../prisma/client");

// Daftar Semua Kelompok Keahlian
const listResearchGroups = async (req, res) => {
  try {
    const researchGroups = await prisma.researchGroup.findMany();

    res.json({
      data: researchGroups,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

module.exports = {
  listResearchGroups,
};
