import asyncHandler from 'express-async-handler';
import prisma from '../prisma/client.js';

// Daftar Semua Dosen
const listDosens = asyncHandler(async (req, res) => {
  const dosens = await prisma.dosen.findMany({
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

  const mapped = dosens.map((d) => ({
    ...d,
    name: d.user?.name,
    email: d.user?.email,
    phone: d.user?.phone,
  }));

  res.json({
    data: mapped,
  });
});

// Update or Insert Dosen
const upsertDosen = asyncHandler(async (req, res) => {
  const userId = req.params.userId; // String UUID

  const user = await prisma.user.findFirst({ where: { id: userId } });
  if (!user) {
    res.status(404);
    throw new Error("Pengguna tidak ditemukan");
  }
  if (user.role !== "DOSEN") {
    res.status(400);
    throw new Error("Pengguna bukan dosen");
  }

  const { nip, nidn, lecturerCode, kodeDosen, name, researchGroupId } = req.body;
  const targetKodeDosen = kodeDosen || lecturerCode;

  // Update name in User table
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { name },
  });

  // Upsert Dosen record
  const dosen = await prisma.dosen.upsert({
    where: { userId },
    update: {
      nip,
      nidn,
      kodeDosen: targetKodeDosen,
      researchGroupId,
    },
    create: {
      nip,
      nidn,
      kodeDosen: targetKodeDosen,
      researchGroupId,
      userId,
    },
  });

  res.json({
    message: "Create or update dosen data successful",
    data: {
      ...dosen,
      name: updatedUser.name,
    },
  });
});

// Find Dosen By User Id
const findDosenByUserId = asyncHandler(async (req, res) => {
  const userId = req.params.userId; // String UUID

  const dosen = await prisma.dosen.findUnique({
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

  if (!dosen) {
    res.status(404);
    throw new Error("Data dosen tidak ditemukan");
  }

  res.json({
    data: {
      ...dosen,
      name: dosen.user?.name,
      email: dosen.user?.email,
      phone: dosen.user?.phone,
    },
  });
});

export { listDosens,
  upsertDosen,
  findDosenByUserId, };
