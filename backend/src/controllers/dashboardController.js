import asyncHandler from "express-async-handler";
import prisma from "../config/prisma.js";
import { calculateSidangProgress } from "../services/dashboardService.js";


//admin
const getAdminDashboard = asyncHandler(async (req, res) => {
  // 1. Periode Aktif
  const [activeSidangPeriod, activeYudisiumPeriod] = await Promise.all([
    prisma.sidangPeriod.findFirst({
      where: { isOpen: true, deletedAt: null },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.yudisiumPeriod.findFirst({
      where: { isOpen: true, deletedAt: null },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const activePeriod = activeSidangPeriod || activeYudisiumPeriod || null;

  // 2. Total Pendaftar pada periode aktif
  let totalPendaftar = 0;
  if (activePeriod) {
    const categoryLower = (activePeriod.category || "").toLowerCase();
    if (categoryLower === "pendaftaran sidang") {
      totalPendaftar = await prisma.sidangRegistration.count({
        where: {
          sidangRegistrationPeriodId: activePeriod.id,
          deletedAt: null,
        },
      });
    } else if (categoryLower === "sidang") {
      totalPendaftar = await prisma.sidangRegistration.count({
        where: {
          sidangPeriodId: activePeriod.id,
          deletedAt: null,
        },
      });
    } else if (categoryLower === "pendaftaran yudisium") {
      totalPendaftar = await prisma.yudisiumRegistration.count({
        where: {
          yudisiumRegistrationPeriodId: activePeriod.id,
          deletedAt: null,
        },
      });
    } else if (categoryLower === "yudisium") {
      totalPendaftar = await prisma.yudisiumRegistration.count({
        where: {
          yudisiumPeriodId: activePeriod.id,
          deletedAt: null,
        },
      });
    }
  }

  // 3. Total Pengajuan SK yang belum diproses (adminId = null & sktaUploadPath = null)
  const totalPengajuanSk = await prisma.permohonanSkta.count({
    where: {
      adminId: null,
      sktaUploadPath: null,
      deletedAt: null,
    },
  });

  // 4. Ambil master dokumen persyaratan berkas sidang untuk validasi kelengkapan
  const allSidangDocs = await prisma.dokumenPersyaratanBerkas.findMany({
    where: {
      category: { startsWith: "Sidang" },
      isRequired: true,
      deletedAt: null,
    },
    select: { code: true, category: true },
  });

  const docsConfig = {
    allSidangDocs,
    wajibSlugs: allSidangDocs
      .filter((d) => d.category === "Sidang - Berkas Wajib")
      .map((d) => d.code),
    bahasaSudahSlugs: allSidangDocs
      .filter((d) => d.category === "Sidang - Berkas Tes Bahasa (Sudah)")
      .map((d) => d.code),
    bahasaBelumSlugs: allSidangDocs
      .filter((d) => d.category === "Sidang - Berkas Tes Bahasa (Belum)")
      .map((d) => d.code),
  };

  // 5. Data sidang registration
  const rawSidangRegistrations = await prisma.sidangRegistration.findMany({
    where: { deletedAt: null },
    orderBy: { updatedAt: "desc" },
    include: {
      mahasiswa: {
        include: {
          studyProgram: true,
          user: { select: { name: true } },
        },
      },
      sidangRegistrationUploads: true,
    },
  });

  const sidangRegistration = rawSidangRegistrations.map((reg) => ({
    id: reg.id,
    name: reg.mahasiswa?.user?.name || `Mahasiswa #${reg.mahasiswa?.nim || ""}`,
    nim: reg.mahasiswa?.nim || "-",
    studyProgram: reg.mahasiswa?.studyProgram?.name || "-",
    progress: calculateSidangProgress(reg, docsConfig),
  }));

  // 6. Activity log (5 pengajuan SK terbaru, 5 pendaftaran sidang terbaru, 5 pendaftaran yudisium terbaru -> gabung -> ambil 5 teratas)
  const [rawSktaLogs, rawSidangLogs, rawYudisiumLogs] = await Promise.all([
    prisma.permohonanSkta.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        updatedAt: true,
        createdAt: true,
        mahasiswa: {
          select: {
            nim: true,
            user: { select: { name: true } },
          },
        },
      },
    }),
    prisma.sidangRegistration.findMany({
      where: {
        deletedAt: null,
        OR: [{ submittedAt: { not: null } }, { isDraft: false }],
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        submittedAt: true,
        updatedAt: true,
        createdAt: true,
        mahasiswa: {
          select: {
            nim: true,
            user: { select: { name: true } },
          },
        },
      },
    }),
    prisma.yudisiumRegistration.findMany({
      where: {
        deletedAt: null,
        OR: [{ submittedAt: { not: null } }, { isDraft: false }],
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        submittedAt: true,
        updatedAt: true,
        createdAt: true,
        mahasiswa: {
          select: {
            nim: true,
            user: { select: { name: true } },
          },
        },
      },
    }),
  ]);

  const sktaLogs = rawSktaLogs.map((item) => ({
    name:
      item.mahasiswa?.user?.name || `Mahasiswa #${item.mahasiswa?.nim || ""}`,
    activity: "Pengajuan SK",
    date: item.updatedAt || item.createdAt,
  }));

  const sidangLogs = rawSidangLogs.map((item) => ({
    name:
      item.mahasiswa?.user?.name || `Mahasiswa #${item.mahasiswa?.nim || ""}`,
    activity: "Pendaftaran Sidang",
    date: item.submittedAt || item.updatedAt || item.createdAt,
  }));

  const yudisiumLogs = rawYudisiumLogs.map((item) => ({
    name:
      item.mahasiswa?.user?.name || `Mahasiswa #${item.mahasiswa?.nim || ""}`,
    activity: "Pendaftaran Yudisium",
    date: item.submittedAt || item.updatedAt || item.createdAt,
  }));

  const activityLog = [...sktaLogs, ...sidangLogs, ...yudisiumLogs]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const periodeAktif = activePeriod
    ? {
        name: activePeriod.name,
        category: activePeriod.category,
        period: activePeriod.period,
        startDate: activePeriod.startDate,
        endDate: activePeriod.endDate,
      }
    : null;

  res.json({
    message: "Admin dashboard data retrieved successfully",
    data: {
      periodeAktif,
      totalPendaftar,
      totalPengajuanSk,
      sidangRegistration,
      activityLog,
    },
  });
});
//dosen
const getDosenDashboard = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const dosen = await prisma.dosen.findUnique({
    where: { userId, deletedAt: null },
  });

  if (!dosen) {
    res.status(404);
    throw new Error("Data Dosen tidak ditemukan");
  }

  // 1. Total Mahasiswa Bimbingan (mahasiswa yang dosen pembimbing 1 atau 2 adalah dosen yang login)
  const [bimbinganSkta, bimbinganSidang] = await Promise.all([
    prisma.permohonanSkta.findMany({
      where: {
        deletedAt: null,
        OR: [
          { dosenPembimbing1Id: dosen.id },
          { dosenPembimbing2Id: dosen.id },
        ],
      },
      select: { mahasiswaId: true },
      distinct: ["mahasiswaId"],
    }),
    prisma.sidangRegistration.findMany({
      where: {
        deletedAt: null,
        OR: [
          { dosenPembimbing1Id: dosen.id },
          { dosenPembimbing2Id: dosen.id },
        ],
      },
      select: { mahasiswaId: true },
      distinct: ["mahasiswaId"],
    }),
  ]);

  const uniqueMahasiswaBimbinganIds = new Set([
    ...bimbinganSkta.map((b) => b.mahasiswaId).filter(Boolean),
    ...bimbinganSidang.map((b) => b.mahasiswaId).filter(Boolean),
  ]);
  const totalMahasiswaBimbingan = uniqueMahasiswaBimbinganIds.size;

  // 2. Total Mahasiswa Siap Sidang (mahasiswa dengan dosen penguji 1 atau 2 adalah dosen yang login)
  const totalMahasiswaSiapSidang = await prisma.sidangRegistration.count({
    where: {
      deletedAt: null,
      OR: [
        { dosenPenguji1Id: dosen.id },
        { dosenPenguji2Id: dosen.id },
      ],
    },
  });

  // 3. Jadwal Sidang Hari Ini (dosen sebagai pembimbing atau penguji)
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const dosenSidangCondition = {
    deletedAt: null,
    OR: [
      { dosenPembimbing1Id: dosen.id },
      { dosenPembimbing2Id: dosen.id },
      { dosenPenguji1Id: dosen.id },
      { dosenPenguji2Id: dosen.id },
    ],
  };

  const includeConfig = {
    mahasiswa: {
      include: {
        studyProgram: true,
        user: { select: { name: true } },
      },
    },
    ruanganSidang: true,
  };

  const todaySidangList = await prisma.sidangRegistration.findMany({
    where: {
      ...dosenSidangCondition,
      tglSidang: {
        gte: startOfToday,
        lte: endOfToday,
      },
    },
    orderBy: { tglSidang: "asc" },
    include: includeConfig,
  });

  let combinedSidangList = [...todaySidangList];

  // Jika jadwal hari ini kosong atau kurang dari 3, ambil jadwal mendatang (besok dst.) sampai minimal 3 jadwal tampil
  if (combinedSidangList.length < 3) {
    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

    const needed = 3 - combinedSidangList.length;

    const upcomingSidangList = await prisma.sidangRegistration.findMany({
      where: {
        ...dosenSidangCondition,
        tglSidang: {
          gte: startOfTomorrow,
        },
      },
      orderBy: { tglSidang: "asc" },
      take: needed,
      include: includeConfig,
    });

    combinedSidangList.push(...upcomingSidangList);
  }

  const jadwalSidang = combinedSidangList.map((sidang) => {
    let position = "";
    if (sidang.dosenPenguji1Id === dosen.id) position = "Penguji 1";
    else if (sidang.dosenPenguji2Id === dosen.id) position = "Penguji 2";
    else if (sidang.dosenPembimbing1Id === dosen.id) position = "Pembimbing 1";
    else if (sidang.dosenPembimbing2Id === dosen.id) position = "Pembimbing 2";

    return {
      id: sidang.id,
      name:
        sidang.mahasiswa?.user?.name || `Mahasiswa #${sidang.mahasiswa?.nim || ""}`,
      nim: sidang.mahasiswa?.nim || "-",
      studyProgram: sidang.mahasiswa?.studyProgram?.name || "-",
      position: position,
      ruangan: sidang.ruanganSidang?.name || "Ruangan Belum Ditentukan",
      tglSidang: sidang.tglSidang,
    };
  });

  res.json({
    message: "Dosen dashboard data retrieved successfully",
    data: {
      totalMahasiswaBimbingan,
      totalMahasiswaSiapSidang,
      totalNilaiBelumDiinput: 0,
      jadwalSidang,
    },
  });
});
//mahasiswa
const getMahasiswaDashboard = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const rawMahasiswa = await prisma.mahasiswa.findUnique({
    where: { userId, deletedAt: null },
    include: {
      studyProgram: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      dosenWali: {
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!rawMahasiswa) {
    res.status(404);
    throw new Error("Data Mahasiswa tidak ditemukan");
  }

  const mahasiswa = {
    id: rawMahasiswa.id,
    nim: rawMahasiswa.nim || "",
    name: rawMahasiswa.user?.name || "",
    email: rawMahasiswa.user?.email || "",
    phone: rawMahasiswa.user?.phone || null,
    kelasAsal: rawMahasiswa.kelasAsal || "",
    tahunAngkatan: rawMahasiswa.tahunAngkatan,
    sks: rawMahasiswa.sks,
    ipk: rawMahasiswa.ipk,
    tak: rawMahasiswa.tak,
    studyProgram: rawMahasiswa.studyProgram
      ? {
          id: rawMahasiswa.studyProgram.id,
          name: rawMahasiswa.studyProgram.name,
          facultyId: rawMahasiswa.studyProgram.facultyId,
        }
      : null,
    dosenWali: rawMahasiswa.dosenWali
      ? {
          id: rawMahasiswa.dosenWali.id,
          name: rawMahasiswa.dosenWali.user?.name || "",
          kodeDosen: rawMahasiswa.dosenWali.kodeDosen,
        }
      : null,
  };

  // 2. Periode Sidang (Data 1: Pendaftaran Sidang, Data 2: Pelaksanaan Sidang - Sepasang dengan Name & Period yang sama)
  const activeSidangReg = await prisma.sidangPeriod.findFirst({
    where: { category: "pendaftaran sidang", isOpen: true, deletedAt: null },
    orderBy: { updatedAt: "desc" },
  });

  const latestSidangReg =
    activeSidangReg ||
    (await prisma.sidangPeriod.findFirst({
      where: { category: "pendaftaran sidang", deletedAt: null },
      orderBy: { startDate: "desc" },
    }));

  let pelaksanaanSidang = null;
  if (latestSidangReg) {
    pelaksanaanSidang = await prisma.sidangPeriod.findFirst({
      where: {
        category: "sidang",
        name: latestSidangReg.name,
        period: latestSidangReg.period,
        deletedAt: null,
      },
      orderBy: { startDate: "desc" },
    });

    if (!pelaksanaanSidang) {
      pelaksanaanSidang = await prisma.sidangPeriod.findFirst({
        where: {
          category: "sidang",
          period: latestSidangReg.period,
          deletedAt: null,
        },
        orderBy: { startDate: "desc" },
      });
    }
  }
  if (!pelaksanaanSidang) {
    pelaksanaanSidang = await prisma.sidangPeriod.findFirst({
      where: { category: "sidang", deletedAt: null },
      orderBy: { startDate: "desc" },
    });
  }

  const periodeSidang = [latestSidangReg, pelaksanaanSidang]
    .filter(Boolean)
    .map((p) => ({
      name: p.name,
      category: p.category,
      period: p.period,
      startDate: p.startDate,
      endDate: p.endDate,
    }));

  // 3. Periode Yudisium (Data 1: Pendaftaran Yudisium, Data 2: Pelaksanaan Yudisium - Sepasang dengan Name & Period yang sama)
  const activeYudisiumReg = await prisma.yudisiumPeriod.findFirst({
    where: { category: "pendaftaran yudisium", isOpen: true, deletedAt: null },
    orderBy: { updatedAt: "desc" },
  });

  const latestYudisiumReg =
    activeYudisiumReg ||
    (await prisma.yudisiumPeriod.findFirst({
      where: { category: "pendaftaran yudisium", deletedAt: null },
      orderBy: { startDate: "desc" },
    }));

  let pelaksanaanYudisium = null;
  if (latestYudisiumReg) {
    pelaksanaanYudisium = await prisma.yudisiumPeriod.findFirst({
      where: {
        category: "yudisium",
        name: latestYudisiumReg.name,
        period: latestYudisiumReg.period,
        deletedAt: null,
      },
      orderBy: { startDate: "desc" },
    });

    if (!pelaksanaanYudisium) {
      pelaksanaanYudisium = await prisma.yudisiumPeriod.findFirst({
        where: {
          category: "yudisium",
          period: latestYudisiumReg.period,
          deletedAt: null,
        },
        orderBy: { startDate: "desc" },
      });
    }
  }
  if (!pelaksanaanYudisium) {
    pelaksanaanYudisium = await prisma.yudisiumPeriod.findFirst({
      where: { category: "yudisium", deletedAt: null },
      orderBy: { startDate: "desc" },
    });
  }

  const periodeYudisium = [latestYudisiumReg, pelaksanaanYudisium]
    .filter(Boolean)
    .map((p) => ({
      name: p.name,
      category: p.category,
      period: p.period,
      startDate: p.startDate,
      endDate: p.endDate,
    }));

  // 4. Activity Log milik mahasiswa ini
  const [rawSktaLogs, rawSidangLogs, rawYudisiumLogs] = await Promise.all([
    prisma.permohonanSkta.findMany({
      where: { mahasiswaId: rawMahasiswa.id, deletedAt: null },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        updatedAt: true,
        createdAt: true,
        mahasiswa: {
          select: {
            nim: true,
            user: { select: { name: true } },
          },
        },
      },
    }),
    prisma.sidangRegistration.findMany({
      where: {
        mahasiswaId: rawMahasiswa.id,
        deletedAt: null,
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        submittedAt: true,
        updatedAt: true,
        createdAt: true,
        mahasiswa: {
          select: {
            nim: true,
            user: { select: { name: true } },
          },
        },
      },
    }),
    prisma.yudisiumRegistration.findMany({
      where: {
        mahasiswaId: rawMahasiswa.id,
        deletedAt: null,
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        submittedAt: true,
        updatedAt: true,
        createdAt: true,
        mahasiswa: {
          select: {
            nim: true,
            user: { select: { name: true } },
          },
        },
      },
    }),
  ]);

  const sktaLogs = rawSktaLogs.map((item) => ({
    name:
      item.mahasiswa?.user?.name || `Mahasiswa #${item.mahasiswa?.nim || ""}`,
    activity: "Pengajuan SK",
    date: item.updatedAt || item.createdAt,
  }));

  const sidangLogs = rawSidangLogs.map((item) => ({
    name:
      item.mahasiswa?.user?.name || `Mahasiswa #${item.mahasiswa?.nim || ""}`,
    activity: "Pendaftaran Sidang",
    date: item.submittedAt || item.updatedAt || item.createdAt,
  }));

  const yudisiumLogs = rawYudisiumLogs.map((item) => ({
    name:
      item.mahasiswa?.user?.name || `Mahasiswa #${item.mahasiswa?.nim || ""}`,
    activity: "Pendaftaran Yudisium",
    date: item.submittedAt || item.updatedAt || item.createdAt,
  }));

  const activityLog = [...sktaLogs, ...sidangLogs, ...yudisiumLogs]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  res.json({
    message: "Mahasiswa dashboard data retrieved successfully",
    data: {
      mahasiswa,
      periodeSidang,
      periodeYudisium,
      activityLog,
    },
  });
});

export { getAdminDashboard, getDosenDashboard, getMahasiswaDashboard };
