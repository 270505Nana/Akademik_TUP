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
  for (const item of nilaiInputList || []) {
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
      `Komponen asesmen berikut belum dinilai: ${missingAsesmen.join(", ")}`,
    );
    error.statusCode = 400;
    throw error;
  }

  return snapshot;
};

// Helper format profil dosen sederhana untuk respons penilaian
const formatDosenSimple = (dosen) => {
  if (!dosen) return null;
  return {
    id: dosen.id,
    name: dosen.name || "",
    nip: dosen.nip || "",
    kodeDosen: dosen.kodeDosen || null,
  };
};

// Helper untuk menghitung skor terbobot per CLO dari snapshot penilaian dosen
const hitungSkorCloDosen = (snapshotNilai, cloId) => {
  if (!Array.isArray(snapshotNilai)) return null;
  const cloItem = snapshotNilai.find(
    (c) => c.cloProdiId === cloId || c.cloName === cloId,
  );
  if (
    !cloItem ||
    !Array.isArray(cloItem.asesmen) ||
    cloItem.asesmen.length === 0
  ) {
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

// Helper menentukan peran dosen dan bobot penilai
const resolvePenilaiInfo = async (dosenPenilaiId, sidangRegistration) => {
  let peran = null;

  if (dosenPenilaiId === sidangRegistration.dosenPembimbing1Id) {
    peran = "dosenPembimbing1";
  } else if (dosenPenilaiId === sidangRegistration.dosenPembimbing2Id) {
    peran = "dosenPembimbing2";
  } else if (dosenPenilaiId === sidangRegistration.dosenPenguji1Id) {
    peran = "dosenPenguji1";
  } else if (dosenPenilaiId === sidangRegistration.dosenPenguji2Id) {
    peran = "dosenPenguji2";
  }

  if (!peran) {
    const error = new Error(
      "Dosen tidak terdaftar sebagai pembimbing atau penguji pada sidang ini",
    );
    error.statusCode = 403;
    throw error;
  }

  const studyProgramId = sidangRegistration.mahasiswa?.studyProgramId;
  const hasMultiplePembimbing = Boolean(
    sidangRegistration.dosenPembimbing1Id &&
    sidangRegistration.dosenPembimbing2Id,
  );
  const hasMultiplePenguji = Boolean(
    sidangRegistration.dosenPenguji1Id && sidangRegistration.dosenPenguji2Id,
  );

  let bobotPenilai = 0.5;

  const isPembimbing = peran.startsWith("dosenPembimbing");
  const isPenguji = peran.startsWith("dosenPenguji");

  // Jika pembimbing atau penguji hanya 1 orang, bobot adalah 100% (1.0)
  if (isPembimbing && !hasMultiplePembimbing) {
    bobotPenilai = 1.0;
  } else if (isPenguji && !hasMultiplePenguji) {
    bobotPenilai = 1.0;
  } else if (studyProgramId) {
    // Jika terdapat 2 penilai, cek skema master data prodi
    try {
      const skema = await prisma.skemaPenilaiProdi.findFirst({
        where: {
          studyProgramId,
          peran,
          deletedAt: null,
        },
      });

      if (skema && skema.bobot != null) {
        bobotPenilai = Number(skema.bobot);
      } else {
        bobotPenilai = 0.5;
      }
    } catch {
      bobotPenilai = 0.5;
    }
  }

  return { peran, bobotPenilai, studyProgramId };
};

// Get Penilaian Tugas Akhir by Sidang Registration ID (Dosen me)
export const getPenilaianBySidangRegistrationId = async ({
  sidangRegistrationId,
  userId,
  userRole,
}) => {
  if (userRole !== "DOSEN") {
    const error = new Error(
      "Hanya dosen yang dapat mengakses penilaian tugas akhir",
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

  const sidangRegistration = await prisma.sidangRegistration.findUnique({
    where: { id: sidangRegistrationId },
    include: {
      mahasiswa: {
        include: { studyProgram: true },
      },
      ruanganSidang: true,
      revisiTugasAkhir: {
        where: { deletedAt: null },
      },
    },
  });

  if (!sidangRegistration || sidangRegistration.deletedAt) {
    const error = new Error("Pendaftaran sidang tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const { peran, bobotPenilai, studyProgramId } = await resolvePenilaiInfo(
    currentDosen.id,
    sidangRegistration,
  );

  if (!studyProgramId) {
    const error = new Error("Program studi mahasiswa tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const cloList = await getMasterDataPenilaianProdi(studyProgramId);

  // Cek apakah sidang sudah ditutup
  const revisiTugasAkhir =
    sidangRegistration.revisiTugasAkhir &&
    sidangRegistration.revisiTugasAkhir.length > 0
      ? sidangRegistration.revisiTugasAkhir.find(
          (r) => r.tglSetujuiUntukRevisi !== null,
        ) || null
      : null;

  const isSidangClosed = Boolean(revisiTugasAkhir);

  // Cek apakah penilaian sudah pernah disimpan di DB
  const existingPenilaian = await prisma.penilaianTugasAkhir.findUnique({
    where: {
      sidangRegistrationId_dosenPenilaiId: {
        sidangRegistrationId,
        dosenPenilaiId: currentDosen.id,
      },
    },
  });

  const isSubmitted = Boolean(existingPenilaian && !existingPenilaian.deletedAt);
  const template = buildPenilaianTemplate(cloList);

  const skorPerClo = cloList.map((clo) => ({
    cloProdiId: clo.id,
    cloName: clo.name,
    skor: isSubmitted ? hitungSkorCloDosen(existingPenilaian.nilai, clo.id) : null,
  }));

  const penilaianData = {
    id: isSubmitted ? existingPenilaian.id : null,
    peran: isSubmitted ? existingPenilaian.peran : peran,
    bobotPenilai: isSubmitted ? Number(existingPenilaian.bobotPenilai) : bobotPenilai,
    isSubmitted,
    dosen: formatDosenSimple(currentDosen),
    catatanRevisi: isSubmitted ? existingPenilaian.catatanRevisi || "" : "",
    nilai: isSubmitted ? existingPenilaian.nilai : template,
    skorPerClo,
  };

  return {
    sidangRegistrationId,
    isSidangClosed,
    mahasiswa: {
      id: sidangRegistration.mahasiswa?.id || null,
      name: sidangRegistration.mahasiswa?.name || "",
      nim: sidangRegistration.mahasiswa?.nim || "",
      studyProgram: sidangRegistration.mahasiswa?.studyProgram?.name || "",
      judulTugasAkhir:
        sidangRegistration.judulTugasAkhirIndonesia ||
        sidangRegistration.judulTugasAkhirInggris ||
        "-",
    },
    jadwalSidang: {
      tglSidang: sidangRegistration.tglSidang,
      ruangan: sidangRegistration.ruanganSidang?.name || null,
    },
    penilaian: penilaianData,
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
      "Hanya dosen yang dapat melakukan penilaian tugas akhir",
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

  // Pastikan belum ada Berita Acara atau revisi aktif untuk sidang ini (sidang belum ditutup)
  const existingRevisi = await prisma.revisiTugasAkhir.findFirst({
    where: {
      sidangRegistrationId,
      tglSetujuiUntukRevisi: { not: null },
      deletedAt: null,
    },
  });
  const existingBeritaAcara =
    await prisma.beritaAcaraSidangTugasAkhir.findFirst({
      where: { sidangRegistrationId, deletedAt: null },
    });
  if (existingRevisi || existingBeritaAcara) {
    const error = new Error(
      "Penilaian tidak dapat diubah karena sidang sudah ditutup",
    );
    error.statusCode = 400;
    throw error;
  }

  // Validasi waktu sidang: penilaian hanya boleh dilakukan saat atau setelah sidang dimulai
  if (!sidangRegistration.tglSidang) {
    const error = new Error(
      "Penilaian belum dapat dilakukan karena sidang belum memiliki jadwal",
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
      "Penilaian belum dapat dilakukan karena sidang belum dimulai",
    );
    error.statusCode = 400;
    throw error;
  }

  // Tentukan peran penilai dan bobot penilai
  const { peran, bobotPenilai, studyProgramId } = await resolvePenilaiInfo(
    dosenPenilaiId,
    sidangRegistration,
  );

  if (!studyProgramId) {
    const error = new Error("Program studi mahasiswa tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  // Ambil master data kurikulum prodi untuk membangun Hierarchical Snapshot
  const cloList = await getMasterDataPenilaianProdi(studyProgramId);
  if (!cloList.length) {
    const error = new Error(
      "CLO / Jenis Asesmen belum dikonfigurasi untuk Program Studi ini",
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
      peran,
    },
    create: {
      bobotPenilai,
      nilai: snapshot,
      catatanRevisi: catatanRevisi || "",
      sidangRegistrationId,
      peran,
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

// Get All Penilaian by Sidang Registration ID
export const getAllPenilaianBySidangRegistrationId = async ({
  sidangRegistrationId,
  userId,
  userRole,
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
      revisiTugasAkhir: {
        where: { deletedAt: null },
      },
    },
  });

  if (!sidangRegistration || sidangRegistration.deletedAt) {
    const error = new Error("Pendaftaran sidang tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  // 2. Validasi Hak Akses Dosen: hanya dosen yang terdaftar pada sidang ini (atau Kaprodi terkait) yang diizinkan
  if (userRole === "DOSEN") {
    const currentDosen = await prisma.dosen.findUnique({
      where: { userId, deletedAt: null },
    });

    if (!currentDosen) {
      const error = new Error("Data dosen tidak ditemukan");
      error.statusCode = 403;
      throw error;
    }

    const assignedDosenIds = [
      sidangRegistration.dosenPembimbing1Id,
      sidangRegistration.dosenPembimbing2Id,
      sidangRegistration.dosenPenguji1Id,
      sidangRegistration.dosenPenguji2Id,
    ].filter(Boolean);

    const isAssigned = assignedDosenIds.includes(currentDosen.id);
    const isKaprodi =
      Boolean(currentDosen.isKetuaProdi) &&
      Boolean(currentDosen.studyProgramId) &&
      currentDosen.studyProgramId === sidangRegistration.mahasiswa?.studyProgramId;

    if (!isAssigned && !isKaprodi) {
      const error = new Error(
        "Akses ditolak. Anda tidak memiliki hak akses untuk melihat rekap penilaian sidang ini"
      );
      error.statusCode = 403;
      throw error;
    }
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
    sidangRegistration.dosenPembimbing1 && sidangRegistration.dosenPembimbing2,
  );
  const hasMultiplePenguji = Boolean(
    sidangRegistration.dosenPenguji1 && sidangRegistration.dosenPenguji2,
  );

  // 3. Ambil konfigurasi skema penilai prodi (digunakan untuk fallback preview jika penilai belum submit)
  const skemaPenilaiList = await prisma.skemaPenilaiProdi.findMany({
    where: { studyProgramId, deletedAt: null },
  });

  const getBobotDefaultPenilai = (peran) => {
    // Jika penilai tunggal -> bobot otomatis 100% (1.0)
    if (peran.startsWith("dosenPembimbing") && !hasMultiplePembimbing)
      return 1.0;
    if (peran.startsWith("dosenPenguji") && !hasMultiplePenguji) return 1.0;

    // Cek master data skema penilai prodi mahasiswa
    const found = skemaPenilaiList.find((s) => s.peran === peran);
    if (found && found.bobot != null) {
      return Number(found.bobot);
    }

    // Default Opsi A jika prodi tidak memiliki aturan khusus: 50% (0.5)
    return 0.5;
  };

  // 5. Susun daftar penilai yang ditugaskan pada sidang ini
  const assignedRoles = [
    {
      peran: "dosenPembimbing1",
      dosen: sidangRegistration.dosenPembimbing1,
      defaultBobot: hasMultiplePembimbing ? 0.5 : 1.0,
    },
    {
      peran: "dosenPembimbing2",
      dosen: sidangRegistration.dosenPembimbing2,
      defaultBobot: 0.5,
    },
    {
      peran: "dosenPenguji1",
      dosen: sidangRegistration.dosenPenguji1,
      defaultBobot: hasMultiplePenguji ? 0.5 : 1.0,
    },
    {
      peran: "dosenPenguji2",
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

  // Susun detail penilaian untuk setiap penilai yang ditugaskan
  const penilaian = activePenilai.map((p) => {
    const existing = existingPenilaianMap.get(p.dosen.id);
    const isSubmitted = Boolean(existing);
    const bobot =
      existing?.bobotPenilai != null
        ? Number(existing.bobotPenilai)
        : getBobotDefaultPenilai(p.peran);

    const skorPerClo = cloList.map((clo) => ({
      cloProdiId: clo.id,
      cloName: clo.name,
      skor: isSubmitted ? hitungSkorCloDosen(existing.nilai, clo.id) : null,
    }));

    return {
      id: existing?.id || null,
      peran: existing?.peran || p.peran,
      bobotPenilai: bobot,
      isSubmitted,
      dosen: formatDosenSimple(p.dosen),
      catatanRevisi: existing?.catatanRevisi || "",
      nilai: isSubmitted ? existing.nilai : buildPenilaianTemplate(cloList),
      skorPerClo,
    };
  });

  const submittedCount = penilaian.filter((p) => p.isSubmitted).length;
  const isAllSubmitted =
    penilaian.length > 0 && submittedCount === penilaian.length;

  // 5. Ambil data revisi tugas akhir untuk mengetahui status penutupan sidang
  const revisiTugasAkhir =
    sidangRegistration.revisiTugasAkhir &&
    sidangRegistration.revisiTugasAkhir.length > 0
      ? sidangRegistration.revisiTugasAkhir.find(
          (r) => r.tglSetujuiUntukRevisi !== null,
        ) || null
      : null;

  const isSidangClosed = Boolean(revisiTugasAkhir);

  return {
    sidangRegistrationId,
    isSidangClosed,
    mahasiswa: {
      id: sidangRegistration.mahasiswa?.id || null,
      name: sidangRegistration.mahasiswa?.name || "",
      nim: sidangRegistration.mahasiswa?.nim || "",
      studyProgram: sidangRegistration.mahasiswa?.studyProgram?.name || "",
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
    penilaian,
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

// Menutup Sidang Tugas Akhir (Khusus Dosen Pembimbing 1)
export const tutupSidang = async ({
  sidangRegistrationId,
  userId,
  deadlineRevisi,
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
      revisiTugasAkhir: { where: { deletedAt: null } },
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
      "Hanya Dosen Pembimbing 1 yang memiliki hak akses untuk menutup sidang tugas akhir",
    );
    error.statusCode = 403;
    throw error;
  }

  // 4. Pastikan sidang belum pernah ditutup sebelumnya
  const existingClosedRevisi = (sidangRegistration.revisiTugasAkhir || []).find(
    (r) => r.tglSetujuiUntukRevisi !== null,
  );
  const existingBeritaAcara =
    sidangRegistration.beritaAcaraSidangTugasAkhirs &&
    sidangRegistration.beritaAcaraSidangTugasAkhirs.length > 0;

  if (existingClosedRevisi || existingBeritaAcara) {
    const error = new Error("Sidang ini sudah ditutup sebelumnya");
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
      `Sidang belum dapat ditutup karena dosen penilai berikut belum menyimpan penilaian: ${missingPenilai.join(", ")}`,
    );
    error.statusCode = 400;
    throw error;
  }

  // 6. Simpan atau perbarui RevisiTugasAkhir
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
        status: "IN_PROGRESS",
      },
    });
  }

  return {
    revisiTugasAkhir: savedRevisi,
  };
};
