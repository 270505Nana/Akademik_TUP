import prisma from "../config/prisma.js";
import { ROLES } from "../constants/index.js";

export const getMahasiswas = async ({
  search,
  studyProgramId,
  tahunAngkatan,
  skip,
  take,
}) => {
  const where = { deletedAt: null };

  const searchTerm = (search || "").trim();
  if (searchTerm) {
    where.OR = [
      { user: { name: { contains: searchTerm, mode: "insensitive" } } },
      { nim: { contains: searchTerm, mode: "insensitive" } },
      { kelasAsal: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  if (studyProgramId) where.studyProgramId = studyProgramId;
  if (tahunAngkatan) where.tahunAngkatan = Number(tahunAngkatan);

  const [total, mahasiswas] = await Promise.all([
    prisma.mahasiswa.count({ where }),
    prisma.mahasiswa.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
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

export const upsertMahasiswa = async (idOrUserId, payload) => {
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
    await tx.user.update({
      where: { id: userId },
      data: { name },
    });

    return await tx.mahasiswa.upsert({
      where: { userId },
      update: {
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
