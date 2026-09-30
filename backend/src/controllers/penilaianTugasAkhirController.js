import asyncHandler from "express-async-handler";
import prisma from "../config/prisma.js";
import { mapDosen } from "../mappers/userMapper.js";
import { sendValidationError, isNil } from "../utils/validationHelper.js";

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
  if (dosenPenilaiId === sidangRegistration.dosenPembimbing1Id) {
    type = "pembimbing_1";
  } else if (dosenPenilaiId === sidangRegistration.dosenPembimbing2Id) {
    type = "pembimbing_2";
  } else if (dosenPenilaiId === sidangRegistration.dosenPenguji1Id) {
    type = "penguji_1";
  } else if (dosenPenilaiId === sidangRegistration.dosenPenguji2Id) {
    type = "penguji_2";
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

  return { type, bobotPenilai };
};

/**
 * @desc    Get Penilaian Tugas Akhir by Sidang Registration ID
 * @route   GET /api/penilaian-tugas-akhir/sidang-registration/:sidangRegistrationId
 * @access  Private (Dosen / Admin)
 */
export const getPenilaianBySidangRegistrationId = asyncHandler(async (req, res) => {
  const { sidangRegistrationId } = req.params;
  const { dosenPenilaiId: queryDosenPenilaiId } = req.query;

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

  // Tentukan dosenPenilaiId target
  let targetDosenPenilaiId = queryDosenPenilaiId || null;
  if (!targetDosenPenilaiId && req.user?.role === "DOSEN") {
    const currentDosen = await prisma.dosen.findUnique({
      where: { userId: req.user.id },
    });
    if (currentDosen) {
      targetDosenPenilaiId = currentDosen.id;
    }
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
  const where = {
    sidangRegistrationId,
    deletedAt: null,
  };
  if (targetDosenPenilaiId) {
    where.dosenPenilaiId = targetDosenPenilaiId;
  }

  const penilaian = await prisma.penilaianTugasAkhir.findFirst({
    where,
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
      dosenPenilai: penilaian.dosenPenilai ? mapDosen(penilaian.dosenPenilai) : {},
      dosenKaprodi: penilaian.dosenKaprodi
        ? mapDosen(penilaian.dosenKaprodi)
        : kaprodi
        ? mapDosen(kaprodi)
        : {},
    });
  }

  // Jika belum ada penilaian yang tersimpan, berikan data template/default
  const { bobotPenilai } = await calculateBobotPenilai(
    sidangRegistration,
    targetDosenPenilaiId
  );

  let targetDosenPenilai = null;
  if (targetDosenPenilaiId) {
    targetDosenPenilai = await prisma.dosen.findUnique({
      where: { id: targetDosenPenilaiId },
      include: { user: true, studyProgram: true, researchGroup: true },
    });
  }

  return res.json({
    bobotPenilai,
    bobotNilai: defaultBobotNilai,
    nilai: {},
    catatanRevisi: "",
    sidangRegistrationId: sidangRegistration.id,
    dosenPenilai: targetDosenPenilai ? mapDosen(targetDosenPenilai) : {},
    dosenKaprodi: kaprodi ? mapDosen(kaprodi) : {},
  });
});

/**
 * @desc    Create or Update Penilaian Tugas Akhir
 * @route   POST /api/penilaian-tugas-akhir
 * @access  Private (Dosen / Admin)
 */
export const savePenilaianTugasAkhir = asyncHandler(async (req, res) => {
  const { nilai, catatanRevisi, sidangRegistrationId, dosenPenilaiId: bodyDosenPenilaiId, bobotNilai: bodyBobotNilai, dosenKaprodiId: bodyDosenKaprodiId } = req.body;
  const errors = [];

  if (isNil(sidangRegistrationId)) {
    errors.push({
      field: "sidangRegistrationId",
      message: "ID Pendaftaran Sidang wajib diisi",
    });
  }

  if (isNil(nilai) || typeof nilai !== "object") {
    errors.push({
      field: "nilai",
      message: "Nilai wajib diisi dalam bentuk object JSON",
    });
  }

  // Tentukan dosenPenilaiId
  let dosenPenilaiId = bodyDosenPenilaiId;
  if (isNil(dosenPenilaiId) && req.user?.role === "DOSEN") {
    const currentDosen = await prisma.dosen.findUnique({
      where: { userId: req.user.id },
    });
    if (currentDosen) {
      dosenPenilaiId = currentDosen.id;
    }
  }

  if (isNil(dosenPenilaiId)) {
    errors.push({
      field: "dosenPenilaiId",
      message: "ID Dosen Penilai wajib diisi",
    });
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

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

  // Validasi dosen penilai
  const dosenPenilai = await prisma.dosen.findUnique({
    where: { id: dosenPenilaiId },
  });

  if (!dosenPenilai || dosenPenilai.deletedAt) {
    res.status(404);
    throw new Error("Dosen Penilai tidak ditemukan");
  }

  // Hitung bobotPenilai berdasarkan SkemaPenilaiProdi
  const { bobotPenilai } = await calculateBobotPenilai(
    sidangRegistration,
    dosenPenilaiId
  );

  const studyProgramId = sidangRegistration.mahasiswa?.studyProgramId;

  // Tentukan bobotNilai
  let bobotNilai = bodyBobotNilai;
  if (!bobotNilai || typeof bobotNilai !== "object" || Object.keys(bobotNilai).length === 0) {
    bobotNilai = await getDefaultBobotNilaiByStudyProgram(studyProgramId);
  }

  // Tentukan dosenKaprodiId
  let dosenKaprodiId = bodyDosenKaprodiId || null;
  if (!dosenKaprodiId && studyProgramId) {
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
        catatanRevisi: catatanRevisi !== undefined ? catatanRevisi : existingPenilaian.catatanRevisi,
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
      dosenPenilai: savedPenilaian.dosenPenilai ? mapDosen(savedPenilaian.dosenPenilai) : {},
      dosenKaprodi: savedPenilaian.dosenKaprodi ? mapDosen(savedPenilaian.dosenKaprodi) : {},
    },
  });
});
