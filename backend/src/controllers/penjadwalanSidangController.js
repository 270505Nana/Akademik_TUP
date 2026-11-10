import asyncHandler from "express-async-handler";
import {
  getPaginationParams,
  formatPaginationResponse,
} from "../utils/paginationHelper.js";
import { mapPenjadwalanSidangToFrontend } from "../mappers/penjadwalanMapper.js";
import * as penjadwalanSidangService from "../services/penjadwalanSidangService.js";

// Penjadwalan Sidang List
const listPenjadwalanSidang = asyncHandler(async (req, res) => {
  const paginationParams = getPaginationParams(req.query);

  const { total, registrations } =
    await penjadwalanSidangService.getPenjadwalanSidangList({
      user: req.user,
      dosen: req.dosen,
      sidangPeriodId: req.query.sidangPeriodId,
      search: req.query.search,
      sortBy: req.query.sortBy,
      statusPenjadwalan: req.query.statusPenjadwalan,
      ...paginationParams,
    });

  const data = registrations.map((reg) => mapPenjadwalanSidangToFrontend(reg));

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
// Catatan: Admin tidak dibatasi oleh isLocked (isLocked khusus untuk membatasi Ketua KK)
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
// Catatan: Admin tidak dibatasi oleh isLocked (isLocked khusus untuk membatasi Ketua KK)
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
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  await workbook.xlsx.write(res);
  res.end();
});

// Toggle Lock Sidang Registration (Admin Only)
// Digunakan oleh admin untuk mengunci pendaftaran agar dosen/Ketua KK tidak dapat lagi mengubah penguji
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
// Catatan: Admin tidak dibatasi oleh isLocked (isLocked khusus untuk membatasi Ketua KK)
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

// Tandai Baca Info Penjadwalan Sidang (Mahasiswa)
const toggleReadInfoPenjadwalan = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const updatedRegistration =
    await penjadwalanSidangService.toggleReadInfoPenjadwalan({
      id,
      user: req.user,
    });

  res.json({
    message: "Info penjadwalan sidang berhasil ditandai sudah dibaca",
    data: mapPenjadwalanSidangToFrontend(updatedRegistration),
  });
});

// Toggle Publish Sidang Period (Admin Only)
const togglePublishSidangPeriod = asyncHandler(async (req, res) => {
  const { sidangPeriodId } = req.params;

  const updatedPeriod =
    await penjadwalanSidangService.togglePublishSidangPeriod(sidangPeriodId);

  res.json({
    message: updatedPeriod.isPublished
      ? "Jadwal sidang untuk periode ini berhasil dipublikasikan ke mahasiswa"
      : "Publikasi jadwal sidang untuk periode ini berhasil dibatalkan",
    data: updatedPeriod,
  });
});

// Upload Nota Dinas (Admin Only)
const uploadNotaDinasController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const fileData = req.file; 

  if (!fileData) {
    res.status(400);
    throw new Error("File Nota Dinas wajib dilampirkan");
  }

  const updatedRegistration = await penjadwalanSidangService.uploadNotaDinas({
    id,
    fileData,
  });

  res.status(201).json({
    message: "Nota Dinas berhasil diunggah",
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
  toggleReadInfoPenjadwalan,
  togglePublishSidangPeriod,
  uploadNotaDinasController,
};
