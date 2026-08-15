import asyncHandler from 'express-async-handler';
import prisma from "../config/prisma.js";
import { sendValidationError, isNil } from '../utils/validationHelper.js';

// Daftar Semua Program Studi
const listStudyPrograms = asyncHandler(async (req, res) => {
  const studyPrograms = await prisma.studyProgram.findMany({
    where: { deletedAt: null },
    include: { faculty: true },
  });

  res.json({
    data: studyPrograms,
  });
});

// Buat Program Studi Baru
const createStudyProgram = asyncHandler(async (req, res) => {
  const { name, facultyId } = req.body;

  const errors = [];
  if (isNil(name)) {
    errors.push({ field: 'name', message: 'Nama program studi wajib diisi' });
  } else {
    const trimmed = String(name).trim();
    if (trimmed.length < 3) errors.push({ field: 'name', message: 'Nama program studi minimal 3 karakter' });
    else if (trimmed.length > 100) errors.push({ field: 'name', message: 'Nama program studi maksimal 100 karakter' });
  }
  if (isNil(facultyId)) {
    errors.push({ field: 'facultyId', message: 'ID fakultas wajib diisi' });
  } else if (isNaN(parseInt(facultyId))) {
    errors.push({ field: 'facultyId', message: 'ID fakultas harus berupa integer' });
  }
  if (errors.length > 0) return sendValidationError(res, errors, req);

  // Check if faculty exists
  const faculty = await prisma.faculty.findUnique({
    where: { id: facultyId },
  });

  if (!faculty || faculty.deletedAt != null) {
    res.status(404);
    throw new Error("Fakultas tidak ditemukan");
  }

  const studyProgram = await prisma.studyProgram.create({
    data: {
      name,
      facultyId,
      isPublish: true,
    },
    include: { faculty: true },
  });

  res.status(201).json({
    message: "Study program created successfully",
    data: studyProgram,
  });
});

// Cari Program Studi By ID
const findStudyProgramById = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);

  const studyProgram = await prisma.studyProgram.findUnique({
    where: { id },
    include: { faculty: true },
  });

  if (!studyProgram || studyProgram.deletedAt != null) {
    res.status(404);
    throw new Error("Program studi tidak ditemukan");
  }

  res.json({ data: studyProgram });
});

// Update Program Studi
const updateStudyProgram = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, facultyId } = req.body;

  const errors = [];
  if (req.body.name !== undefined) {
    if (isNil(name)) {
      errors.push({ field: 'name', message: 'Nama program studi tidak boleh kosong' });
    } else {
      const trimmed = String(name).trim();
      if (trimmed.length < 3) errors.push({ field: 'name', message: 'Nama program studi minimal 3 karakter' });
      else if (trimmed.length > 100) errors.push({ field: 'name', message: 'Nama program studi maksimal 100 karakter' });
    }
  }
  if (req.body.facultyId !== undefined) {
    if (isNil(facultyId)) {
      errors.push({ field: 'facultyId', message: 'ID fakultas tidak boleh kosong' });
    } else if (isNaN(parseInt(facultyId))) {
      errors.push({ field: 'facultyId', message: 'ID fakultas harus berupa integer' });
    }
  }
  if (errors.length > 0) return sendValidationError(res, errors, req);

  const studyProgram = await prisma.studyProgram.findUnique({
    where: { id },
  });

  if (!studyProgram || studyProgram.deletedAt != null) {
    res.status(404);
    throw new Error("Program studi tidak ditemukan");
  }

  // If facultyId is provided, check if it exists
  if (facultyId) {
    const faculty = await prisma.faculty.findUnique({
      where: { id: facultyId },
    });

    if (!faculty || faculty.deletedAt != null) {
      res.status(404);
      throw new Error("Fakultas tidak ditemukan");
    }
  }

  const updatedStudyProgram = await prisma.studyProgram.update({
    where: { id },
    data: {
      name: name || studyProgram.name,
      facultyId: facultyId || studyProgram.facultyId,
    },
    include: { faculty: true },
  });

  res.json({
    message: "Study program updated successfully",
    data: updatedStudyProgram,
  });
});

// Soft Delete Program Studi
const deleteStudyProgram = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);

  const studyProgram = await prisma.studyProgram.findUnique({
    where: { id },
  });

  if (!studyProgram || studyProgram.deletedAt != null) {
    res.status(404);
    throw new Error("Program studi tidak ditemukan");
  }

  const deletedStudyProgram = await prisma.studyProgram.update({
    where: { id },
    data: { deletedAt: new Date() },
    include: { faculty: true },
  });

  res.json({
    message: "Study program deleted successfully",
    data: deletedStudyProgram,
  });
});

// Toggle Publish Status (Hide/Show)
const toggleStudyProgramPublish = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);

  const studyProgram = await prisma.studyProgram.findUnique({
    where: { id },
  });

  if (!studyProgram || studyProgram.deletedAt != null) {
    res.status(404);
    throw new Error("Program studi tidak ditemukan");
  }

  const updatedStudyProgram = await prisma.studyProgram.update({
    where: { id },
    data: { isPublish: !studyProgram.isPublish },
    include: { faculty: true },
  });

  res.json({
    message: `Study program ${
      updatedStudyProgram.isPublish ? "published" : "hidden"
    } successfully`,
    data: updatedStudyProgram,
  });
});

export { listStudyPrograms,
  createStudyProgram,
  findStudyProgramById,
  updateStudyProgram,
  deleteStudyProgram,
  toggleStudyProgramPublish, };
