import asyncHandler from 'express-async-handler';
import prisma from "../config/prisma.js";
import { sendValidationError, isNil, parseBoolean } from '../utils/validationHelper.js';
import { getPaginationParams, formatPaginationResponse } from '../utils/paginationHelper.js';

// Daftar Semua Kelompok Keahlian (dengan filter & sort)
const listResearchGroups = asyncHandler(async (req, res) => {
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

  const [total, researchGroups] = await Promise.all([
    prisma.researchGroup.count({ where }),
    prisma.researchGroup.findMany({
      where,
      orderBy,
      skip: paginationParams.skip,
      take: paginationParams.take,
    }),
  ]);

  res.json(formatPaginationResponse(researchGroups, total, paginationParams));
});

// Ambil Detail Kelompok Keahlian By ID
const findResearchGroupById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const researchGroup = await prisma.researchGroup.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!researchGroup) {
    res.status(404);
    throw new Error("Kelompok keahlian tidak ditemukan");
  }

  res.json({
    data: researchGroup,
  });
});

// Buat Kelompok Keahlian Baru (Restore jika sudah ada tapi soft-deleted)
const createResearchGroup = asyncHandler(async (req, res) => {
  const { name, isActive } = req.body;

  const errors = [];
  if (isNil(name)) {
    errors.push({ field: 'name', message: 'Nama kelompok keahlian wajib diisi' });
  } else {
    const trimmed = String(name).trim();
    if (trimmed.length < 3) {
      errors.push({ field: 'name', message: 'Nama kelompok keahlian minimal 3 karakter' });
    } else if (trimmed.length > 100) {
      errors.push({ field: 'name', message: 'Nama kelompok keahlian maksimal 100 karakter' });
    }
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors, req);
  }

  const trimmedName = String(name).trim();

  // Cari apakah ada data dengan nama yang sama (termasuk yang soft-deleted)
  const existing = await prisma.researchGroup.findFirst({
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
        { field: 'name', message: 'Nama kelompok keahlian sudah terdaftar' }
      ], req);
    }

    // Jika sebelumnya soft-deleted, hapus status soft-delete (restore)
    const restored = await prisma.researchGroup.update({
      where: { id: existing.id },
      data: {
        name: trimmedName,
        deletedAt: null,
        isActive: isActive !== undefined ? (parseBoolean(isActive) ?? true) : true,
      },
    });

    return res.status(200).json({
      message: "Kelompok keahlian berhasil dipulihkan",
      data: restored,
    });
  }

  const researchGroup = await prisma.researchGroup.create({
    data: {
      name: trimmedName,
      isActive: isActive !== undefined ? (parseBoolean(isActive) ?? true) : true,
    },
  });

  res.status(201).json({
    message: "Research group created successfully",
    data: researchGroup,
  });
});

// Update Kelompok Keahlian
const updateResearchGroup = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, isActive } = req.body;

  const errors = [];
  if (req.body.name !== undefined) {
    if (isNil(name)) {
      errors.push({ field: 'name', message: 'Nama kelompok keahlian tidak boleh kosong' });
    } else {
      const trimmed = String(name).trim();
      if (trimmed.length < 3) {
        errors.push({ field: 'name', message: 'Nama kelompok keahlian minimal 3 karakter' });
      } else if (trimmed.length > 100) {
        errors.push({ field: 'name', message: 'Nama kelompok keahlian maksimal 100 karakter' });
      }
    }
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors, req);
  }

  const researchGroup = await prisma.researchGroup.findFirst({
    where: { id, deletedAt: null },
  });

  if (!researchGroup) {
    res.status(404);
    throw new Error("Kelompok keahlian tidak ditemukan");
  }

  const updateData = {};
  if (name !== undefined) {
    const trimmedName = String(name).trim();
    // Cek duplikasi nama dengan data lain yang aktif
    const duplicate = await prisma.researchGroup.findFirst({
      where: {
        name: { equals: trimmedName, mode: 'insensitive' },
        deletedAt: null,
        NOT: { id },
      },
    });

    if (duplicate) {
      return sendValidationError(res, [
        { field: 'name', message: 'Nama kelompok keahlian sudah terdaftar' }
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

  const updatedResearchGroup = await prisma.researchGroup.update({
    where: { id },
    data: updateData,
  });

  res.json({
    message: "Research group updated successfully",
    data: updatedResearchGroup,
  });
});

// Soft Delete Kelompok Keahlian
const deleteResearchGroup = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const researchGroup = await prisma.researchGroup.findFirst({
    where: { id, deletedAt: null },
  });

  if (!researchGroup) {
    res.status(404);
    throw new Error("Kelompok keahlian tidak ditemukan");
  }

  const deletedResearchGroup = await prisma.researchGroup.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  res.json({
    message: "Research group deleted successfully",
    data: deletedResearchGroup,
  });
});

// Toggle Status Aktif (isActive)
const toggleResearchGroupActive = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const researchGroup = await prisma.researchGroup.findFirst({
    where: { id, deletedAt: null },
  });

  if (!researchGroup) {
    res.status(404);
    throw new Error("Kelompok keahlian tidak ditemukan");
  }

  const nextStatus = !researchGroup.isActive;

  const updatedResearchGroup = await prisma.researchGroup.update({
    where: { id },
    data: { isActive: nextStatus },
  });

  res.json({
    message: `Research group ${nextStatus ? "activated" : "deactivated"} successfully`,
    data: updatedResearchGroup,
  });
});

export {
  listResearchGroups,
  findResearchGroupById,
  createResearchGroup,
  updateResearchGroup,
  deleteResearchGroup,
  toggleResearchGroupActive,
};
