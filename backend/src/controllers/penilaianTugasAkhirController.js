import asyncHandler from "express-async-handler";
import { mapPenilaianTugasAkhir } from "../mappers/penilaianTugasAkhirMapper.js";
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
