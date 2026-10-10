import prisma from "../config/prisma.js";

// Get Penilaian Tugas Akhir by Sidang Registration ID
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
  });

  if (!currentDosen || currentDosen.deletedAt) {
    const error = new Error("Data dosen tidak ditemukan");
    error.statusCode = 403;
    throw error;
  }

  // Ambil data langsung dari model PenilaianTugasAkhir
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

  if (!penilaian || penilaian.deletedAt) {
    const error = new Error("Penilaian tugas akhir tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  return penilaian;
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

  // Tentukan peran penilai (pembimbing / penguji) dan hitung bobot penilai
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

  if (!penilaiType) {
    const error = new Error(
      "Dosen tidak terdaftar sebagai pembimbing atau penguji pada sidang ini",
    );
    error.statusCode = 403;
    throw error;
  }

  // Ambil bobotNilai dari JenisAsesmenClo prodi mahasiswa
  const bobotNilai = {};
  if (studyProgramId) {
    const jenisAsesmenList = await prisma.jenisAsesmenClo.findMany({
      where: {
        cloProdi: {
          studyProgramId,
          deletedAt: null,
        },
        deletedAt: null,
      },
      orderBy: [{ cloProdi: { name: "asc" } }, { createdAt: "asc" }],
    });

    jenisAsesmenList.forEach((item, index) => {
      bobotNilai[`nilai${index + 1}`] = Number(item.bobot);
    });
  }

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
      bobotNilai,
      nilai,
      catatanRevisi:
        catatanRevisi !== undefined ? catatanRevisi || "" : undefined,
      penilaiType,
    },
    create: {
      bobotPenilai,
      bobotNilai,
      nilai,
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
