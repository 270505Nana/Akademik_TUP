import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import prisma from '../prisma/client.js';

// Daftar Semua Mahasiswa
const listStudents = asyncHandler(async (req, res) => {
  const students = await prisma.student.findMany();

  res.json({
    data: students,
  });
});

// Update or Insert Mahasiswa
const upsertStudent = asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.userId);

  const user = await prisma.user.findFirst({ where: { id: userId } });
  if (!user) {
    res.status(404);
    throw new Error("Pengguna tidak ditemukan");
  }
  if (user.role !== "MAHASISWA") {
    res.status(400);
    throw new Error("Pengguna bukan mahasiswa");
  }

  const { nim, name, className, sks, ipk, tak } = req.body;

  const year = parseInt(req.body.year);
  const studyProgramId = parseInt(req.body.studyProgramId);
  const dosenWaliId = parseInt(req.body.dosenWaliId);

  const student = await prisma.student.upsert({
    where: { userId },
    update: {
      nim,
      name,
      className,
      year,
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
      year,
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
});

// Find Mahasiswa By User Id
const findStudentByUserId = asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.userId);

  const student = await prisma.student.findUnique({
    where: { userId },
  });

  if (!student) {
    res.status(404);
    throw new Error("Data mahasiswa tidak ditemukan");
  }

  res.json({ data: student });
});

// Find Mahasiswa By Id
const findStudentById = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);

  const student = await prisma.student.findUnique({
    where: { id },
  });

  if (!student) {
    res.status(404);
    throw new Error("Data mahasiswa tidak ditemukan");
  }

  res.json({ data: student });
});

export { listStudents,
  upsertStudent,
  findStudentByUserId,
  findStudentById, };
