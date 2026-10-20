import asyncHandler from "express-async-handler";
import {
  getPaginationParams,
  formatPaginationResponse,
} from "../utils/paginationHelper.js";
import { mapSkemaPenilai } from "../mappers/skemaPenilaiMapper.js";
import * as skemaPenilaiService from "../services/skemaPenilaiService.js";

/**
 * Membuat data Skema Penilai baru
 */
export const createSkemaPenilai = asyncHandler(async (req, res) => {
  const skema = await skemaPenilaiService.createSkemaPenilai(req.body);

  res.status(201).json({
    message: "Skema Penilai berhasil dibuat",
    data: mapSkemaPenilai(skema),
  });
});

/**
 * Mendapatkan daftar Skema Penilai
 */
export const getSkemaPenilais = asyncHandler(async (req, res) => {
  const paginationParams = getPaginationParams(req.query);

  const { total, skemaList } = await skemaPenilaiService.getSkemaPenilais({
    ...req.query,
    skip: paginationParams.skip,
    take: paginationParams.take,
  });

  return res.json(
    formatPaginationResponse(
      skemaList.map(mapSkemaPenilai),
      total,
      paginationParams
    )
  );
});

/**
 * Mendapatkan data Skema Penilai berdasarkan ID
 */
export const getSkemaPenilaiById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const skema = await skemaPenilaiService.getSkemaPenilaiById(id);

  return res.json({ data: mapSkemaPenilai(skema) });
});

/**
 * Memperbarui data Skema Penilai
 */
export const updateSkemaPenilai = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updatedSkema = await skemaPenilaiService.updateSkemaPenilai(
    id,
    req.body
  );

  return res.json({
    message: "Skema Penilai berhasil diperbarui",
    data: mapSkemaPenilai(updatedSkema),
  });
});

/**
 * Menghapus data Skema Penilai
 */
export const deleteSkemaPenilai = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await skemaPenilaiService.deleteSkemaPenilai(id);

  return res.json({ message: "Skema Penilai berhasil dihapus" });
});
