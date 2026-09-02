import asyncHandler from 'express-async-handler';
import prisma from "../config/prisma.js";
import { sendValidationError, isNil, parseBoolean } from '../utils/validationHelper.js';
import { getPaginationParams, formatPaginationResponse } from '../utils/paginationHelper.js';

// Daftar Semua Program Studi (dengan search, filter, sort, dan pagination)
const listStudyPrograms = asyncHandler(async (req, res) => {
  const paginationParams = getPaginationParams(req.query);
  const { search, q, name, isActive, is_active, facultyId, faculty_id, faculty, sortBy, sort } = req.query;

  const where = { deletedAt: null };

  const searchTerm = (search || q || name || '').trim();
  if (searchTerm) {
    where.name = {
      contains: searchTerm,
      mode: 'insensitive',
    };
  }

  const activeParam = isActive !== undefined ? isActive : is_active;
  if (activeParam !== undefined) {
    const parsedActive = parseBoolean(activeParam);
    if (parsedActive !== undefined) {
      where.isActive = parsedActive;
    }
  }

  const fId = (facultyId || faculty_id || '').trim();
  const fParam = (faculty || '').trim();

  if (fId) {
    where.facultyId = fId;
  } else if (fParam) {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(fParam);
    if (isUUID) {
      where.facultyId = fParam;
    } else {
      where.faculty = {
        name: {
          contains: fParam,
          mode: 'insensitive',
        },
      };
    }
  }

  let orderBy = { name: 'asc' };
  const sortParam = (sortBy || sort || '').toLowerCase().trim();

  if (sortParam === 'nameasc' || sortParam === 'a-z') {
    orderBy = { name: 'asc' };
  } else if (sortParam === 'namedesc' || sortParam === 'z-a') {
    orderBy = { name: 'desc' };
  } else if (sortParam === 'facultyasc' || sortParam === 'faculty_asc') {
    orderBy = { faculty: { name: 'asc' } };
  } else if (sortParam === 'facultydesc' || sortParam === 'faculty_desc') {
    orderBy = { faculty: { name: 'desc' } };
  } else if (sortParam === 'activeinactive' || sortParam === 'active-inactive' || sortParam === 'active') {
    orderBy = [{ isActive: 'desc' }, { name: 'asc' }];
  } else if (sortParam === 'inactiveactive' || sortParam === 'inactive-active' || sortParam === 'inactive') {
    orderBy = [{ isActive: 'asc' }, { name: 'asc' }];
  } else if (sortParam === 'newest') {
    orderBy = { createdAt: 'desc' };
  } else if (sortParam === 'oldest') {
    orderBy = { createdAt: 'asc' };
  }

  const [total, studyPrograms] = await Promise.all([
    prisma.studyProgram.count({ where }),
    prisma.studyProgram.findMany({
      where,
      orderBy,
      skip: paginationParams.skip,
      take: paginationParams.take,
      include: { faculty: true },
    }),
  ]);

  res.json(formatPaginationResponse(studyPrograms, total, paginationParams));
});

// Cari Program Studi By ID
const findStudyProgramById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const studyProgram = await prisma.studyProgram.findFirst({
    where: {
      id,
      deletedAt: null,
    },
    include: { faculty: true },
  });

  if (!studyProgram) {
    res.status(404);
    throw new Error("Program studi tidak ditemukan");
  }

  res.json({ data: studyProgram });
});

// Buat Program Studi Baru (Restore jika sudah ada tapi soft-deleted)
const createStudyProgram = asyncHandler(async (req, res) => {
  const { name, facultyId, isActive } = req.body;

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
  }
  if (errors.length > 0) return sendValidationError(res, errors, req);

  // Check if faculty exists
  const faculty = await prisma.faculty.findFirst({
    where: { id: facultyId, deletedAt: null },
  });

  if (!faculty) {
    res.status(404);
    throw new Error("Fakultas tidak ditemukan");
  }

  const trimmedName = String(name).trim();

  // Cari apakah ada data dengan nama yang sama (termasuk yang soft-deleted)
  const existing = await prisma.studyProgram.findFirst({
    where: {
      name: {
        equals: trimmedName,
        mode: 'insensitive',
      },
    },
    omit: {
      deletedAt: false,
    },
  });

  if (existing) {
    if (existing.deletedAt === null) {
      return sendValidationError(res, [
        { field: 'name', message: 'Nama program studi sudah terdaftar' }
      ], req);
    }

    // Jika sebelumnya soft-deleted, pulihkan data (restore)
    const restored = await prisma.studyProgram.update({
      where: { id: existing.id },
      data: {
        name: trimmedName,
        facultyId,
        deletedAt: null,
        isActive: isActive !== undefined ? (parseBoolean(isActive) ?? true) : true,
      },
      include: { faculty: true },
    });

    return res.status(200).json({
      message: "Program studi berhasil dipulihkan",
      data: restored,
    });
  }

  const studyProgram = await prisma.studyProgram.create({
    data: {
      name: trimmedName,
      facultyId,
      isActive: isActive !== undefined ? (parseBoolean(isActive) ?? true) : true,
    },
    include: { faculty: true },
  });

  res.status(201).json({
    message: "Study program created successfully",
    data: studyProgram,
  });
});

// Update Program Studi
const updateStudyProgram = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, facultyId, isActive } = req.body;

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
    }
  }
  if (errors.length > 0) return sendValidationError(res, errors, req);

  const studyProgram = await prisma.studyProgram.findFirst({
    where: { id, deletedAt: null },
  });

  if (!studyProgram) {
    res.status(404);
    throw new Error("Program studi tidak ditemukan");
  }

  const updateData = {};

  // If facultyId is provided, check if it exists
  if (facultyId !== undefined) {
    const faculty = await prisma.faculty.findFirst({
      where: { id: facultyId, deletedAt: null },
    });

    if (!faculty) {
      res.status(404);
      throw new Error("Fakultas tidak ditemukan");
    }
    updateData.facultyId = facultyId;
  }

  if (name !== undefined) {
    const trimmedName = String(name).trim();
    // Cek duplikasi nama dengan program studi lain yang aktif
    const duplicate = await prisma.studyProgram.findFirst({
      where: {
        name: { equals: trimmedName, mode: 'insensitive' },
        deletedAt: null,
        NOT: { id },
      },
    });

    if (duplicate) {
      return sendValidationError(res, [
        { field: 'name', message: 'Nama program studi sudah terdaftar' }
      ], req);
    }
    updateData.name = trimmedName;
  }

  if (isActive !== undefined) {
    const parsed = parseBoolean(isActive);
    if (parsed !== undefined) {
      updateData.isActive = parsed;
    }
  }

  const updatedStudyProgram = await prisma.studyProgram.update({
    where: { id },
    data: updateData,
    include: { faculty: true },
  });

  res.json({
    message: "Study program updated successfully",
    data: updatedStudyProgram,
  });
});

// Soft Delete Program Studi
const deleteStudyProgram = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const studyProgram = await prisma.studyProgram.findFirst({
    where: { id, deletedAt: null },
  });

  if (!studyProgram) {
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

// Toggle Status Aktif (isActive)
const toggleStudyProgramActive = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const studyProgram = await prisma.studyProgram.findFirst({
    where: { id, deletedAt: null },
  });

  if (!studyProgram) {
    res.status(404);
    throw new Error("Program studi tidak ditemukan");
  }

  const nextStatus = !studyProgram.isActive;

  const updatedStudyProgram = await prisma.studyProgram.update({
    where: { id },
    data: { isActive: nextStatus },
    include: { faculty: true },
  });

  res.json({
    message: `Study program ${nextStatus ? "activated" : "deactivated"} successfully`,
    data: updatedStudyProgram,
  });
});

export {
  listStudyPrograms,
  createStudyProgram,
  findStudyProgramById,
  updateStudyProgram,
  deleteStudyProgram,
  toggleStudyProgramActive,
};
