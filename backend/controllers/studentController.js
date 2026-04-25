const bcrypt = require("bcrypt");

const jwt = require("jsonwebtoken");

const prisma = require("../prisma/client");

// Daftar Semua Mahasiswa
const listStudents = async (req, res) => {
  try {
    const students = await prisma.student.findMany();

    res.json({
      data: students,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Update or Insert Mahasiswa
const upsertStudent = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    const user = await prisma.user.findFirst({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role !== "STUDENT")
      return res.status(400).json({ message: "User is not an student" });

    const { nim, name, className, sks, ipk, tak, studyProgramId, dosenWaliId } =
      req.body;

    const student = await prisma.student.upsert({
      where: { userId },
      update: {
        nim,
        name,
        className,
        sks,
        ipk,
        tak,
        studyProgramId,
        dosenWaliId,
      },
      create: {
        nim,
        name,
        className,
        sks,
        ipk,
        tak,
        studyProgramId,
        dosenWaliId,
        userId,
      },
    });

    res.json({
      message: "Create or update student data successful",
      data: student,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Find Mahasiswa By User Id
const findStudentByUserId = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    const student = await prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      return res.status(404).json({ message: "Student data not found" });
    }

    res.json({ data: student });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

module.exports = {
  listStudents,
  upsertStudent,
  findStudentByUserId,
};
