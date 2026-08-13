import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import prisma from '../prisma/client.js';

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
    throw new Error("Pengguna tidak ditemukan");
  }
  if (user.role !== "LECTURER") {
    res.status(400);
    throw new Error("Pengguna bukan dosen");
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
    throw new Error("Data dosen tidak ditemukan");
  }

  res.json({ data: lecturer });
});

export { listLecturers,
  upsertLecturer,
  findLecturerByUserId, };
