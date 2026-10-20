import asyncHandler from "express-async-handler";
import {
  getPaginationParams,
  formatPaginationResponse,
} from "../utils/paginationHelper.js";
import * as mahasiswaBimbinganService from "../services/mahasiswaBimbinganService.js";
import { mapMahasiswaBimbinganList } from "../mappers/mahasiswaBimbinganMapper.js";

/**
 * Mendapatkan daftar sidang registration mahasiswa bimbingan dosen yang sedang login (paginated)
 */
export const listMahasiswaBimbingan = asyncHandler(async (req, res) => {
  const paginationParams = getPaginationParams(req.query);
  const { search, studyProgramId, sortBy, sortOrder } = req.query;

  const { total, registrations } =
    await mahasiswaBimbinganService.getMahasiswaBimbingan({
      userId: req.user.id,
      search,
      studyProgramId,
      sortBy,
      sortOrder,
      ...paginationParams,
    });

  const data = mapMahasiswaBimbinganList(registrations, req);

  res.json(formatPaginationResponse(data, total, paginationParams));
});
