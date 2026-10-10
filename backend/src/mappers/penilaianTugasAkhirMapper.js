import { mapDosen } from "./userMapper.js";

export const mapPenilaianTugasAkhir = (penilaian) => ({
  id: penilaian.id,
  bobotPenilai: Number(penilaian.bobotPenilai),
  bobotNilai: penilaian.bobotNilai || {},
  nilai: penilaian.nilai || {},
  catatanRevisi: penilaian.catatanRevisi || "",
  sidangRegistrationId: penilaian.sidangRegistrationId,
  penilaiType: penilaian.penilaiType,
  dosenPenilai: penilaian.dosenPenilai ? mapDosen(penilaian.dosenPenilai) : {},
  dosenKaprodi: penilaian.dosenKaprodi ? mapDosen(penilaian.dosenKaprodi) : {},
});
