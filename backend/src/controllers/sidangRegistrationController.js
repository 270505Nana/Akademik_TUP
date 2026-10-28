import asyncHandler from "express-async-handler";
import * as sidangRegistrationService from "../services/sidangRegistrationService.js";
import { serveDownload } from "../services/storageService.js";

/**
 * Sidang Registration List (with search, studyProgramId, skemaSidang, jalurNonSidang, status filter, sort, and pagination)
 * GET /api/sidang-registrations
 */
export const listSidangRegistrations = asyncHandler(async (req, res) => {
  const result = await sidangRegistrationService.listSidangRegistrations({
    query: req.query,
    req,
  });
  res.json(result);
});

/**
 * Get Sidang Registration by ID
 * GET /api/sidang-registrations/:id
 */
export const getSidangRegistrationById = asyncHandler(async (req, res) => {
  const data = await sidangRegistrationService.getSidangRegistrationById(
    req.params.id,
    req
  );
  res.json({ data });
});

/**
 * Get Sidang Registration by Mahasiswa ID
 * GET /api/sidang-registrations/student/:mahasiswaId
 */
export const getSidangRegistrationByMahasiswaId = asyncHandler(async (req, res) => {
  const data = await sidangRegistrationService.getSidangRegistrationByMahasiswaId(
    req.params.mahasiswaId,
    req
  );
  res.json({ data });
});

/**
 * Save Draft Sidang Registration (Upsert)
 * POST /api/sidang-registrations
 */
export const saveSidangRegistration = asyncHandler(async (req, res) => {
  const data = await sidangRegistrationService.saveSidangRegistration(
    req.body,
    req
  );
  res.status(200).json({
    message: "Sidang registration saved as draft successfully",
    data,
  });
});

/**
 * Submit Sidang Registration (Finalize with Validation)
 * POST /api/sidang-registrations/submit
 */
export const submitSidangRegistration = asyncHandler(async (req, res) => {
  const data = await sidangRegistrationService.submitSidangRegistration(
    req.body,
    req
  );
  res.status(200).json({
    message: "Sidang registration submitted successfully",
    data,
  });
});

/**
 * Delete Sidang Registration (soft delete)
 * DELETE /api/sidang-registrations/:id
 */
export const deleteSidangRegistration = asyncHandler(async (req, res) => {
  const deletedSidangRegistration =
    await sidangRegistrationService.deleteSidangRegistration(req.params.id);
  res.json({
    message: "Sidang registration deleted successfully",
    data: deletedSidangRegistration,
  });
});

/**
 * Upload Dokumen Persyaratan Sidang
 * POST /api/sidang-registrations/:id/uploads
 */
export const uploadSidangRegistrationFile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { slug, category, name } = req.body;
  const fileCategory = category || slug;
  const file = req.files?.file?.[0] || req.file;

  const result = await sidangRegistrationService.uploadSidangRegistrationFile({
    id,
    fileCategory,
    name,
    file,
    req,
  });

  res.status(200).json({
    message: result.isUpdated
      ? "File updated successfully"
      : "File uploaded successfully",
    data: result.data,
  });
});

/**
 * Get All Uploaded Files by Sidang Registration ID
 * GET /api/sidang-registrations/:id/uploads
 */
export const getSidangRegistrationFiles = asyncHandler(async (req, res) => {
  const data = await sidangRegistrationService.getSidangRegistrationFiles(
    req.params.id,
    req
  );
  res.json({ data });
});

/**
 * Download Sidang Registration Upload
 * GET /api/sidang-registrations/uploads/:uploadId/download
 */
export const downloadSidangRegistrationFile = asyncHandler(async (req, res) => {
  const { filepath, downloadName } =
    await sidangRegistrationService.getDownloadFileInfo(req.params.uploadId);
  await serveDownload(res, { filepath, downloadName });
});

/**
 * Approve Sidang Registration (Admin Response)
 * PUT /api/sidang-registrations/:id/approve
 */
export const approveSidangRegistration = asyncHandler(async (req, res) => {
  const data = await sidangRegistrationService.approveSidangRegistration(
    {
      id: req.params.id,
      ...req.body,
    },
    req
  );
  res.json({
    message: "Pendaftaran sidang berhasil disetujui",
    data,
  });
});

/**
 * Reject/Request Revision for Sidang Registration (Admin Response)
 * PUT /api/sidang-registrations/:id/reject
 */
export const rejectSidangRegistration = asyncHandler(async (req, res) => {
  const data = await sidangRegistrationService.rejectSidangRegistration(
    {
      id: req.params.id,
      ...req.body,
    },
    req
  );
  res.json({
    message: "Pendaftaran sidang berhasil ditolak / diminta revisi",
    data,
  });
});

/**
 * Toggle Lock Sidang Registration (Admin Only)
 * PATCH /api/sidang-registrations/:id/toggle-lock
 */
export const toggleLockSidangRegistration = asyncHandler(async (req, res) => {
  const result = await sidangRegistrationService.toggleLockSidangRegistration(
    req.params.id,
    req
  );
  res.json({
    message: result.isLocked
      ? "Pendaftaran sidang berhasil dikunci"
      : "Kunci pendaftaran sidang berhasil dibuka",
    data: result.data,
  });
});
