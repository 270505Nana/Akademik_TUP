import asyncHandler from "express-async-handler";
import prisma from "../config/prisma.js";
import {
  getPaginationParams,
  formatPaginationResponse,
} from "../utils/paginationHelper.js";
import { mapAdmin } from "../mappers/index.js";
import * as masterDataService from "../services/masterDataService.js";

// Daftar Semua Admin
export const listAdmins = asyncHandler(async (req, res) => {
  const paginationParams = getPaginationParams(req.query);
  const { total, admins } = await masterDataService.getAdmins(paginationParams);
  res.json(formatPaginationResponse(admins.map(mapAdmin), total, paginationParams));
});

// Update or Insert Admin
export const upsertAdmin = asyncHandler(async (req, res) => {
  const idOrUserId = req.params.id;
  const { name } = req.body;

  let adminRecord = await masterDataService.getAdminByIdOrUserId(idOrUserId);
  const userId = adminRecord ? adminRecord.userId : idOrUserId;

  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
  });

  if (!user) {
    res.status(404);
    throw new Error("Pengguna tidak ditemukan");
  }
  if (user.role !== "ADMIN") {
    res.status(400);
    throw new Error("Pengguna bukan admin");
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: { name },
    });

    const admin = await tx.admin.upsert({
      where: { userId },
      update: {},
      create: { userId },
      include: { user: true },
    });

    return { ...admin, user: updatedUser };
  });

  res.json({
    message: "Create or update admin data successful",
    data: mapAdmin(result),
  });
});

// Find Admin By Id
export const findAdminById = asyncHandler(async (req, res) => {
  const admin = await masterDataService.getAdminByIdOrUserId(req.params.id);
  if (!admin) {
    res.status(404);
    throw new Error("Data admin tidak ditemukan");
  }
  res.json({ data: mapAdmin(admin) });
});
