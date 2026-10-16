import asyncHandler from "express-async-handler";
import * as mahasiswaService from "../services/mahasiswaService.js";
import { mapMahasiswa } from "../mappers/index.js";
import {
  getPaginationParams,
  formatPaginationResponse,
} from "../utils/paginationHelper.js";

// Daftar Semua Mahasiswa
const listMahasiswa = asyncHandler(async (req, res) => {
  const paginationParams = getPaginationParams(req.query);
  const { search, studyProgramId, tahunAngkatan, sortBy, sortOrder } = req.query;

  const { total, mahasiswas } = await mahasiswaService.getMahasiswas({
    search,
    studyProgramId,
    tahunAngkatan,
    sortBy,
    sortOrder,
    ...paginationParams,
  });

  res.json(
    formatPaginationResponse(
      mahasiswas.map(mapMahasiswa),
      total,
      paginationParams,
    ),
  );
});

// Update or Insert Mahasiswa
const upsertMahasiswa = asyncHandler(async (req, res) => {
  const mahasiswa = await mahasiswaService.upsertMahasiswa(
    req.params.id,
    req.body,
    req.user,
  );
  res.json({
    message: "Data mahasiswa berhasil disimpan",
    data: mapMahasiswa(mahasiswa),
  });
});

// Find Mahasiswa By Id (with fallback to userId)
const findMahasiswaById = asyncHandler(async (req, res) => {
  const mahasiswa = await mahasiswaService.getMahasiswaByIdOrUserId(
    req.params.id,
  );
  res.json({ data: mapMahasiswa(mahasiswa) });
});

// Get Mahasiswa Dashboard
const getMahasiswaDashboard = asyncHandler(async (req, res) => {
  const data = await mahasiswaService.getMahasiswaDashboardData(req.user.id);
  res.json({
    message: "Mahasiswa dashboard data retrieved successfully",
    data,
  });
});

export {
  listMahasiswa,
  upsertMahasiswa,
  findMahasiswaById,
  getMahasiswaDashboard,
};
