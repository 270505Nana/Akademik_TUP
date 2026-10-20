import asyncHandler from "express-async-handler";
import * as sklService from "../services/sklService.js";
import {
  mapSklUpload,
  mapSklUploadList,
} from "../mappers/documentMapper.js";
import { formatPaginationResponse } from "../utils/paginationHelper.js";
import { serveDownload } from "../services/storageService.js";

// List all SKL uploads
export const listSklUploads = asyncHandler(async (req, res) => {
  const result = await sklService.listSklUploads(req.query, req.user);
  const data = mapSklUploadList(result.data, req);
  res.json(formatPaginationResponse(data, result.total, result.paginationParams));
});

// Get SKL upload by ID or Mahasiswa ID
export const getSklUploadById = asyncHandler(async (req, res) => {
  const result = await sklService.getSklUploadById(req.params.id, req.user);
  res.json({ data: mapSklUpload(result, req) });
});

// Create SKL upload
export const createSklUpload = asyncHandler(async (req, res) => {
  const result = await sklService.createSklUpload(req.body, req.file);
  res.status(result.isExisting ? 200 : 201).json({
    message: "SKL uploaded successfully",
    data: mapSklUpload(result.data, req),
  });
});

// Update SKL upload
export const updateSklUpload = asyncHandler(async (req, res) => {
  const result = await sklService.updateSklUpload(
    req.params.id,
    req.body,
    req.file
  );
  res.json({
    message: "SKL updated successfully",
    data: mapSklUpload(result, req),
  });
});

// Delete SKL upload (soft delete)
export const deleteSklUpload = asyncHandler(async (req, res) => {
  await sklService.deleteSklUpload(req.params.id);
  res.json({ message: "SKL deleted successfully" });
});

// Download SKL upload file
export const downloadSklUpload = asyncHandler(async (req, res) => {
  const downloadData = await sklService.getSklForDownload(
    req.params.id,
    req.user
  );
  await serveDownload(res, downloadData);
});
