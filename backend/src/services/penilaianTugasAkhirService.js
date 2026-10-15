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
  const hasMultiplePembimbing = Boolean(
    sidangRegistration.dosenPembimbing1Id &&
      sidangRegistration.dosenPembimbing2Id
  );
  const hasMultiplePenguji = Boolean(
    sidangRegistration.dosenPenguji1Id &&
      sidangRegistration.dosenPenguji2Id
  );

  let bobotPenilai = 0.5;

  // Jika pembimbing atau penguji hanya 1 orang, bobot adalah 100% (1.0)
  if (penilaiType === "pembimbing" && !hasMultiplePembimbing) {
    bobotPenilai = 1.0;
  } else if (penilaiType === "penguji" && !hasMultiplePenguji) {
    bobotPenilai = 1.0;
  } else if (type && studyProgramId) {
    // Jika terdapat 2 penilai, cek skema master data prodi
    const skema = await prisma.skemaPenilaiProdi.findFirst({
      where: {
        studyProgramId,
        type,
        deletedAt: null,
      },
    });

    if (skema && skema.bobot != null) {
      bobotPenilai = Number(skema.bobot);
    } else {
      // Opsi A: Default jika tidak ditemukan di master data adalah 0.5 (50% - 50%)
      bobotPenilai = 0.5;
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

  // Pastikan belum ada Berita Acara untuk sidang ini (sidang belum ditutup)
  const existingBeritaAcara =
    await prisma.beritaAcaraSidangTugasAkhir.findFirst({
      where: { sidangRegistrationId, deletedAt: null },
    });
  if (existingBeritaAcara) {
    const error = new Error(
      "Penilaian tidak dapat diubah karena sidang sudah ditutup dan Berita Acara telah diterbitkan"
    );
    error.statusCode = 400;
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

// Konversi Nilai Angka ke Nilai Huruf berdasarkan Rubrik Penilaian Sidang
export const konversiNilaiHuruf = (nilai) => {
  if (nilai === null || nilai === undefined || isNaN(nilai)) return "-";
  const score = Number(nilai);
  if (score > 85) return "A";
  if (score > 75) return "AB";
  if (score > 65) return "B";
  if (score > 60) return "BC";
  if (score > 50) return "C";
  if (score > 40) return "D";
  return "E";
};

// Tentukan Keterangan Kelulusan berdasarkan Nilai Huruf
export const tentukanKeteranganKelulusan = (nilaiHuruf) => {
  if (["A", "AB", "B", "BC", "C"].includes(nilaiHuruf)) {
    return "Lulus";
  }
  if (nilaiHuruf === "D") {
    return "Lulus Bersyarat";
  }
  if (nilaiHuruf === "E") {
    return "Tidak Lulus";
  }
  return "Belum Lengkap";
};

// Get All Penilaian by Sidang Registration ID + Perhitungan Matriks Berita Acara
export const getAllPenilaianBySidangRegistrationId = async ({
  sidangRegistrationId,
}) => {
  // 1. Ambil data pendaftaran sidang beserta mahasiswa dan seluruh dosen penilai
  const sidangRegistration = await prisma.sidangRegistration.findUnique({
    where: { id: sidangRegistrationId },
    include: {
      mahasiswa: {
        include: { studyProgram: true, user: true },
      },
      ruanganSidang: true,
      dosenPembimbing1: {
        include: { user: true, studyProgram: true, researchGroup: true },
      },
      dosenPembimbing2: {
        include: { user: true, studyProgram: true, researchGroup: true },
      },
      dosenPenguji1: {
        include: { user: true, studyProgram: true, researchGroup: true },
      },
      dosenPenguji2: {
        include: { user: true, studyProgram: true, researchGroup: true },
      },
      penilaianTugasAkhir: {
        where: { deletedAt: null },
        include: {
          dosenPenilai: {
            include: { user: true, studyProgram: true, researchGroup: true },
          },
          dosenKaprodi: {
            include: { user: true, studyProgram: true, researchGroup: true },
          },
        },
      },
      beritaAcaraSidangTugasAkhirs: {
        where: { deletedAt: null },
      },
    },
  });

  if (!sidangRegistration || sidangRegistration.deletedAt) {
    const error = new Error("Pendaftaran sidang tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const studyProgramId = sidangRegistration.mahasiswa?.studyProgramId;
  if (!studyProgramId) {
    const error = new Error("Program studi mahasiswa tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  // 2. Ambil master kurikulum CLO prodi mahasiswa
  const cloList = await getMasterDataPenilaianProdi(studyProgramId);

  const hasMultiplePembimbing = Boolean(
    sidangRegistration.dosenPembimbing1 &&
      sidangRegistration.dosenPembimbing2
  );
  const hasMultiplePenguji = Boolean(
    sidangRegistration.dosenPenguji1 &&
      sidangRegistration.dosenPenguji2
  );

  // 3. Ambil konfigurasi skema penilai prodi (digunakan untuk fallback preview jika penilai belum submit)
  const skemaPenilaiList = await prisma.skemaPenilaiProdi.findMany({
    where: { studyProgramId, deletedAt: null },
  });

  const getBobotDefaultPenilai = (role, penilaiType) => {
    // Jika penilai tunggal -> bobot otomatis 100% (1.0)
    if (penilaiType === "pembimbing" && !hasMultiplePembimbing) return 1.0;
    if (penilaiType === "penguji" && !hasMultiplePenguji) return 1.0;

    // Cek master data skema penilai prodi mahasiswa (contoh: Bisdig punya aturan pembimbing_1 = 0.6)
    const found = skemaPenilaiList.find((s) => s.type === role);
    if (found && found.bobot != null) {
      return Number(found.bobot);
    }

    // Default Opsi A jika prodi tidak memiliki aturan khusus: 50% (0.5)
    return 0.5;
  };

  // 4. Ambil konfigurasi skema perhitungan nilai berita acara prodi (bobot Ra vs Rb per CLO)
  const skemaPerhitunganList =
    await prisma.skemaPerhitunganNilaiBeritaAcaraTugasAkhirProdi.findMany({
      where: { studyProgramId, deletedAt: null },
    });

  const getBobotRaRbClo = (cloId) => {
    const specific = skemaPerhitunganList.find((s) => s.cloProdiId === cloId);
    if (specific) {
      return {
        bobotPembimbing: Number(specific.bobotRataRataPembimbing),
        bobotPenguji: Number(specific.bobotRataRataPenguji),
      };
    }
    const defaultProdi = skemaPerhitunganList.find(
      (s) => s.cloProdiId === null
    );
    if (defaultProdi) {
      return {
        bobotPembimbing: Number(defaultProdi.bobotRataRataPembimbing),
        bobotPenguji: Number(defaultProdi.bobotRataRataPenguji),
      };
    }
    // Fallback default prodi umum (60% pembimbing, 40% penguji)
    return { bobotPembimbing: 0.6, bobotPenguji: 0.4 };
  };

  // 5. Susun daftar penilai yang ditugaskan pada sidang ini
  const assignedRoles = [
    {
      role: "pembimbing_1",
      penilaiType: "pembimbing",
      dosen: sidangRegistration.dosenPembimbing1,
      defaultBobot: hasMultiplePembimbing ? 0.5 : 1.0,
    },
    {
      role: "pembimbing_2",
      penilaiType: "pembimbing",
      dosen: sidangRegistration.dosenPembimbing2,
      defaultBobot: 0.5,
    },
    {
      role: "penguji_1",
      penilaiType: "penguji",
      dosen: sidangRegistration.dosenPenguji1,
      defaultBobot: hasMultiplePenguji ? 0.5 : 1.0,
    },
    {
      role: "penguji_2",
      penilaiType: "penguji",
      dosen: sidangRegistration.dosenPenguji2,
      defaultBobot: 0.5,
    },
  ];

  // Filter hanya dosen yang benar-benar ditugaskan pada pendaftaran sidang ini
  const activePenilai = assignedRoles.filter((item) => item.dosen !== null);

  // Buat lookup map penilaian berdasarkan dosenPenilaiId
  const existingPenilaianMap = new Map();
  for (const p of sidangRegistration.penilaianTugasAkhir) {
    existingPenilaianMap.set(p.dosenPenilaiId, p);
  }

  // Helper untuk menghitung skor terbobot per CLO dari snapshot penilaian dosen
  const hitungSkorCloDosen = (snapshotNilai, cloId) => {
    if (!Array.isArray(snapshotNilai)) return null;
    const cloItem = snapshotNilai.find(
      (c) => c.cloProdiId === cloId || c.cloName === cloId
    );
    if (!cloItem || !Array.isArray(cloItem.asesmen) || cloItem.asesmen.length === 0) {
      return null;
    }

    let totalBobot = 0;
    let totalTertimbang = 0;
    let anyFilled = false;

    for (const a of cloItem.asesmen) {
      if (a.nilai !== null && a.nilai !== undefined) {
        anyFilled = true;
        const b = Number(a.bobot) || 0;
        const n = Number(a.nilai) || 0;
        totalBobot += b;
        totalTertimbang += b * n;
      }
    }

    if (!anyFilled || totalBobot === 0) return null;
    return Number((totalTertimbang / totalBobot).toFixed(2));
  };

  // Susun detail penilaian untuk setiap penilai yang ditugaskan
  const penilaianList = activePenilai.map((p) => {
    const existing = existingPenilaianMap.get(p.dosen.id);
    const isSubmitted = Boolean(existing);
    const bobot =
      existing?.bobotPenilai != null
        ? Number(existing.bobotPenilai)
        : getBobotDefaultPenilai(p.role, p.penilaiType);

    const skorPerClo = cloList.map((clo) => ({
      cloProdiId: clo.id,
      cloName: clo.name,
      skor: isSubmitted ? hitungSkorCloDosen(existing.nilai, clo.id) : null,
    }));

    return {
      penilaiRole: p.role,
      penilaiType: p.penilaiType,
      bobotPenilai: bobot,
      isSubmitted,
      penilaianId: existing?.id || null,
      dosen: p.dosen,
      catatanRevisi: existing?.catatanRevisi || "",
      nilai: isSubmitted ? existing.nilai : null,
      skorPerClo,
    };
  });

  const submittedCount = penilaianList.filter((p) => p.isSubmitted).length;
  const isAllSubmitted =
    penilaianList.length > 0 && submittedCount === penilaianList.length;

  // 6. Hitung skemaPerhitunganNilai untuk Berita Acara (Per CLO)
  const p1 = penilaianList.find((p) => p.penilaiRole === "pembimbing_1");
  const p2 = penilaianList.find((p) => p.penilaiRole === "pembimbing_2");
  const u1 = penilaianList.find((p) => p.penilaiRole === "penguji_1");
  const u2 = penilaianList.find((p) => p.penilaiRole === "penguji_2");

  const wP1 = p1 ? p1.bobotPenilai : 0;
  const wP2 = p2 ? p2.bobotPenilai : 0;
  const totalWP = wP1 + wP2 || 1;

  const wU1 = u1 ? u1.bobotPenilai : 0;
  const wU2 = u2 ? u2.bobotPenilai : 0;
  const totalWU = wU1 + wU2 || 1;

  let totalNilaiAngka = 0;
  let canCalculateTotal = isAllSubmitted && cloList.length > 0;

  const skemaPerhitunganNilai = cloList.map((clo) => {
    // Total bobot CLO terhadap nilai akhir (sum of bobot jenisAsesmen)
    const bobotClo = Number(
      (clo.jenisAsesmenClo || [])
        .reduce((sum, a) => sum + (Number(a.bobot) || 0), 0)
        .toFixed(2)
    );

    const { bobotPembimbing, bobotPenguji } = getBobotRaRbClo(clo.id);

    // Ambil skor individual masing-masing dosen penilai untuk CLO ini
    const scoreP1 = p1 ? hitungSkorCloDosen(p1.nilai, clo.id) : null;
    const scoreP2 = p2 ? hitungSkorCloDosen(p2.nilai, clo.id) : null;
    const scoreU1 = u1 ? hitungSkorCloDosen(u1.nilai, clo.id) : null;
    const scoreU2 = u2 ? hitungSkorCloDosen(u2.nilai, clo.id) : null;

    // Hitung Rata-rata Pembimbing (Ra)
    let rataRataPembimbing = null;
    if (p1 && p2) {
      if (scoreP1 !== null && scoreP2 !== null) {
        rataRataPembimbing = Number(
          ((scoreP1 * wP1 + scoreP2 * wP2) / totalWP).toFixed(2)
        );
      }
    } else if (p1 && scoreP1 !== null) {
      rataRataPembimbing = scoreP1;
    }

    // Hitung Rata-rata Penguji (Rb)
    let rataRataPenguji = null;
    if (u1 && u2) {
      if (scoreU1 !== null && scoreU2 !== null) {
        rataRataPenguji = Number(
          ((scoreU1 * wU1 + scoreU2 * wU2) / totalWU).toFixed(2)
        );
      }
    } else if (u1 && scoreU1 !== null) {
      rataRataPenguji = scoreU1;
    }

    // Hitung Nilai Hasil Perhitungan CLO = (Ra * bobotPembimbing) + (Rb * bobotPenguji)
    let nilaiHasilPerhitungan = null;
    let nilaiTertimbang = null;

    if (rataRataPembimbing !== null && rataRataPenguji !== null) {
      nilaiHasilPerhitungan = Number(
        (
          rataRataPembimbing * bobotPembimbing +
          rataRataPenguji * bobotPenguji
        ).toFixed(2)
      );
      nilaiTertimbang = Number((nilaiHasilPerhitungan * bobotClo).toFixed(2));
      totalNilaiAngka += nilaiTertimbang;
    } else {
      canCalculateTotal = false;
    }

    return {
      cloProdiId: clo.id,
      cloName: clo.name,
      deskripsi: clo.description,
      bobotClo,
      bobotPembimbing,
      bobotPenguji,
      nilaiPembimbing1: scoreP1,
      nilaiPembimbing2: scoreP2,
      rataRataPembimbing,
      nilaiPenguji1: scoreU1,
      nilaiPenguji2: scoreU2,
      rataRataPenguji,
      nilaiHasilPerhitungan,
      nilaiTertimbang,
    };
  });

  const finalTotalAngka = canCalculateTotal
    ? Number(totalNilaiAngka.toFixed(2))
    : null;

  const calculatedNilaiHuruf = canCalculateTotal
    ? konversiNilaiHuruf(finalTotalAngka)
    : null;

  const rekomendasiKeterangan = calculatedNilaiHuruf
    ? tentukanKeteranganKelulusan(calculatedNilaiHuruf)
    : null;

  // 7. Cek apakah Berita Acara sudah terbit sebelumnya
  const existingBeritaAcara =
    sidangRegistration.beritaAcaraSidangTugasAkhirs &&
    sidangRegistration.beritaAcaraSidangTugasAkhirs.length > 0
      ? sidangRegistration.beritaAcaraSidangTugasAkhirs[0]
      : null;

  const isBeritaAcaraPublished = Boolean(existingBeritaAcara);

  // 8. Kumpulkan catatan revisi dari semua dosen yang telah mengisi
  const catatanRevisiList = penilaianList
    .filter(
      (p) => p.isSubmitted && p.catatanRevisi && p.catatanRevisi.trim() !== ""
    )
    .map((p) => ({
      dosenId: p.dosen.id,
      dosenName: p.dosen.name,
      penilaiRole: p.penilaiRole,
      penilaiType: p.penilaiType,
      catatanRevisi: p.catatanRevisi,
    }));

  return {
    sidangRegistrationId,
    mahasiswa: {
      id: sidangRegistration.mahasiswa?.id,
      name: sidangRegistration.mahasiswa?.name,
      nim: sidangRegistration.mahasiswa?.nim,
      studyProgram: sidangRegistration.mahasiswa?.studyProgram
        ? {
            id: sidangRegistration.mahasiswa.studyProgram.id,
            name: sidangRegistration.mahasiswa.studyProgram.name,
          }
        : null,
      judulTugasAkhir:
        sidangRegistration.judulTugasAkhirIndonesia ||
        sidangRegistration.judulTugasAkhirInggris ||
        "-",
    },
    jadwalSidang: {
      tglSidang: sidangRegistration.tglSidang,
      ruangan: sidangRegistration.ruanganSidang?.name || null,
    },
    statusPenilaian: {
      totalPenilai: activePenilai.length,
      submittedCount,
      isAllSubmitted,
    },
    penilaianList,
    beritaAcaraCalculation: {
      isBeritaAcaraPublished,
      beritaAcaraId: existingBeritaAcara?.id || null,
      skemaPerhitunganNilai: isBeritaAcaraPublished
        ? existingBeritaAcara.skemaPerhitunganNilai
        : skemaPerhitunganNilai,
      totalNilaiAngka: isBeritaAcaraPublished
        ? Number(existingBeritaAcara.nilaiAkhir)
        : finalTotalAngka,
      nilaiAkhir: isBeritaAcaraPublished
        ? Number(existingBeritaAcara.nilaiAkhir)
        : finalTotalAngka,
      nilaiHuruf: isBeritaAcaraPublished
        ? existingBeritaAcara.nilaiHuruf
        : calculatedNilaiHuruf,
      keterangan: isBeritaAcaraPublished
        ? existingBeritaAcara.keterangan
        : null,
      rekomendasiKeterangan,
      justifikasi: isBeritaAcaraPublished
        ? existingBeritaAcara.justifikasi
        : null,
      catatanRevisiList,
    },
  };
};

// Menutup Sidang Tugas Akhir (Khusus Dosen Pembimbing 1)
export const tutupSidang = async ({
  sidangRegistrationId,
  userId,
  deadlineRevisi,
  keterangan,
  nilaiAkhir,
  justifikasi,
}) => {
  // 1. Ambil data dosen dari userId (access token)
  const currentDosen = await prisma.dosen.findUnique({
    where: { userId },
  });

  if (!currentDosen || currentDosen.deletedAt) {
    const error = new Error("Data dosen tidak ditemukan");
    error.statusCode = 403;
    throw error;
  }

  // 2. Ambil data pendaftaran sidang beserta dosen penilai dan riwayat penilaian
  const sidangRegistration = await prisma.sidangRegistration.findUnique({
    where: { id: sidangRegistrationId },
    include: {
      mahasiswa: {
        include: { studyProgram: true, user: true },
      },
      dosenPembimbing1: { include: { user: true } },
      dosenPembimbing2: { include: { user: true } },
      dosenPenguji1: { include: { user: true } },
      dosenPenguji2: { include: { user: true } },
      penilaianTugasAkhir: { where: { deletedAt: null } },
      beritaAcaraSidangTugasAkhirs: { where: { deletedAt: null } },
    },
  });

  if (!sidangRegistration || sidangRegistration.deletedAt) {
    const error = new Error("Pendaftaran sidang tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  // 3. Pastikan yang menutup sidang adalah DOSEN PEMBIMBING 1
  if (sidangRegistration.dosenPembimbing1Id !== currentDosen.id) {
    const error = new Error(
      "Hanya Dosen Pembimbing 1 yang memiliki hak akses untuk menutup sidang tugas akhir"
    );
    error.statusCode = 403;
    throw error;
  }

  // 4. Pastikan sidang belum pernah ditutup sebelumnya
  if (
    sidangRegistration.beritaAcaraSidangTugasAkhirs &&
    sidangRegistration.beritaAcaraSidangTugasAkhirs.length > 0
  ) {
    const error = new Error(
      "Sidang ini sudah ditutup dan Berita Acara telah diterbitkan"
    );
    error.statusCode = 400;
    throw error;
  }

  // 5. Pastikan semua dosen penilai yang ditugaskan sudah menyimpan penilaian
  const assignedPenilai = [];
  if (sidangRegistration.dosenPembimbing1) {
    assignedPenilai.push({
      role: "Pembimbing 1",
      dosen: sidangRegistration.dosenPembimbing1,
    });
  }
  if (sidangRegistration.dosenPembimbing2) {
    assignedPenilai.push({
      role: "Pembimbing 2",
      dosen: sidangRegistration.dosenPembimbing2,
    });
  }
  if (sidangRegistration.dosenPenguji1) {
    assignedPenilai.push({
      role: "Penguji 1",
      dosen: sidangRegistration.dosenPenguji1,
    });
  }
  if (sidangRegistration.dosenPenguji2) {
    assignedPenilai.push({
      role: "Penguji 2",
      dosen: sidangRegistration.dosenPenguji2,
    });
  }

  const existingPenilaianMap = new Map();
  for (const p of sidangRegistration.penilaianTugasAkhir) {
    existingPenilaianMap.set(p.dosenPenilaiId, p);
  }

  const missingPenilai = [];
  for (const p of assignedPenilai) {
    if (!existingPenilaianMap.has(p.dosen.id)) {
      missingPenilai.push(`${p.role} (${p.dosen.name || "Dosen"})`);
    }
  }

  if (missingPenilai.length > 0) {
    const error = new Error(
      `Sidang belum dapat ditutup karena dosen penilai berikut belum menyimpan penilaian: ${missingPenilai.join(", ")}`
    );
    error.statusCode = 400;
    throw error;
  }

  // 6. Hitung hasil kalkulasi nilai sidang dan skemaPerhitunganNilai Berita Acara
  const rekapData = await getAllPenilaianBySidangRegistrationId({
    sidangRegistrationId,
  });

  const {
    skemaPerhitunganNilai,
    totalNilaiAngka: calculatedScore,
  } = rekapData.beritaAcaraCalculation;

  if (calculatedScore === null || calculatedScore === undefined) {
    const error = new Error(
      "Kalkulasi nilai akhir sidang belum dapat dihitung secara lengkap"
    );
    error.statusCode = 400;
    throw error;
  }

  // 7. Tentukan nilaiAkhir (angka): default adalah hasil perhitungan
  let finalNilaiAngka = calculatedScore;
  let isDifferent = false;

  if (
    nilaiAkhir !== undefined &&
    nilaiAkhir !== null &&
    String(nilaiAkhir).trim() !== ""
  ) {
    const customScore = Number(nilaiAkhir);
    if (isNaN(customScore) || customScore < 0 || customScore > 100) {
      const error = new Error("Nilai akhir harus berupa angka antara 0 dan 100");
      error.statusCode = 400;
      throw error;
    }

    if (Math.abs(customScore - calculatedScore) >= 0.01) {
      isDifferent = true;
      if (!justifikasi || justifikasi.trim() === "") {
        const error = new Error(
          "Justifikasi wajib diisi apabila nilai akhir berbeda dari hasil perhitungan"
        );
        error.statusCode = 400;
        throw error;
      }
    }
    finalNilaiAngka = Number(customScore.toFixed(2));
  }

  // 8. Tentukan nilaiHuruf secara otomatis berdasarkan rubrik sidang
  const nilaiHuruf = konversiNilaiHuruf(finalNilaiAngka);

  // 9. Simpan atau perbarui RevisiTugasAkhir
  const parsedDeadline = new Date(deadlineRevisi);
  const existingRevisi = await prisma.revisiTugasAkhir.findFirst({
    where: { sidangRegistrationId, deletedAt: null },
  });

  let savedRevisi;
  if (existingRevisi) {
    savedRevisi = await prisma.revisiTugasAkhir.update({
      where: { id: existingRevisi.id },
      data: {
        deadlineRevisi: parsedDeadline,
        tglSetujuiUntukRevisi: new Date(),
        setujuiUntukRevisiId: currentDosen.id,
      },
    });
  } else {
    savedRevisi = await prisma.revisiTugasAkhir.create({
      data: {
        sidangRegistrationId,
        deadlineRevisi: parsedDeadline,
        tglSetujuiUntukRevisi: new Date(),
        setujuiUntukRevisiId: currentDosen.id,
      },
    });
  }

  // 10. Terbitkan BeritaAcaraSidangTugasAkhir
  const beritaAcara = await prisma.beritaAcaraSidangTugasAkhir.create({
    data: {
      sidangRegistrationId,
      skemaPerhitunganNilai,
      nilaiAkhir: String(finalNilaiAngka),
      nilaiHuruf,
      keterangan,
      justifikasi: isDifferent ? justifikasi.trim() : (justifikasi || null),
    },
    include: {
      sidangRegistration: {
        include: {
          mahasiswa: { include: { studyProgram: true } },
        },
      },
    },
  });

  return {
    beritaAcara,
    revisiTugasAkhir: savedRevisi,
  };
};

