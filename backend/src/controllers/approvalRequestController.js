import asyncHandler from "express-async-handler";
import {
  getPaginationParams,
  formatPaginationResponse,
} from "../utils/paginationHelper.js";
import { getAcademicAccessContext } from "../middlewares/authorize.js";
import { mapApprovalRequest } from "../mappers/approvalRequestMapper.js";
import * as approvalService from "../services/approvalService.js";

/**
 * Daftar Semua Permohonan Persetujuan (dengan filter, sort, search, dan pagination)
 */
export const listApprovalRequests = asyncHandler(async (req, res) => {
  const paginationParams = getPaginationParams(req.query);
  const access = await getAcademicAccessContext(req);

  const { total, requests } = await approvalService.getApprovalRequests(
    {
      ...req.query,
      skip: paginationParams.skip,
      take: paginationParams.take,
    },
    access
  );

  return res.json(
    formatPaginationResponse(
      requests.map(mapApprovalRequest),
      total,
      paginationParams
    )
  );
});

/**
 * Ambil Detail Permohonan Persetujuan By ID
 */
export const findApprovalRequestById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const access = await getAcademicAccessContext(req);
  const changeRequest = await approvalService.getApprovalRequestById(id, access);

  return res.json({ data: mapApprovalRequest(changeRequest) });
});

/**
 * Setujui Usulan Perubahan (Approve)
 */
export const approveApprovalRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const access = await getAcademicAccessContext(req);
  const updatedRequest = await approvalService.approveApprovalRequest(
    id,
    access
  );

  return res.json({
    message:
      "Permohonan perubahan berhasil disetujui dan diterapkan ke data aktif",
    data: mapApprovalRequest(updatedRequest),
  });
});

/**
 * Tolak Usulan Perubahan (Reject)
 */
export const rejectApprovalRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rejectionNote } = req.body;
  const access = await getAcademicAccessContext(req);
  const updatedRequest = await approvalService.rejectApprovalRequest(
    id,
    rejectionNote,
    access
  );

  return res.json({
    message: "Permohonan perubahan berhasil ditolak",
    data: mapApprovalRequest(updatedRequest),
  });
});

/**
 * Batalkan Usulan Perubahan (Cancel oleh Pengusul)
 */
export const cancelApprovalRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const access = await getAcademicAccessContext(req);
  const updatedRequest = await approvalService.cancelApprovalRequest(
    id,
    access
  );

  return res.json({
    message: "Permohonan perubahan berhasil dibatalkan",
    data: mapApprovalRequest(updatedRequest),
  });
});
