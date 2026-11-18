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

