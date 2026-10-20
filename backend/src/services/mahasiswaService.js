import prisma from "../config/prisma.js";
import { ROLES } from "../constants/roles.js";

export const getMahasiswas = async ({
  search,
  studyProgramId,
  tahunAngkatan,
  sortBy = "createdAt",
  sortOrder = "desc",
  skip,
  take,
}) => {
  const where = { deletedAt: null };

  const searchTerm = (search || "").trim();
  if (searchTerm) {
    where.OR = [
      { name: { contains: searchTerm, mode: "insensitive" } },
      { nim: { contains: searchTerm, mode: "insensitive" } },
      { kelasAsal: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  if (studyProgramId) where.studyProgramId = studyProgramId.trim();
  if (tahunAngkatan) where.tahunAngkatan = Number(tahunAngkatan);

  const orderDirection = (sortOrder || "desc").toLowerCase() === "asc" ? "asc" : "desc";
  const sortField = (sortBy || "createdAt").trim();
  let orderBy = { createdAt: orderDirection };

  if (sortField === "name") {
    orderBy = { name: orderDirection };
  } else if (sortField === "nim") {
    orderBy = { nim: orderDirection };
  } else if (sortField === "kelasAsal") {
    orderBy = { kelasAsal: orderDirection };
  } else if (sortField === "tahunAngkatan") {
    orderBy = { tahunAngkatan: orderDirection };
  } else if (sortField === "ipk") {
    orderBy = { ipk: orderDirection };
  } else if (sortField === "sks") {
    orderBy = { sks: orderDirection };
  } else if (sortField === "tak") {
    orderBy = { tak: orderDirection };
  } else if (sortField === "createdAt") {
    orderBy = { createdAt: orderDirection };
  }

  const [total, mahasiswas] = await Promise.all([
    prisma.mahasiswa.count({ where }),
    prisma.mahasiswa.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        user: true,
        studyProgram: { include: { faculty: true } },
      },
    }),
  ]);

  return { total, mahasiswas };
};

export const getMahasiswaByIdOrUserId = async (idOrUserId) => {
  let mahasiswa = await prisma.mahasiswa.findUnique({
    where: { id: idOrUserId },
    include: { user: true, studyProgram: { include: { faculty: true } } },
  });

  if (!mahasiswa) {
    mahasiswa = await prisma.mahasiswa.findUnique({
      where: { userId: idOrUserId },
      include: { user: true, studyProgram: { include: { faculty: true } } },
    });
  }

  if (!mahasiswa || mahasiswa.deletedAt) {
    const error = new Error("Mahasiswa tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  return mahasiswa;
};

export const upsertMahasiswa = async (idOrUserId, payload, currentUser) => {
  const {
    name,
    nim,
    kelasAsal,
    tahunAngkatan,
    sks,
    ipk,
    tak,
    studyProgramId,
    dosenWaliId,
  } = payload;

  // Cek apakah ada mahasiswa dengan id sama
  // Jika tidak ada berarti itu mungkin id user
  let mRecord = await prisma.mahasiswa.findUnique({
    where: { id: idOrUserId },
  });
  let userId = mRecord ? mRecord.userId : idOrUserId;

  if (!mRecord) {
    mRecord = await prisma.mahasiswa.findUnique({
      where: { userId: idOrUserId },
    });
    if (mRecord) userId = mRecord.userId;
  }

  // Authorization Check: Mahasiswa hanya boleh upsert data miliknya sendiri
  if (currentUser) {
    if (currentUser.role === ROLES.MAHASISWA && currentUser.id !== userId) {
      const error = new Error(
        "Akses ditolak: Anda hanya dapat mengubah data profil Anda sendiri.",
      );
      error.statusCode = 403;
      throw error;
    }
    if (
      currentUser.role !== ROLES.ADMIN &&
      currentUser.role !== ROLES.MAHASISWA
    ) {
      const error = new Error(
        "Akses ditolak: Anda tidak memiliki izin untuk mengubah data mahasiswa.",
      );
      error.statusCode = 403;
      throw error;
    }
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
  });

  if (!user) {
    const error = new Error("Pengguna tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  if (user.role !== ROLES.MAHASISWA) {
    const error = new Error("Pengguna bukan mahasiswa");
    error.statusCode = 400;
    throw error;
  }

  return await prisma.$transaction(async (tx) => {
    return await tx.mahasiswa.upsert({
      where: { userId },
      update: {
        name,
        nim,
        kelasAsal: kelasAsal || null,
        tahunAngkatan: tahunAngkatan || null,
        sks: sks || null,
        ipk: ipk || null,
        tak: tak || null,
        studyProgramId: studyProgramId || null,
        dosenWaliId: dosenWaliId || null,
      },
      create: {
        name,
        nim,
        kelasAsal: kelasAsal || null,
        tahunAngkatan: tahunAngkatan || null,
        sks: sks || null,
        ipk: ipk || null,
        tak: tak || null,
        studyProgramId: studyProgramId || null,
        dosenWaliId: dosenWaliId || null,
        userId,
      },
      include: {
        user: true,
        studyProgram: { include: { faculty: true } },
      },
    });
  });
};

export const getMahasiswaDashboardData = async (userId) => {
  const rawMahasiswa = await prisma.mahasiswa.findFirst({
    where: { userId, deletedAt: null },
    include: {
      studyProgram: true,
      user: {
        select: {
          id: true,
          email: true,
          phone: true,
        },
      },
      dosenWali: true,
    },
  });

  if (!rawMahasiswa) {
    const error = new Error("Data Mahasiswa tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const mahasiswa = {
    id: rawMahasiswa.id,
    nim: rawMahasiswa.nim || "",
    name: rawMahasiswa.name || "",
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
          name: rawMahasiswa.dosenWali.name || "",
          kodeDosen: rawMahasiswa.dosenWali.kodeDosen,
        }
      : null,
  };

  // Periode Sidang (Data 1: Pendaftaran Sidang, Data 2: Pelaksanaan Sidang)
  const activeSidangReg = await prisma.sidangPeriod.findFirst({
    where: {
      category: "pendaftaran",
      isOpen: true,
      deletedAt: null,
    },
    orderBy: { updatedAt: "desc" },
  });

  const latestSidangReg =
    activeSidangReg ||
    (await prisma.sidangPeriod.findFirst({
      where: {
        category: "pendaftaran",
        deletedAt: null,
      },
      orderBy: { startDate: "desc" },
    }));

  let pelaksanaanSidang = null;
  if (latestSidangReg) {
    pelaksanaanSidang = await prisma.sidangPeriod.findFirst({
      where: {
        category: { in: ["pelaksanaan", "sidang"] },
        name: latestSidangReg.name,
        period: latestSidangReg.period,
        deletedAt: null,
      },
      orderBy: { startDate: "desc" },
    });

    if (!pelaksanaanSidang) {
      pelaksanaanSidang = await prisma.sidangPeriod.findFirst({
        where: {
          category: { in: ["pelaksanaan", "sidang"] },
          period: latestSidangReg.period,
          deletedAt: null,
        },
        orderBy: { startDate: "desc" },
      });
    }
  }
  if (!pelaksanaanSidang) {
    pelaksanaanSidang = await prisma.sidangPeriod.findFirst({
      where: {
        category: { in: ["pelaksanaan", "sidang"] },
        deletedAt: null,
      },
      orderBy: { startDate: "desc" },
    });
  }

  const periodeSidang = [latestSidangReg, pelaksanaanSidang]
    .filter(Boolean)
    .map((p) => ({
      name: p.name,
      category: (p.category || "").toLowerCase().includes("pendaftaran")
        ? "pendaftaran"
        : "pelaksanaan",
      period: p.period,
      startDate: p.startDate,
      endDate: p.endDate,
    }));

  // Periode Yudisium (Data 1: Pendaftaran Yudisium, Data 2: Pelaksanaan Yudisium)
  const activeYudisiumReg = await prisma.yudisiumPeriod.findFirst({
    where: {
      category: { in: ["pendaftaran", "pendaftaran yudisium"] },
      isOpen: true,
      deletedAt: null,
    },
    orderBy: { updatedAt: "desc" },
  });

  const latestYudisiumReg =
    activeYudisiumReg ||
    (await prisma.yudisiumPeriod.findFirst({
      where: {
        category: { in: ["pendaftaran", "pendaftaran yudisium"] },
        deletedAt: null,
      },
      orderBy: { startDate: "desc" },
    }));

  let pelaksanaanYudisium = null;
  if (latestYudisiumReg) {
    pelaksanaanYudisium = await prisma.yudisiumPeriod.findFirst({
      where: {
        category: { in: ["pelaksanaan", "yudisium"] },
        name: latestYudisiumReg.name,
        period: latestYudisiumReg.period,
        deletedAt: null,
      },
      orderBy: { startDate: "desc" },
    });

    if (!pelaksanaanYudisium) {
      pelaksanaanYudisium = await prisma.yudisiumPeriod.findFirst({
        where: {
          category: { in: ["pelaksanaan", "yudisium"] },
          period: latestYudisiumReg.period,
          deletedAt: null,
        },
        orderBy: { startDate: "desc" },
      });
    }
  }
  if (!pelaksanaanYudisium) {
    pelaksanaanYudisium = await prisma.yudisiumPeriod.findFirst({
      where: {
        category: { in: ["pelaksanaan", "yudisium"] },
        deletedAt: null,
      },
      orderBy: { startDate: "desc" },
    });
  }

  const periodeYudisium = [latestYudisiumReg, pelaksanaanYudisium]
    .filter(Boolean)
    .map((p) => ({
      name: p.name,
      category: (p.category || "").toLowerCase().includes("pendaftaran")
        ? "pendaftaran"
        : "pelaksanaan",
      period: p.period,
      startDate: p.startDate,
      endDate: p.endDate,
    }));

  // Activity Log milik mahasiswa ini
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
            name: true,
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
            name: true,
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
            name: true,
          },
        },
      },
    }),
  ]);

  const sktaLogs = rawSktaLogs.map((item) => ({
    name: item.mahasiswa?.name || `Mahasiswa #${item.mahasiswa?.nim || ""}`,
    activity: "Pengajuan SK",
    date: item.updatedAt || item.createdAt,
  }));

  const sidangLogs = rawSidangLogs.map((item) => ({
    name: item.mahasiswa?.name || `Mahasiswa #${item.mahasiswa?.nim || ""}`,
    activity: "Pendaftaran Sidang",
    date: item.submittedAt || item.updatedAt || item.createdAt,
  }));

  const yudisiumLogs = rawYudisiumLogs.map((item) => ({
    name: item.mahasiswa?.name || `Mahasiswa #${item.mahasiswa?.nim || ""}`,
    activity: "Pendaftaran Yudisium",
    date: item.submittedAt || item.updatedAt || item.createdAt,
  }));

  const activityLog = [...sktaLogs, ...sidangLogs, ...yudisiumLogs]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return {
    mahasiswa,
    periodeSidang,
    periodeYudisium,
    activityLog,
  };
};
