import asyncHandler from 'express-async-handler';
import prisma from "../config/prisma.js";
import { sendValidationError, isNil } from '../utils/validationHelper.js';

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

  const mapped = dosens.map((d) => {
    const { user, ...rest } = d;
    return {
      ...rest,
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || null,
    };
  });

  res.json({
    data: mapped,
  });
});

// Update or Insert Dosen
const upsertDosen = asyncHandler(async (req, res) => {
  const idOrUserId = req.params.id; // String UUID

  let dosenRecord = await prisma.dosen.findUnique({
    where: { id: idOrUserId },
  });

  let userId;
  if (dosenRecord) {
    userId = dosenRecord.userId;
  } else {
    dosenRecord = await prisma.dosen.findUnique({
      where: { userId: idOrUserId },
    });
    if (dosenRecord) {
      userId = dosenRecord.userId;
    } else {
      userId = idOrUserId;
    }
  }

  const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
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

  const errors = [];
  if (isNil(nip)) errors.push({ field: 'nip', message: 'NIP wajib diisi' });
  if (isNil(name)) errors.push({ field: 'name', message: 'Nama wajib diisi' });
  if (isNil(researchGroupId)) errors.push({ field: 'researchGroupId', message: 'ID kelompok riset wajib diisi' });
  if (req.body.kodeDosen !== undefined && isNil(kodeDosen)) {
    errors.push({ field: 'kodeDosen', message: 'Kode dosen wajib diisi' });
  }
  if (req.body.lecturerCode !== undefined && isNil(lecturerCode)) {
    errors.push({ field: 'lecturerCode', message: 'Kode dosen wajib diisi' });
  }
  if (errors.length > 0) return sendValidationError(res, errors, req);

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

// Find Dosen By Id (with fallback to userId)
const findDosenById = asyncHandler(async (req, res) => {
  const idOrUserId = req.params.id; // String UUID

  let dosen = await prisma.dosen.findUnique({
    where: { id: idOrUserId },
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
    // Fallback to userId
    dosen = await prisma.dosen.findUnique({
      where: { userId: idOrUserId },
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
  }

  if (!dosen) {
    res.status(404);
    throw new Error("Data dosen tidak ditemukan");
  }

  const { user, ...rest } = dosen;

  res.json({
    data: {
      ...rest,
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || null,
    },
  });
});

// Toggle Ketua KK status
const toggleKetuaKK = asyncHandler(async (req, res) => {
  const idOrUserId = req.params.id; // String UUID

  let dosen = await prisma.dosen.findUnique({
    where: { id: idOrUserId },
  });

  if (!dosen) {
    // Fallback to userId
    dosen = await prisma.dosen.findUnique({
      where: { userId: idOrUserId },
    });
  }

  if (!dosen) {
    res.status(404);
    throw new Error("Data dosen tidak ditemukan");
  }

  const nextStatus = !dosen.isKetuaKK;

  const updatedDosen = await prisma.$transaction(async (tx) => {
    if (nextStatus) {
      // Set dosen lain di KK (Research Group) yang sama ke false
      await tx.dosen.updateMany({
        where: {
          researchGroupId: dosen.researchGroupId,
          isKetuaKK: true,
          NOT: {
            id: dosen.id,
          },
        },
        data: {
          isKetuaKK: false,
        },
      });
    }

    // Update status dosen saat ini
    return await tx.dosen.update({
      where: { id: dosen.id },
      data: {
        isKetuaKK: nextStatus,
      },
    });
  });

  res.json({
    message: `Berhasil mengubah status Ketua KK menjadi ${nextStatus ? 'Aktif' : 'Nonaktif'}`,
    data: updatedDosen,
  });
});

export { listDosens,
  upsertDosen,
  findDosenById,
  toggleKetuaKK, };
