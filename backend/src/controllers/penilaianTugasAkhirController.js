import asyncHandler from "express-async-handler";
import {
  mapPenilaianTugasAkhir,
  mapRekapPenilaianSidang,
  mapTutupSidangResponse,
} from "../mappers/penilaianTugasAkhirMapper.js";
import * as penilaianTugasAkhirService from "../services/penilaianTugasAkhirService.js";

// Get Penilaian Tugas Akhir by Sidang Registration ID (Dosen me)
export const getPenilaianBySidangRegistrationId = asyncHandler(
  async (req, res) => {
    const { sidangRegistrationId } = req.params;

    if (!sidangRegistrationId) {
      res.status(400);
      throw new Error("ID Pendaftaran Sidang wajib diisi");
    }

    const result =
      await penilaianTugasAkhirService.getPenilaianBySidangRegistrationId({
        sidangRegistrationId,
        userId: req.user.id,
        userRole: req.user.role,
      });

    res.status(200).json({
      message: "Data penilaian tugas akhir berhasil diambil",
      data: result,
    });
  },
);

// Get All Penilaian by Sidang Registration ID (Rekap)
export const getAllPenilaianBySidangRegistrationId = asyncHandler(
  async (req, res) => {
    const { sidangRegistrationId } = req.params;

    if (!sidangRegistrationId) {
      res.status(400);
      throw new Error("ID Pendaftaran Sidang wajib diisi");
    }

    const result =
      await penilaianTugasAkhirService.getAllPenilaianBySidangRegistrationId({
        sidangRegistrationId,
        userId: req.user.id,
        userRole: req.user.role,
      });

    res.status(200).json({
      message: "Data rekap penilaian sidang berhasil diambil",
      data: result,
    });
  },
);

// Create or Update Penilaian Tugas Akhir
export const savePenilaianTugasAkhir = asyncHandler(async (req, res) => {
  const { sidangRegistrationId } = req.params;
  const { nilai, catatanRevisi } = req.body;

  if (!sidangRegistrationId) {
    res.status(400);
    throw new Error("ID Pendaftaran Sidang wajib diisi");
  }

  const savedPenilaian =
    await penilaianTugasAkhirService.savePenilaianTugasAkhir({
      sidangRegistrationId,
      userId: req.user.id,
      userRole: req.user.role,
      nilai,
      catatanRevisi,
    });

  res.status(200).json({
    message: "Penilaian tugas akhir berhasil disimpan",
    data: mapPenilaianTugasAkhir(savedPenilaian),
  });
});

// Menutup Sidang Tugas Akhir & Menetapkan Batas Waktu Revisi (Khusus Pembimbing 1)
export const tutupSidang = asyncHandler(async (req, res) => {
  const { sidangRegistrationId } = req.params;
  const { deadlineRevisi } = req.body;

  if (!sidangRegistrationId) {
    res.status(400);
    throw new Error("ID Pendaftaran Sidang wajib diisi");
  }

  const result = await penilaianTugasAkhirService.tutupSidang({
    sidangRegistrationId,
    userId: req.user.id,
    deadlineRevisi,
  });

  res.status(200).json({
    message: "Sidang tugas akhir berhasil ditutup dan batas waktu revisi telah ditetapkan",
    data: mapTutupSidangResponse(result),
  });
});


