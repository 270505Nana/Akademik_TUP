const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const prisma = require("../prisma/client");

// Daftar Semua Academic Staff
const listAcademicStaff = asyncHandler(async (req, res) => {
  const academicStaff = await prisma.academicStaff.findMany();

  res.json({
    data: academicStaff,
  });
});

// Update or Insert Academic Staff
const upsertAcademicStaff = asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.userId);

  const user = await prisma.user.findFirst({ where: { id: userId } });
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  if (user.role !== "ACADEMIC_STAFF") {
    res.status(400);
    throw new Error("User is not an academic staff");
  }

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
});

// Find Academic Staff By User Id
const findAcademicStaffByUserId = asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.userId);

  const academicStaff = await prisma.academicStaff.findUnique({
    where: { userId },
  });

  if (!academicStaff) {
    res.status(404);
    throw new Error("Academic staff data not found");
  }

  res.json({ data: academicStaff });
});

module.exports = {
  listAcademicStaff,
  upsertAcademicStaff,
  findAcademicStaffByUserId,
};
