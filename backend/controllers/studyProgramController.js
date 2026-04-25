const bcrypt = require("bcrypt");

const jwt = require("jsonwebtoken");

const prisma = require("../prisma/client");

// Daftar Semua Program Studi
const listStudyPrograms = async (req, res) => {
  try {
    const studyPrograms = await prisma.studyProgram.findMany();

    res.json({
      data: studyPrograms,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

module.exports = {
  listStudyPrograms,
};
