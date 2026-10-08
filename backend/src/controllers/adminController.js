import asyncHandler from "express-async-handler";
import {
  getPaginationParams,
  formatPaginationResponse,
} from "../utils/paginationHelper.js";
import { mapAdmin } from "../mappers/index.js";
import {
  getAdminPaginated,
  getAdminByIdOrUserId,
  upsertAdminData,
  getAdminDashboardData,
} from "../services/adminService.js";

// Daftar Semua Admin
export const listAdmins = asyncHandler(async (req, res) => {
  const paginationParams = getPaginationParams(req.query);
  const { total, admins } = await getAdminPaginated(paginationParams);

  res.json(
    formatPaginationResponse(admins.map(mapAdmin), total, paginationParams),
  );
});

/**
 * NOTE:
 * - Upsert akan dipecah menjadi endpoint Insert dan Update terpisah
 * - Untuk update profil user admin menggunakan PUT /api/users/profile (sementara belum dibuat)
 */

// Update or Insert Admin
export const upsertAdmin = asyncHandler(async (req, res) => {
  const idOrUserId = req.params.id;
  const { name } = req.body;

  let adminRecord = await getAdminByIdOrUserId(idOrUserId);
  const userId = adminRecord ? adminRecord.userId : idOrUserId;
  const result = await upsertAdminData({ userId, name });

  res.json({
    message: "Create or update admin data successful",
    data: mapAdmin(result),
  });
});

// Find Admin By Id
export const findAdminById = asyncHandler(async (req, res) => {
  const admin = await getAdminByIdOrUserId(req.params.id);

  if (!admin) {
    res.status(404);
    throw new Error("Data admin tidak ditemukan");
  }

  res.json({ data: mapAdmin(admin) });
});

// Dashboard
export const getAdminDashboard = asyncHandler(async (req, res) => {
  const data = await getAdminDashboardData();

  res.json({
    message: "Admin dashboard data retrieved successfully",
    data,
  });
});
