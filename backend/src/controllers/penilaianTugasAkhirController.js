import asyncHandler from "express-async-handler";
import { mapDosen } from "../mappers/userMapper.js";
import * as penilaianTugasAkhirService from "../services/penilaianTugasAkhirService.js";

// Helper formatter untuk response data penilaian tugas akhir
const formatPenilaianResponse = (penilaian) => ({
  id: penilaian.id,
  bobotPenilai: Number(penilaian.bobotPenilai),
  bobotNilai: penilaian.bobotNilai || {},
  nilai: penilaian.nilai || {},
  catatanRevisi: penilaian.catatanRevisi || "",
  sidangRegistrationId: penilaian.sidangRegistrationId,
  penilaiType: penilaian.penilaiType,
  dosenPenilai: penilaian.dosenPenilai
    ? mapDosen(penilaian.dosenPenilai)
    : {},
  dosenKaprodi: penilaian.dosenKaprodi
    ? mapDosen(penilaian.dosenKaprodi)
    : {},
});

// Get Penilaian Tugas Akhir by Sidang Registration ID
export const getPenilaianBySidangRegistrationId = asyncHandler(
  async (req, res) => {
    const { sidangRegistrationId } = req.params;

    const penilaian =
      await penilaianTugasAkhirService.getPenilaianBySidangRegistrationId({
        sidangRegistrationId,
        userId: req.user.id,
        userRole: req.user.role,
      });

    res.json(formatPenilaianResponse(penilaian));
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
    data: formatPenilaianResponse(savedPenilaian),
  });
});
