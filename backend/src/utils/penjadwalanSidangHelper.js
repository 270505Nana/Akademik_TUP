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
 * Helper untuk memeriksa bentrok jadwal (jarak 2 jam) antara ruangan dan dosen
 */
export const checkJadwalConflict = async ({
  registrationId,
  excludeRegistrationIds = [],
  tglSidang,
  ruanganSidangId,
  dosenIds = [],
  isCapstone = false,
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

  // Filter out pendaftaran sesama skema Capstone (kelonggaran Capstone diperbolehkan bersamaan)
  const conflicts = potentialConflicts.filter((otherReg) => {
    const otherIsCapstone = isCapstoneScheme(otherReg);
    if (isCapstone && otherIsCapstone) {
      return false;
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

      // Pengecualian kelonggaran skema Capstone: sesama Capstone tidak dianggap bentrok
      if (itemA.isCapstone && itemB.isCapstone) {
        continue;
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

      // Pengecualian kelonggaran skema Capstone: sesama Capstone tidak dianggap bentrok
      if (itemA.isCapstone && itemB.isCapstone) {
        continue;
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
 * Membuat Workbook Excel untuk ekspor data jadwal sidang
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

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  jadwalList.forEach((jadwal) => {
    let formattedDate = "";
    let formattedTime = "";

    if (jadwal.tglSidang) {
      const d = new Date(jadwal.tglSidang);
      const day = String(d.getDate()).padStart(2, "0");
      const month = months[d.getMonth()];
      const year = String(d.getFullYear()).slice(-2);

      formattedDate = `${day}-${month}-${year}`;

      const hours = String(d.getHours()).padStart(2, "0");
      const mins = String(d.getMinutes()).padStart(2, "0");
      formattedTime = `${hours}:${mins}`;
    }

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
