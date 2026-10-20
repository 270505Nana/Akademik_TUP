import asyncHandler from "express-async-handler";
import * as studyProgramService from "../services/studyProgramService.js";
import { mapStudyProgram } from "../mappers/studyProgramMapper.js";
import {
  getPaginationParams,
  formatPaginationResponse,
} from "../utils/paginationHelper.js";

// Daftar Semua Program Studi (dengan search, filter, sort, dan pagination)
const listStudyPrograms = asyncHandler(async (req, res) => {
  const paginationParams = getPaginationParams(req.query);
  const { search, isActive, facultyId, sortBy, sortOrder } = req.query;

  const { total, studyPrograms } = await studyProgramService.getStudyPrograms({
    search,
    isActive,
    facultyId,
    sortBy,
    sortOrder,
    ...paginationParams,
  });

  res.json(
    formatPaginationResponse(
      studyPrograms.map(mapStudyProgram),
      total,
      paginationParams,
    ),
  );
});

// Cari Program Studi By ID
const findStudyProgramById = asyncHandler(async (req, res) => {
  const studyProgram = await studyProgramService.getStudyProgramById(
    req.params.id,
  );
  res.json({ data: mapStudyProgram(studyProgram) });
});

// Buat Program Studi Baru (Restore jika sudah ada tapi soft-deleted)
const createStudyProgram = asyncHandler(async (req, res) => {
  const { isRestored, studyProgram } =
    await studyProgramService.createStudyProgram(req.body);

  if (isRestored) {
    return res.status(200).json({
      message: "Program studi berhasil dipulihkan",
      data: mapStudyProgram(studyProgram),
    });
  }

  res.status(201).json({
    message: "Study program created successfully",
    data: mapStudyProgram(studyProgram),
  });
});

// Update Program Studi
const updateStudyProgram = asyncHandler(async (req, res) => {
  const updatedStudyProgram = await studyProgramService.updateStudyProgram(
    req.params.id,
    req.body,
  );

  res.json({
    message: "Study program updated successfully",
    data: mapStudyProgram(updatedStudyProgram),
  });
});

// Soft Delete Program Studi
const deleteStudyProgram = asyncHandler(async (req, res) => {
  const deletedStudyProgram = await studyProgramService.deleteStudyProgram(
    req.params.id,
  );

  res.json({
    message: "Study program deleted successfully",
    data: mapStudyProgram(deletedStudyProgram),
  });
});

// Toggle Status Aktif (isActive)
const toggleStudyProgramActive = asyncHandler(async (req, res) => {
  const { nextStatus, studyProgram } =
    await studyProgramService.toggleStudyProgramActive(req.params.id);

  res.json({
    message: `Study program ${nextStatus ? "activated" : "deactivated"} successfully`,
    data: mapStudyProgram(studyProgram),
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
