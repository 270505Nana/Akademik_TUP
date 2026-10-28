import asyncHandler from "express-async-handler";
import * as dosenService from "../services/dosenService.js";
import { mapDosen } from "../mappers/userMapper.js";
import {
  getPaginationParams,
  formatPaginationResponse,
} from "../utils/paginationHelper.js";

// Daftar Semua Dosen (dengan search, filter, sort, dan pagination)
export const listDosens = asyncHandler(async (req, res) => {
  const paginationParams = getPaginationParams(req.query);
  const { search, researchGroupId, studyProgramId, sortBy, sortOrder } = req.query;

  const { total, dosens } = await dosenService.getDosens({
    search,
    researchGroupId,
    studyProgramId,
    sortBy,
    sortOrder,
    ...paginationParams,
  });

  res.json(
    formatPaginationResponse(dosens.map(mapDosen), total, paginationParams),
  );
});

// Update or Insert Dosen
export const upsertDosen = asyncHandler(async (req, res) => {
  const dosen = await dosenService.upsertDosen(req.params.id, req.body);
  res.json({
    message: "Data dosen berhasil disimpan",
    data: mapDosen(dosen),
  });
});

// Find Dosen By Id (with fallback to userId)
export const findDosenById = asyncHandler(async (req, res) => {
  const dosen = await dosenService.getDosenByIdOrUserId(req.params.id);
  res.json({ data: mapDosen(dosen) });
});

// Toggle Ketua KK status
export const toggleKetuaKK = asyncHandler(async (req, res) => {
  const dosen = await dosenService.toggleKetuaKK(req.params.id);
  res.json({
    message: `Status ketua KK dosen berhasil ${dosen.isKetuaKK ? "diaktifkan" : "dinonaktifkan"}`,
    data: mapDosen(dosen),
  });
});

// Upload Tanda Tangan Dosen (dosen yang sedang login)
export const uploadSignature = asyncHandler(async (req, res) => {
  const dosen = await dosenService.uploadSignature(req.user.id, req.file);
  res.json({
    message: "Tanda tangan berhasil diunggah",
    data: mapDosen(dosen),
  });
});

// Hapus Tanda Tangan Dosen (dosen yang sedang login)
export const deleteSignature = asyncHandler(async (req, res) => {
  const dosen = await dosenService.deleteSignature(req.user.id);
  res.json({
    message: "Tanda tangan berhasil dihapus",
    data: mapDosen(dosen),
  });
});

// Dashboard Dosen
export const getDosenDashboard = asyncHandler(async (req, res) => {
  const data = await dosenService.getDosenDashboardData(req.user.id);
  res.json({
    message: "Dosen dashboard data retrieved successfully",
    data,
  });
});


// Opsi Dosen untuk Dropdown
export const getDosenOptions = asyncHandler(async (req, res) => {
  const { search, studyProgramId, researchGroupId } = req.query;
  const data = await dosenService.getDosenOptions({
    search,
    studyProgramId,
    researchGroupId,
  });

  res.json({
    message: "Daftar opsi dosen berhasil diambil",
    data,
  });
});
