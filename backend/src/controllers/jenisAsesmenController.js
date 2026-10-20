import asyncHandler from "express-async-handler";
import {
  getPaginationParams,
  formatPaginationResponse,
} from "../utils/paginationHelper.js";
import { getAcademicAccessContext } from "../middlewares/authorize.js";
import { mapJenisAsesmen } from "../mappers/jenisAsesmenMapper.js";
import * as jenisAsesmenService from "../services/jenisAsesmenService.js";

/**
 * Membuat data Jenis Asesmen baru
 */
export const createJenisAsesmen = asyncHandler(async (req, res) => {
  const access = await getAcademicAccessContext(req);
  const result = await jenisAsesmenService.createJenisAsesmen(req.body, access);

  if (result.isApproval) {
    return res.status(result.statusCode).json({
      message: result.message,
      data: result.data,
    });
  }

  return res.status(201).json({
    message: "Jenis Asesmen berhasil dibuat",
    data: mapJenisAsesmen(result.jenisAsesmen),
  });
});

/**
 * Mendapatkan daftar Jenis Asesmen
 */
export const getJenisAsesmens = asyncHandler(async (req, res) => {
  const paginationParams = getPaginationParams(req.query);
  const access = await getAcademicAccessContext(req);

  const { total, jenisAsesmenList } =
    await jenisAsesmenService.getJenisAsesmens(
      {
        ...req.query,
        skip: paginationParams.skip,
        take: paginationParams.take,
      },
      access
    );

  return res.json(
    formatPaginationResponse(
      jenisAsesmenList.map(mapJenisAsesmen),
      total,
      paginationParams
    )
  );
});

/**
 * Mendapatkan data Jenis Asesmen berdasarkan ID
 */
export const getJenisAsesmenById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const access = await getAcademicAccessContext(req);
  const jenisAsesmen = await jenisAsesmenService.getJenisAsesmenById(
    id,
    access
  );

  return res.json({ data: mapJenisAsesmen(jenisAsesmen) });
});

/**
 * Memperbarui data Jenis Asesmen
 */
export const updateJenisAsesmen = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const access = await getAcademicAccessContext(req);
  const result = await jenisAsesmenService.updateJenisAsesmen(
    id,
    req.body,
    access
  );

  if (result.isConflict || result.isApproval) {
    return res.status(result.statusCode).json({
      message: result.message,
      data: result.data,
    });
  }

  return res.json({
    message: "Jenis Asesmen berhasil diperbarui",
    data: mapJenisAsesmen(result.jenisAsesmen),
  });
});

/**
 * Menghapus data Jenis Asesmen
 */
export const deleteJenisAsesmen = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const access = await getAcademicAccessContext(req);
  const result = await jenisAsesmenService.deleteJenisAsesmen(id, access);

  if (result.isConflict || result.isApproval) {
    return res.status(result.statusCode).json({
      message: result.message,
      data: result.data,
    });
  }

  return res.json({ message: "Jenis Asesmen berhasil dihapus" });
});
