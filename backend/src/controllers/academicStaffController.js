import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import prisma from '../prisma/client.js';

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
    throw new Error("Pengguna tidak ditemukan");
  }
  if (user.role !== "ACADEMIC_STAFF") {
    res.status(400);
    throw new Error("Pengguna bukan staf akademik");
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
    throw new Error("Data staf akademik tidak ditemukan");
  }

  res.json({ data: academicStaff });
});

export { listAcademicStaff,
  upsertAcademicStaff,
  findAcademicStaffByUserId, };
