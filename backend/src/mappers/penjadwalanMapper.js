const mapCleanMahasiswa = (mhs) => {
  if (!mhs) return null;
  return {
    name: mhs.name ?? mhs.user?.name ?? null,
    nim: mhs.nim ?? null,
    studyProgram: mhs.studyProgram ? { name: mhs.studyProgram.name } : null,
  };
};

const mapCleanDosen = (dosen, { includeResearchGroup = false } = {}) => {
  if (!dosen) return null;
  const result = {
    id: dosen.id,
    name: dosen.name ?? dosen.user?.name ?? null,
    kodeDosen: dosen.kodeDosen ?? null,
  };
  if (includeResearchGroup) {
    result.researchGroupId = dosen.researchGroupId ?? null;
  }
  return result;
};

const mapCleanRuangan = (ruangan) => {
  if (!ruangan) return null;
  return {
    id: ruangan.id,
    name: ruangan.name ?? null,
    gedung: ruangan.gedung ?? null,
  };
};

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
    judulTugasAkhirIndonesia: item.judulTugasAkhirIndonesia ?? null,
    judulTugasAkhirInggris: item.judulTugasAkhirInggris ?? null,
    skemaSidang: item.skemaSidang ?? null,
    skemaSidangFinal: item.skemaSidangFinal ?? null,
    tglSidang: item.tglSidang ?? null,
    status: item.status ?? null,
    statusPenjadwalan,
    isLocked: (item.isLocked || item.sidangPeriod?.isPublished) ?? false,
    isPublished: item.sidangPeriod?.isPublished ?? false,
    isInfoPenjadwalanReaded: item.isInfoPenjadwalanReaded ?? false,
    notaDinasUrl: item.notaDinasUrl ?? null,
    mahasiswa: mapCleanMahasiswa(item.mahasiswa),
    dosenPembimbing1: mapCleanDosen(item.dosenPembimbing1, {
      includeResearchGroup: true,
    }),
    dosenPembimbing2: mapCleanDosen(item.dosenPembimbing2),
    dosenPenguji1: mapCleanDosen(item.dosenPenguji1),
    dosenPenguji2: mapCleanDosen(item.dosenPenguji2),
    ruanganSidang: mapCleanRuangan(item.ruanganSidang),
  };
};
