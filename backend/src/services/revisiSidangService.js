import { v4 as uuidv4 } from "uuid";
import prisma from "../config/prisma.js";
import { uploadFile, deleteFile } from "./storageService.js";
import { getPaginationParams, formatPaginationResponse } from "../utils/paginationHelper.js";
import {
  mapRevisiSidangListItem,
  mapRevisiSidangDetail,
} from "../mappers/revisiSidangMapper.js";

/**
 * Mencari periode pelaksanaan sidang yang aktif (isOpen: true) atau yang terakhir aktif
 */
export const getActiveOrLatestPelaksanaanSidangPeriod = async () => {
  const active = await prisma.sidangPeriod.findFirst({
    where: {
      category: "pelaksanaan",
      isOpen: true,
      deletedAt: null,
    },
    orderBy: { updatedAt: "desc" },
  });

  if (active) return active;

  return await prisma.sidangPeriod.findFirst({
    where: {
      category: "pelaksanaan",
      deletedAt: null,
    },
    orderBy: { endDate: "desc" },
  });
};

/**
 * Helper untuk menghitung skemaPerhitunganNilai otomatis dari snapshot penilaian dosen
 */
export const calculateSkemaPerhitunganNilai = async (sidangRegistration) => {
  const studyProgramId = sidangRegistration.mahasiswa?.studyProgramId;
  if (!studyProgramId) return [];

  const cloList = await prisma.cloProdi.findMany({
    where: { studyProgramId, deletedAt: null },
    include: {
      subcloProdi: { where: { deletedAt: null }, orderBy: { name: "asc" } },
      jenisAsesmenClo: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } },
    },
    orderBy: { name: "asc" },
  });

  if (!cloList.length) return [];

  const skemaPenilaiList = await prisma.skemaPenilaiProdi.findMany({
    where: { studyProgramId, deletedAt: null },
  });

  const hasMultiplePembimbing = Boolean(
    sidangRegistration.dosenPembimbing1Id && sidangRegistration.dosenPembimbing2Id
  );
  const hasMultiplePenguji = Boolean(
    sidangRegistration.dosenPenguji1Id && sidangRegistration.dosenPenguji2Id
  );

  const getBobotDefaultPenilai = (role, penilaiType) => {
    if (penilaiType === "pembimbing" && !hasMultiplePembimbing) return 1.0;
    if (penilaiType === "penguji" && !hasMultiplePenguji) return 1.0;
    const found = skemaPenilaiList.find((s) => s.type === role);
    if (found && found.bobot != null) return Number(found.bobot);
    return 0.5;
  };

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
    const defaultProdi = skemaPerhitunganList.find((s) => s.cloProdiId === null);
    if (defaultProdi) {
      return {
        bobotPembimbing: Number(defaultProdi.bobotRataRataPembimbing),
        bobotPenguji: Number(defaultProdi.bobotRataRataPenguji),
      };
    }
    return { bobotPembimbing: 0.6, bobotPenguji: 0.4 };
  };

  const assignedRoles = [
    {
      role: "pembimbing_1",
      penilaiType: "pembimbing",
      dosenId: sidangRegistration.dosenPembimbing1Id,
    },
    {
      role: "pembimbing_2",
      penilaiType: "pembimbing",
      dosenId: sidangRegistration.dosenPembimbing2Id,
    },
    {
      role: "penguji_1",
      penilaiType: "penguji",
      dosenId: sidangRegistration.dosenPenguji1Id,
    },
    {
      role: "penguji_2",
      penilaiType: "penguji",
      dosenId: sidangRegistration.dosenPenguji2Id,
    },
  ];

  const activePenilai = assignedRoles.filter((item) => item.dosenId !== null);
  const existingPenilaianMap = new Map();
  for (const p of (sidangRegistration.penilaianTugasAkhir || [])) {
    existingPenilaianMap.set(p.dosenPenilaiId, p);
  }

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

  const penilaianList = activePenilai.map((p) => {
    const existing = existingPenilaianMap.get(p.dosenId);
    const isSubmitted = Boolean(existing);
    const bobot =
      existing?.bobotPenilai != null
        ? Number(existing.bobotPenilai)
        : getBobotDefaultPenilai(p.role, p.penilaiType);
    return {
      penilaiRole: p.role,
      penilaiType: p.penilaiType,
      bobotPenilai: bobot,
      isSubmitted,
      nilai: isSubmitted ? existing.nilai : null,
    };
  });

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

  return cloList.map((clo) => {
    const bobotClo = Number(
      (clo.jenisAsesmenClo || [])
        .reduce((sum, a) => sum + (Number(a.bobot) || 0), 0)
        .toFixed(2)
    );
    const { bobotPembimbing, bobotPenguji } = getBobotRaRbClo(clo.id);

    const scoreP1 = p1 ? hitungSkorCloDosen(p1.nilai, clo.id) : null;
    const scoreP2 = p2 ? hitungSkorCloDosen(p2.nilai, clo.id) : null;
    const scoreU1 = u1 ? hitungSkorCloDosen(u1.nilai, clo.id) : null;
    const scoreU2 = u2 ? hitungSkorCloDosen(u2.nilai, clo.id) : null;

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
};

/**
 * 1. GET /api/revisi-sidang
 * Admin: get all revisi sidang pada periode pelaksanaan aktif atau terakhir aktif
 * Dosen: get all revisi sidang pada periode pelaksanaan aktif atau terakhir aktif (peran Dospem 1)
 */
export const getRevisiSidangList = async ({ user, query }) => {
  const paginationParams = getPaginationParams(query);
  const { sidangPeriodId, search, sort } = query;

  let targetPeriodId = sidangPeriodId;
  let selectedPeriod = null;

  if (targetPeriodId && typeof targetPeriodId === "string" && targetPeriodId.trim() !== "") {
    targetPeriodId = targetPeriodId.trim();
    selectedPeriod = await prisma.sidangPeriod.findUnique({
      where: { id: targetPeriodId, deletedAt: null },
    });
  } else {
    selectedPeriod = await getActiveOrLatestPelaksanaanSidangPeriod();
    if (selectedPeriod) {
      targetPeriodId = selectedPeriod.id;
    }
  }

  const where = {
    deletedAt: null,
    tglSetujuiUntukRevisi: { not: null },
    sidangRegistration: {
      deletedAt: null,
    },
  };

  if (targetPeriodId) {
    where.sidangRegistration.sidangPeriodId = targetPeriodId;
  }

  // Jika Dosen: filter khusus pendaftaran sidang di mana dosen adalah Dosen Pembimbing 1
  if (user?.role === "DOSEN") {
    const currentDosen = await prisma.dosen.findUnique({
      where: { userId: user.id, deletedAt: null },
    });

    if (!currentDosen) {
      const error = new Error("Data Dosen tidak ditemukan");
      error.statusCode = 404;
      throw error;
    }

    where.sidangRegistration.dosenPembimbing1Id = currentDosen.id;
  }

  // Pencarian (Search)
  if (search && search.trim() !== "") {
    const q = search.trim();
    where.sidangRegistration.OR = [
      { mahasiswa: { name: { contains: q, mode: "insensitive" } } },
      { mahasiswa: { nim: { contains: q, mode: "insensitive" } } },
      { judulTugasAkhirIndonesia: { contains: q, mode: "insensitive" } },
      { judulTugasAkhirInggris: { contains: q, mode: "insensitive" } },
    ];
  }

  // Sorting: newest (default) or oldest
  const orderBy = {
    createdAt: sort === "oldest" ? "asc" : "desc",
  };

  const total = await prisma.revisiTugasAkhir.count({ where });

  const revisiList = await prisma.revisiTugasAkhir.findMany({
    where,
    include: {
      berkasRevisi: true,
      setujuiUntukRevisi: true,
      setujuiHasilRevisi: true,
      sidangRegistration: {
        include: {
          mahasiswa: { include: { studyProgram: true } },
          dosenPembimbing1: true,
          dosenPembimbing2: true,
          dosenPenguji1: true,
          dosenPenguji2: true,
          ruanganSidang: true,
          sidangPeriod: true,
          beritaAcaraSidangTugasAkhirs: { where: { deletedAt: null } },
        },
      },
    },
    orderBy,
    skip: paginationParams.skip,
    take: paginationParams.take,
  });

  const formattedData = revisiList.map(mapRevisiSidangListItem);

  const response = formatPaginationResponse(formattedData, total, paginationParams);
  return {
    ...response,
    selectedPeriod: selectedPeriod
      ? {
          id: selectedPeriod.id,
          name: selectedPeriod.name,
          period: selectedPeriod.period,
          isOpen: selectedPeriod.isOpen,
          startDate: selectedPeriod.startDate,
          endDate: selectedPeriod.endDate,
        }
      : null,
  };
};

/**
 * 2. GET /api/revisi-sidang/me
 * Mahasiswa: mengambil latest revisi sidang dia
 */
export const getLatestRevisiSidangMahasiswa = async ({ user }) => {
  const currentMahasiswa = await prisma.mahasiswa.findUnique({
    where: { userId: user.id, deletedAt: null },
  });

  if (!currentMahasiswa) {
    const error = new Error("Data Mahasiswa tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const latestRevisi = await prisma.revisiTugasAkhir.findFirst({
    where: {
      deletedAt: null,
      tglSetujuiUntukRevisi: { not: null },
      sidangRegistration: {
        mahasiswaId: currentMahasiswa.id,
        deletedAt: null,
      },
    },
    include: {
      berkasRevisi: true,
      setujuiUntukRevisi: true,
      setujuiHasilRevisi: true,
      sidangRegistration: {
        include: {
          mahasiswa: { include: { studyProgram: true } },
          dosenPembimbing1: true,
          dosenPembimbing2: true,
          dosenPenguji1: true,
          dosenPenguji2: true,
          ruanganSidang: true,
          sidangPeriod: true,
          beritaAcaraSidangTugasAkhirs: { where: { deletedAt: null } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!latestRevisi) {
    return null;
  }

  return mapRevisiSidangDetail(latestRevisi);
};

/**
 * 3. PUT /api/revisi-sidang/:id/submit
 * Mahasiswa: submit revisi, opsional kirim berkas revisi
 */
export const submitRevisiSidang = async ({ id, user, file }) => {
  const currentMahasiswa = await prisma.mahasiswa.findUnique({
    where: { userId: user.id, deletedAt: null },
  });

  if (!currentMahasiswa) {
    const error = new Error("Data Mahasiswa tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const revisi = await prisma.revisiTugasAkhir.findFirst({
    where: { id, deletedAt: null },
    include: {
      sidangRegistration: true,
      berkasRevisi: true,
    },
  });

  if (!revisi) {
    const error = new Error("Data revisi sidang tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  if (revisi.sidangRegistration.mahasiswaId !== currentMahasiswa.id) {
    const error = new Error("Anda tidak memiliki hak akses untuk merevisi sidang ini");
    error.statusCode = 403;
    throw error;
  }

  if (!revisi.tglSetujuiUntukRevisi) {
    const error = new Error("Sidang belum ditutup oleh Dosen Pembimbing 1");
    error.statusCode = 400;
    throw error;
  }

  // Ketika revisi sudah di acc maka data revisi tidak bisa dihapus maupun diganti
  if (revisi.tglSetujuiHasilRevisi !== null) {
    const error = new Error("Revisi sidang sudah disetujui, data revisi tidak dapat diubah lagi");
    error.statusCode = 400;
    throw error;
  }

  let newBerkasId = revisi.berkasRevisiId;

  // Jika mahasiswa mengirimkan berkas revisi baru
  if (file) {
    // Jika sebelumnya sudah ada berkas revisi, hard delete record dan file fisiknya
    if (revisi.berkasRevisiId) {
      const oldBerkas = await prisma.berkasMahasiswa.findUnique({
        where: { id: revisi.berkasRevisiId },
      });
      if (oldBerkas && oldBerkas.filepath) {
        await deleteFile(oldBerkas.filepath);
      }
      await prisma.berkasMahasiswa.delete({
        where: { id: revisi.berkasRevisiId },
      }).catch(() => {});
    }

    const filename = `${uuidv4()}_${file.originalname || "berkas_revisi.pdf"}`;
    const uploaded = await uploadFile({
      buffer: file.buffer,
      customFilename: filename,
      folder: "berkas-revisi",
      mimetype: file.mimetype || "application/pdf",
    });

    const newBerkas = await prisma.berkasMahasiswa.create({
      data: {
        id: uuidv4(),
        name: file.originalname || "Berkas Revisi Sidang",
        category: "Revisi Sidang",
        filepath: uploaded.filepath,
        mahasiswaId: currentMahasiswa.id,
      },
    });

    newBerkasId = newBerkas.id;
  }

  await prisma.revisiTugasAkhir.update({
    where: { id },
    data: {
      tglSubmitRevisi: new Date(),
      berkasRevisiId: newBerkasId,
    },
  });
};

/**
 * 4. DELETE /api/revisi-sidang/:id/berkas
 * Mahasiswa: hapus berkas file revisi
 */
export const deleteBerkasRevisiSidang = async ({ id, user }) => {
  const currentMahasiswa = await prisma.mahasiswa.findUnique({
    where: { userId: user.id, deletedAt: null },
  });

  if (!currentMahasiswa) {
    const error = new Error("Data Mahasiswa tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const revisi = await prisma.revisiTugasAkhir.findFirst({
    where: { id, deletedAt: null },
    include: {
      sidangRegistration: true,
      berkasRevisi: true,
    },
  });

  if (!revisi) {
    const error = new Error("Data revisi sidang tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  if (revisi.sidangRegistration.mahasiswaId !== currentMahasiswa.id) {
    const error = new Error("Anda tidak memiliki hak akses untuk menghapus berkas revisi ini");
    error.statusCode = 403;
    throw error;
  }

  // Ketika revisi sudah di acc maka berkas tidak bisa dihapus maupun diganti
  if (revisi.tglSetujuiHasilRevisi !== null) {
    const error = new Error("Revisi sidang sudah disetujui, berkas revisi tidak dapat dihapus");
    error.statusCode = 400;
    throw error;
  }

  if (!revisi.berkasRevisiId) {
    const error = new Error("Tidak ada berkas revisi yang diunggah untuk sidang ini");
    error.statusCode = 400;
    throw error;
  }

  const berkasId = revisi.berkasRevisiId;
  const berkas = await prisma.berkasMahasiswa.findUnique({
    where: { id: berkasId },
  });

  if (berkas && berkas.filepath) {
    await deleteFile(berkas.filepath);
  }

  // Putuskan relasi berkasRevisiId pada revisi terlebih dahulu
  await prisma.revisiTugasAkhir.update({
    where: { id },
    data: { berkasRevisiId: null },
  });

  // Hard delete record BerkasMahasiswa
  if (berkas) {
    await prisma.berkasMahasiswa.delete({
      where: { id: berkasId },
    }).catch(() => {});
  }

  return { message: "Berkas revisi sidang berhasil dihapus" };
};

/**
 * 5. PUT /api/revisi-sidang/:id/verify
 * Dosen (Pembimbing 1): verifikasi hasil revisi dan terbitkan Berita Acara
 */
export const verifyRevisiSidang = async ({ id, user, payload }) => {
  const currentDosen = await prisma.dosen.findUnique({
    where: { userId: user.id, deletedAt: null },
  });

  if (!currentDosen) {
    const error = new Error("Data Dosen tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const revisi = await prisma.revisiTugasAkhir.findFirst({
    where: { id, deletedAt: null },
    include: {
      sidangRegistration: {
        include: {
          mahasiswa: { include: { studyProgram: true } },
          dosenPembimbing1: true,
          dosenPembimbing2: true,
          dosenPenguji1: true,
          dosenPenguji2: true,
          penilaianTugasAkhir: { where: { deletedAt: null } },
        },
      },
    },
  });

  if (!revisi) {
    const error = new Error("Data revisi sidang tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  // Khusus untuk Dosen Pembimbing 1
  if (revisi.sidangRegistration.dosenPembimbing1Id !== currentDosen.id) {
    const error = new Error(
      "Hanya Dosen Pembimbing 1 yang memiliki hak akses untuk memverifikasi revisi sidang"
    );
    error.statusCode = 403;
    throw error;
  }

  // Mahasiswa wajib submit dulu
  if (!revisi.tglSubmitRevisi) {
    const error = new Error("Mahasiswa belum melakukan submit revisi sidang");
    error.statusCode = 400;
    throw error;
  }

  // Ketika revisi sudah di acc maka nilai tidak bisa dihapus maupun diganti
  if (revisi.tglSetujuiHasilRevisi !== null) {
    const error = new Error("Revisi sidang sudah disetujui sebelumnya dan tidak dapat diubah lagi");
    error.statusCode = 400;
    throw error;
  }

  const { nilaiAkhir, keteranganLulus, nilaiHuruf, justifikasi } = payload;

  // Hitung skemaPerhitunganNilai secara otomatis dari snapshot nilai dosen-dosen penilai
  const skemaPerhitunganNilai = await calculateSkemaPerhitunganNilai(
    revisi.sidangRegistration
  );

  return await prisma.$transaction(async (tx) => {
    // 1. Update status pada SidangRegistration menjadi "Sidang Selesai"
    await tx.sidangRegistration.update({
      where: { id: revisi.sidangRegistrationId },
      data: {
        status: "Sidang Selesai",
      },
    });

    // 2. Update status Setujui Hasil Revisi di RevisiTugasAkhir
    await tx.revisiTugasAkhir.update({
      where: { id },
      data: {
        tglSetujuiHasilRevisi: new Date(),
        setujuiHasilRevisiId: currentDosen.id,
      },
    });

    // 3. Buat atau perbarui BeritaAcaraSidangTugasAkhir
    const existingBeritaAcara = await tx.beritaAcaraSidangTugasAkhir.findFirst({
      where: {
        sidangRegistrationId: revisi.sidangRegistrationId,
        deletedAt: null,
      },
    });

    if (existingBeritaAcara) {
      await tx.beritaAcaraSidangTugasAkhir.update({
        where: { id: existingBeritaAcara.id },
        data: {
          skemaPerhitunganNilai,
          nilaiAkhir: String(nilaiAkhir),
          keteranganLulus,
          nilaiHuruf,
          justifikasi: justifikasi || null,
        },
      });
    } else {
      await tx.beritaAcaraSidangTugasAkhir.create({
        data: {
          sidangRegistrationId: revisi.sidangRegistrationId,
          skemaPerhitunganNilai,
          nilaiAkhir: String(nilaiAkhir),
          keteranganLulus,
          nilaiHuruf,
          justifikasi: justifikasi || null,
        },
      });
    }
  });
};
