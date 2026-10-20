import asyncHandler from "express-async-handler";
import * as transkripService from "../services/transkripService.js";
import {
  mapTranskripUpload,
  mapTranskripUploadList,
} from "../mappers/documentMapper.js";
import { formatPaginationResponse } from "../utils/paginationHelper.js";
import { serveDownload } from "../services/storageService.js";

// List all Transkrip uploads
export const listTranskripUploads = asyncHandler(async (req, res) => {
  const result = await transkripService.listTranskripUploads(req.query, req.user);
  const data = mapTranskripUploadList(result.data, req);
  res.json(formatPaginationResponse(data, result.total, result.paginationParams));
});

// Get Transkrip upload by ID or Mahasiswa ID
export const getTranskripUploadById = asyncHandler(async (req, res) => {
  const result = await transkripService.getTranskripUploadById(
    req.params.id,
    req.user
  );
  res.json({ data: mapTranskripUpload(result, req) });
});

// Create Transkrip upload
export const createTranskripUpload = asyncHandler(async (req, res) => {
  const result = await transkripService.createTranskripUpload(
    req.body,
    req.file
  );
  res.status(result.isExisting ? 200 : 201).json({
    message: "Transkrip uploaded successfully",
    data: mapTranskripUpload(result.data, req),
  });
});

// Update Transkrip upload
export const updateTranskripUpload = asyncHandler(async (req, res) => {
  const result = await transkripService.updateTranskripUpload(
    req.params.id,
    req.body,
    req.file
  );
  res.json({
    message: "Transkrip updated successfully",
    data: mapTranskripUpload(result, req),
  });
});

// Delete Transkrip upload (soft delete)
export const deleteTranskripUpload = asyncHandler(async (req, res) => {
  await transkripService.deleteTranskripUpload(req.params.id);
  res.json({ message: "Transkrip deleted successfully" });
});

// Download Transkrip upload file
export const downloadTranskripUpload = asyncHandler(async (req, res) => {
  const downloadData = await transkripService.getTranskripForDownload(
    req.params.id,
    req.user
  );
  await serveDownload(res, downloadData);
});
