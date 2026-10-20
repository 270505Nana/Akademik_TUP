import asyncHandler from "express-async-handler";
import {
  getPaginationParams,
  formatPaginationResponse,
} from "../utils/paginationHelper.js";
import { getAcademicAccessContext } from "../middlewares/authorize.js";
import { mapClo } from "../mappers/cloMapper.js";
import * as cloService from "../services/cloService.js";

/**
 * Membuat data CLO baru
 */
export const createCloProdi = asyncHandler(async (req, res) => {
  const access = await getAcademicAccessContext(req);
  const result = await cloService.createCloProdi(req.body, access);

  if (result.isApproval) {
    return res.status(result.statusCode).json({
      message: result.message,
      data: result.data,
    });
  }

  return res.status(201).json({
    message: "CLO berhasil dibuat",
    data: mapClo(result.clo),
  });
});

/**
 * Mendapatkan daftar CLO
 */
export const getCloProdis = asyncHandler(async (req, res) => {
  const paginationParams = getPaginationParams(req.query);
  const access = await getAcademicAccessContext(req);

  const { total, cloList } = await cloService.getCloProdis(
    {
      ...req.query,
      skip: paginationParams.skip,
      take: paginationParams.take,
    },
    access
  );

  return res.json(
    formatPaginationResponse(cloList.map(mapClo), total, paginationParams)
  );
});

/**
 * Mendapatkan data CLO berdasarkan ID
 */
export const getCloProdiById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const access = await getAcademicAccessContext(req);
  const clo = await cloService.getCloProdiById(id, access);

  return res.json({ data: mapClo(clo) });
});

/**
 * Memperbarui data CLO
 */
export const updateCloProdi = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const access = await getAcademicAccessContext(req);
  const result = await cloService.updateCloProdi(id, req.body, access);

  if (result.isConflict || result.isApproval) {
    return res.status(result.statusCode).json({
      message: result.message,
      data: result.data,
    });
  }

  return res.json({
    message: "CLO berhasil diperbarui",
    data: mapClo(result.clo),
  });
});

/**
 * Menghapus data CLO
 */
export const deleteCloProdi = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const access = await getAcademicAccessContext(req);
  const result = await cloService.deleteCloProdi(id, access);

  if (result.isConflict || result.isApproval) {
    return res.status(result.statusCode).json({
      message: result.message,
      data: result.data,
    });
  }

  return res.json({ message: "CLO berhasil dihapus" });
});
