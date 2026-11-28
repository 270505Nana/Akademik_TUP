import excel from "exceljs";
import prisma from "../config/prisma.js";

export const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

/**
 * Helper untuk memeriksa apakah skema pendaftaran adalah Capstone
 */
export const isCapstoneScheme = (reg) => {
  const skema = (reg?.skemaSidangFinal || reg?.skemaSidang || "").trim().toLowerCase();
  return skema.includes("capstone");
};

/**
 * Helper untuk memeriksa apakah dua pendaftaran sidang merupakan kelompok Capstone yang sama
 * (Sesama Capstone dan memiliki judul tugas akhir yang sama, case-insensitive & trimmed)
 */
export const isSameCapstoneGroup = (regA, regB) => {
  if (!isCapstoneScheme(regA) || !isCapstoneScheme(regB)) {
    return false;
  }

  const judulIndoA = (regA?.judulTugasAkhirIndonesia || "").trim().toLowerCase();
  const judulIndoB = (regB?.judulTugasAkhirIndonesia || "").trim().toLowerCase();

  const judulEnA = (regA?.judulTugasAkhirInggris || "").trim().toLowerCase();
  const judulEnB = (regB?.judulTugasAkhirInggris || "").trim().toLowerCase();

  const matchIndo = Boolean(judulIndoA && judulIndoB && judulIndoA === judulIndoB);
  const matchEn = Boolean(judulEnA && judulEnB && judulEnA === judulEnB);

  return matchIndo || matchEn;
};

/**
 * Helper untuk memeriksa bentrok jadwal (jarak 2 jam) antara ruangan dan dosen
 */
export const checkJadwalConflict = async ({
  registrationId,
  excludeRegistrationIds = [],
  tglSidang,
  ruanganSidangId,
  dosenIds = [],
  isCapstone = false,
  targetRegistration = null,
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

  const potentialConflicts = await prisma.sidangRegistration.findMany({
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

  if (!potentialConflicts || potentialConflicts.length === 0) return null;

  let currentReg = targetRegistration;
  if (!currentReg && registrationId) {
    currentReg = await prisma.sidangRegistration.findUnique({
      where: { id: registrationId },
    });
  }

  // Filter out pendaftaran sesama kelompok Capstone (kelompok sama jika judul TA sama)
  const conflicts = potentialConflicts.filter((otherReg) => {
    const otherIsCapstone = isCapstoneScheme(otherReg);
    if (isCapstone && otherIsCapstone) {
      if (currentReg && isSameCapstoneGroup(currentReg, otherReg)) {
        return false; // Sama kelompok Capstone: boleh dijadwalkan bersamaan
      }
      return true; // Berbeda kelompok Capstone: bentrok!
    }
    return true;
  });

  if (conflicts.length === 0) return null;

  const conflict = conflicts[0];

  if (ruanganSidangId && conflict.ruanganSidangId === ruanganSidangId) {
    const namaRuangan = conflict.ruanganSidang
      ? `${conflict.ruanganSidang.name} (${conflict.ruanganSidang.gedung})`
      : "tersebut";
    return `Jadwal bentrok: Ruangan ${namaRuangan} sudah terjadwal untuk sidang mahasiswa ${conflict.mahasiswa?.name || "lain"} pada rentang waktu 2 jam (${new Date(conflict.tglSidang).toISOString()}).`;
  }

  const conflictingDosen = [
    conflict.dosenPembimbing1,
    conflict.dosenPembimbing2,
    conflict.dosenPenguji1,
    conflict.dosenPenguji2,
  ].find((d) => d && validDosenIds.includes(d.id));

  if (conflictingDosen) {
    const namaDosen =
      conflictingDosen.name || conflictingDosen.kodeDosen || "Dosen";
    return `Jadwal bentrok: Dosen ${namaDosen} sudah memiliki jadwal sidang mahasiswa ${conflict.mahasiswa?.name || "lain"} pada rentang waktu 2 jam (${new Date(conflict.tglSidang).toISOString()}).`;
  }

  return "Jadwal bentrok dengan pelaksanaan sidang lain (jarak minimal 2 jam).";
};

/**
 * Validasi bentrok antar item pendaftaran sidang di dalam request batch set penguji
 */
export const validateBatchPengujiInternalConflict = (scheduledItems, dosenMap) => {
  for (let i = 0; i < scheduledItems.length; i++) {
    for (let j = i + 1; j < scheduledItems.length; j++) {
      const itemA = scheduledItems[i];
      const itemB = scheduledItems[j];

      // Pengecualian kelonggaran skema Capstone: hanya jika sesama Capstone dan 1 kelompok (judul sama)
      if (itemA.isCapstone && itemB.isCapstone) {
        const regA = itemA.registration || itemA;
        const regB = itemB.registration || itemB;
        if (isSameCapstoneGroup(regA, regB)) {
          continue;
        }
      }

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
            dosenObj?.name || dosenObj?.kodeDosen || "Dosen";
          const error = new Error(
            `Jadwal bentrok dalam batch: Dosen ${namaDosen} terlibat pada sidang mahasiswa ${itemA.mahasiswaName} dan ${itemB.mahasiswaName} dalam rentang 2 jam.`,
          );
          error.statusCode = 400;
          throw error;
        }
      }
    }
  }
};

/**
 * Validasi bentrok antar item pendaftaran sidang di dalam request batch set jadwal
 */
export const validateBatchJadwalInternalConflict = (itemsWithMeta, ruanganMap) => {
  for (let i = 0; i < itemsWithMeta.length; i++) {
    for (let j = i + 1; j < itemsWithMeta.length; j++) {
      const itemA = itemsWithMeta[i];
      const itemB = itemsWithMeta[j];

      // Pengecualian kelonggaran skema Capstone: hanya jika sesama Capstone dan 1 kelompok (judul sama)
      if (itemA.isCapstone && itemB.isCapstone) {
        const regA = itemA.registration || itemA;
        const regB = itemB.registration || itemB;
        if (isSameCapstoneGroup(regA, regB)) {
          continue;
        }
      }

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
          const error = new Error(
            `Jadwal bentrok dalam batch: Ruangan ${namaRuangan} dijadwalkan bersamaan untuk mahasiswa ${itemA.mahasiswaName} dan ${itemB.mahasiswaName} dalam rentang 2 jam.`,
          );
          error.statusCode = 400;
          throw error;
        }

        const commonDosen = itemA.involvedDosens.find((dA) =>
          itemB.involvedDosenIds.includes(dA.id),
        );
        if (commonDosen) {
          const namaDosen =
            commonDosen.name || commonDosen.kodeDosen || "Dosen";
          const error = new Error(
            `Jadwal bentrok dalam batch: Dosen ${namaDosen} terjadwal untuk mahasiswa ${itemA.mahasiswaName} dan ${itemB.mahasiswaName} dalam rentang 2 jam.`,
          );
          error.statusCode = 400;
          throw error;
        }
      }
    }
  }
};

/**
 * Format tanggal dan waktu ke standar WIB (Asia/Jakarta)
 */
export const formatWibDateTime = (date) => {
  if (!date) return { formattedDate: "", formattedTime: "" };
  const d = new Date(date);
  if (isNaN(d.getTime())) return { formattedDate: "", formattedTime: "" };

  const optionsDate = {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    year: "2-digit",
  };
  const optionsTime = {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  };

  const parts = new Intl.DateTimeFormat("en-GB", optionsDate).formatToParts(d);
  const day = parts.find((p) => p.type === "day")?.value || String(d.getDate()).padStart(2, "0");
  const month = parts.find((p) => p.type === "month")?.value || "";
  const year = parts.find((p) => p.type === "year")?.value || String(d.getFullYear()).slice(-2);
  const formattedDate = `${day}-${month}-${year}`;

  const timeParts = new Intl.DateTimeFormat("en-GB", optionsTime).formatToParts(d);
  const hours = timeParts.find((p) => p.type === "hour")?.value || "00";
  const mins = timeParts.find((p) => p.type === "minute")?.value || "00";
  const formattedTime = `${hours}:${mins}`;

  return { formattedDate, formattedTime };
};

/**
 * Membuat Workbook Excel untuk ekspor data jadwal sidang format iGracias
 */
export const generateJadwalSidangWorkbook = (jadwalList) => {
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

  jadwalList.forEach((jadwal) => {
    const { formattedDate, formattedTime } = formatWibDateTime(jadwal.tglSidang);

    worksheet.addRow({
      nim: jadwal.mahasiswa?.nim || "",
      tanggal: formattedDate,
      ruangan: jadwal.ruanganSidang?.name || "",
      shift: formattedTime,
      penguji1: jadwal.dosenPenguji1?.kodeDosen || "",
      penguji2: jadwal.dosenPenguji2?.kodeDosen || "",
    });
  });

  return workbook;
};
/**
 * Menghasilkan nama file Excel ekspor jadwal sidang yang tersanitasi
 */
export const generateJadwalSidangFilename = (selectedPeriod) => {
  if (!selectedPeriod) {
    return "TAPA_Sidang.xlsx";
  }

  const sanitizePart = (str) =>
    (str || "")
      .replace(/[/\\]/g, "")
      .replace(/[:*?"<>|]/g, "")
      .replace(/\s+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "");

  const tahunAjaran = sanitizePart(selectedPeriod.period);
  const namaPeriode = sanitizePart(selectedPeriod.name);
  return `TAPA_Sidang_${tahunAjaran}_${namaPeriode}.xlsx`;
};

/**
 * Mencari periode pelaksanaan sidang yang aktif (isOpen: true) atau yang mendatang (upcoming) terdekat
 */
export const getActiveOrUpcomingPelaksanaanSidangPeriod = async () => {
  const now = new Date();

  // 1. Cari periode pelaksanaan yang saat ini aktif/dibuka
  const active = await prisma.sidangPeriod.findFirst({
    where: {
      category: "pelaksanaan",
      isOpen: true,
      deletedAt: null,
    },
    orderBy: { updatedAt: "desc" },
  });

  if (active) return active;

  // 2. Fallback: Cari periode pelaksanaan mendatang (upcoming) yang paling dekat (startDate terdekat)
  const upcoming =
    (await prisma.sidangPeriod.findFirst({
      where: {
        category: "pelaksanaan",
        startDate: { gte: now },
        deletedAt: null,
      },
      orderBy: { startDate: "asc" },
    })) ||
    (await prisma.sidangPeriod.findFirst({
      where: {
        category: "pelaksanaan",
        endDate: { gte: now },
        deletedAt: null,
      },
      orderBy: { startDate: "asc" },
    }));

  if (upcoming) return upcoming;

  // 3. Jika semua periode sudah lewat dan tidak ada yang aktif, kembalikan null
  return null;
};

export const getActiveOrLatestPelaksanaanSidangPeriod = getActiveOrUpcomingPelaksanaanSidangPeriod;

/**
 * Mengekstrak daftar unik Mahasiswa dan Dosen yang terlibat pada jadwal sidang
 */
export const extractUsersTerlibatSidang = (jadwalList) => {
  const mahasiswaMap = new Map();
  const dosenMap = new Map();

  const upsertDosen = (dosen, roleLabel) => {
    if (!dosen || dosen.deletedAt || dosen.user?.deletedAt) return;
    const key = dosen.id || dosen.kodeDosen;
    if (!key) return;

    if (!dosenMap.has(key)) {
      dosenMap.set(key, {
        id: dosen.id,
        userId: dosen.userId,
        kodeDosen: dosen.kodeDosen || "",
        nama: dosen.name || "",
        email: dosen.user?.email || "",
        roles: new Set([roleLabel]),
      });
    } else {
      dosenMap.get(key).roles.add(roleLabel);
    }
  };

  jadwalList.forEach((jadwal) => {
    // 1. Mahasiswa
    const mhs = jadwal.mahasiswa;
    if (mhs && !mhs.deletedAt && !mhs.user?.deletedAt) {
      const mhsKey = mhs.id || mhs.nim;
      if (mhsKey && !mahasiswaMap.has(mhsKey)) {
        mahasiswaMap.set(mhsKey, {
          id: mhs.id,
          userId: mhs.userId,
          nim: mhs.nim || "",
          nama: mhs.name || "",
          email: mhs.user?.email || "",
          peran: "Mahasiswa",
        });
      }
    }

    // 2. Dosen terlibat sidang (Pembimbing 1 & 2, Penguji 1 & 2)
    upsertDosen(jadwal.dosenPembimbing1, "Dosen Pembimbing");
    upsertDosen(jadwal.dosenPembimbing2, "Dosen Pembimbing");
    upsertDosen(jadwal.dosenPenguji1, "Dosen Penguji");
    upsertDosen(jadwal.dosenPenguji2, "Dosen Penguji");
  });

  const mahasiswaList = Array.from(mahasiswaMap.values()).sort((a, b) =>
    a.nim.localeCompare(b.nim),
  );

  const dosenList = Array.from(dosenMap.values())
    .map((d) => ({
      id: d.id,
      userId: d.userId,
      kodeDosen: d.kodeDosen,
      nama: d.nama,
      email: d.email,
      peran: "Dosen",
      detailPeran: Array.from(d.roles).join(", "),
    }))
    .sort((a, b) => a.kodeDosen.localeCompare(b.kodeDosen));

  return { mahasiswaList, dosenList };
};

/**
 * Workbook Excel Data User (2 sheet: Mahasiswa & Dosen)
 */
export const generateDataUserWorkbook = (mahasiswaList, dosenList) => {
  const workbook = new excel.Workbook();

  // Sheet 1: Mahasiswa (NIM | Nama | Email)
  const sheetMahasiswa = workbook.addWorksheet("Mahasiswa");
  sheetMahasiswa.columns = [
    { header: "NIM", key: "nim", width: 18 },
    { header: "Nama", key: "nama", width: 32 },
    { header: "Email", key: "email", width: 35 },
  ];

  mahasiswaList.forEach((mhs) => {
    sheetMahasiswa.addRow({
      nim: mhs.nim,
      nama: mhs.nama,
      email: mhs.email,
    });
  });

  // Sheet 2: Dosen (Kode Dosen | Nama Dosen | Email)
  const sheetDosen = workbook.addWorksheet("Dosen");
  sheetDosen.columns = [
    { header: "Kode Dosen", key: "kodeDosen", width: 15 },
    { header: "Nama Dosen", key: "namaDosen", width: 35 },
    { header: "Email", key: "email", width: 35 },
  ];

  dosenList.forEach((dosen) => {
    sheetDosen.addRow({
      kodeDosen: dosen.kodeDosen,
      namaDosen: dosen.nama,
      email: dosen.email,
    });
  });

  return workbook;
};

/**
 * Nama file Excel Data User yang tersanitasi
 */
export const generateDataUserFilename = (selectedPeriod) => {
  if (!selectedPeriod) {
    return "Data_User.xlsx";
  }

  const sanitizePart = (str) =>
    (str || "")
      .replace(/[/\\]/g, "")
      .replace(/[:*?"<>|]/g, "")
      .replace(/\s+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "");

  const tahunAjaran = sanitizePart(selectedPeriod.period);
  const namaPeriode = sanitizePart(selectedPeriod.name);
  return `Data_User_${tahunAjaran}_${namaPeriode}.xlsx`;
};

/**
 * Nama file ZIP gabungan (Jadwal Sidang + Data User)
 */
export const generateExportSidangZipFilename = (selectedPeriod) => {
  if (!selectedPeriod) {
    return "Export_Sidang.zip";
  }

  const sanitizePart = (str) =>
    (str || "")
      .replace(/[/\\]/g, "")
      .replace(/[:*?"<>|]/g, "")
      .replace(/\s+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "");

  const tahunAjaran = sanitizePart(selectedPeriod.period);
  const namaPeriode = sanitizePart(selectedPeriod.name);
  return `Export_Sidang_${tahunAjaran}_${namaPeriode}.zip`;
};