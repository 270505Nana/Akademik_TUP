import prisma from "../config/prisma.js";
import { uploadFile, deleteFile } from "./storageService.js";
import { ZipArchive } from "archiver";
import { PassThrough } from "stream";
import {
  checkJadwalConflict,
  isCapstoneScheme,
  validateBatchPengujiInternalConflict,
  validateBatchJadwalInternalConflict,
  generateJadwalSidangWorkbook,
  generateJadwalSidangFilename,
  generateJadwalBandungWorkbook,
} from "../utils/penjadwalanSidangHelper.js";

export const resolveStatusSidang = (penguji1, penguji2, tglSidang, ruangan) => {
  const adaPenguji = Boolean(penguji1 && penguji2);
  const adaJadwal = Boolean(tglSidang && ruangan);

  return adaPenguji && adaJadwal ? "Siap Sidang" : "Pendaftaran Diterima";
};

export const hitungStatusPenjadwalan = (
  penguji1,
  penguji2,
  tglSidang,
  ruangan,
) => {
  const adaPenguji = Boolean(penguji1 && penguji2);
  const adaJadwal = Boolean(tglSidang && ruangan);

  if (adaPenguji && adaJadwal) return "Siap Sidang";
  if (adaPenguji && !adaJadwal) return "Penguji Ready";
  if (!adaPenguji && adaJadwal) return "Penjadwalan Ready";

  return null;
};

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
  sidangPeriod: true,
};

/**
 * Mendapatkan daftar penjadwalan sidang (paginated)
 * Mendukung pencarian keyword (nama mahasiswa, NIM, judul TA) dan pengurutan (newest / oldest)
 */
export const getPenjadwalanSidangList = async ({
  user,
  dosen,
  sidangPeriodId,
  search,
  sort,
  skip,
  take,
  status,
  statusPenjadwalan,
  skemaSidang,
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
        where: { isOpen: true, category: "pendaftaran", deletedAt: null },
        orderBy: { updatedAt: "desc" },
      })) ||
      (await prisma.sidangPeriod.findFirst({
        where: { category: "pendaftaran", deletedAt: null },
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

  if (
    skemaSidang &&
    typeof skemaSidang === "string" &&
    skemaSidang.trim() !== ""
  ) {
    if (skemaSidang.trim().toLowerCase() === "non sidang") {
      return { total: 0, registrations: [] };
    }
    where.skemaSidangFinal = {
      equals: skemaSidang.trim(),
      mode: "insensitive",
    };
  } else {
    where.AND = [
      ...(where.AND || []),
      {
        OR: [
          { skemaSidangFinal: null },
          {
            NOT: {
              skemaSidangFinal: {
                equals: "Non Sidang",
                mode: "insensitive",
              },
            },
          },
        ],
      },
    ];
  }

  const filterStatus = (status || statusPenjadwalan || "").trim();
  if (filterStatus) {
    if (filterStatus === "Siap Sidang") {
      where.status = "Siap Sidang";
    } else if (filterStatus === "Penguji Ready") {
      where.dosenPenguji1Id = { not: null };
      where.dosenPenguji2Id = { not: null };
      where.AND = [
        ...(where.AND || []),
        {
          OR: [{ tglSidang: null }, { ruanganSidangId: null }],
        },
      ];
    } else if (filterStatus === "Penjadwalan Ready") {
      where.tglSidang = { not: null };
      where.ruanganSidangId = { not: null };
      where.AND = [
        ...(where.AND || []),
        {
          OR: [{ dosenPenguji1Id: null }, { dosenPenguji2Id: null }],
        },
      ];
    } else if (filterStatus === "Pendaftaran Diterima") {
      where.status = "Pendaftaran Diterima";
    } else {
      where.status = filterStatus;
    }
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

  // Filter pencarian: nama mahasiswa, NIM, atau judul tugas akhir (Indonesia / Inggris)
  if (search && typeof search === "string" && search.trim() !== "") {
    const searchTerm = search.trim();
    where.AND = [
      ...(where.AND || []),
      {
        OR: [
          {
            judulTugasAkhirIndonesia: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
          {
            judulTugasAkhirInggris: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
          {
            mahasiswa: { name: { contains: searchTerm, mode: "insensitive" } },
          },
          { mahasiswa: { nim: { contains: searchTerm, mode: "insensitive" } } },
        ],
      },
    ];
  }

  // Sorting: newest (desc) atau oldest (asc) berdasarkan createdAt sesuai standar /api/sidang-registrations
  const sortParam = (sort || "").toLowerCase().trim();
  const orderBy =
    sortParam === "oldest" ? { createdAt: "asc" } : { createdAt: "desc" };

  const [total, registrations] = await Promise.all([
    prisma.sidangRegistration.count({ where }),
    prisma.sidangRegistration.findMany({
      where,
      skip,
      take,
      include: penjadwalanSidangInclude,
      orderBy,
    }),
  ]);

  return { total, registrations };
};

/**
 * Menentukan dosen penguji sidang untuk satu pendaftaran (Ketua KK Only)
 */
export const setPengujiSidang = async ({
  id,
  dosenPenguji1Id,
  dosenPenguji2Id,
  user,
  dosen,
}) => {
  const registration = await prisma.sidangRegistration.findUnique({
    where: { id },
    include: {
      sidangPeriod: true,
      mahasiswa: true,
      dosenPembimbing1: true,
    },
  });

  if (!registration || registration.deletedAt) {
    const error = new Error("Pendaftaran sidang tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  // Validasi otorisasi: Dosen (Ketua KK) hanya boleh menentukan penguji untuk mahasiswa dari Research Group yang sama dengan dospem 1
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

    if (
      !registration.dosenPembimbing1 ||
      registration.dosenPembimbing1.researchGroupId !== currentDosen.researchGroupId
    ) {
      const error = new Error(
        "Anda tidak memiliki hak akses untuk menentukan dosen penguji mahasiswa di luar Kelompok Keahlian (Research Group) Anda",
      );
      error.statusCode = 403;
      throw error;
    }
  }

  // Catatan: Pengecekan isLocked & isPublished secara khusus membatasi role Dosen / Ketua KK
  if (registration.isLocked || registration.sidangPeriod?.isPublished) {
    const error = new Error(
      "Pendaftaran sidang telah dikunci atau telah dipublikasikan oleh admin. Dosen penguji tidak dapat diubah.",
    );
    error.statusCode = 400;
    throw error;
  }

  // Validasi: Dosen pembimbing tidak boleh ditugaskan sebagai dosen penguji mahasiswa bimbingannya sendiri
  const pembimbingIds = [
    registration.dosenPembimbing1Id,
    registration.dosenPembimbing2Id,
  ].filter(Boolean);

  if (
    pembimbingIds.includes(dosenPenguji1Id) ||
    pembimbingIds.includes(dosenPenguji2Id)
  ) {
    const error = new Error(
      "Dosen pembimbing tidak dapat ditugaskan sebagai dosen penguji mahasiswa bimbingannya sendiri",
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
      targetRegistration: registration,
    });

    if (conflictMessage) {
      const error = new Error(conflictMessage);
      error.statusCode = 400;
      throw error;
    }
  }

  const statusBaru = resolveStatusSidang(
    dosenPenguji1Id,
    dosenPenguji2Id,
    registration.tglSidang,
    registration.ruanganSidangId,
  );

  return prisma.sidangRegistration.update({
    where: { id },
    data: {
      dosenPenguji1Id,
      dosenPenguji2Id,
      status: statusBaru,
      isInfoPenjadwalanReaded: false,
    },
    include: penjadwalanSidangInclude,
  });
};

/**
 * Menentukan dosen penguji sidang untuk multiple pendaftaran (batch) (Ketua KK Only)
 */
export const batchSetPengujiSidang = async (items, { user, dosen } = {}) => {
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
      sidangPeriod: true,
    },
  });

  const registrationMap = new Map(registrations.map((reg) => [reg.id, reg]));
  for (const id of registrationIds) {
    if (!registrationMap.has(id)) {
      const error = new Error(
        `Pendaftaran sidang dengan ID ${id} tidak ditemukan`,
      );
      error.statusCode = 404;
      throw error;
    }
  }

  // Validasi otorisasi: Dosen (Ketua KK) hanya boleh menentukan penguji untuk mahasiswa dari Research Group yang sama dengan dospem 1
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

    const unauthorizedRegs = registrations.filter(
      (reg) =>
        !reg.dosenPembimbing1 ||
        reg.dosenPembimbing1.researchGroupId !== currentDosen.researchGroupId,
    );

    if (unauthorizedRegs.length > 0) {
      const unauthorizedNames = unauthorizedRegs
        .map((reg) => reg.mahasiswa?.name || reg.id)
        .join(", ");
      const error = new Error(
        `Anda tidak memiliki hak akses untuk menentukan dosen penguji mahasiswa di luar Kelompok Keahlian (Research Group) Anda: ${unauthorizedNames}`,
      );
      error.statusCode = 403;
      throw error;
    }
  }

  // Catatan: Pengecekan isLocked & isPublished secara khusus membatasi role Dosen / Ketua KK
  const lockedRegistrations = registrations.filter(
    (reg) => reg.isLocked || reg.sidangPeriod?.isPublished,
  );
  if (lockedRegistrations.length > 0) {
    const lockedNames = lockedRegistrations
      .map((reg) => reg.mahasiswa?.name || reg.id)
      .join(", ");
    const error = new Error(
      `Tidak dapat mengubah dosen penguji karena pendaftaran sidang berikut telah dikunci atau telah dipublikasikan oleh admin: ${lockedNames}`,
    );
    error.statusCode = 400;
    throw error;
  }

  // Validasi: Dosen pembimbing tidak boleh ditugaskan sebagai dosen penguji
  for (const item of items) {
    const reg = registrationMap.get(item.id);
    const pembimbingIds = [
      reg.dosenPembimbing1Id,
      reg.dosenPembimbing2Id,
    ].filter(Boolean);

    if (
      pembimbingIds.includes(item.dosenPenguji1Id) ||
      pembimbingIds.includes(item.dosenPenguji2Id)
    ) {
      const mhsName = reg.mahasiswa?.name || reg.id;
      const error = new Error(
        `Dosen pembimbing tidak dapat ditugaskan sebagai dosen penguji mahasiswa bimbingannya sendiri (${mhsName})`,
      );
      error.statusCode = 400;
      throw error;
    }
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
      const error = new Error(
        `Dosen penguji dengan ID ${dosenId} tidak ditemukan`,
      );
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
        registration: reg,
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
      registrationId: item.id,
      excludeRegistrationIds: registrationIds,
      tglSidang: item.tglSidang,
      dosenIds: [item.dosenPenguji1Id, item.dosenPenguji2Id],
      isCapstone: item.isCapstone,
      targetRegistration: item.registration,
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
      const reg = registrationMap.get(item.id);

      const statusBaru = resolveStatusSidang(
        item.dosenPenguji1Id,
        item.dosenPenguji2Id,
        reg.tglSidang,
        reg.ruanganSidangId,
      );

      const updated = await tx.sidangRegistration.update({
        where: { id: item.id },
        data: {
          dosenPenguji1Id: item.dosenPenguji1Id,
          dosenPenguji2Id: item.dosenPenguji2Id,
          status: statusBaru,
          isInfoPenjadwalanReaded: false,
        },
        include: penjadwalanSidangInclude,
      });
      results.push(updated);
    }
    return results;
  });
};

/**
 * Menentukan jadwal sidang (tanggal dan ruangan) untuk satu pendaftaran (Admin Only)
 * Catatan: Endpoint ini hanya untuk Admin. Admin tidak dibatasi oleh status isLocked
 * (status isLocked secara khusus ditujukan untuk membatasi Ketua KK agar tidak mengubah penguji).
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
    targetRegistration: registration,
  });

  if (conflictMessage) {
    const error = new Error(conflictMessage);
    error.statusCode = 400;
    throw error;
  }

  const statusBaru = resolveStatusSidang(
    registration.dosenPenguji1Id,
    registration.dosenPenguji2Id,
    new Date(tglSidang),
    ruanganSidangId,
  );

  return prisma.sidangRegistration.update({
    where: { id },
    data: {
      tglSidang: new Date(tglSidang),
      ruanganSidangId,
      status: statusBaru,
      isInfoPenjadwalanReaded: false,
    },
    include: penjadwalanSidangInclude,
  });
};

/**
 * Menentukan jadwal sidang (tanggal dan ruangan) untuk multiple pendaftaran (batch) (Admin Only)
 * Catatan: Endpoint ini hanya untuk Admin. Admin tidak dibatasi oleh status isLocked.
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
      const error = new Error(
        `Pendaftaran sidang dengan ID ${id} tidak ditemukan`,
      );
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
      const error = new Error(
        `Ruangan sidang dengan ID ${ruanganId} tidak ditemukan`,
      );
      error.statusCode = 404;
      throw error;
    }
  }

  // 1. Validasi bentrok antar item di dalam batch
  const itemsWithMeta = items.map((item) => {
    const reg = registrationMap.get(item.id);
    return {
      ...item,
      registration: reg,
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
      registrationId: item.id,
      excludeRegistrationIds: registrationIds,
      tglSidang: item.tglSidang,
      ruanganSidangId: item.ruanganSidangId,
      dosenIds: item.involvedDosenIds,
      isCapstone: item.isCapstone,
      targetRegistration: item.registration,
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
      const reg = registrationMap.get(item.id);

      const statusBaru = resolveStatusSidang(
        reg.dosenPenguji1Id,
        reg.dosenPenguji2Id,
        new Date(item.tglSidang),
        item.ruanganSidangId,
      );

      const updated = await tx.sidangRegistration.update({
        where: { id: item.id },
        data: {
          tglSidang: new Date(item.tglSidang),
          ruanganSidangId: item.ruanganSidangId,
          status: statusBaru,
          isInfoPenjadwalanReaded: false,
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

  // Workbook Format Awal
  const workbookAwal = generateJadwalSidangWorkbook(jadwalList);
  const bufferAwal = await workbookAwal.xlsx.writeBuffer();

  //Workbook Format Bandung
  const workbookBandung = generateJadwalBandungWorkbook(jadwalList);
  const bufferBandung = await workbookBandung.xlsx.writeBuffer();

  //keduanya dalam arsip ZIP
  const archive = new ZipArchive({ zlib: { level: 9 } });
  const stream = new PassThrough();

  archive.on("error", (err) => {
    throw err;
  });

  archive.pipe(stream);
  archive.append(Buffer.from(bufferAwal), {
    name: "Jadwal_Sidang_Format_Awal.xlsx",
  });
  archive.append(Buffer.from(bufferBandung), {
    name: "Jadwal_Sidang_Format_Bandung.xlsx",
  });

  await archive.finalize();

  const baseFilename = generateJadwalSidangFilename(selectedPeriod);
  const zipFilename = baseFilename.endsWith(".xlsx")
    ? baseFilename.replace(".xlsx", ".zip")
    : `${baseFilename}.zip`;

  return { stream, filename: zipFilename };
};

/**
 * Toggle kunci pendaftaran sidang oleh admin
 * Mengunci pendaftaran agar dosen/Ketua KK tidak dapat mengubah susunan dosen penguji
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

  const updateData = {
    isLocked: !registration.isLocked,
  };

  if (registration.isLocked) {
    if (registration.notaDinasUrl) {
      await deleteFile(registration.notaDinasUrl);
    }
    updateData.notaDinasUrl = null;
  }

  return prisma.sidangRegistration.update({
    where: { id },
    data: updateData,
    include: penjadwalanSidangInclude,
  });
};

/**
 * Menentukan dosen penguji dan jadwal sidang (tanggal dan ruangan) sekaligus untuk satu pendaftaran (Admin Only)
 * Catatan: Endpoint ini diperuntukkan bagi Admin (tidak terikat batasan isLocked).
 * Namun aturan integritas akademik dosen pembimbing !== dosen penguji tetap berlaku.
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

  // Validasi: Dosen pembimbing tidak boleh ditugaskan sebagai dosen penguji
  const pembimbingIds = [
    registration.dosenPembimbing1Id,
    registration.dosenPembimbing2Id,
  ].filter(Boolean);

  if (
    pembimbingIds.includes(dosenPenguji1Id) ||
    pembimbingIds.includes(dosenPenguji2Id)
  ) {
    const error = new Error(
      "Dosen pembimbing tidak dapat ditugaskan sebagai dosen penguji mahasiswa bimbingannya sendiri",
    );
    error.statusCode = 400;
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
    targetRegistration: registration,
  });

  if (conflictMessage) {
    const error = new Error(conflictMessage);
    error.statusCode = 400;
    throw error;
  }

  const statusBaru = resolveStatusSidang(
    dosenPenguji1Id,
    dosenPenguji2Id,
    new Date(tglSidang),
    ruanganSidangId,
  );

  return prisma.sidangRegistration.update({
    where: { id },
    data: {
      dosenPenguji1Id,
      dosenPenguji2Id,
      tglSidang: new Date(tglSidang),
      ruanganSidangId,
      status: statusBaru,
      isInfoPenjadwalanReaded: false,
    },
    include: penjadwalanSidangInclude,
  });
};

/**
 * Tandai info penjadwalan sidang telah dibaca oleh mahasiswa
 * Bersifat satu arah: hanya mengubah isInfoPenjadwalanReaded menjadi true.
 * Jika jadwal belum dipublikasikan, melempar error 404.
 */
export const toggleReadInfoPenjadwalan = async ({ id, user }) => {
  const registration = await prisma.sidangRegistration.findUnique({
    where: { id },
    include: {
      mahasiswa: true,
      sidangPeriod: true,
    },
  });

  if (
    !registration ||
    registration.deletedAt ||
    !registration.sidangPeriod?.isPublished
  ) {
    const error = new Error("Pendaftaran sidang tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  if (user?.role === "MAHASISWA") {
    if (!registration.mahasiswa || registration.mahasiswa.userId !== user.id) {
      const error = new Error(
        "Anda tidak memiliki akses ke pendaftaran sidang ini",
      );
      error.statusCode = 403;
      throw error;
    }
  }

  return prisma.sidangRegistration.update({
    where: { id },
    data: {
      isInfoPenjadwalanReaded: true,
    },
    include: penjadwalanSidangInclude,
  });
};

/**
 * Toggle status publish periode sidang ke mahasiswa (Admin Only)
 */
export const togglePublishSidangPeriod = async (sidangPeriodId) => {
  const period = await prisma.sidangPeriod.findFirst({
    where: {
      id: sidangPeriodId,
      deletedAt: null,
    },
  });

  if (!period) {
    const error = new Error("Periode sidang tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  return prisma.sidangPeriod.update({
    where: { id: sidangPeriodId },
    data: {
      isPublished: !period.isPublished,
    },
  });
};

export const uploadNotaDinas = async ({ id, fileData }) => {
  const registration = await prisma.sidangRegistration.findUnique({
    where: { id },
  });

  if (!registration || registration.deletedAt) {
    const error = new Error("Pendaftaran sidang tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  // Validasi: Pastikan jadwal sudah di-lock sebelum upload nota dinas
  if (!registration.isLocked) {
    const error = new Error(
      "Jadwal sidang belum di-lock (final). Nota dinas tidak dapat diunggah.",
    );
    error.statusCode = 400;
    throw error;
  }

  const uploaded = await uploadFile({
    buffer: fileData.buffer,
    originalname: fileData.originalname,
    folder: "nota-dinas",
    mimetype: fileData.mimetype,
  });

  // Hapus file lama di R2/storage jika admin mengunggah ulang Nota Dinas
  if (registration.notaDinasUrl) {
    await deleteFile(registration.notaDinasUrl);
  }

  // Simpan path/key file nota dinas ke kolom notaDinasUrl pada SidangRegistration
  return prisma.sidangRegistration.update({
    where: { id },
    data: {
      notaDinasUrl: uploaded.filepath,
    },
    include: penjadwalanSidangInclude,
  });
};
/**
 * Mengambil data Nota Dinas berdasarkan ID pendaftaran sidang
 */
export const getNotaDinas = async ({ id, user, dosen }) => {
  const registration = await prisma.sidangRegistration.findUnique({
    where: { id },
    include: penjadwalanSidangInclude,
  });

  if (!registration || registration.deletedAt) {
    const error = new Error("Pendaftaran sidang tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  // Jika yang mengakses adalah DOSEN biasa (bukan Admin & bukan Ketua KK),
  // pastikan dosen tersebut merupakan pembimbing atau penguji di sidang ini
  if (user?.role === "DOSEN" && !dosen?.isKetuaKK) {
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

    const involvedDosenIds = [
      registration.dosenPembimbing1Id,
      registration.dosenPembimbing2Id,
      registration.dosenPenguji1Id,
      registration.dosenPenguji2Id,
    ].filter(Boolean);

    if (!involvedDosenIds.includes(currentDosen.id)) {
      const error = new Error(
        "Anda tidak memiliki akses untuk melihat Nota Dinas sidang ini",
      );
      error.statusCode = 403;
      throw error;
    }
  }

  if (!registration.notaDinasUrl) {
    const error = new Error(
      "Nota Dinas belum diunggah untuk pendaftaran sidang ini",
    );
    error.statusCode = 404;
    throw error;
  }

  return registration;
};
