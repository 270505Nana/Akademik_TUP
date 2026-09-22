import asyncHandler from "express-async-handler";
import excel from "exceljs";
import prisma from "../config/prisma.js";
import {
  sendValidationError,
  isNil,
  isValidISO8601,
} from "../utils/validationHelper.js";
import {
  getPaginationParams,
  formatPaginationResponse,
} from "../utils/paginationHelper.js";
import { mapPenjadwalanSidangToFrontend } from "../mappers/index.js";

const penjadwalanSidangInclude = {
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

// Penjadwalan Sidang List
const listPenjadwalanSidang = asyncHandler(async (req, res) => {
  const paginationParams = getPaginationParams(req.query);

  const where = {
    deletedAt: null,
  };

  if (req.user?.role === "DOSEN") {
    const dosen =
      req.dosen ||
      (await prisma.dosen.findUnique({
        where: { userId: req.user.id, deletedAt: null },
      }));

    if (!dosen) {
      res.status(404);
      throw new Error("Data Dosen tidak ditemukan");
    }

    where.dosenPembimbing1 = {
      researchGroupId: dosen.researchGroupId,
      deletedAt: null,
    };
  }

  const [total, sidangRegistrations] = await Promise.all([
    prisma.sidangRegistration.count({ where }),
    prisma.sidangRegistration.findMany({
      where,
      skip: paginationParams.skip,
      take: paginationParams.take,
      include: penjadwalanSidangInclude,
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  const data = sidangRegistrations.map((reg) =>
    mapPenjadwalanSidangToFrontend(reg),
  );

  res.json(formatPaginationResponse(data, total, paginationParams));
});

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

// Helper untuk memeriksa bentrok jadwal (jarak 2 jam) antara ruangan dan dosen
const checkJadwalConflict = async ({
  registrationId,
  excludeRegistrationIds = [],
  tglSidang,
  ruanganSidangId,
  dosenIds = [],
}) => {
  if (!tglSidang) return null;

  const targetTime = new Date(tglSidang).getTime();
  const minTime = new Date(targetTime - TWO_HOURS_MS);
  const maxTime = new Date(targetTime + TWO_HOURS_MS);

  const validDosenIds = dosenIds.filter(Boolean);

  const orConditions = [];
  if (ruanganSidangId) {
    orConditions.push({ ruanganSidangId });
  }
  if (validDosenIds.length > 0) {
    orConditions.push(
      { dosenPembimbing1Id: { in: validDosenIds } },
      { dosenPembimbing2Id: { in: validDosenIds } },
      { dosenPenguji1Id: { in: validDosenIds } },
      { dosenPenguji2Id: { in: validDosenIds } },
    );
  }

  if (orConditions.length === 0) return null;

  const notIds = [];
  if (registrationId) notIds.push(registrationId);
  if (Array.isArray(excludeRegistrationIds) && excludeRegistrationIds.length > 0) {
    notIds.push(...excludeRegistrationIds);
  }

  const idCondition =
    notIds.length === 1
      ? { id: { not: notIds[0] } }
      : notIds.length > 1
        ? { id: { notIn: notIds } }
        : {};

  const conflict = await prisma.sidangRegistration.findFirst({
    where: {
      ...idCondition,
      deletedAt: null,
      tglSidang: {
        gt: minTime,
        lt: maxTime,
      },
      OR: orConditions,
    },
    include: {
      ruanganSidang: true,
      dosenPembimbing1: { include: { user: true } },
      dosenPembimbing2: { include: { user: true } },
      dosenPenguji1: { include: { user: true } },
      dosenPenguji2: { include: { user: true } },
      mahasiswa: { include: { user: true } },
    },
  });

  if (!conflict) return null;

  if (ruanganSidangId && conflict.ruanganSidangId === ruanganSidangId) {
    const namaRuangan = conflict.ruanganSidang
      ? `${conflict.ruanganSidang.name} (${conflict.ruanganSidang.gedung})`
      : "tersebut";
    return `Jadwal bentrok: Ruangan ${namaRuangan} sudah terjadwal untuk sidang mahasiswa ${conflict.mahasiswa?.user?.name || "lain"} pada rentang waktu 2 jam (${new Date(conflict.tglSidang).toISOString()}).`;
  }

  const conflictingDosen = [
    conflict.dosenPembimbing1,
    conflict.dosenPembimbing2,
    conflict.dosenPenguji1,
    conflict.dosenPenguji2,
  ].find((d) => d && validDosenIds.includes(d.id));

  if (conflictingDosen) {
    const namaDosen =
      conflictingDosen.user?.name || conflictingDosen.kodeDosen || "Dosen";
    return `Jadwal bentrok: Dosen ${namaDosen} sudah memiliki jadwal sidang mahasiswa ${conflict.mahasiswa?.user?.name || "lain"} pada rentang waktu 2 jam (${new Date(conflict.tglSidang).toISOString()}).`;
  }

  return "Jadwal bentrok dengan pelaksanaan sidang lain (jarak minimal 2 jam).";
};

// Set Dosen Penguji Sidang (Ketua KK Only)
const setPengujiSidang = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { dosenPenguji1Id, dosenPenguji2Id } = req.body;

  const errors = [];
  if (isNil(dosenPenguji1Id)) {
    errors.push({
      field: "dosenPenguji1Id",
      message: "ID dosen penguji 1 wajib diisi",
    });
  } else if (typeof dosenPenguji1Id !== "string") {
    errors.push({
      field: "dosenPenguji1Id",
      message: "ID dosen penguji 1 harus berupa string",
    });
  }

  if (isNil(dosenPenguji2Id)) {
    errors.push({
      field: "dosenPenguji2Id",
      message: "ID dosen penguji 2 wajib diisi",
    });
  } else if (typeof dosenPenguji2Id !== "string") {
    errors.push({
      field: "dosenPenguji2Id",
      message: "ID dosen penguji 2 harus berupa string",
    });
  }

  if (
    !isNil(dosenPenguji1Id) &&
    !isNil(dosenPenguji2Id) &&
    dosenPenguji1Id === dosenPenguji2Id
  ) {
    errors.push({
      field: "dosenPenguji2Id",
      message: "Dosen penguji 1 dan dosen penguji 2 tidak boleh sama",
    });
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  const registration = await prisma.sidangRegistration.findUnique({
    where: { id },
  });

  if (!registration || registration.deletedAt) {
    res.status(404);
    throw new Error("Pendaftaran sidang tidak ditemukan");
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
    res.status(404);
    throw new Error("Dosen penguji 1 tidak ditemukan");
  }

  if (!dosen2 || dosen2.deletedAt) {
    res.status(404);
    throw new Error("Dosen penguji 2 tidak ditemukan");
  }

  // Validasi bentrok jika jadwal sidang sudah ditentukan sebelumnya
  if (registration.tglSidang) {
    const conflictMessage = await checkJadwalConflict({
      registrationId: id,
      tglSidang: registration.tglSidang,
      dosenIds: [dosenPenguji1Id, dosenPenguji2Id],
    });

    if (conflictMessage) {
      res.status(400);
      throw new Error(conflictMessage);
    }
  }

  const updatedRegistration = await prisma.sidangRegistration.update({
    where: { id },
    data: {
      dosenPenguji1Id,
      dosenPenguji2Id,
    },
    include: penjadwalanSidangInclude,
  });

  res.json({
    message: "Dosen penguji sidang berhasil ditentukan",
    data: mapPenjadwalanSidangToFrontend(updatedRegistration),
  });
});

// Set Dosen Penguji Sidang Batch (Ketua KK Only)
const batchSetPengujiSidang = asyncHandler(async (req, res) => {
  if (!Array.isArray(req.body) || req.body.length === 0) {
    return sendValidationError(res, [
      {
        field: "body",
        message: "Request body harus berupa array data dan tidak boleh kosong",
      },
    ]);
  }

  const errors = [];
  const seenIds = new Set();

  req.body.forEach((item, idx) => {
    if (isNil(item.id)) {
      errors.push({
        field: `[${idx}].id`,
        message: "ID pendaftaran sidang wajib diisi",
      });
    } else if (typeof item.id !== "string") {
      errors.push({
        field: `[${idx}].id`,
        message: "ID pendaftaran sidang harus berupa string",
      });
    } else if (seenIds.has(item.id)) {
      errors.push({
        field: `[${idx}].id`,
        message: "ID pendaftaran sidang tidak boleh duplikat dalam satu request",
      });
    } else {
      seenIds.add(item.id);
    }

    if (isNil(item.dosenPenguji1Id)) {
      errors.push({
        field: `[${idx}].dosenPenguji1Id`,
        message: "ID dosen penguji 1 wajib diisi",
      });
    } else if (typeof item.dosenPenguji1Id !== "string") {
      errors.push({
        field: `[${idx}].dosenPenguji1Id`,
        message: "ID dosen penguji 1 harus berupa string",
      });
    }

    if (isNil(item.dosenPenguji2Id)) {
      errors.push({
        field: `[${idx}].dosenPenguji2Id`,
        message: "ID dosen penguji 2 wajib diisi",
      });
    } else if (typeof item.dosenPenguji2Id !== "string") {
      errors.push({
        field: `[${idx}].dosenPenguji2Id`,
        message: "ID dosen penguji 2 harus berupa string",
      });
    }

    if (
      !isNil(item.dosenPenguji1Id) &&
      !isNil(item.dosenPenguji2Id) &&
      item.dosenPenguji1Id === item.dosenPenguji2Id
    ) {
      errors.push({
        field: `[${idx}].dosenPenguji2Id`,
        message: "Dosen penguji 1 dan dosen penguji 2 tidak boleh sama",
      });
    }
  });

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  const registrationIds = Array.from(seenIds);
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
      res.status(404);
      throw new Error(`Pendaftaran sidang dengan ID ${id} tidak ditemukan`);
    }
  }

  const allDosenIds = new Set();
  req.body.forEach((item) => {
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
      res.status(404);
      throw new Error(`Dosen penguji dengan ID ${dosenId} tidak ditemukan`);
    }
  }

  // 1. Validasi bentrok antar item di dalam batch (jika sudah ada tglSidang)
  const scheduledItems = req.body
    .map((item) => {
      const reg = registrationMap.get(item.id);
      return {
        ...item,
        tglSidang: reg.tglSidang,
        mahasiswaName: reg.mahasiswa?.user?.name || "Mahasiswa",
        allDosenIds: [
          reg.dosenPembimbing1Id,
          reg.dosenPembimbing2Id,
          item.dosenPenguji1Id,
          item.dosenPenguji2Id,
        ].filter(Boolean),
      };
    })
    .filter((item) => item.tglSidang);

  for (let i = 0; i < scheduledItems.length; i++) {
    for (let j = i + 1; j < scheduledItems.length; j++) {
      const itemA = scheduledItems[i];
      const itemB = scheduledItems[j];
      const diff = Math.abs(
        new Date(itemA.tglSidang).getTime() -
          new Date(itemB.tglSidang).getTime(),
      );

      if (diff < TWO_HOURS_MS) {
        const commonDosenId = itemA.allDosenIds.find((dId) =>
          itemB.allDosenIds.includes(dId),
        );
        if (commonDosenId) {
          const dosenObj = dosenMap.get(commonDosenId);
          const namaDosen =
            dosenObj?.user?.name || dosenObj?.kodeDosen || "Dosen";
          res.status(400);
          throw new Error(
            `Jadwal bentrok dalam batch: Dosen ${namaDosen} terlibat pada sidang mahasiswa ${itemA.mahasiswaName} dan ${itemB.mahasiswaName} dalam rentang 2 jam.`,
          );
        }
      }
    }
  }

  // 2. Validasi bentrok dengan data lain di database
  for (const item of scheduledItems) {
    const conflictMessage = await checkJadwalConflict({
      excludeRegistrationIds: registrationIds,
      tglSidang: item.tglSidang,
      dosenIds: [item.dosenPenguji1Id, item.dosenPenguji2Id],
    });

    if (conflictMessage) {
      res.status(400);
      throw new Error(conflictMessage);
    }
  }

  const updatedRegistrations = await prisma.$transaction(async (tx) => {
    const results = [];
    for (const item of req.body) {
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

  res.json({
    message: "Dosen penguji sidang batch berhasil ditentukan",
    data: updatedRegistrations.map((reg) =>
      mapPenjadwalanSidangToFrontend(reg),
    ),
  });
});

// Set Jadwal Sidang (Admin Only)
const setJadwalSidang = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { tglSidang, ruanganSidangId } = req.body;

  const errors = [];
  if (isNil(tglSidang)) {
    errors.push({
      field: "tglSidang",
      message: "Tanggal sidang wajib diisi",
    });
  } else if (!isValidISO8601(tglSidang)) {
    errors.push({
      field: "tglSidang",
      message:
        "Tanggal sidang harus berupa tanggal yang valid (format ISO 8601)",
    });
  }

  if (isNil(ruanganSidangId)) {
    errors.push({
      field: "ruanganSidangId",
      message: "ID ruangan sidang wajib diisi",
    });
  } else if (typeof ruanganSidangId !== "string") {
    errors.push({
      field: "ruanganSidangId",
      message: "ID ruangan sidang harus berupa string",
    });
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  const registration = await prisma.sidangRegistration.findUnique({
    where: { id },
  });

  if (!registration || registration.deletedAt) {
    res.status(404);
    throw new Error("Pendaftaran sidang tidak ditemukan");
  }

  const ruangan = await prisma.ruangan.findUnique({
    where: { id: ruanganSidangId },
  });

  if (!ruangan || ruangan.deletedAt) {
    res.status(404);
    throw new Error("Ruangan sidang tidak ditemukan");
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
  });

  if (conflictMessage) {
    res.status(400);
    throw new Error(conflictMessage);
  }

  const updatedRegistration = await prisma.sidangRegistration.update({
    where: { id },
    data: {
      tglSidang: new Date(tglSidang),
      ruanganSidangId,
    },
    include: penjadwalanSidangInclude,
  });

  res.json({
    message: "Jadwal sidang berhasil ditentukan",
    data: mapPenjadwalanSidangToFrontend(updatedRegistration),
  });
});

// Set Jadwal Sidang Batch (Admin Only)
const batchSetJadwalSidang = asyncHandler(async (req, res) => {
  if (!Array.isArray(req.body) || req.body.length === 0) {
    return sendValidationError(res, [
      {
        field: "body",
        message: "Request body harus berupa array data dan tidak boleh kosong",
      },
    ]);
  }

  const errors = [];
  const seenIds = new Set();

  req.body.forEach((item, idx) => {
    if (isNil(item.id)) {
      errors.push({
        field: `[${idx}].id`,
        message: "ID pendaftaran sidang wajib diisi",
      });
    } else if (typeof item.id !== "string") {
      errors.push({
        field: `[${idx}].id`,
        message: "ID pendaftaran sidang harus berupa string",
      });
    } else if (seenIds.has(item.id)) {
      errors.push({
        field: `[${idx}].id`,
        message: "ID pendaftaran sidang tidak boleh duplikat dalam satu request",
      });
    } else {
      seenIds.add(item.id);
    }

    if (isNil(item.tglSidang)) {
      errors.push({
        field: `[${idx}].tglSidang`,
        message: "Tanggal sidang wajib diisi",
      });
    } else if (!isValidISO8601(item.tglSidang)) {
      errors.push({
        field: `[${idx}].tglSidang`,
        message:
          "Tanggal sidang harus berupa tanggal yang valid (format ISO 8601)",
      });
    }

    if (isNil(item.ruanganSidangId)) {
      errors.push({
        field: `[${idx}].ruanganSidangId`,
        message: "ID ruangan sidang wajib diisi",
      });
    } else if (typeof item.ruanganSidangId !== "string") {
      errors.push({
        field: `[${idx}].ruanganSidangId`,
        message: "ID ruangan sidang harus berupa string",
      });
    }
  });

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  const registrationIds = Array.from(seenIds);
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
      res.status(404);
      throw new Error(`Pendaftaran sidang dengan ID ${id} tidak ditemukan`);
    }
  }

  const allRuanganIds = new Set(req.body.map((item) => item.ruanganSidangId));
  const ruanganList = await prisma.ruangan.findMany({
    where: {
      id: { in: Array.from(allRuanganIds) },
      deletedAt: null,
    },
  });

  const ruanganMap = new Map(ruanganList.map((r) => [r.id, r]));
  for (const ruanganId of allRuanganIds) {
    if (!ruanganMap.has(ruanganId)) {
      res.status(404);
      throw new Error(`Ruangan sidang dengan ID ${ruanganId} tidak ditemukan`);
    }
  }

  // 1. Validasi bentrok antar item di dalam batch
  const itemsWithMeta = req.body.map((item) => {
    const reg = registrationMap.get(item.id);
    return {
      ...item,
      mahasiswaName: reg.mahasiswa?.user?.name || "Mahasiswa",
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

  for (let i = 0; i < itemsWithMeta.length; i++) {
    for (let j = i + 1; j < itemsWithMeta.length; j++) {
      const itemA = itemsWithMeta[i];
      const itemB = itemsWithMeta[j];
      const diff = Math.abs(
        new Date(itemA.tglSidang).getTime() -
          new Date(itemB.tglSidang).getTime(),
      );

      if (diff < TWO_HOURS_MS) {
        if (itemA.ruanganSidangId === itemB.ruanganSidangId) {
          const ruanganObj = ruanganMap.get(itemA.ruanganSidangId);
          const namaRuangan = ruanganObj
            ? `${ruanganObj.name} (${ruanganObj.gedung})`
            : "yang sama";
          res.status(400);
          throw new Error(
            `Jadwal bentrok dalam batch: Ruangan ${namaRuangan} dijadwalkan bersamaan untuk mahasiswa ${itemA.mahasiswaName} dan ${itemB.mahasiswaName} dalam rentang 2 jam.`,
          );
        }

        const commonDosen = itemA.involvedDosens.find((dA) =>
          itemB.involvedDosenIds.includes(dA.id),
        );
        if (commonDosen) {
          const namaDosen =
            commonDosen.user?.name || commonDosen.kodeDosen || "Dosen";
          res.status(400);
          throw new Error(
            `Jadwal bentrok dalam batch: Dosen ${namaDosen} terjadwal untuk mahasiswa ${itemA.mahasiswaName} dan ${itemB.mahasiswaName} dalam rentang 2 jam.`,
          );
        }
      }
    }
  }

  // 2. Validasi bentrok dengan jadwal lain di database
  for (const item of itemsWithMeta) {
    const conflictMessage = await checkJadwalConflict({
      excludeRegistrationIds: registrationIds,
      tglSidang: item.tglSidang,
      ruanganSidangId: item.ruanganSidangId,
      dosenIds: item.involvedDosenIds,
    });

    if (conflictMessage) {
      res.status(400);
      throw new Error(conflictMessage);
    }
  }

  const updatedRegistrations = await prisma.$transaction(async (tx) => {
    const results = [];
    for (const item of req.body) {
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

  res.json({
    message: "Jadwal sidang batch berhasil ditentukan",
    data: updatedRegistrations.map((reg) =>
      mapPenjadwalanSidangToFrontend(reg),
    ),
  });
});

const exportJadwalSidang = asyncHandler(async (req, res) => {

  let targetPeriodId = req.query.sidangPeriodId;
  let selectedPeriod = null;

  if (targetPeriodId) {
    selectedPeriod = await prisma.sidangPeriod.findUnique({
      where: { id: targetPeriodId },
    });
  } else {
    selectedPeriod = await prisma.sidangPeriod.findFirst({
      where: { deletedAt: null },
      orderBy: { endDate: "desc" },
    });

    if (selectedPeriod) {
      targetPeriodId = selectedPeriod.id;
    }
  }
  const whereClause = {
    deletedAt: null,
    tglSidang: { not: null },
  };
  if (targetPeriodId) {
    whereClause.sidangPeriodId = targetPeriodId;
  }

  const jadwalList = await prisma.sidangRegistration.findMany({
    where: whereClause,
    include: penjadwalanSidangInclude,
    orderBy: { tglSidang: "asc" }
  });
  const workbook = new excel.Workbook();
  const worksheet = workbook.addWorksheet("Jadwal Sidang");

  worksheet.columns = [
    { header: "NIM", key: "nim", width: 15 },
    { header: "TANGGAL", key: "tanggal", width: 15 },
    { header: "RUANGAN", key: "ruangan", width: 15 },
    { header: "SHIFT", key: "shift", width: 10 },
    { header: "PENGUJI I", key: "penguji1", width: 15 },
    { header: "PENGUJI II", key: "penguji2", width: 15 },
  ];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  jadwalList.forEach((jadwal) => {
    let formattedDate = '';
    let formattedTime = '';

    if (jadwal.tglSidang) {
      const d = new Date(jadwal.tglSidang);
      const day = String(d.getDate()).padStart(2, '0');
      const month = months[d.getMonth()];
      const year = String(d.getFullYear()).slice(-2);

      formattedDate = `${day}-${month}-${year}`;

      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      formattedTime = `${hours}:${mins}`;
    }

    worksheet.addRow({
      nim: jadwal.mahasiswa?.nim || '',
      tanggal: formattedDate,
      ruangan: jadwal.ruanganSidang?.name || '',
      shift: formattedTime,
      penguji1: jadwal.dosenPenguji1?.kodeDosen || '',
      penguji2: jadwal.dosenPenguji2?.kodeDosen || '',
    });
  });

  let filename = "TAPA_Sidanga.xlsx";

  if (selectedPeriod) {
    const tahunAjaran = (selectedPeriod.period || "").replace(/\//g, "-");
    const namaPeriode = (selectedPeriod.name || "").replace(/[\\/:*?"<>|]/g, "_");
    filename = `TAPA_Sidang_${tahunAjaran}_${namaPeriode}.xlsx`;
  }

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}"`,
  );
  await workbook.xlsx.write(res);
  res.end();
});
export {
  listPenjadwalanSidang,
  setPengujiSidang,
  batchSetPengujiSidang,
  setJadwalSidang,
  batchSetJadwalSidang,
  exportJadwalSidang,
};
