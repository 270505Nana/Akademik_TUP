import asyncHandler from "express-async-handler";
import * as periodService from "../services/periodService.js";

/**
 * Daftar Semua Periode Yudisium (Dipasangkan Pendaftaran & Pelaksanaan)
 * GET /api/yudisium-periods
 */
export const listYudisiumPeriods = asyncHandler(async (req, res) => {
  const result = await periodService.listYudisiumPeriods(req.query);
  res.json(result);
});

/**
 * Ambil Detail Yudisium Period by ID
 * GET /api/yudisium-periods/:id
 */
export const getYudisiumPeriodById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const yudisiumPeriod = await periodService.getYudisiumPeriodById(id);
  res.json({
    data: yudisiumPeriod,
  });
});

/**
 * Buat Yudisium Period Baru
 * POST /api/yudisium-periods
 */
export const createYudisiumPeriod = asyncHandler(async (req, res) => {
  const newYudisiumPeriod = await periodService.createYudisiumPeriod(req.body);
  res.status(201).json({
    message: "Yudisium period created successfully",
    data: newYudisiumPeriod,
  });
});

/**
 * Update Yudisium Period
 * PUT /api/yudisium-periods/:id
 */
export const updateYudisiumPeriod = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updatedYudisiumPeriod = await periodService.updateYudisiumPeriod(id, req.body);
  res.json({
    message: "Yudisium period updated successfully",
    data: updatedYudisiumPeriod,
  });
});

/**
 * Hapus Yudisium Period
 * DELETE /api/yudisium-periods/:id
 */
export const deleteYudisiumPeriod = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await periodService.deleteYudisiumPeriod(id);
  res.json({
    message: "Yudisium period deleted successfully",
  });
});
