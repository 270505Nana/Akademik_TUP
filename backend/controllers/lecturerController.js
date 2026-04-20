const bcrypt = require("bcrypt");

const jwt = require("jsonwebtoken");

const prisma = require("../prisma/client");

// Get Dosen
const getLecturers = async (req, res) => {
  try {
    const lecturers = await prisma.lecturer.findMany();

    res.json({
      data: lecturers,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Update or Insert Dosen
const upsertLecturer = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    const user = await prisma.user.findFirst({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role !== "LECTURER")
      return res.status(400).json({ message: "User is not an lecturer" });

    const { nip, nidn, lecturerCode, name, researchGroupId } = req.body;

    const lecturer = await prisma.lecturer.upsert({
      where: { userId },
      update: { nip, nidn, lecturerCode, name, researchGroupId },
      create: { nip, nidn, lecturerCode, name, researchGroupId, userId },
    });

    res.json({
      message: "Create or update lecturer data successful",
      data: lecturer,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Get Dosen By User Id
const getLecturerByUserId = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    const lecturer = await prisma.lecturer.findUnique({
      where: { userId },
    });

    if (!lecturer) {
      return res.status(404).json({ message: "Lecturer data not found" });
    }

    res.json({ data: lecturer });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

module.exports = {
  getLecturers,
  upsertLecturer,
  getLecturerByUserId,
};
