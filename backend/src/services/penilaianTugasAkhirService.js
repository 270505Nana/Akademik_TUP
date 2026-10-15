import prisma from "../config/prisma.js";

// Helper untuk mengambil master data kurikulum asesmen prodi
const getMasterDataPenilaianProdi = async (studyProgramId) => {
  return await prisma.cloProdi.findMany({
    where: {
      studyProgramId,
      deletedAt: null,
    },
    include: {
      subcloProdi: {
        where: { deletedAt: null },
        orderBy: { name: "asc" },
      },
      jenisAsesmenClo: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });
};

// Helper untuk menyusun template formulir kosong (nilai: null)
const buildPenilaianTemplate = (cloList) => {
  return cloList.map((clo) => ({
    cloProdiId: clo.id,
    cloName: clo.name,
    deskripsi: clo.description,
    subClo: (clo.subcloProdi || []).map((sub) => ({
      id: sub.id,
      name: sub.name,
      deskripsi: sub.description,
    })),
    asesmen: (clo.jenisAsesmenClo || []).map((ja) => ({
      jenisAsesmenId: ja.id,
      content: ja.content,
      bobot: Number(ja.bobot),
      nilai: null,
    })),
  }));
};

// Helper untuk menyusun Hierarchical Snapshot dari input nilai dosen
const buildPenilaianSnapshot = (cloList, nilaiInputList) => {
  const nilaiMap = new Map();
  for (const item of (nilaiInputList || [])) {
    nilaiMap.set(item.jenisAsesmenId, Number(item.nilai));
  }

  const missingAsesmen = [];
  const snapshot = cloList.map((clo) => {
    const asesmen = (clo.jenisAsesmenClo || []).map((ja) => {
      const score = nilaiMap.get(ja.id);
      if (score === undefined || score === null) {
        missingAsesmen.push(`${clo.name} - ${ja.content}`);
      }
      return {
        jenisAsesmenId: ja.id,
        content: ja.content,
        bobot: Number(ja.bobot),
        nilai: score !== undefined ? score : 0,
      };
    });

    return {
      cloProdiId: clo.id,
      cloName: clo.name,
      deskripsi: clo.description,
      subClo: (clo.subcloProdi || []).map((sub) => ({
        id: sub.id,
        name: sub.name,
        deskripsi: sub.description,
      })),
      asesmen,
    };
  });

  if (missingAsesmen.length > 0) {
    const error = new Error(
      `Komponen asesmen berikut belum dinilai: ${missingAsesmen.join(", ")}`
    );
    error.statusCode = 400;
    throw error;
  }

  return snapshot;
};

// Helper menentukan peran dosen (pembimbing / penguji) dan bobot penilai
const resolvePenilaiInfo = async (dosenPenilaiId, sidangRegistration) => {
  let type = null;
  let penilaiType = null;

  if (dosenPenilaiId === sidangRegistration.dosenPembimbing1Id) {
    type = "pembimbing_1";
    penilaiType = "pembimbing";
  } else if (dosenPenilaiId === sidangRegistration.dosenPembimbing2Id) {
    type = "pembimbing_2";
    penilaiType = "pembimbing";
  } else if (dosenPenilaiId === sidangRegistration.dosenPenguji1Id) {
    type = "penguji_1";
    penilaiType = "penguji";
  } else if (dosenPenilaiId === sidangRegistration.dosenPenguji2Id) {
    type = "penguji_2";
    penilaiType = "penguji";
  }

  if (!penilaiType) {
    const error = new Error(
      "Dosen tidak terdaftar sebagai pembimbing atau penguji pada sidang ini"
    );
    error.statusCode = 403;
    throw error;
  }

  const studyProgramId = sidangRegistration.mahasiswa?.studyProgramId;
  let bobotPenilai = 0.5;

  if (type && studyProgramId) {
    const skema = await prisma.skemaPenilaiProdi.findFirst({
      where: {
        studyProgramId,
        type,
        deletedAt: null,
      },
    });

    if (skema && skema.bobot != null) {
      bobotPenilai = Number(skema.bobot);
    }
  }

  return { type, penilaiType, bobotPenilai, studyProgramId };
};

// Get Penilaian Tugas Akhir by Sidang Registration ID
export const getPenilaianBySidangRegistrationId = async ({
  sidangRegistrationId,
  userId,
  userRole,
}) => {
  if (userRole !== "DOSEN") {
    const error = new Error(
      "Hanya dosen yang dapat mengakses penilaian tugas akhir"
    );
    error.statusCode = 403;
    throw error;
  }

  const currentDosen = await prisma.dosen.findUnique({
    where: { userId },
    include: { user: true, studyProgram: true, researchGroup: true },
  });

  if (!currentDosen || currentDosen.deletedAt) {
    const error = new Error("Data dosen tidak ditemukan");
    error.statusCode = 403;
    throw error;
  }

  // 1. Cek apakah penilaian sudah pernah disimpan di DB
  const penilaian = await prisma.penilaianTugasAkhir.findUnique({
    where: {
      sidangRegistrationId_dosenPenilaiId: {
        sidangRegistrationId,
        dosenPenilaiId: currentDosen.id,
      },
    },
    include: {
      dosenPenilai: {
        include: { user: true, studyProgram: true, researchGroup: true },
      },
      dosenKaprodi: {
        include: { user: true, studyProgram: true, researchGroup: true },
      },
    },
  });

  if (penilaian && !penilaian.deletedAt) {
    return penilaian;
  }

  // 2. Jika belum ada penilaian, kembalikan template kosong dari master data prodi
  const sidangRegistration = await prisma.sidangRegistration.findUnique({
    where: { id: sidangRegistrationId },
    include: {
      mahasiswa: true,
    },
  });

  if (!sidangRegistration || sidangRegistration.deletedAt) {
    const error = new Error("Pendaftaran sidang tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const { penilaiType, bobotPenilai, studyProgramId } =
    await resolvePenilaiInfo(currentDosen.id, sidangRegistration);

  if (!studyProgramId) {
    const error = new Error("Program studi mahasiswa tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const cloList = await getMasterDataPenilaianProdi(studyProgramId);
  const template = buildPenilaianTemplate(cloList);

  return {
    id: null,
    sidangRegistrationId,
    penilaiType,
    bobotPenilai,
    nilai: template,
    catatanRevisi: "",
    dosenPenilai: currentDosen,
    dosenKaprodi: null,
    createdAt: null,
    updatedAt: null,
  };
};

// Create or Update (Upsert) Penilaian Tugas Akhir
export const savePenilaianTugasAkhir = async ({
  sidangRegistrationId,
  userId,
  userRole,
  nilai,
  catatanRevisi,
}) => {
  if (userRole !== "DOSEN") {
    const error = new Error(
      "Hanya dosen yang dapat melakukan penilaian tugas akhir"
    );
    error.statusCode = 403;
    throw error;
  }

  const currentDosen = await prisma.dosen.findUnique({
    where: { userId },
  });

  if (!currentDosen || currentDosen.deletedAt) {
    const error = new Error("Data dosen penilai tidak ditemukan");
    error.statusCode = 403;
    throw error;
  }

  const dosenPenilaiId = currentDosen.id;

  // Validasi pendaftaran sidang
  const sidangRegistration = await prisma.sidangRegistration.findUnique({
    where: { id: sidangRegistrationId },
    include: {
      mahasiswa: true,
    },
  });

  if (!sidangRegistration || sidangRegistration.deletedAt) {
    const error = new Error("Pendaftaran sidang tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  // Validasi waktu sidang: penilaian hanya boleh dilakukan saat atau setelah sidang dimulai
  if (!sidangRegistration.tglSidang) {
    const error = new Error(
      "Penilaian belum dapat dilakukan karena sidang belum memiliki jadwal"
    );
    error.statusCode = 400;
    throw error;
  }

  const tglSidang = new Date(sidangRegistration.tglSidang);
  if (isNaN(tglSidang.getTime())) {
    const error = new Error("Jadwal tanggal sidang tidak valid");
    error.statusCode = 400;
    throw error;
  }

  const now = new Date();
  if (now < tglSidang) {
    const error = new Error(
      "Penilaian belum dapat dilakukan karena sidang belum dimulai"
    );
    error.statusCode = 400;
    throw error;
  }

  // Tentukan peran penilai dan bobot penilai
  const { penilaiType, bobotPenilai, studyProgramId } =
    await resolvePenilaiInfo(dosenPenilaiId, sidangRegistration);

  if (!studyProgramId) {
    const error = new Error("Program studi mahasiswa tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  // Ambil master data kurikulum prodi untuk membangun Hierarchical Snapshot
  const cloList = await getMasterDataPenilaianProdi(studyProgramId);
  if (!cloList.length) {
    const error = new Error(
      "CLO / Jenis Asesmen belum dikonfigurasi untuk Program Studi ini"
    );
    error.statusCode = 400;
    throw error;
  }

  const snapshot = buildPenilaianSnapshot(cloList, nilai);

  // Upsert penilaian tugas akhir berdasarkan compound unique key (sidangRegistrationId, dosenPenilaiId)
  const savedPenilaian = await prisma.penilaianTugasAkhir.upsert({
    where: {
      sidangRegistrationId_dosenPenilaiId: {
        sidangRegistrationId,
        dosenPenilaiId,
      },
    },
    update: {
      bobotPenilai,
      nilai: snapshot,
      catatanRevisi:
        catatanRevisi !== undefined ? catatanRevisi || "" : undefined,
      penilaiType,
    },
    create: {
      bobotPenilai,
      nilai: snapshot,
      catatanRevisi: catatanRevisi || "",
      sidangRegistrationId,
      penilaiType,
      dosenPenilaiId,
    },
    include: {
      dosenPenilai: {
        include: { user: true, studyProgram: true, researchGroup: true },
      },
      dosenKaprodi: {
        include: { user: true, studyProgram: true, researchGroup: true },
      },
    },
  });

  return savedPenilaian;
};
