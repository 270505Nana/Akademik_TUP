const bcrypt = require("bcrypt");

const jwt = require("jsonwebtoken");

const prisma = require("../prisma/client");

// Daftar Semua Academic Staff
const listAcademicStaff = async (req, res) => {
  try {
    const academicStaff = await prisma.academicStaff.findMany();

    res.json({
      data: academicStaff,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Update or Insert Academic Staff
const upsertAcademicStaff = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    const user = await prisma.user.findFirst({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role !== "ACADEMIC_STAFF")
      return res.status(400).json({ message: "User is not an academic staff" });

    const { name } = req.body;

    const academicStaff = await prisma.academicStaff.upsert({
      where: { userId },
      update: { name },
      create: { name, userId },
    });

    res.json({
      message: "Create or update academic staff data successful",
      data: academicStaff,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Find Academic Staff By User Id
const findAcademicStaffByUserId = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    const academicStaff = await prisma.academicStaff.findUnique({
      where: { userId },
    });

    if (!academicStaff) {
      return res.status(404).json({ message: "Academic staff data not found" });
    }

    res.json({ data: academicStaff });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

module.exports = {
  listAcademicStaff,
  upsertAcademicStaff,
  findAcademicStaffByUserId,
};
