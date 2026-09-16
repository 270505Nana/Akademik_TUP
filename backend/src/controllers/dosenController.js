import asyncHandler from "express-async-handler";
import * as dosenService from "../services/dosenService.js";
import { mapDosen } from "../mappers/index.js";
import {
  getPaginationParams,
  formatPaginationResponse,
} from "../utils/paginationHelper.js";

// Daftar Semua Dosen (dengan search, filter, sort, dan pagination)
export const listDosens = asyncHandler(async (req, res) => {
  const paginationParams = getPaginationParams(req.query);
  const { search, researchGroupId, researchGroup, sortBy } = req.query;

  const { total, dosens } = await dosenService.getDosens({
    search,
    researchGroupId,
    researchGroup,
    sortBy,
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
