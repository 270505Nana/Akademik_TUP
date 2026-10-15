import { mapDosen } from "./userMapper.js";

export const mapPenilaianTugasAkhir = (penilaian) => {
  if (!penilaian) return null;

  return {
    id: penilaian.id || null,
    bobotPenilai: Number(penilaian.bobotPenilai) || 0,
    nilai: Array.isArray(penilaian.nilai) ? penilaian.nilai : [],
    catatanRevisi: penilaian.catatanRevisi || "",
    sidangRegistrationId: penilaian.sidangRegistrationId,
    penilaiType: penilaian.penilaiType,
    dosenPenilai: penilaian.dosenPenilai ? mapDosen(penilaian.dosenPenilai) : null,
    dosenKaprodi: penilaian.dosenKaprodi ? mapDosen(penilaian.dosenKaprodi) : null,
  };
};
