import prisma from "../config/prisma.js";
import {
  checkJadwalConflict,
  isCapstoneScheme,
  validateBatchPengujiInternalConflict,
  validateBatchJadwalInternalConflict,
  generateJadwalSidangWorkbook,
  generateJadwalSidangFilename,
} from "../utils/penjadwalanSidangHelper.js";

export const penjadwalanSidangInclude = {
  mahasiswa: {
    include: {
      studyProgram: true,
      user: true,
    },
  },
  dosenPembimbing1: {
    include: {
      user: true,
    },
  },
  dosenPembimbing2: {
    include: {
      user: true,
    },
  },
  dosenPenguji1: {
    include: {
      user: true,
    },
  },
  dosenPenguji2: {
    include: {
      user: true,
    },
  },
  ruanganSidang: true,
};

/**
 * Mendapatkan daftar penjadwalan sidang (paginated)
 */
export const getPenjadwalanSidangList = async ({
  user,
  dosen,
  sidangPeriodId,
  skip,
  take,
}) => {
  let targetPeriodId = sidangPeriodId;

  if (
    targetPeriodId &&
    typeof targetPeriodId === "string" &&
    targetPeriodId.trim() !== ""
  ) {
    targetPeriodId = targetPeriodId.trim();
  } else {
    const activePeriod =
      (await prisma.sidangPeriod.findFirst({
        where: { isOpen: true, deletedAt: null },
        orderBy: { updatedAt: "desc" },
      })) ||
      (await prisma.sidangPeriod.findFirst({
        where: { deletedAt: null },
        orderBy: { endDate: "desc" },
      }));

    if (activePeriod) {
      targetPeriodId = activePeriod.id;
    }
  }

  const where = {
    isDraft: false,
    deletedAt: null,
  };

  if (targetPeriodId) {
    where.sidangPeriodId = targetPeriodId;
  }

  if (user?.role === "DOSEN") {
    const currentDosen =
      dosen ||
      (await prisma.dosen.findUnique({
        where: { userId: user.id, deletedAt: null },
      }));

    if (!currentDosen) {
      const error = new Error("Data Dosen tidak ditemukan");
      error.statusCode = 404;
      throw error;
    }

    where.dosenPembimbing1 = {
      researchGroupId: currentDosen.researchGroupId,
      deletedAt: null,
    };
  }

  const [total, registrations] = await Promise.all([
    prisma.sidangRegistration.count({ where }),
    prisma.sidangRegistration.findMany({
      where,
      skip,
      take,
      include: penjadwalanSidangInclude,
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  return { total, registrations };
};

/**
 * Menentukan dosen penguji sidang untuk satu pendaftaran
 */
export const setPengujiSidang = async ({
  id,
  dosenPenguji1Id,
  dosenPenguji2Id,
}) => {
  const registration = await prisma.sidangRegistration.findUnique({
    where: { id },
  });

  if (!registration || registration.deletedAt) {
    const error = new Error("Pendaftaran sidang tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  if (registration.isLocked) {
    const error = new Error(
      "Pendaftaran sidang telah dikunci oleh admin. Dosen penguji tidak dapat diubah.",
    );
    error.statusCode = 400;
    throw error;
  }

  const [dosen1, dosen2] = await Promise.all([
    prisma.dosen.findUnique({
      where: { id: dosenPenguji1Id },
    }),
    prisma.dosen.findUnique({
      where: { id: dosenPenguji2Id },
    }),
  ]);

  if (!dosen1 || dosen1.deletedAt) {
    const error = new Error("Dosen penguji 1 tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  if (!dosen2 || dosen2.deletedAt) {
    const error = new Error("Dosen penguji 2 tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  // Validasi bentrok jika jadwal sidang sudah ditentukan sebelumnya
  if (registration.tglSidang) {
    const conflictMessage = await checkJadwalConflict({
      registrationId: id,
      tglSidang: registration.tglSidang,
      dosenIds: [dosenPenguji1Id, dosenPenguji2Id],
      isCapstone: isCapstoneScheme(registration),
    });

    if (conflictMessage) {
      const error = new Error(conflictMessage);
      error.statusCode = 400;
      throw error;
    }
  }

  return prisma.sidangRegistration.update({
    where: { id },
    data: {
      dosenPenguji1Id,
      dosenPenguji2Id,
    },
    include: penjadwalanSidangInclude,
  });
};

/**
 * Menentukan dosen penguji sidang untuk multiple pendaftaran (batch)
 */
export const batchSetPengujiSidang = async (items) => {
  const registrationIds = Array.from(new Set(items.map((item) => item.id)));
  const registrations = await prisma.sidangRegistration.findMany({
    where: {
      id: { in: registrationIds },
      deletedAt: null,
    },
    include: {
      mahasiswa: { include: { user: true } },
      dosenPembimbing1: { include: { user: true } },
      dosenPembimbing2: { include: { user: true } },
    },
  });

  const registrationMap = new Map(registrations.map((reg) => [reg.id, reg]));
  for (const id of registrationIds) {
    if (!registrationMap.has(id)) {
      const error = new Error(`Pendaftaran sidang dengan ID ${id} tidak ditemukan`);
      error.statusCode = 404;
      throw error;
    }
  }

  const lockedRegistrations = registrations.filter((reg) => reg.isLocked);
  if (lockedRegistrations.length > 0) {
    const lockedNames = lockedRegistrations
      .map((reg) => reg.mahasiswa?.name || reg.id)
      .join(", ");
    const error = new Error(
      `Tidak dapat mengubah dosen penguji karena pendaftaran sidang berikut telah dikunci oleh admin: ${lockedNames}`,
    );
    error.statusCode = 400;
    throw error;
  }

  const allDosenIds = new Set();
  items.forEach((item) => {
    allDosenIds.add(item.dosenPenguji1Id);
    allDosenIds.add(item.dosenPenguji2Id);
  });

  const dosens = await prisma.dosen.findMany({
    where: {
      id: { in: Array.from(allDosenIds) },
      deletedAt: null,
    },
    include: { user: true },
  });

  const dosenMap = new Map(dosens.map((d) => [d.id, d]));
  for (const dosenId of allDosenIds) {
    if (!dosenMap.has(dosenId)) {
      const error = new Error(`Dosen penguji dengan ID ${dosenId} tidak ditemukan`);
      error.statusCode = 404;
      throw error;
    }
  }

  // 1. Validasi bentrok antar item di dalam batch (jika sudah ada tglSidang)
  const scheduledItems = items
    .map((item) => {
      const reg = registrationMap.get(item.id);
      return {
        ...item,
        isCapstone: isCapstoneScheme(reg),
        tglSidang: reg.tglSidang,
        mahasiswaName: reg.mahasiswa?.name || "Mahasiswa",
        allDosenIds: [
          reg.dosenPembimbing1Id,
          reg.dosenPembimbing2Id,
          item.dosenPenguji1Id,
          item.dosenPenguji2Id,
        ].filter(Boolean),
      };
    })
    .filter((item) => item.tglSidang);

  validateBatchPengujiInternalConflict(scheduledItems, dosenMap);

  // 2. Validasi bentrok dengan data lain di database
  for (const item of scheduledItems) {
    const conflictMessage = await checkJadwalConflict({
      excludeRegistrationIds: registrationIds,
      tglSidang: item.tglSidang,
      dosenIds: [item.dosenPenguji1Id, item.dosenPenguji2Id],
      isCapstone: item.isCapstone,
    });

    if (conflictMessage) {
      const error = new Error(conflictMessage);
      error.statusCode = 400;
      throw error;
    }
  }

  return prisma.$transaction(async (tx) => {
    const results = [];
    for (const item of items) {
      const updated = await tx.sidangRegistration.update({
        where: { id: item.id },
        data: {
          dosenPenguji1Id: item.dosenPenguji1Id,
          dosenPenguji2Id: item.dosenPenguji2Id,
        },
        include: penjadwalanSidangInclude,
      });
      results.push(updated);
    }
    return results;
  });
};

/**
 * Menentukan jadwal sidang (tanggal dan ruangan) untuk satu pendaftaran
 */
export const setJadwalSidang = async ({ id, tglSidang, ruanganSidangId }) => {
  const registration = await prisma.sidangRegistration.findUnique({
    where: { id },
  });

  if (!registration || registration.deletedAt) {
    const error = new Error("Pendaftaran sidang tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const ruangan = await prisma.ruangan.findUnique({
    where: { id: ruanganSidangId },
  });

  if (!ruangan || ruangan.deletedAt) {
    const error = new Error("Ruangan sidang tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  // Kumpulkan semua dosen yang terlibat dalam sidang ini (Pembimbing 1 & 2, Penguji 1 & 2)
  const involvedDosenIds = [
    registration.dosenPembimbing1Id,
    registration.dosenPembimbing2Id,
    registration.dosenPenguji1Id,
    registration.dosenPenguji2Id,
  ].filter(Boolean);

  // Validasi bentrok jadwal (jarak 2 jam untuk ruangan dan semua dosen terkait)
  const conflictMessage = await checkJadwalConflict({
    registrationId: id,
    tglSidang,
    ruanganSidangId,
    dosenIds: involvedDosenIds,
    isCapstone: isCapstoneScheme(registration),
  });

  if (conflictMessage) {
    const error = new Error(conflictMessage);
    error.statusCode = 400;
    throw error;
  }

  return prisma.sidangRegistration.update({
    where: { id },
    data: {
      tglSidang: new Date(tglSidang),
      ruanganSidangId,
    },
    include: penjadwalanSidangInclude,
  });
};

/**
 * Menentukan jadwal sidang (tanggal dan ruangan) untuk multiple pendaftaran (batch)
 */
export const batchSetJadwalSidang = async (items) => {
  const registrationIds = Array.from(new Set(items.map((item) => item.id)));
  const registrations = await prisma.sidangRegistration.findMany({
    where: {
      id: { in: registrationIds },
      deletedAt: null,
    },
    include: {
      mahasiswa: { include: { user: true } },
      dosenPembimbing1: { include: { user: true } },
      dosenPembimbing2: { include: { user: true } },
      dosenPenguji1: { include: { user: true } },
      dosenPenguji2: { include: { user: true } },
    },
  });

  const registrationMap = new Map(registrations.map((reg) => [reg.id, reg]));
  for (const id of registrationIds) {
    if (!registrationMap.has(id)) {
      const error = new Error(`Pendaftaran sidang dengan ID ${id} tidak ditemukan`);
      error.statusCode = 404;
      throw error;
    }
  }

  const allRuanganIds = new Set(items.map((item) => item.ruanganSidangId));
  const ruanganList = await prisma.ruangan.findMany({
    where: {
      id: { in: Array.from(allRuanganIds) },
      deletedAt: null,
    },
  });

  const ruanganMap = new Map(ruanganList.map((r) => [r.id, r]));
  for (const ruanganId of allRuanganIds) {
    if (!ruanganMap.has(ruanganId)) {
      const error = new Error(`Ruangan sidang dengan ID ${ruanganId} tidak ditemukan`);
      error.statusCode = 404;
      throw error;
    }
  }

  // 1. Validasi bentrok antar item di dalam batch
  const itemsWithMeta = items.map((item) => {
    const reg = registrationMap.get(item.id);
    return {
      ...item,
      isCapstone: isCapstoneScheme(reg),
      mahasiswaName: reg.mahasiswa?.name || "Mahasiswa",
      involvedDosenIds: [
        reg.dosenPembimbing1Id,
        reg.dosenPembimbing2Id,
        reg.dosenPenguji1Id,
        reg.dosenPenguji2Id,
      ].filter(Boolean),
      involvedDosens: [
        reg.dosenPembimbing1,
        reg.dosenPembimbing2,
        reg.dosenPenguji1,
        reg.dosenPenguji2,
      ].filter(Boolean),
    };
  });

  validateBatchJadwalInternalConflict(itemsWithMeta, ruanganMap);

  // 2. Validasi bentrok dengan jadwal lain di database
  for (const item of itemsWithMeta) {
    const conflictMessage = await checkJadwalConflict({
      excludeRegistrationIds: registrationIds,
      tglSidang: item.tglSidang,
      ruanganSidangId: item.ruanganSidangId,
      dosenIds: item.involvedDosenIds,
      isCapstone: item.isCapstone,
    });

    if (conflictMessage) {
      const error = new Error(conflictMessage);
      error.statusCode = 400;
      throw error;
    }
  }

  return prisma.$transaction(async (tx) => {
    const results = [];
    for (const item of items) {
      const updated = await tx.sidangRegistration.update({
        where: { id: item.id },
        data: {
          tglSidang: new Date(item.tglSidang),
          ruanganSidangId: item.ruanganSidangId,
        },
        include: penjadwalanSidangInclude,
      });
      results.push(updated);
    }
    return results;
  });
};

/**
 * Mengekspor data jadwal sidang ke Excel
 */
export const exportJadwalSidang = async ({ user, dosen, sidangPeriodId }) => {
  let targetPeriodId = sidangPeriodId;
  let selectedPeriod = null;

  if (
    targetPeriodId &&
    typeof targetPeriodId === "string" &&
    targetPeriodId.trim() !== ""
  ) {
    targetPeriodId = targetPeriodId.trim();
    selectedPeriod = await prisma.sidangPeriod.findFirst({
      where: { id: targetPeriodId, deletedAt: null },
    });
  } else {
    selectedPeriod =
      (await prisma.sidangPeriod.findFirst({
        where: { isOpen: true, deletedAt: null },
        orderBy: { updatedAt: "desc" },
      })) ||
      (await prisma.sidangPeriod.findFirst({
        where: { deletedAt: null },
        orderBy: { endDate: "desc" },
      }));

    if (selectedPeriod) {
      targetPeriodId = selectedPeriod.id;
    }
  }

  const whereClause = {
    isDraft: false,
    deletedAt: null,
    tglSidang: { not: null },
  };

  if (targetPeriodId) {
    whereClause.sidangPeriodId = targetPeriodId;
  }

  if (user?.role === "DOSEN") {
    const currentDosen =
      dosen ||
      (await prisma.dosen.findUnique({
        where: { userId: user.id, deletedAt: null },
      }));

    if (!currentDosen) {
      const error = new Error("Data Dosen tidak ditemukan");
      error.statusCode = 404;
      throw error;
    }

    whereClause.dosenPembimbing1 = {
      researchGroupId: currentDosen.researchGroupId,
      deletedAt: null,
    };
  }

  const jadwalList = await prisma.sidangRegistration.findMany({
    where: whereClause,
    include: penjadwalanSidangInclude,
    orderBy: { tglSidang: "asc" },
  });

  const workbook = generateJadwalSidangWorkbook(jadwalList);
  const filename = generateJadwalSidangFilename(selectedPeriod);

  return { workbook, filename };
};

/**
 * Toggle kunci pendaftaran sidang oleh admin
 */
export const toggleLockSidangRegistration = async (id) => {
  const registration = await prisma.sidangRegistration.findUnique({
    where: { id },
  });

  if (!registration || registration.deletedAt) {
    const error = new Error("Pendaftaran sidang tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  return prisma.sidangRegistration.update({
    where: { id },
    data: {
      isLocked: !registration.isLocked,
    },
    include: penjadwalanSidangInclude,
  });
};

/**
 * Menentukan dosen penguji dan jadwal sidang (tanggal dan ruangan) sekaligus untuk satu pendaftaran (Admin Only)
 */
export const setPengujiJadwalSidang = async ({
  id,
  dosenPenguji1Id,
  dosenPenguji2Id,
  tglSidang,
  ruanganSidangId,
}) => {
  const registration = await prisma.sidangRegistration.findUnique({
    where: { id },
  });

  if (!registration || registration.deletedAt) {
    const error = new Error("Pendaftaran sidang tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const ruangan = await prisma.ruangan.findUnique({
    where: { id: ruanganSidangId },
  });

  if (!ruangan || ruangan.deletedAt) {
    const error = new Error("Ruangan sidang tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const [dosen1, dosen2] = await Promise.all([
    prisma.dosen.findUnique({
      where: { id: dosenPenguji1Id },
    }),
    prisma.dosen.findUnique({
      where: { id: dosenPenguji2Id },
    }),
  ]);

  if (!dosen1 || dosen1.deletedAt) {
    const error = new Error("Dosen penguji 1 tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  if (!dosen2 || dosen2.deletedAt) {
    const error = new Error("Dosen penguji 2 tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  // Kumpulkan semua dosen yang terlibat dalam sidang ini (Pembimbing 1 & 2, Penguji 1 & 2 yang baru)
  const involvedDosenIds = [
    registration.dosenPembimbing1Id,
    registration.dosenPembimbing2Id,
    dosenPenguji1Id,
    dosenPenguji2Id,
  ].filter(Boolean);

  // Validasi bentrok jadwal (jarak 2 jam untuk ruangan dan semua dosen terkait)
  const conflictMessage = await checkJadwalConflict({
    registrationId: id,
    tglSidang,
    ruanganSidangId,
    dosenIds: involvedDosenIds,
    isCapstone: isCapstoneScheme(registration),
  });

  if (conflictMessage) {
    const error = new Error(conflictMessage);
    error.statusCode = 400;
    throw error;
  }

  return prisma.sidangRegistration.update({
    where: { id },
    data: {
      dosenPenguji1Id,
      dosenPenguji2Id,
      tglSidang: new Date(tglSidang),
      ruanganSidangId,
    },
    include: penjadwalanSidangInclude,
  });
};

/**
 * Toggle status publish pendaftaran sidang ke mahasiswa (Admin Only)
 * Ketika publish di-toggle:
 * - jika isPublished menjadi true, maka isLocked juga menjadi true.
 * - jika isPublished menjadi false, isLocked tidak ikut menjadi false.
 */
export const togglePublishSidangRegistration = async (id) => {
  const registration = await prisma.sidangRegistration.findUnique({
    where: { id },
  });

  if (!registration || registration.deletedAt) {
    const error = new Error("Pendaftaran sidang tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const nextPublished = !registration.isPublished;
  const updateData = {
    isPublished: nextPublished,
  };

  if (nextPublished) {
    updateData.isLocked = true;
  }

  return prisma.sidangRegistration.update({
    where: { id },
    data: updateData,
    include: penjadwalanSidangInclude,
  });
};


