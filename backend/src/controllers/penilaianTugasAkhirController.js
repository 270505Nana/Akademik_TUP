import asyncHandler from "express-async-handler";
import {
  mapPenilaianTugasAkhir,
  mapRekapPenilaianSidang,
  mapTutupSidangResponse,
} from "../mappers/penilaianTugasAkhirMapper.js";
import * as penilaianTugasAkhirService from "../services/penilaianTugasAkhirService.js";

// Get Penilaian Tugas Akhir by Sidang Registration ID
export const getPenilaianBySidangRegistrationId = asyncHandler(
  async (req, res) => {
    const { sidangRegistrationId } = req.params;

    if (!sidangRegistrationId) {
      res.status(400);
      throw new Error("ID Pendaftaran Sidang wajib diisi");
    }

    const penilaian =
      await penilaianTugasAkhirService.getPenilaianBySidangRegistrationId({
        sidangRegistrationId,
        userId: req.user.id,
        userRole: req.user.role,
      });

    res.json(mapPenilaianTugasAkhir(penilaian));
  },
);

// Get All Penilaian by Sidang Registration ID + Kalkulasi Berita Acara
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

    res.json({
      message: "Data seluruh penilaian sidang dan kalkulasi berita acara berhasil diambil",
      data: mapRekapPenilaianSidang(result),
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

// Menutup Sidang Tugas Akhir & Menerbitkan Berita Acara (Khusus Pembimbing 1)
export const tutupSidang = asyncHandler(async (req, res) => {
  const { sidangRegistrationId } = req.params;
  const { deadlineRevisi, keterangan, nilaiAkhir, justifikasi } = req.body;

  if (!sidangRegistrationId) {
    res.status(400);
    throw new Error("ID Pendaftaran Sidang wajib diisi");
  }

  const result = await penilaianTugasAkhirService.tutupSidang({
    sidangRegistrationId,
    userId: req.user.id,
    deadlineRevisi,
    keterangan,
    nilaiAkhir,
    justifikasi,
  });

  res.status(201).json({
    message: "Sidang tugas akhir berhasil ditutup dan Berita Acara telah diterbitkan",
    data: mapTutupSidangResponse(result),
  });
});


