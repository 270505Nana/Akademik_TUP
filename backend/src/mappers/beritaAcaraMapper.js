/**
 * Mapper untuk response item Berita Acara pada list (GET /api/berita-acara)
 */
export const mapBeritaAcaraListItem = (ba) => {
  if (!ba) return null;
  const reg = ba.sidangRegistration || {};
  const mhs = reg.mahasiswa || {};

  return {
    id: ba.id,
    nilaiAkhir: ba.nilaiAkhir,
    keteranganLulus: ba.keteranganLulus,
    nilaiHuruf: ba.nilaiHuruf,
    justifikasi: ba.justifikasi,
    isPublished: Boolean(ba.isPublish),
    tglPublish: ba.isPublish,
    hasBerkas: Boolean(ba.berkasId || ba.berkas),
    berkas: ba.berkas
      ? {
          id: ba.berkas.id,
          name: ba.berkas.name,
          category: ba.berkas.category,
          filepath: ba.berkas.filepath,
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
    createdAt: ba.createdAt,
    updatedAt: ba.updatedAt,
  };
};

/**
 * Mapper untuk response detail Berita Acara (GET /api/berita-acara/:id & GET /api/berita-acara/me)
 */
export const mapBeritaAcaraDetail = (ba) => {
  if (!ba) return null;
  const reg = ba.sidangRegistration || {};
  const mhs = reg.mahasiswa || {};

  const timPenilai = [];
  if (reg.dosenPembimbing1) {
    timPenilai.push({
      id: reg.dosenPembimbing1.id,
      name: reg.dosenPembimbing1.name,
      nip: reg.dosenPembimbing1.nip,
      peran: "dosenPembimbing1",
    });
  }
  if (reg.dosenPembimbing2) {
    timPenilai.push({
      id: reg.dosenPembimbing2.id,
      name: reg.dosenPembimbing2.name,
      nip: reg.dosenPembimbing2.nip,
      peran: "dosenPembimbing2",
    });
  }
  if (reg.dosenPenguji1) {
    timPenilai.push({
      id: reg.dosenPenguji1.id,
      name: reg.dosenPenguji1.name,
      nip: reg.dosenPenguji1.nip,
      peran: "dosenPenguji1",
    });
  }
  if (reg.dosenPenguji2) {
    timPenilai.push({
      id: reg.dosenPenguji2.id,
      name: reg.dosenPenguji2.name,
      nip: reg.dosenPenguji2.nip,
      peran: "dosenPenguji2",
    });
  }

  return {
    id: ba.id,
    nilaiAkhir: ba.nilaiAkhir,
    keteranganLulus: ba.keteranganLulus,
    nilaiHuruf: ba.nilaiHuruf,
    justifikasi: ba.justifikasi,
    isPublished: Boolean(ba.isPublish),
    tglPublish: ba.isPublish,
    skemaPerhitunganNilai: ba.skemaPerhitunganNilai,
    hasBerkas: Boolean(ba.berkasId || ba.berkas),
    berkas: ba.berkas
      ? {
          id: ba.berkas.id,
          name: ba.berkas.name,
          category: ba.berkas.category,
          filepath: ba.berkas.filepath,
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
    timPenilai,
    createdAt: ba.createdAt,
    updatedAt: ba.updatedAt,
  };
};
