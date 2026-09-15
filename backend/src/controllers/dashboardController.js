import asyncHandler from "express-async-handler";
import prisma from "../config/prisma.js";
const NON_SIDANG_CATEGORY_MAP = {
  "Publikasi Jurnal": "Sidang - Evidence Non Sidang Publikasi Jurnal",
  "Proceeding International": "Sidang - Evidence Non Sidang Proceeding International",
  "Proceeding Internasional": "Sidang - Evidence Non Sidang Proceeding International",
  HKI: "Sidang - Evidence Non Sidang HKI",
};

// Helper untuk menghitung persentase progres pengisian form pendaftaran sidang
// Menilai input field wajib + kelengkapan upload berkas (wajib, tes bahasa, & non-sidang jika berlaku)
const calculateSidangProgress = (reg, docsConfig) => {
  if (!reg.isDraft && reg.submittedAt) return 100;

  // 1. Validasi Input Fields (11 field wajib untuk submit)
  const requiredFields = [
    reg.program,
    reg.sks,
    reg.ipk,
    reg.tak,
    reg.sktaExpDate,
    reg.judulTugasAkhirIndonesia,
    reg.judulTugasAkhirInggris,
    reg.dosenPembimbing1Id,
    reg.dosenPembimbing2Id,
    reg.skemaSidang,
  ];

  let filledFieldsCount = requiredFields.filter(
    (f) => f !== null && f !== undefined && f !== "",
  ).length;

  if (reg.lulusTesBahasa === true || reg.lulusTesBahasa === false) {
    filledFieldsCount += 1;
  }
  const totalFieldsCount = 11;

  // 2. Validasi Uploaded Files
  const uploadedCategories = new Set(
    (reg.sidangRegistrationUploads || []).map((u) => u.category),
  );

  // A. Berkas Wajib
  const wajibSlugs = docsConfig.wajibSlugs || [];
  const wajibUploadedCount = wajibSlugs.filter((slug) =>
    uploadedCategories.has(slug),
  ).length;

  // B. Berkas Tes Bahasa
  let bahasaSlugs = [];
  if (reg.lulusTesBahasa === true) {
    bahasaSlugs = docsConfig.bahasaSudahSlugs || [];
  } else if (reg.lulusTesBahasa === false) {
    bahasaSlugs = docsConfig.bahasaBelumSlugs || [];
  } else {
    bahasaSlugs =
      docsConfig.bahasaSudahSlugs && docsConfig.bahasaSudahSlugs.length > 0
        ? docsConfig.bahasaSudahSlugs
        : docsConfig.bahasaBelumSlugs || [];
  }
  const bahasaUploadedCount = bahasaSlugs.filter((slug) =>
    uploadedCategories.has(slug),
  ).length;

  // C. Berkas Non Sidang (jika skema Non Sidang)
  const effectiveSkema = String(reg.skemaSidang || "").trim().toLowerCase();
  const isNonSidang =
    effectiveSkema === "non sidang" ||
    effectiveSkema.includes("non") ||
    (Array.isArray(reg.jalurNonSidang) && reg.jalurNonSidang.length > 0);

  let nonSidangSlugs = [];
  if (isNonSidang && Array.isArray(reg.jalurNonSidang)) {
    for (const jalur of reg.jalurNonSidang) {
      const normalized = String(jalur || "").trim();
      const matchedKey = Object.keys(NON_SIDANG_CATEGORY_MAP).find(
        (k) => k.toLowerCase() === normalized.toLowerCase(),
      );
      const catName = matchedKey
        ? NON_SIDANG_CATEGORY_MAP[matchedKey]
        : `Sidang - Evidence Non Sidang ${normalized}`;
      const slugs = (docsConfig.allSidangDocs || [])
        .filter((d) => d.category === catName)
        .map((d) => d.code);
      nonSidangSlugs.push(...slugs);
    }
  }
  const nonSidangUploadedCount = nonSidangSlugs.filter((slug) =>
    uploadedCategories.has(slug),
  ).length;

  const totalCriteria =
    totalFieldsCount +
    wajibSlugs.length +
    bahasaSlugs.length +
    nonSidangSlugs.length;

  const completedCriteria =
    filledFieldsCount +
    wajibUploadedCount +
    bahasaUploadedCount +
    nonSidangUploadedCount;

  if (totalCriteria === 0) return 100;
  if (completedCriteria >= totalCriteria) return 100;

  const percentage = Math.floor((completedCriteria / totalCriteria) * 100);
  return Math.min(percentage, 99);
};

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

  const totalBimbingan = await prisma.mahasiswa.count({
    where: { dosenWaliId: dosen.id, deletedAt: null },
  });

  const sidangList = await prisma.sidangRegistration.findMany({
    where: {
      deletedAt: null,
      isDraft: false,
      OR: [{ dosenPembimbing1Id: dosen.id }, { dosenPembimbing2Id: dosen.id }],
    },
    orderBy: { tglSidang: "asc" },
    include: {
      mahasiswa: {
        include: {
          studyProgram: true,
          user: { select: { name: true } },
        },
      },
      //ruangSidang: true
    },
  });

  const jadwalSidang = sidangList.map((sidang) => {
    let peran = "Pembimbing";
    if (sidang.dosenPembimbing1Id === dosen.id) peran = "Pembimbing 1";
    if (sidang.dosenPembimbing2Id === dosen.id) peran = "Pembimbing 2";

    return {
      id: sidang.id,
      nama:
        sidang.mahasiswa?.user?.name || `Mahasiswa #${sidang.mahasiswa?.nim}`,
      nim: sidang.mahasiswa?.nim || "-",
      prodi: sidang.mahasiswa?.studyProgram?.name || "-",
      peran: peran,
      hari: sidang.tglSidang
        ? new Date(sidang.tglSidang).toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "Belum ditentukan",
      jam: sidang.tglSidang
        ? new Date(sidang.tglSidang).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "-",
      ruangan: sidang.ruanganSidang || "Ruangan Belum Ditentukan",
      isUrgent: sidang.tglSidang
        ? new Date(sidang.tglSidang) - new Date() < 86400000
        : false,
    };
  });

  res.json({
    message: "Dosen dashboard data retrieved successfully",
    data: {
      statistik: [
        {
          label: "Total Mahasiswa Bimbingan",
          nilai: totalBimbingan,
          icon: "users",
        },
        {
          label: "Mahasiswa Siap Sidang",
          nilai: jadwalSidang.length,
          icon: "calendar",
        },
        { label: "Nilai yang Belum Diinput", nilai: 0, icon: "edit" },
      ],
      jadwalSidang: jadwalSidang,
      inputNilai: [],
    },
  });
});
//mahasiswa
const getMahasiswaDashboard = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const mahasiswa = await prisma.mahasiswa.findUnique({
    where: { userId, deletedAt: null },
  });

  if (!mahasiswa) {
    res.status(404);
    throw new Error("Data Mahasiswa tidak ditemukan");
  }

  const [sktaRequest, sidangRegistrations, sidangPeriods, yudisiumPeriods] =
    await Promise.all([
      prisma.permohonanSkta.findFirst({
        where: { mahasiswaId: mahasiswa.id, deletedAt: null },
        orderBy: { createdAt: "desc" },
      }),
      prisma.sidangRegistration.findMany({
        where: { mahasiswaId: mahasiswa.id, deletedAt: null },
        orderBy: { createdAt: "desc" },
        include: {
          sidangPeriod: true,
          sidangRegistrationPeriod: true,
        },
      }),
      prisma.sidangPeriod.findMany({
        where: { deletedAt: null },
        orderBy: { startDate: "desc" },
      }),
      prisma.yudisiumPeriod.findMany({
        where: { deletedAt: null },
        orderBy: { startDate: "desc" },
      }),
    ]);

  res.json({
    message: "Mahasiswa dashboard data retrieved successfully",
    data: { sktaRequest, sidangRegistrations, sidangPeriods, yudisiumPeriods },
  });
});

export { getAdminDashboard, getDosenDashboard, getMahasiswaDashboard };
