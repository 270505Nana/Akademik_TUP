import asyncHandler from 'express-async-handler';
import prisma from "../config/prisma.js";
import { sendValidationError, isNil } from '../utils/validationHelper.js';
import { getPaginationParams, formatPaginationResponse } from '../utils/paginationHelper.js';

// Daftar Semua Admin
const listAdmins = asyncHandler(async (req, res) => {
  const paginationParams = getPaginationParams(req.query);

  const [total, admins] = await Promise.all([
    prisma.admin.count(),
    prisma.admin.findMany({
      skip: paginationParams.skip,
      take: paginationParams.take,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    }),
  ]);

  const mapped = admins.map((adm) => {
    const { user, ...rest } = adm;
    return {
      ...rest,
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || null,
    };
  });

  res.json(formatPaginationResponse(mapped, total, paginationParams));
});

// Update or Insert Admin
const upsertAdmin = asyncHandler(async (req, res) => {
  const idOrUserId = req.params.id; // String UUID

  let adminRecord = await prisma.admin.findUnique({
    where: { id: idOrUserId },
  });

  let userId;
  if (adminRecord) {
    userId = adminRecord.userId;
  } else {
    adminRecord = await prisma.admin.findUnique({
      where: { userId: idOrUserId },
    });
    if (adminRecord) {
      userId = adminRecord.userId;
    } else {
      userId = idOrUserId;
    }
  }

  const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
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

// Find Admin By Id (with fallback to userId)
const findAdminById = asyncHandler(async (req, res) => {
  const idOrUserId = req.params.id; // String UUID

  let admin = await prisma.admin.findUnique({
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

  if (!admin) {
    // Fallback to userId
    admin = await prisma.admin.findUnique({
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

  if (!admin) {
    res.status(404);
    throw new Error("Data admin tidak ditemukan");
  }

  const { user, ...rest } = admin;

  res.json({
    data: {
      ...rest,
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || null,
    },
  });
});

export { listAdmins,
  upsertAdmin,
  findAdminById, };
