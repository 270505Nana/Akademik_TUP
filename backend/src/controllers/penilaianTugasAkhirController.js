import asyncHandler from "express-async-handler";
import prisma from "../config/prisma.js";
import { mapDosen } from "../mappers/userMapper.js";

/**
 * Helper to fetch default bobotNilai from JenisAsesmenClo for a study program
 */
const getDefaultBobotNilaiByStudyProgram = async (studyProgramId) => {
  if (!studyProgramId) return {};

  const jenisAsesmenList = await prisma.jenisAsesmenClo.findMany({
    where: {
      cloProdi: {
        studyProgramId,
        deletedAt: null,
      },
      deletedAt: null,
    },
    orderBy: { createdAt: "asc" },
  });

  const bobotNilai = {};
  jenisAsesmenList.forEach((item, index) => {
    bobotNilai[`nilai${index + 1}`] = Number(item.bobot);
  });

  return bobotNilai;
};

/**
 * Helper to calculate bobotPenilai from SkemaPenilaiProdi based on dosen role in sidangRegistration
 */
const calculateBobotPenilai = async (sidangRegistration, dosenPenilaiId) => {
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

  return { type, penilaiType, bobotPenilai };
};

/**
 * @desc    Get Penilaian Tugas Akhir by Sidang Registration ID
 * @route   GET /api/penilaian-tugas-akhir/sidang-registration/:sidangRegistrationId
 * @access  Private (Dosen)
 */
export const getPenilaianBySidangRegistrationId = asyncHandler(async (req, res) => {
  const { sidangRegistrationId } = req.params;

  // Dosen penilai diambil dari token login
  if (req.user?.role !== "DOSEN") {
    res.status(403);
    throw new Error("Hanya dosen yang dapat mengakses penilaian tugas akhir");
  }

  const currentDosen = await prisma.dosen.findUnique({
    where: { userId: req.user.id },
    include: { user: true, studyProgram: true, researchGroup: true },
  });

  if (!currentDosen || currentDosen.deletedAt) {
    res.status(403);
    throw new Error("Data dosen tidak ditemukan");
  }

  const targetDosenPenilaiId = currentDosen.id;

  const sidangRegistration = await prisma.sidangRegistration.findUnique({
    where: { id: sidangRegistrationId },
    include: {
      mahasiswa: {
        include: {
          studyProgram: true,
          user: true,
        },
      },
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
    },
  });

  if (!sidangRegistration || sidangRegistration.deletedAt) {
    res.status(404);
    throw new Error("Pendaftaran sidang tidak ditemukan");
  }

  const studyProgramId = sidangRegistration.mahasiswa?.studyProgramId;

  // Tentukan peran penilai (pembimbing / penguji) dan hitung bobot penilai
  const { penilaiType, bobotPenilai } = await calculateBobotPenilai(
    sidangRegistration,
    targetDosenPenilaiId
  );

  // Pastikan dosen tersebut terdaftar sebagai pembimbing atau penguji
  if (!penilaiType) {
    res.status(403);
    throw new Error("Anda tidak terdaftar sebagai pembimbing atau penguji pada sidang ini");
  }

  // Dosen Kaprodi dari prodi mahasiswa
  let kaprodi = null;
  if (studyProgramId) {
    kaprodi = await prisma.dosen.findFirst({
      where: {
        studyProgramId,
        isKetuaProdi: true,
        deletedAt: null,
      },
      include: {
        user: true,
        studyProgram: true,
        researchGroup: true,
      },
    });
  }

  // Ambil default bobotNilai dari JenisAsesmenClo
  const defaultBobotNilai = await getDefaultBobotNilaiByStudyProgram(studyProgramId);

  // Cari data PenilaianTugasAkhir
  const penilaian = await prisma.penilaianTugasAkhir.findFirst({
    where: {
      sidangRegistrationId,
      dosenPenilaiId: targetDosenPenilaiId,
      deletedAt: null,
    },
    include: {
      dosenPenilai: {
        include: { user: true, studyProgram: true, researchGroup: true },
      },
      dosenKaprodi: {
        include: { user: true, studyProgram: true, researchGroup: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  if (penilaian) {
    const bobotNilai =
      penilaian.bobotNilai && Object.keys(penilaian.bobotNilai).length > 0
        ? penilaian.bobotNilai
        : defaultBobotNilai;

    return res.json({
      bobotPenilai: Number(penilaian.bobotPenilai),
      bobotNilai,
      nilai: penilaian.nilai || {},
      catatanRevisi: penilaian.catatanRevisi || "",
      sidangRegistrationId: penilaian.sidangRegistrationId,
      penilaiType: penilaian.penilaiType || penilaiType,
      dosenPenilai: penilaian.dosenPenilai ? mapDosen(penilaian.dosenPenilai) : {},
      dosenKaprodi: penilaian.dosenKaprodi
        ? mapDosen(penilaian.dosenKaprodi)
        : kaprodi
        ? mapDosen(kaprodi)
        : {},
    });
  }

  // Jika belum ada penilaian yang tersimpan, berikan data template/default
  return res.json({
    bobotPenilai,
    bobotNilai: defaultBobotNilai,
    nilai: {},
    catatanRevisi: "",
    sidangRegistrationId: sidangRegistration.id,
    penilaiType: penilaiType || null,
    dosenPenilai: mapDosen(currentDosen),
    dosenKaprodi: kaprodi ? mapDosen(kaprodi) : {},
  });
});

/**
 * @desc    Create or Update Penilaian Tugas Akhir
 * @route   POST /api/penilaian-tugas-akhir
 * @access  Private (Dosen)
 */
export const savePenilaianTugasAkhir = asyncHandler(async (req, res) => {
  const { sidangRegistrationId, nilai, catatanRevisi } = req.body;

  // Dosen penilai diambil dari token pengguna yang sedang login
  if (req.user?.role !== "DOSEN") {
    res.status(403);
    throw new Error("Hanya dosen yang dapat melakukan penilaian tugas akhir");
  }

  const currentDosen = await prisma.dosen.findUnique({
    where: { userId: req.user.id },
  });

  if (!currentDosen || currentDosen.deletedAt) {
    res.status(403);
    throw new Error("Data dosen penilai tidak ditemukan");
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
    res.status(404);
    throw new Error("Pendaftaran sidang tidak ditemukan");
  }

  // Tentukan peran penilai (pembimbing / penguji) dan hitung bobot penilai
  const { penilaiType, bobotPenilai } = await calculateBobotPenilai(
    sidangRegistration,
    dosenPenilaiId
  );

  if (!penilaiType) {
    res.status(403);
    throw new Error("Dosen tidak terdaftar sebagai pembimbing atau penguji pada sidang ini");
  }

  const studyProgramId = sidangRegistration.mahasiswa?.studyProgramId;

  // Bobot nilai diisi otomatis oleh backend dari JenisAsesmenClo prodi mahasiswa
  const bobotNilai = await getDefaultBobotNilaiByStudyProgram(studyProgramId);

  // Tentukan dosenKaprodiId secara otomatis dari prodi mahasiswa
  let dosenKaprodiId = null;
  if (studyProgramId) {
    const kaprodi = await prisma.dosen.findFirst({
      where: {
        studyProgramId,
        isKetuaProdi: true,
        deletedAt: null,
      },
    });
    if (kaprodi) {
      dosenKaprodiId = kaprodi.id;
    }
  }

  // Cek apakah penilaian sudah ada untuk dosen penilai & sidang registration ini (Upsert)
  const existingPenilaian = await prisma.penilaianTugasAkhir.findFirst({
    where: {
      sidangRegistrationId,
      dosenPenilaiId,
      deletedAt: null,
    },
  });

  let savedPenilaian;
  if (existingPenilaian) {
    savedPenilaian = await prisma.penilaianTugasAkhir.update({
      where: { id: existingPenilaian.id },
      data: {
        bobotPenilai,
        bobotNilai: Object.keys(bobotNilai).length > 0 ? bobotNilai : existingPenilaian.bobotNilai,
        nilai,
        catatanRevisi: catatanRevisi !== undefined ? (catatanRevisi || "") : existingPenilaian.catatanRevisi,
        penilaiType,
        dosenKaprodiId: dosenKaprodiId || existingPenilaian.dosenKaprodiId,
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
  } else {
    savedPenilaian = await prisma.penilaianTugasAkhir.create({
      data: {
        bobotPenilai,
        bobotNilai,
        nilai,
        catatanRevisi: catatanRevisi || "",
        sidangRegistrationId,
        penilaiType,
        dosenPenilaiId,
        dosenKaprodiId,
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
  }

  res.status(existingPenilaian ? 200 : 201).json({
    message: "Penilaian tugas akhir berhasil disimpan",
    data: {
      id: savedPenilaian.id,
      bobotPenilai: Number(savedPenilaian.bobotPenilai),
      bobotNilai: savedPenilaian.bobotNilai,
      nilai: savedPenilaian.nilai,
      catatanRevisi: savedPenilaian.catatanRevisi,
      sidangRegistrationId: savedPenilaian.sidangRegistrationId,
      penilaiType: savedPenilaian.penilaiType,
      dosenPenilai: savedPenilaian.dosenPenilai ? mapDosen(savedPenilaian.dosenPenilai) : {},
      dosenKaprodi: savedPenilaian.dosenKaprodi ? mapDosen(savedPenilaian.dosenKaprodi) : {},
    },
  });
});
