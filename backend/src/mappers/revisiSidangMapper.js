/**
 * Mapper untuk response item revisi sidang pada list (GET /api/revisi-sidang)
 */
export const mapRevisiSidangListItem = (revisi) => {
  if (!revisi) return null;
  const reg = revisi.sidangRegistration || {};
  const mhs = reg.mahasiswa || {};

  return {
    id: revisi.id,
    deadlineRevisi: revisi.deadlineRevisi,
    tglSubmitRevisi: revisi.tglSubmitRevisi,
    tglSetujuiHasilRevisi: revisi.tglSetujuiHasilRevisi,
    isSubmitted: Boolean(revisi.tglSubmitRevisi),
    isApproved: Boolean(revisi.tglSetujuiHasilRevisi),
    hasBerkas: Boolean(revisi.berkasRevisiId || revisi.berkasRevisi),
    mahasiswa: reg.mahasiswa
      ? {
          id: mhs.id,
          name: mhs.name,
          nim: mhs.nim,
          studyProgram: mhs.studyProgram?.name || null,
        }
      : null,
    sidang: reg.id
      ? {
          id: reg.id,
          judulTugasAkhir:
            reg.judulTugasAkhirIndonesia || reg.judulTugasAkhirInggris || "-",
          tglSidang: reg.tglSidang,
          ruangan: reg.ruanganSidang?.name || null,
        }
      : null,
  };
};

/**
 * Mapper untuk response detail revisi sidang mahasiswa (GET /api/revisi-sidang/me)
 */
export const mapRevisiSidangDetail = (revisi) => {
  if (!revisi) return null;
  const reg = revisi.sidangRegistration || {};
  const mhs = reg.mahasiswa || {};

  return {
    id: revisi.id,
    deadlineRevisi: revisi.deadlineRevisi,
    tglSubmitRevisi: revisi.tglSubmitRevisi,
    tglSetujuiHasilRevisi: revisi.tglSetujuiHasilRevisi,
    isSubmitted: Boolean(revisi.tglSubmitRevisi),
    isApproved: Boolean(revisi.tglSetujuiHasilRevisi),
    hasBerkas: Boolean(revisi.berkasRevisiId || revisi.berkasRevisi),
    berkasRevisi: revisi.berkasRevisi
      ? {
          id: revisi.berkasRevisi.id,
          name: revisi.berkasRevisi.name,
          category: revisi.berkasRevisi.category,
          filepath: revisi.berkasRevisi.filepath,
        }
      : null,
    mahasiswa: reg.mahasiswa
      ? {
          id: mhs.id,
          name: mhs.name,
          nim: mhs.nim,
          studyProgram: mhs.studyProgram?.name || null,
        }
      : null,
    sidang: reg.id
      ? {
          id: reg.id,
          judulTugasAkhir:
            reg.judulTugasAkhirIndonesia || reg.judulTugasAkhirInggris || "-",
          tglSidang: reg.tglSidang,
          ruangan: reg.ruanganSidang?.name || null,
        }
      : null,
  };
};

/**
 * Mapper lengkap untuk response revisi tugas akhir (misalnya saat verifikasi sidang)
 */
export const mapRevisiSidangFull = (revisi) => {
  if (!revisi) return null;
  const reg = revisi.sidangRegistration || {};

  return {
    id: revisi.id,
    sidangRegistrationId: revisi.sidangRegistrationId,
    deadlineRevisi: revisi.deadlineRevisi,
    tglSetujuiUntukRevisi: revisi.tglSetujuiUntukRevisi,
    setujuiUntukRevisi: revisi.setujuiUntukRevisi
      ? {
          id: revisi.setujuiUntukRevisi.id,
          name: revisi.setujuiUntukRevisi.name,
          kodeDosen: revisi.setujuiUntukRevisi.kodeDosen,
        }
      : null,
    tglSubmitRevisi: revisi.tglSubmitRevisi,
    berkasRevisi: revisi.berkasRevisi
      ? {
          id: revisi.berkasRevisi.id,
          name: revisi.berkasRevisi.name,
          category: revisi.berkasRevisi.category,
          filepath: revisi.berkasRevisi.filepath,
        }
      : null,
    tglSetujuiHasilRevisi: revisi.tglSetujuiHasilRevisi,
    setujuiHasilRevisi: revisi.setujuiHasilRevisi
      ? {
          id: revisi.setujuiHasilRevisi.id,
          name: revisi.setujuiHasilRevisi.name,
          kodeDosen: revisi.setujuiHasilRevisi.kodeDosen,
        }
      : null,
    isSubmitted: Boolean(revisi.tglSubmitRevisi),
    isApproved: Boolean(revisi.tglSetujuiHasilRevisi),
    sidangRegistration: reg.id
      ? {
          id: reg.id,
          judulTugasAkhir:
            reg.judulTugasAkhirIndonesia || reg.judulTugasAkhirInggris || "-",
          status: reg.status || null,
          tglSidang: reg.tglSidang,
          ruangan: reg.ruanganSidang?.name || null,
          mahasiswa: reg.mahasiswa
            ? {
                id: reg.mahasiswa.id,
                name: reg.mahasiswa.name,
                nim: reg.mahasiswa.nim,
                studyProgram: reg.mahasiswa.studyProgram
                  ? {
                      id: reg.mahasiswa.studyProgram.id,
                      name: reg.mahasiswa.studyProgram.name,
                    }
                  : null,
              }
            : null,
          dosenPembimbing1: reg.dosenPembimbing1
            ? {
                id: reg.dosenPembimbing1.id,
                name: reg.dosenPembimbing1.name,
                kodeDosen: reg.dosenPembimbing1.kodeDosen,
              }
            : null,
          dosenPembimbing2: reg.dosenPembimbing2
            ? {
                id: reg.dosenPembimbing2.id,
                name: reg.dosenPembimbing2.name,
                kodeDosen: reg.dosenPembimbing2.kodeDosen,
              }
            : null,
          dosenPenguji1: reg.dosenPenguji1
            ? {
                id: reg.dosenPenguji1.id,
                name: reg.dosenPenguji1.name,
                kodeDosen: reg.dosenPenguji1.kodeDosen,
              }
            : null,
          dosenPenguji2: reg.dosenPenguji2
            ? {
                id: reg.dosenPenguji2.id,
                name: reg.dosenPenguji2.name,
                kodeDosen: reg.dosenPenguji2.kodeDosen,
              }
            : null,
          sidangPeriod: reg.sidangPeriod
            ? {
                id: reg.sidangPeriod.id,
                name: reg.sidangPeriod.name,
                period: reg.sidangPeriod.period,
                isOpen: reg.sidangPeriod.isOpen,
              }
            : null,
          beritaAcara:
            reg.beritaAcaraSidangTugasAkhirs &&
            reg.beritaAcaraSidangTugasAkhirs.length > 0
              ? {
                  id: reg.beritaAcaraSidangTugasAkhirs[0].id,
                  nilaiAkhir: reg.beritaAcaraSidangTugasAkhirs[0].nilaiAkhir,
                  nilaiHuruf: reg.beritaAcaraSidangTugasAkhirs[0].nilaiHuruf,
                  keteranganLulus: reg.beritaAcaraSidangTugasAkhirs[0].keteranganLulus,
                  justifikasi: reg.beritaAcaraSidangTugasAkhirs[0].justifikasi,
                  createdAt: reg.beritaAcaraSidangTugasAkhirs[0].createdAt,
                }
              : null,
        }
      : null,
    createdAt: revisi.createdAt,
    updatedAt: revisi.updatedAt,
  };
};
