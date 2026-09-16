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
