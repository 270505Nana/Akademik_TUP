import prisma from "../config/prisma.js";
import { calculateSidangProgress } from "./dashboardService.js";

export const getAdminPaginated = async ({ skip, take }) => {
  const [total, admins] = await Promise.all([
    prisma.admin.count({ where: { deletedAt: null } }),
    prisma.admin.findMany({
      where: { deletedAt: null },
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            email: true,
            phone: true,
          },
        },
      },
    }),
  ]);

  return { total, admins };
};

export const getAdminByIdOrUserId = async (idOrUserId) => {
  let admin = await prisma.admin.findUnique({
    where: { id: idOrUserId },
    include: { user: true },
  });

  if (!admin) {
    admin = await prisma.admin.findUnique({
      where: { userId: idOrUserId },
      include: { user: true },
    });
  }

  return admin;
};

export const upsertAdminData = async ({ userId, name }) => {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
  });

  if (!user) {
    const error = new Error("Pengguna tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }
  if (user.role !== "ADMIN") {
    const error = new Error("Pengguna bukan admin");
    error.statusCode = 400;
    throw error;
  }

  return prisma.admin.upsert({
    where: { userId },
    update: { name },
    create: { userId, name },
    include: { user: true },
  });
};

export const getAdminDashboardData = async () => {
  // Get Periode Aktif
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

  // Get Total Pendaftar pada Periode Aktif
  // NOTE: Apakah totalPendaftaran merupakan total pendaftar periode aktif atau periode keduanya?
  let totalPendaftar = 0;
  if (activePeriod) {
    if (activeSidangPeriod?.category === "pendaftaran") {
      totalPendaftar = await prisma.sidangRegistration.count({
        where: {
          sidangRegistrationPeriodId: activePeriod.id,
          deletedAt: null,
        },
      });
    } else if (activeSidangPeriod?.category === "pelaksanaan") {
      totalPendaftar = await prisma.sidangRegistration.count({
        where: {
          sidangPeriodId: activePeriod.id,
          deletedAt: null,
        },
      });
    } else if (activeYudisiumPeriod?.category === "pendaftaran") {
      totalPendaftar = await prisma.yudisiumRegistration.count({
        where: {
          yudisiumRegistrationPeriodId: activePeriod.id,
          deletedAt: null,
        },
      });
    } else if (activeYudisiumPeriod?.category === "pelaksanaan") {
      totalPendaftar = await prisma.yudisiumRegistration.count({
        where: {
          yudisiumPeriodId: activePeriod.id,
          deletedAt: null,
        },
      });
    }
  }

  // Get Total Pengajuan SK yang Belum Diproses (adminId = null & sktaUploadPath = null)
  const totalPengajuanSk = await prisma.permohonanSkta.count({
    where: {
      adminId: null,
      sktaUploadPath: null,
      deletedAt: null,
    },
  });

  // Get Master Dokumen Persyaratan Berkas Sidang untuk Validasi Kelengkapan
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

  // Get Data Sidang Registration
  const rawSidangRegistrations = await prisma.sidangRegistration.findMany({
    where: { deletedAt: null },
    orderBy: { updatedAt: "desc" },
    include: {
      mahasiswa: {
        include: {
          studyProgram: true,
        },
      },
      sidangRegistrationUploads: true,
    },
  });

  const sidangRegistration = rawSidangRegistrations.map((reg) => ({
    id: reg.id,
    name: reg.mahasiswa?.name || `Mahasiswa #${reg.mahasiswa?.nim || ""}`,
    nim: reg.mahasiswa?.nim || "-",
    studyProgram: reg.mahasiswa?.studyProgram?.name || "-",
    progress: calculateSidangProgress(reg, docsConfig),
  }));

  // Get Activity Log (5 pengajuan SK terbaru, 5 pendaftaran sidang terbaru, 5 pendaftaran yudisium terbaru -> gabung -> ambil 5 teratas)
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
            name: true,
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
            name: true,
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
            name: true,
          },
        },
      },
    }),
  ]);

  const sktaLogs = rawSktaLogs.map((item) => ({
    name:
      item.mahasiswa?.name || `Mahasiswa #${item.mahasiswa?.nim || ""}`,
    activity: "Pengajuan SK",
    date: item.updatedAt || item.createdAt,
  }));

  const sidangLogs = rawSidangLogs.map((item) => ({
    name:
      item.mahasiswa?.name || `Mahasiswa #${item.mahasiswa?.nim || ""}`,
    activity: "Pendaftaran Sidang",
    date: item.submittedAt || item.updatedAt || item.createdAt,
  }));

  const yudisiumLogs = rawYudisiumLogs.map((item) => ({
    name:
      item.mahasiswa?.name || `Mahasiswa #${item.mahasiswa?.nim || ""}`,
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

  return {
    periodeAktif,
    totalPendaftar,
    totalPengajuanSk,
    sidangRegistration,
    activityLog,
  };
};
