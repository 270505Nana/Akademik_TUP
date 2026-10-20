import asyncHandler from "express-async-handler";
import * as pusatInformasiService from "../services/pusatInformasiService.js";
import {
  mapPusatInformasi,
  mapPusatInformasiList,
  groupPusatInformasiByCategory,
} from "../mappers/pusatInformasiMapper.js";
import { formatPaginationResponse } from "../utils/paginationHelper.js";

export const { findNearestPeriod } = pusatInformasiService;

// Ambil data preview periode sidang, yudisium terdekat dan DokumenPanduanTugasAkhir
export const getPusatInformasiPreview = asyncHandler(async (req, res) => {
  const { periodeSidang, periodeYudisium, dokumenPanduan } =
    await pusatInformasiService.getPusatInformasiPreview();

  const dataDokumen = groupPusatInformasiByCategory(dokumenPanduan);

  res.json({
    periodeSidang,
    periodeYudisium,
    dokumenPanduanTugasAkhir: dataDokumen,
  });
});

// Ambil semua pusat informasi yang dipublish, dikelompokkan berdasarkan kategori
export const getPusatInformasiPublic = asyncHandler(async (req, res) => {
  const items = await pusatInformasiService.getPusatInformasiPublic();
  const data = groupPusatInformasiByCategory(items);

  res.json({ data });
});

// Ambil seluruh data pusat informasi dengan pagination, search, category filter, dan sort
export const listPusatInformasi = asyncHandler(async (req, res) => {
  const result = await pusatInformasiService.listPusatInformasi(req.query);
  const data = mapPusatInformasiList(result.data);
  res.json(formatPaginationResponse(data, result.total, result.paginationParams));
});

// Ambil detail data pusat informasi berdasarkan ID
export const getPusatInformasiById = asyncHandler(async (req, res) => {
  const item = await pusatInformasiService.getPusatInformasiById(req.params.id);
  res.json({
    data: mapPusatInformasi(item),
  });
});

// Tambah data pusat informasi baru
export const createPusatInformasi = asyncHandler(async (req, res) => {
  const created = await pusatInformasiService.createPusatInformasi(req.body);
  res.status(201).json({
    message: "Pusat informasi created successfully",
    data: mapPusatInformasi(created),
  });
});

// Perbarui data pusat informasi berdasarkan ID
export const updatePusatInformasi = asyncHandler(async (req, res) => {
  const updated = await pusatInformasiService.updatePusatInformasi(
    req.params.id,
    req.body
  );
  res.json({
    message: "Pusat informasi updated successfully",
    data: mapPusatInformasi(updated),
  });
});

// Hapus permanen data pusat informasi berdasarkan ID
export const deletePusatInformasi = asyncHandler(async (req, res) => {
  await pusatInformasiService.deletePusatInformasi(req.params.id);
  res.json({
    message: "Pusat informasi deleted successfully",
  });
});
