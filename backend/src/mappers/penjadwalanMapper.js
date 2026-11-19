import { mapMahasiswa, mapDosen } from "./userMapper.js";
import { mapRuangan } from "./ruanganMapper.js";

export const mapPenjadwalanSidangToFrontend = (item) => {
  if (!item) return null;

  const adaPenguji = Boolean(item.dosenPenguji1Id && item.dosenPenguji2Id);
  const adaJadwal = Boolean(
    item.tglSidang && (item.ruanganSidangId || item.ruanganSidang),
  );

  let statusPenjadwalan = null;
  if (adaPenguji && adaJadwal) statusPenjadwalan = "Siap Sidang";
  else if (adaPenguji && !adaJadwal) statusPenjadwalan = "Penguji Ready";
  else if (!adaPenguji && adaJadwal) statusPenjadwalan = "Penjadwalan Ready";

  return {
    id: item.id,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    mahasiswa: mapMahasiswa(item.mahasiswa),
    judulTugasAkhirIndonesia: item.judulTugasAkhirIndonesia ?? null,
    judulTugasAkhirInggris: item.judulTugasAkhirInggris ?? null,
    skemaSidang: item.skemaSidang ?? null,
    skemaSidangFinal: item.skemaSidangFinal ?? null,
    dosenPembimbing1: mapDosen(item.dosenPembimbing1),
    dosenPembimbing2: mapDosen(item.dosenPembimbing2),
    dosenPenguji1: mapDosen(item.dosenPenguji1),
    dosenPenguji2: mapDosen(item.dosenPenguji2),
    tglSidang: item.tglSidang,
    ruanganSidang: mapRuangan(item.ruanganSidang),
    isLocked: (item.isLocked || item.sidangPeriod?.isPublished) ?? false,
    notaDinasUrl: item.notaDinasUrl ?? null,
    status: item.status,
    statusPenjadwalan,
    isPublished: item.sidangPeriod?.isPublished ?? false,
    isInfoPenjadwalanReaded: item.isInfoPenjadwalanReaded ?? false,
  };
};
