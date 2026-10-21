import asyncHandler from "express-async-handler";
import * as periodService from "../services/periodService.js";

/**
 * Daftar Semua Periode Sidang (Dipasangkan Pendaftaran & Pelaksanaan)
 * GET /api/sidang-periods
 */
export const listSidangPeriods = asyncHandler(async (req, res) => {
  const result = await periodService.listSidangPeriods(req.query);
  res.json(result);
});

/**
 * Ambil Detail Sidang Period by ID
 * GET /api/sidang-periods/:id
 */
export const getSidangPeriodById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const sidangPeriod = await periodService.getSidangPeriodById(id);
  res.json({
    data: sidangPeriod,
  });
});

/**
 * Buat Sidang Period Baru
 * POST /api/sidang-periods
 */
export const createSidangPeriod = asyncHandler(async (req, res) => {
  const newSidangPeriod = await periodService.createSidangPeriod(req.body);
  res.status(201).json({
    message: "Sidang period created successfully",
    data: newSidangPeriod,
  });
});

/**
 * Update Sidang Period
 * PUT /api/sidang-periods/:id
 */
export const updateSidangPeriod = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updatedSidangPeriod = await periodService.updateSidangPeriod(id, req.body);
  res.json({
    message: "Sidang period updated successfully",
    data: updatedSidangPeriod,
  });
});

/**
 * Hapus Sidang Period
 * DELETE /api/sidang-periods/:id
 */
export const deleteSidangPeriod = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await periodService.deleteSidangPeriod(id);
  res.json({
    message: "Sidang period deleted successfully",
  });
});
