import asyncHandler from "express-async-handler";
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

const mapMahasiswa = (mahasiswa) => {
  if (!mahasiswa) return null;
  return {
    id: mahasiswa.id,
    nim: mahasiswa.nim || "",
    kelasAsal: mahasiswa.kelasAsal || "",
    tahunAngkatan: mahasiswa.tahunAngkatan,
    sks: mahasiswa.sks,
    ipk: mahasiswa.ipk,
    tak: mahasiswa.tak,
    studyProgramId: mahasiswa.studyProgramId,
    dosenWaliId: mahasiswa.dosenWaliId,
    name: mahasiswa.user?.name || "",
    email: mahasiswa.user?.email || "",
    phone: mahasiswa.user?.phone || null,
    studyProgram: mahasiswa.studyProgram
      ? {
          id: mahasiswa.studyProgram.id,
          name: mahasiswa.studyProgram.name,
          isActive: mahasiswa.studyProgram.isActive,
          facultyId: mahasiswa.studyProgram.facultyId,
        }
      : null,
  };
};

const mapDosen = (dosen) => {
  if (!dosen) return null;
  return {
    id: dosen.id,
    nip: dosen.nip,
    nidn: dosen.nidn,
    kodeDosen: dosen.kodeDosen,
    researchGroupId: dosen.researchGroupId,
    userId: dosen.userId,
    name: dosen.user?.name || "",
    email: dosen.user?.email || "",
    phone: dosen.user?.phone || null,
  };
};

const mapRuangan = (ruangan) => {
  if (!ruangan) return null;
  return {
    id: ruangan.id,
    name: ruangan.name,
    gedung: ruangan.gedung,
    isActive: ruangan.isActive,
  };
};

const mapPenjadwalanSidangToFrontend = (item) => {
  if (!item) return null;
  return {
    id: item.id,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    mahasiswa: mapMahasiswa(item.mahasiswa),
    dosenPembimbing1: mapDosen(item.dosenPembimbing1),
    dosenPembimbing2: mapDosen(item.dosenPembimbing2),
    dosenPenguji1: mapDosen(item.dosenPenguji1),
    dosenPenguji2: mapDosen(item.dosenPenguji2),
    tglSidang: item.tglSidang,
    ruanganSidang: mapRuangan(item.ruanganSidang),
  };
};

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

export {
  listPenjadwalanSidang,
  setPengujiSidang,
  setJadwalSidang,
};
