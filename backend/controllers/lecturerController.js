const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const prisma = require("../prisma/client");

// Daftar Semua Dosen
const listLecturers = asyncHandler(async (req, res) => {
  const lecturers = await prisma.lecturer.findMany();

  res.json({
    data: lecturers,
  });
});

// Update or Insert Dosen
const upsertLecturer = asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.userId);

  const user = await prisma.user.findFirst({ where: { id: userId } });
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  if (user.role !== "LECTURER") {
    res.status(400);
    throw new Error("User is not an lecturer");
  }

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
});

// Find Dosen By User Id
const findLecturerByUserId = asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.userId);

  const lecturer = await prisma.lecturer.findUnique({
    where: { userId },
  });

  if (!lecturer) {
    res.status(404);
    throw new Error("Lecturer data not found");
  }

  res.json({ data: lecturer });
});

module.exports = {
  listLecturers,
  upsertLecturer,
  findLecturerByUserId,
};
