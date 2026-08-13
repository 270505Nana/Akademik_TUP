import asyncHandler from 'express-async-handler';
import prisma from '../prisma/client.js';

// Daftar Semua Mahasiswa
const listMahasiswa = asyncHandler(async (req, res) => {
  const mahasiswa = await prisma.mahasiswa.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  const mapped = mahasiswa.map((m) => ({
    ...m,
    name: m.user?.name,
    email: m.user?.email,
    phone: m.user?.phone,
  }));

  res.json({
    data: mapped,
  });
});

// Update or Insert Mahasiswa
const upsertMahasiswa = asyncHandler(async (req, res) => {
  const userId = req.params.userId; // String UUID

  const user = await prisma.user.findFirst({ where: { id: userId } });
  if (!user) {
    res.status(404);
    throw new Error("Pengguna tidak ditemukan");
  }
  if (user.role !== "MAHASISWA") {
    res.status(400);
    throw new Error("Pengguna bukan mahasiswa");
  }

  const {
    nim,
    name,
    className,
    kelasAsal,
    year,
    tahunAngkatan,
    sks,
    ipk,
    tak,
    studyProgramId,
    dosenWaliId,
  } = req.body;

  const targetKelasAsal = kelasAsal || className;
  const targetTahunAngkatan = tahunAngkatan !== undefined ? tahunAngkatan : year;

  const parsedTahunAngkatan = targetTahunAngkatan ? parseInt(targetTahunAngkatan) : undefined;
  const parsedSks = sks !== undefined && sks !== null ? parseInt(sks) : null;
  const parsedIpk = ipk !== undefined && ipk !== null ? parseFloat(ipk) : null;
  const parsedTak = tak !== undefined && tak !== null ? parseInt(tak) : null;

  // Update name in User table
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { name },
  });

  // Upsert Mahasiswa record
  const mahasiswa = await prisma.mahasiswa.upsert({
    where: { userId },
    update: {
      nim,
      kelasAsal: targetKelasAsal,
      tahunAngkatan: parsedTahunAngkatan,
      sks: parsedSks,
      ipk: parsedIpk,
      tak: parsedTak,
      studyProgramId, // String UUID
      dosenWaliId, // String UUID
    },
    create: {
      nim,
      kelasAsal: targetKelasAsal,
      tahunAngkatan: parsedTahunAngkatan,
      sks: parsedSks,
      ipk: parsedIpk,
      tak: parsedTak,
      studyProgramId, // String UUID
      dosenWaliId, // String UUID
      userId,
    },
  });

  res.json({
    message: "Create or update mahasiswa data successful",
    data: {
      ...mahasiswa,
      name: updatedUser.name,
    },
  });
});

// Find Mahasiswa By User Id
const findMahasiswaByUserId = asyncHandler(async (req, res) => {
  const userId = req.params.userId; // String UUID

  const mahasiswa = await prisma.mahasiswa.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  if (!mahasiswa) {
    res.status(404);
    throw new Error("Data mahasiswa tidak ditemukan");
  }

  res.json({
    data: {
      ...mahasiswa,
      name: mahasiswa.user?.name,
      email: mahasiswa.user?.email,
      phone: mahasiswa.user?.phone,
    },
  });
});

// Find Mahasiswa By Id
const findMahasiswaById = asyncHandler(async (req, res) => {
  const id = req.params.id; // String UUID

  const mahasiswa = await prisma.mahasiswa.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  if (!mahasiswa) {
    res.status(404);
    throw new Error("Data mahasiswa tidak ditemukan");
  }

  res.json({
    data: {
      ...mahasiswa,
      name: mahasiswa.user?.name,
      email: mahasiswa.user?.email,
      phone: mahasiswa.user?.phone,
    },
  });
});

export { listMahasiswa,
  upsertMahasiswa,
  findMahasiswaByUserId,
  findMahasiswaById, };
