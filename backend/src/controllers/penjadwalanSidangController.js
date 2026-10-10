import asyncHandler from "express-async-handler";
import {
  getPaginationParams,
  formatPaginationResponse,
} from "../utils/paginationHelper.js";
import { mapPenjadwalanSidangToFrontend } from "../mappers/index.js";
import * as penjadwalanSidangService from "../services/penjadwalanSidangService.js";

// Penjadwalan Sidang List
const listPenjadwalanSidang = asyncHandler(async (req, res) => {
  const paginationParams = getPaginationParams(req.query);

  const { total, registrations } =
    await penjadwalanSidangService.getPenjadwalanSidangList({
      user: req.user,
      dosen: req.dosen,
      sidangPeriodId: req.query.sidangPeriodId,
      ...paginationParams,
    });

  const data = registrations.map((reg) =>
    mapPenjadwalanSidangToFrontend(reg),
  );

  res.json(formatPaginationResponse(data, total, paginationParams));
});

// Set Dosen Penguji Sidang (Ketua KK Only)
const setPengujiSidang = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { dosenPenguji1Id, dosenPenguji2Id } = req.body;

  const updatedRegistration = await penjadwalanSidangService.setPengujiSidang({
    id,
    dosenPenguji1Id,
    dosenPenguji2Id,
  });

  res.json({
    message: "Dosen penguji sidang berhasil ditentukan",
    data: mapPenjadwalanSidangToFrontend(updatedRegistration),
  });
});

// Set Dosen Penguji Sidang Batch (Ketua KK Only)
const batchSetPengujiSidang = asyncHandler(async (req, res) => {
  const updatedRegistrations =
    await penjadwalanSidangService.batchSetPengujiSidang(req.body);

  res.json({
    message: "Dosen penguji sidang batch berhasil ditentukan",
    data: updatedRegistrations.map((reg) =>
      mapPenjadwalanSidangToFrontend(reg),
    ),
  });
});

// Set Jadwal Sidang (Admin Only)
const setJadwalSidang = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { tglSidang, ruanganSidangId } = req.body;

  const updatedRegistration = await penjadwalanSidangService.setJadwalSidang({
    id,
    tglSidang,
    ruanganSidangId,
  });

  res.json({
    message: "Jadwal sidang berhasil ditentukan",
    data: mapPenjadwalanSidangToFrontend(updatedRegistration),
  });
});

// Set Jadwal Sidang Batch (Admin Only)
const batchSetJadwalSidang = asyncHandler(async (req, res) => {
  const updatedRegistrations =
    await penjadwalanSidangService.batchSetJadwalSidang(req.body);

  res.json({
    message: "Jadwal sidang batch berhasil ditentukan",
    data: updatedRegistrations.map((reg) =>
      mapPenjadwalanSidangToFrontend(reg),
    ),
  });
});

// Export Jadwal Sidang
const exportJadwalSidang = asyncHandler(async (req, res) => {
  const { workbook, filename } =
    await penjadwalanSidangService.exportJadwalSidang({
      user: req.user,
      dosen: req.dosen,
      sidangPeriodId: req.query.sidangPeriodId,
    });

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}"`,
  );
  await workbook.xlsx.write(res);
  res.end();
});

// Toggle Lock Sidang Registration (Admin Only)
const toggleLockSidangRegistration = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const updatedRegistration =
    await penjadwalanSidangService.toggleLockSidangRegistration(id);

  res.json({
    message: updatedRegistration.isLocked
      ? "Pendaftaran sidang berhasil dikunci"
      : "Kunci pendaftaran sidang berhasil dibuka",
    data: mapPenjadwalanSidangToFrontend(updatedRegistration),
  });
});

// Set Dosen Penguji dan Jadwal Sidang Sekaligus (Admin Only)
const setPengujiJadwalSidang = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { dosenPenguji1Id, dosenPenguji2Id, tglSidang, ruanganSidangId } =
    req.body;

  const updatedRegistration =
    await penjadwalanSidangService.setPengujiJadwalSidang({
      id,
      dosenPenguji1Id,
      dosenPenguji2Id,
      tglSidang,
      ruanganSidangId,
    });

  res.json({
    message: "Dosen penguji dan jadwal sidang berhasil ditentukan",
    data: mapPenjadwalanSidangToFrontend(updatedRegistration),
  });
});

// Toggle Publish Sidang Registration (Admin Only)
const togglePublishSidangRegistration = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const updatedRegistration =
    await penjadwalanSidangService.togglePublishSidangRegistration(id);

  res.json({
    message: updatedRegistration.isPublished
      ? "Jadwal sidang berhasil dipublikasikan ke mahasiswa"
      : "Publikasi jadwal sidang berhasil dibatalkan",
    data: mapPenjadwalanSidangToFrontend(updatedRegistration),
  });
});

export {
  listPenjadwalanSidang,
  setPengujiSidang,
  batchSetPengujiSidang,
  setJadwalSidang,
  batchSetJadwalSidang,
  setPengujiJadwalSidang,
  exportJadwalSidang,
  toggleLockSidangRegistration,
  togglePublishSidangRegistration,
};


