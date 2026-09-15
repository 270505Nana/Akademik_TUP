import asyncHandler from "express-async-handler";
import prisma from "../config/prisma.js";
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

export {
  listPenjadwalanSidang,
};
