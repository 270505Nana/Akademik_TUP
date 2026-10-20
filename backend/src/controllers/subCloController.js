import asyncHandler from "express-async-handler";
import {
  getPaginationParams,
  formatPaginationResponse,
} from "../utils/paginationHelper.js";
import { getAcademicAccessContext } from "../middlewares/authorize.js";
import { mapSubclo } from "../mappers/subcloMapper.js";
import * as subcloService from "../services/subcloService.js";

/**
 * Membuat data Sub CLO baru
 */
export const createSubcloProdi = asyncHandler(async (req, res) => {
  const access = await getAcademicAccessContext(req);
  const result = await subcloService.createSubcloProdi(req.body, access);

  if (result.isApproval) {
    return res.status(result.statusCode).json({
      message: result.message,
      data: result.data,
    });
  }

  return res.status(201).json({
    message: "Sub CLO berhasil dibuat",
    data: mapSubclo(result.subclo),
  });
});

/**
 * Mendapatkan daftar Sub CLO
 */
export const getSubcloProdis = asyncHandler(async (req, res) => {
  const paginationParams = getPaginationParams(req.query);
  const access = await getAcademicAccessContext(req);

  const { total, subcloList } = await subcloService.getSubcloProdis(
    {
      ...req.query,
      skip: paginationParams.skip,
      take: paginationParams.take,
    },
    access
  );

  return res.json(
    formatPaginationResponse(
      subcloList.map(mapSubclo),
      total,
      paginationParams
    )
  );
});

/**
 * Mendapatkan data Sub CLO berdasarkan ID
 */
export const getSubcloProdiById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const access = await getAcademicAccessContext(req);
  const subclo = await subcloService.getSubcloProdiById(id, access);

  return res.json({ data: mapSubclo(subclo) });
});

/**
 * Memperbarui data Sub CLO
 */
export const updateSubcloProdi = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const access = await getAcademicAccessContext(req);
  const result = await subcloService.updateSubcloProdi(id, req.body, access);

  if (result.isConflict || result.isApproval) {
    return res.status(result.statusCode).json({
      message: result.message,
      data: result.data,
    });
  }

  return res.json({
    message: "Sub clo berhasil diperbarui",
    data: mapSubclo(result.subclo),
  });
});

/**
 * Menghapus data Sub CLO
 */
export const deleteSubcloProdi = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const access = await getAcademicAccessContext(req);
  const result = await subcloService.deleteSubcloProdi(id, access);

  if (result.isConflict || result.isApproval) {
    return res.status(result.statusCode).json({
      message: result.message,
      data: result.data,
    });
  }

  return res.json({ message: "Sub CLO berhasil dihapus" });
});
