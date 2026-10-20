import asyncHandler from "express-async-handler";
import * as facultyService from "../services/facultyService.js";
import { mapFaculty } from "../mappers/facultyMapper.js";
import {
  getPaginationParams,
  formatPaginationResponse,
} from "../utils/paginationHelper.js";

// Daftar Semua Fakultas (dengan search, filter, sort, dan pagination)
const listFaculties = asyncHandler(async (req, res) => {
  const paginationParams = getPaginationParams(req.query);
  const { search, isActive, sortBy, sortOrder } = req.query;

  const { total, faculties } = await facultyService.getFaculties({
    search,
    isActive,
    sortBy,
    sortOrder,
    ...paginationParams,
  });

  res.json(
    formatPaginationResponse(
      faculties.map(mapFaculty),
      total,
      paginationParams,
    ),
  );
});

// Cari Fakultas By ID
const findFacultyById = asyncHandler(async (req, res) => {
  const faculty = await facultyService.getFacultyById(req.params.id);
  res.json({ data: mapFaculty(faculty) });
});

// Buat Fakultas Baru (Restore jika sudah ada tapi soft-deleted)
const createFaculty = asyncHandler(async (req, res) => {
  const { isRestored, faculty } = await facultyService.createFaculty(req.body);

  if (isRestored) {
    return res.status(200).json({
      message: "Fakultas berhasil dipulihkan",
      data: mapFaculty(faculty),
    });
  }

  res.status(201).json({
    message: "Faculty created successfully",
    data: mapFaculty(faculty),
  });
});

// Update Fakultas
const updateFaculty = asyncHandler(async (req, res) => {
  const updatedFaculty = await facultyService.updateFaculty(
    req.params.id,
    req.body,
  );

  res.json({
    message: "Faculty updated successfully",
    data: mapFaculty(updatedFaculty),
  });
});

// Soft Delete Fakultas
const deleteFaculty = asyncHandler(async (req, res) => {
  const deletedFaculty = await facultyService.deleteFaculty(req.params.id);

  res.json({
    message: "Faculty deleted successfully",
    data: mapFaculty(deletedFaculty),
  });
});

// Toggle Status Aktif (isActive)
const toggleFacultyActive = asyncHandler(async (req, res) => {
  const { nextStatus, faculty } = await facultyService.toggleFacultyActive(
    req.params.id,
  );

  res.json({
    message: `Faculty ${nextStatus ? "activated" : "deactivated"} successfully`,
    data: mapFaculty(faculty),
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
