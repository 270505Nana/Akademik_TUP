import asyncHandler from 'express-async-handler';
import prisma from "../config/prisma.js";
import { sendValidationError, isNil } from '../utils/validationHelper.js';

// Daftar Semua Admin
const listAdmins = asyncHandler(async (req, res) => {
  const admins = await prisma.admin.findMany({
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

  const mapped = admins.map((adm) => ({
    ...adm,
    name: adm.user?.name,
    email: adm.user?.email,
    phone: adm.user?.phone,
  }));

  res.json({
    data: mapped,
  });
});

// Update or Insert Admin
const upsertAdmin = asyncHandler(async (req, res) => {
  const userId = req.params.userId; // String UUID

  const user = await prisma.user.findFirst({ where: { id: userId } });
  if (!user) {
    res.status(404);
    throw new Error("Pengguna tidak ditemukan");
  }
  if (user.role !== "ADMIN") {
    res.status(400);
    throw new Error("Pengguna bukan admin");
  }

  const { name } = req.body;

  const errors = [];
  if (isNil(name) || String(name).trim() === '') {
    errors.push({ field: 'name', message: 'Nama wajib diisi' });
  }
  if (errors.length > 0) {
    return sendValidationError(res, errors, req);
  }
  // Update name in User table
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { name },
  });

  // Upsert Admin record
  const admin = await prisma.admin.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  res.json({
    message: "Create or update admin data successful",
    data: {
      ...admin,
      name: updatedUser.name,
    },
  });
});

// Find Admin By User Id
const findAdminByUserId = asyncHandler(async (req, res) => {
  const userId = req.params.userId; // String UUID

  const admin = await prisma.admin.findUnique({
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

  if (!admin) {
    res.status(404);
    throw new Error("Data admin tidak ditemukan");
  }

  res.json({
    data: {
      ...admin,
      name: admin.user?.name,
      email: admin.user?.email,
      phone: admin.user?.phone,
    },
  });
});

export { listAdmins,
  upsertAdmin,
  findAdminByUserId, };
