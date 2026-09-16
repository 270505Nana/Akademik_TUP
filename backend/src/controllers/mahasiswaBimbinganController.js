import asyncHandler from "express-async-handler";
import {
  getPaginationParams,
  formatPaginationResponse,
} from "../utils/paginationHelper.js";
import * as mahasiswaBimbinganService from "../services/mahasiswaBimbinganService.js";
import { mapMahasiswaBimbinganToFrontend } from "../mappers/index.js";

/**
 * Mendapatkan daftar sidang registration mahasiswa bimbingan dosen yang sedang login (paginated)
 */
export const listMahasiswaBimbingan = asyncHandler(async (req, res) => {
  const paginationParams = getPaginationParams(req.query);
  const { search, studyProgramId, sortBy } = req.query;

  const { total, registrations } =
    await mahasiswaBimbinganService.getMahasiswaBimbingan({
      userId: req.user.id,
      search,
      studyProgramId,
      sortBy,
      ...paginationParams,
    });

  const data = registrations.map((item) =>
    mapMahasiswaBimbinganToFrontend(item, req),
  );

  res.json(formatPaginationResponse(data, total, paginationParams));
});
