const bcrypt = require("bcrypt");

const jwt = require("jsonwebtoken");

const prisma = require("../prisma/client");

// Get All Program Studi
const getStudyPrograms = async (req, res) => {
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
  getStudyPrograms,
};
