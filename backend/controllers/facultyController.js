const bcrypt = require("bcrypt");

const jwt = require("jsonwebtoken");

const prisma = require("../prisma/client");

// Get All Fakultas
const getFaculties = async (req, res) => {
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
  getFaculties,
};
