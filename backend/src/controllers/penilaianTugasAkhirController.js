import asyncHandler from "express-async-handler";
import prisma from "../config/prisma.js";
import { mapDosen } from "../mappers/userMapper.js";

// Get Penilaian Tugas Akhir by Sidang Registration ID
export const getPenilaianBySidangRegistrationId = asyncHandler(
  async (req, res) => {
    const { sidangRegistrationId } = req.params;

    // Dosen penilai diambil dari token login
    if (req.user?.role !== "DOSEN") {
      res.status(403);
      throw new Error("Hanya dosen yang dapat mengakses penilaian tugas akhir");
    }

    const currentDosen = await prisma.dosen.findUnique({
      where: { userId: req.user.id },
    });

    if (!currentDosen || currentDosen.deletedAt) {
      res.status(403);
      throw new Error("Data dosen tidak ditemukan");
    }

    // Ambil data dari PenilaianTugasAkhir
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
      res.status(404);
      throw new Error("Penilaian tugas akhir tidak ditemukan");
    }

    return res.json({
      id: penilaian.id,
      bobotPenilai: Number(penilaian.bobotPenilai),
      bobotNilai: penilaian.bobotNilai || {},
      nilai: penilaian.nilai || {},
      catatanRevisi: penilaian.catatanRevisi || "",
      sidangRegistrationId: penilaian.sidangRegistrationId,
      penilaiType: penilaian.penilaiType,
      dosenPenilai: penilaian.dosenPenilai
        ? mapDosen(penilaian.dosenPenilai)
        : {},
      dosenKaprodi: penilaian.dosenKaprodi
        ? mapDosen(penilaian.dosenKaprodi)
        : {},
    });
  },
);

// Create or Update Penilaian Tugas Akhir
export const savePenilaianTugasAkhir = asyncHandler(async (req, res) => {
  const { sidangRegistrationId } = req.params;
  const { nilai, catatanRevisi } = req.body;

  if (!sidangRegistrationId) {
    res.status(400);
    throw new Error("ID Pendaftaran Sidang wajib diisi");
  }

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
    res.status(403);
    throw new Error(
      "Dosen tidak terdaftar sebagai pembimbing atau penguji pada sidang ini",
    );
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

  res.status(200).json({
    message: "Penilaian tugas akhir berhasil disimpan",
    data: {
      id: savedPenilaian.id,
      bobotPenilai: Number(savedPenilaian.bobotPenilai),
      bobotNilai: savedPenilaian.bobotNilai,
      nilai: savedPenilaian.nilai,
      catatanRevisi: savedPenilaian.catatanRevisi,
      sidangRegistrationId: savedPenilaian.sidangRegistrationId,
      penilaiType: savedPenilaian.penilaiType,
      dosenPenilai: savedPenilaian.dosenPenilai
        ? mapDosen(savedPenilaian.dosenPenilai)
        : {},
      dosenKaprodi: savedPenilaian.dosenKaprodi
        ? mapDosen(savedPenilaian.dosenKaprodi)
        : {},
    },
  });
});
