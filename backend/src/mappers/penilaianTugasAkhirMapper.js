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

export const mapRekapPenilaianSidang = (data) => {
  if (!data) return null;

  return {
    ...data,
    penilaianList: (data.penilaianList || []).map((p) => ({
      ...p,
      dosen: p.dosen ? mapDosen(p.dosen) : null,
    })),
  };
};

export const mapBeritaAcara = (beritaAcara) => {
  if (!beritaAcara) return null;

  return {
    id: beritaAcara.id,
    sidangRegistrationId: beritaAcara.sidangRegistrationId,
    skemaPerhitunganNilai: Array.isArray(beritaAcara.skemaPerhitunganNilai)
      ? beritaAcara.skemaPerhitunganNilai
      : [],
    nilaiAkhir: beritaAcara.nilaiAkhir,
    nilaiHuruf: beritaAcara.nilaiHuruf,
    keterangan: beritaAcara.keterangan,
    justifikasi: beritaAcara.justifikasi || null,
    createdAt: beritaAcara.createdAt,
    updatedAt: beritaAcara.updatedAt,
  };
};

export const mapTutupSidangResponse = ({ beritaAcara, revisiTugasAkhir }) => {
  return {
    beritaAcara: mapBeritaAcara(beritaAcara),
    revisiTugasAkhir: revisiTugasAkhir
      ? {
          id: revisiTugasAkhir.id,
          deadlineRevisi: revisiTugasAkhir.deadlineRevisi,
          tglSetujuiUntukRevisi: revisiTugasAkhir.tglSetujuiUntukRevisi,
          setujuiUntukRevisiId: revisiTugasAkhir.setujuiUntukRevisiId,
        }
      : null,
  };
};


