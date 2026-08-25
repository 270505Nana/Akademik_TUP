import asyncHandler from 'express-async-handler';
import prisma from "../config/prisma.js";
import { sendValidationError, isNil, parseBoolean } from '../utils/validationHelper.js';
import { getPaginationParams, formatPaginationResponse } from '../utils/paginationHelper.js';

// Daftar Semua Fakultas (dengan filter & sort)
const listFaculties = asyncHandler(async (req, res) => {
  const paginationParams = getPaginationParams(req.query);
  const { name, isActive, is_active, sortBy, sort } = req.query;

  const where = { deletedAt: null };

  if (name && typeof name === 'string' && name.trim() !== '') {
    where.name = {
      contains: name.trim(),
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

  let orderBy = { name: 'asc' };
  const sortParam = (sortBy || sort || '').toLowerCase().trim();

  if (sortParam === 'a-z' || sortParam === 'name_asc') {
    orderBy = { name: 'asc' };
  } else if (sortParam === 'z-a' || sortParam === 'name_desc') {
    orderBy = { name: 'desc' };
  } else if (sortParam === 'active-inactive' || sortParam === 'active' || sortParam === 'status') {
    orderBy = [{ isActive: 'desc' }, { name: 'asc' }];
  } else if (sortParam === 'inactive-active' || sortParam === 'inactive') {
    orderBy = [{ isActive: 'asc' }, { name: 'asc' }];
  }

  const [total, faculties] = await Promise.all([
    prisma.faculty.count({ where }),
    prisma.faculty.findMany({
      where,
      orderBy,
      skip: paginationParams.skip,
      take: paginationParams.take,
    }),
  ]);

  res.json(formatPaginationResponse(faculties, total, paginationParams));
});

// Cari Fakultas By ID
const findFacultyById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const faculty = await prisma.faculty.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!faculty) {
    res.status(404);
    throw new Error("Fakultas tidak ditemukan");
  }

  res.json({ data: faculty });
});

// Buat Fakultas Baru (Restore jika sudah ada tapi soft-deleted)
const createFaculty = asyncHandler(async (req, res) => {
  const { name, isActive } = req.body;

  const errors = [];
  if (isNil(name)) {
    errors.push({ field: 'name', message: 'Nama fakultas wajib diisi' });
  } else {
    const trimmed = String(name).trim();
    if (trimmed.length < 3) errors.push({ field: 'name', message: 'Nama fakultas minimal 3 karakter' });
    else if (trimmed.length > 100) errors.push({ field: 'name', message: 'Nama fakultas maksimal 100 karakter' });
  }
  if (errors.length > 0) return sendValidationError(res, errors, req);

  const trimmedName = String(name).trim();

  // Cari apakah ada data dengan nama yang sama (termasuk yang soft-deleted)
  const existing = await prisma.faculty.findFirst({
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
        { field: 'name', message: 'Nama fakultas sudah terdaftar' }
      ], req);
    }

    // Jika sebelumnya soft-deleted, hapus status soft-delete (restore)
    const restored = await prisma.faculty.update({
      where: { id: existing.id },
      data: {
        name: trimmedName,
        deletedAt: null,
        isActive: isActive !== undefined ? (parseBoolean(isActive) ?? true) : true,
      },
    });

    return res.status(200).json({
      message: "Fakultas berhasil dipulihkan",
      data: restored,
    });
  }

  const faculty = await prisma.faculty.create({
    data: {
      name: trimmedName,
      isActive: isActive !== undefined ? (parseBoolean(isActive) ?? true) : true,
    },
  });

  res.status(201).json({
    message: "Faculty created successfully",
    data: faculty,
  });
});

// Update Fakultas
const updateFaculty = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, isActive } = req.body;

  const errors = [];
  if (req.body.name !== undefined) {
    if (isNil(name)) {
      errors.push({ field: 'name', message: 'Nama fakultas tidak boleh kosong' });
    } else {
      const trimmed = String(name).trim();
      if (trimmed.length < 3) errors.push({ field: 'name', message: 'Nama fakultas minimal 3 karakter' });
      else if (trimmed.length > 100) errors.push({ field: 'name', message: 'Nama fakultas maksimal 100 karakter' });
    }
  }
  if (errors.length > 0) return sendValidationError(res, errors, req);

  const faculty = await prisma.faculty.findFirst({
    where: { id, deletedAt: null },
  });

  if (!faculty) {
    res.status(404);
    throw new Error("Fakultas tidak ditemukan");
  }

  const updateData = {};
  if (name !== undefined) {
    const trimmedName = String(name).trim();
    // Cek duplikasi nama dengan fakultas lain yang aktif
    const duplicate = await prisma.faculty.findFirst({
      where: {
        name: { equals: trimmedName, mode: 'insensitive' },
        deletedAt: null,
        NOT: { id },
      },
    });

    if (duplicate) {
      return sendValidationError(res, [
        { field: 'name', message: 'Nama fakultas sudah terdaftar' }
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

  const updatedFaculty = await prisma.faculty.update({
    where: { id },
    data: updateData,
  });

  res.json({
    message: "Faculty updated successfully",
    data: updatedFaculty,
  });
});

// Soft Delete Fakultas
const deleteFaculty = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const faculty = await prisma.faculty.findFirst({
    where: { id, deletedAt: null },
  });

  if (!faculty) {
    res.status(404);
    throw new Error("Fakultas tidak ditemukan");
  }

  const deletedFaculty = await prisma.faculty.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  res.json({
    message: "Faculty deleted successfully",
    data: deletedFaculty,
  });
});

// Toggle Status Aktif (isActive)
const toggleFacultyActive = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const faculty = await prisma.faculty.findFirst({
    where: { id, deletedAt: null },
  });

  if (!faculty) {
    res.status(404);
    throw new Error("Fakultas tidak ditemukan");
  }

  const nextStatus = !faculty.isActive;

  const updatedFaculty = await prisma.faculty.update({
    where: { id },
    data: { isActive: nextStatus },
  });

  res.json({
    message: `Faculty ${nextStatus ? "activated" : "deactivated"} successfully`,
    data: updatedFaculty,
  });
});

export {
  listFaculties,
  createFaculty,
  findFacultyById,
  updateFaculty,
  deleteFaculty,
  toggleFacultyActive,
};
