import asyncHandler from "express-async-handler";
import * as ruanganService from "../services/ruanganService.js";
import { mapRuangan } from "../mappers/ruanganMapper.js";

export const createRuangan = asyncHandler(async (req, res) => {
  const ruangan = await ruanganService.createRuangan(req.body);
  res.status(201).json({
    message: "Data ruangan berhasil ditambahkan",
    data: mapRuangan(ruangan),
  });
});

export const getRuangans = asyncHandler(async (req, res) => {
  const { search, gedung, isActive, sortBy, sortOrder } = req.query;
  const ruangans = await ruanganService.getRuangans({
    search,
    gedung,
    isActive,
    sortBy,
    sortOrder,
  });

  res.json({
    message: "Data ruangan berhasil diambil",
    data: ruangans.map(mapRuangan),
  });
});

export const getRuanganById = asyncHandler(async (req, res) => {
  const ruangan = await ruanganService.getRuanganById(req.params.id);
  res.json({
    message: "Data ruangan ditemukan",
    data: mapRuangan(ruangan),
  });
});

export const updateRuangan = asyncHandler(async (req, res) => {
  const ruangan = await ruanganService.updateRuangan(req.params.id, req.body);
  res.json({
    message: "Data ruangan berhasil diperbarui",
    data: mapRuangan(ruangan),
  });
});

export const deleteRuangan = asyncHandler(async (req, res) => {
  await ruanganService.deleteRuangan(req.params.id);
  res.json({
    message: "Data ruangan berhasil dihapus",
  });
});
