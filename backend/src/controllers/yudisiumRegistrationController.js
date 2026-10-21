import asyncHandler from "express-async-handler";
import * as yudisiumRegistrationService from "../services/yudisiumRegistrationService.js";
import { serveDownload } from "../services/storageService.js";

/**
 * Yudisium Registration List (with search, studyProgramId, skemaSidang, pengajuanCumlaude, skemaCumlaude, status filter, sort, and pagination)
 * GET /api/yudisium-registrations
 */
export const listYudisiumRegistrations = asyncHandler(async (req, res) => {
  const result = await yudisiumRegistrationService.listYudisiumRegistrations({
    query: req.query,
    req,
  });
  res.json(result);
});

/**
 * Get Yudisium Registration by ID
 * GET /api/yudisium-registrations/:id
 */
export const getYudisiumRegistrationById = asyncHandler(async (req, res) => {
  const data = await yudisiumRegistrationService.getYudisiumRegistrationById(
    req.params.id,
    req
  );
  res.json({ data });
});

/**
 * Get Yudisium Registration by Mahasiswa ID
 * GET /api/yudisium-registrations/student/:mahasiswaId
 */
export const getYudisiumRegistrationByMahasiswaId = asyncHandler(async (req, res) => {
  const data = await yudisiumRegistrationService.getYudisiumRegistrationByMahasiswaId(
    req.params.mahasiswaId,
    req
  );
  res.json({ data });
});

/**
 * Save Draft Yudisium Registration (Upsert)
 * POST /api/yudisium-registrations
 */
export const saveYudisiumRegistration = asyncHandler(async (req, res) => {
  const data = await yudisiumRegistrationService.saveYudisiumRegistration(
    req.body,
    req
  );
  res.status(200).json({
    message: "Yudisium registration saved as draft successfully",
    data,
  });
});

/**
 * Submit Yudisium Registration (Update isDraft to false with Validation)
 * POST /api/yudisium-registrations/submit
 */
export const submitYudisiumRegistration = asyncHandler(async (req, res) => {
  const data = await yudisiumRegistrationService.submitYudisiumRegistration(
    req.body,
    req
  );
  res.status(200).json({
    message: "Yudisium registration submitted successfully",
    data,
  });
});

/**
 * Delete Yudisium Registration (soft delete)
 * DELETE /api/yudisium-registrations/:id
 */
export const deleteYudisiumRegistration = asyncHandler(async (req, res) => {
  const deletedYudisiumRegistration =
    await yudisiumRegistrationService.deleteYudisiumRegistration(req.params.id);
  res.json({
    message: "Yudisium registration deleted successfully",
    data: deletedYudisiumRegistration,
  });
});

/**
 * Upload Dokumen Persyaratan Yudisium
 * POST /api/yudisium-registrations/:id/uploads
 */
export const uploadYudisiumRegistrationFile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { slug, category, name } = req.body;
  const fileCategory = category || slug;
  const file = req.files?.file?.[0] || req.file;

  const result = await yudisiumRegistrationService.uploadYudisiumRegistrationFile({
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
 * Get All Uploaded Files by Yudisium Registration ID
 * GET /api/yudisium-registrations/:id/uploads
 */
export const getYudisiumRegistrationFiles = asyncHandler(async (req, res) => {
  const data = await yudisiumRegistrationService.getYudisiumRegistrationFiles(
    req.params.id,
    req
  );
  res.json({ data });
});

/**
 * Download Yudisium Registration Upload
 * GET /api/yudisium-registrations/uploads/:uploadId/download
 */
export const downloadYudisiumRegistrationFile = asyncHandler(async (req, res) => {
  const { filepath, downloadName } =
    await yudisiumRegistrationService.getDownloadFileInfo(req.params.uploadId);
  await serveDownload(res, { filepath, downloadName });
});

/**
 * Approve Yudisium Registration (Admin Response)
 * PUT /api/yudisium-registrations/:id/approve
 */
export const approveYudisiumRegistration = asyncHandler(async (req, res) => {
  const data = await yudisiumRegistrationService.approveYudisiumRegistration(
    {
      id: req.params.id,
      ...req.body,
    },
    req
  );
  res.json({
    message: "Pendaftaran yudisium berhasil disetujui",
    data,
  });
});

/**
 * Reject/Request Revision for Yudisium Registration (Admin Response)
 * PUT /api/yudisium-registrations/:id/reject
 */
export const rejectYudisiumRegistration = asyncHandler(async (req, res) => {
  const data = await yudisiumRegistrationService.rejectYudisiumRegistration(
    {
      id: req.params.id,
      ...req.body,
    },
    req
  );
  res.json({
    message: "Pendaftaran yudisium berhasil ditolak / diminta revisi",
    data,
  });
});

/**
 * Export data pendaftar yudisium ke format Excel
 * GET /api/yudisium-registrations/export
 */
export const exportYudisium = asyncHandler(async (req, res) => {
  const { workbook, filename } =
    await yudisiumRegistrationService.exportYudisiumWorkbook({
      yudisiumPeriodId: req.query.yudisiumPeriodId,
    });

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}"`
  );

  await workbook.xlsx.write(res);
  res.end();
});
