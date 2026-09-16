import asyncHandler from "express-async-handler";
import * as masterDataService from "../services/masterDataService.js";

export const createRuangan = asyncHandler(async (req, res) => {
  const { name, gedung, isActive } = req.body;
  if (!name || !gedung) {
    res.status(400);
    throw new Error("Nama ruangan dan gedung wajib diisi");
  }

  const ruangan = await masterDataService.createRuangan({ name, gedung, isActive });
  res.status(201).json({
    message: "Data ruangan berhasil ditambahkan",
    data: ruangan,
  });
});

export const getRuangans = asyncHandler(async (req, res) => {
  const ruangans = await masterDataService.getRuangans();
  res.json({
    message: "Data ruangan berhasil diambil",
    data: ruangans,
  });
});

export const getRuanganById = asyncHandler(async (req, res) => {
  const ruangan = await masterDataService.getRuanganById(req.params.id);
  if (!ruangan) {
    res.status(404);
    throw new Error("Data ruangan tidak ditemukan");
  }

  res.json({
    message: "Data ruangan ditemukan",
    data: ruangan,
  });
});

export const updateRuangan = asyncHandler(async (req, res) => {
  const ruanganExists = await masterDataService.getRuanganById(req.params.id);
  if (!ruanganExists) {
    res.status(404);
    throw new Error("Data ruangan tidak ditemukan");
  }

  const ruangan = await masterDataService.updateRuangan(req.params.id, req.body);
  res.json({
    message: "Data ruangan berhasil diperbarui",
    data: ruangan,
  });
});

export const deleteRuangan = asyncHandler(async (req, res) => {
  const ruanganExists = await masterDataService.getRuanganById(req.params.id);
  if (!ruanganExists) {
    res.status(404);
    throw new Error("Data ruangan tidak ditemukan");
  }

  await masterDataService.deleteRuangan(req.params.id);
  res.json({
    message: "Data ruangan berhasil dihapus",
  });
});
