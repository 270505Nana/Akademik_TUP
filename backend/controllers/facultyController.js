const bcrypt = require("bcrypt");

const jwt = require("jsonwebtoken");

const prisma = require("../prisma/client");

// Daftar Semua Fakultas
const listFaculties = async (req, res) => {
  try {
    const faculties = await prisma.faculty.findMany();

    res.json({
      data: faculties,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

module.exports = {
  listFaculties,
};
