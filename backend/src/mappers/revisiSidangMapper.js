/**
 * Mapper untuk response item revisi sidang pada list (GET /api/revisi-sidang)
 */
export const mapRevisiSidangListItem = (revisi) => {
  if (!revisi) return null;
  const reg = revisi.sidangRegistration || {};
  const mhs = reg.mahasiswa || {};

  return {
    id: revisi.id,
    status: revisi.status,
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

  const roleOrder = {
    dosenPembimbing1: 1,
    dosenPembimbing2: 2,
    dosenPenguji1: 3,
    dosenPenguji2: 4,
  };

  const catatanRevisi = (reg.penilaianTugasAkhir || [])
    .map((p) => {
      const dosen = p.dosenPenilai || {};
      let peran = p.peran;
      if (!peran) {
        if (p.dosenPenilaiId === reg.dosenPembimbing1Id) peran = "dosenPembimbing1";
        else if (p.dosenPenilaiId === reg.dosenPembimbing2Id) peran = "dosenPembimbing2";
        else if (p.dosenPenilaiId === reg.dosenPenguji1Id) peran = "dosenPenguji1";
        else if (p.dosenPenilaiId === reg.dosenPenguji2Id) peran = "dosenPenguji2";
      }

      return {
        id: dosen.id || p.dosenPenilaiId,
        name: dosen.name || "-",
        nip: dosen.nip || "-",
        peran: peran || "-",
        catatan: p.catatanRevisi || "",
      };
    })
    .sort((a, b) => (roleOrder[a.peran] || 99) - (roleOrder[b.peran] || 99));

  return {
    id: revisi.id,
    status: revisi.status,
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
    catatanRevisi,
  };
};

