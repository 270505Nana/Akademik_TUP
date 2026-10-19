import asyncHandler from "express-async-handler";
import * as researchGroupService from "../services/researchGroupService.js";
import { mapResearchGroup } from "../mappers/index.js";
import {
  getPaginationParams,
  formatPaginationResponse,
} from "../utils/paginationHelper.js";

// Daftar Semua Kelompok Keahlian (dengan search, filter, sort, dan pagination)
const listResearchGroups = asyncHandler(async (req, res) => {
  const paginationParams = getPaginationParams(req.query);
  const { search, isActive, studyProgramId, sortBy, sortOrder } = req.query;

  const { total, researchGroups } = await researchGroupService.getResearchGroups({
    search,
    isActive,
    studyProgramId,
    sortBy,
    sortOrder,
    ...paginationParams,
  });

  res.json(
    formatPaginationResponse(
      researchGroups.map(mapResearchGroup),
      total,
      paginationParams,
    ),
  );
});

// Ambil Detail Kelompok Keahlian By ID
const findResearchGroupById = asyncHandler(async (req, res) => {
  const researchGroup = await researchGroupService.getResearchGroupById(
    req.params.id,
  );

  res.json({
    data: mapResearchGroup(researchGroup),
  });
});

// Buat Kelompok Keahlian Baru (Restore jika sudah ada tapi soft-deleted)
const createResearchGroup = asyncHandler(async (req, res) => {
  const { isRestored, researchGroup } =
    await researchGroupService.createResearchGroup(req.body);

  if (isRestored) {
    return res.status(200).json({
      message: "Kelompok keahlian berhasil dipulihkan",
      data: mapResearchGroup(researchGroup),
    });
  }

  return res.status(201).json({
    message: "Research group created successfully",
    data: mapResearchGroup(researchGroup),
  });
});

// Update Kelompok Keahlian
const updateResearchGroup = asyncHandler(async (req, res) => {
  const researchGroup = await researchGroupService.updateResearchGroup(
    req.params.id,
    req.body,
  );

  res.json({
    message: "Research group updated successfully",
    data: mapResearchGroup(researchGroup),
  });
});

// Soft Delete Kelompok Keahlian
const deleteResearchGroup = asyncHandler(async (req, res) => {
  const deletedResearchGroup = await researchGroupService.deleteResearchGroup(
    req.params.id,
  );

  res.json({
    message: "Research group deleted successfully",
    data: mapResearchGroup(deletedResearchGroup),
  });
});

// Toggle Status Aktif (isActive)
const toggleResearchGroupActive = asyncHandler(async (req, res) => {
  const { nextStatus, researchGroup } =
    await researchGroupService.toggleResearchGroupActive(req.params.id);

  res.json({
    message: `Research group ${nextStatus ? "activated" : "deactivated"} successfully`,
    data: mapResearchGroup(researchGroup),
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
