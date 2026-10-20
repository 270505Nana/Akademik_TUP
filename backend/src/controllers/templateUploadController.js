import asyncHandler from "express-async-handler";
import * as templateService from "../services/templateUploadService.js";
import {
  mapTemplateUpload,
  mapTemplateUploadList,
} from "../mappers/templateUploadMapper.js";
import { formatPaginationResponse } from "../utils/paginationHelper.js";
import { serveDownload, servePreview } from "../services/storageService.js";

// Get all template uploads
export const listTemplateUploads = asyncHandler(async (req, res) => {
  const result = await templateService.listTemplateUploads(req.query);
  const data = mapTemplateUploadList(result.data, req);
  res.json(formatPaginationResponse(data, result.total, result.paginationParams));
});

// Create template upload
export const createTemplateUpload = asyncHandler(async (req, res) => {
  const result = await templateService.createTemplateUpload(req.body, req.file);
  const data = mapTemplateUpload(result, req);
  res.json({
    message: "Template upload created successfully",
    data,
  });
});

// Get template upload by Code
export const findTemplateUploadByCode = asyncHandler(async (req, res) => {
  const result = await templateService.findTemplateUploadByCode(req.params.code);
  const data = mapTemplateUpload(result, req);
  res.json({ data });
});

// Update template upload by ID (using PATCH)
export const updateTemplateUpload = asyncHandler(async (req, res) => {
  const result = await templateService.updateTemplateUpload(
    req.params.id,
    req.body,
    req.file
  );
  const data = mapTemplateUpload(result, req);
  res.json({
    message: "Template upload updated successfully",
    data,
  });
});

// Delete template upload by ID (hard delete)
export const deleteTemplateUpload = asyncHandler(async (req, res) => {
  await templateService.deleteTemplateUpload(req.params.id);
  res.json({ message: "Template upload deleted successfully" });
});

// Download template by Code
export const downloadTemplateUpload = asyncHandler(async (req, res) => {
  const fileData = await templateService.getTemplateForDownload(req.params.code);
  await serveDownload(res, fileData);
});

// Preview template (serve inline, e.g. for PDF) by Code
export const previewTemplateUpload = asyncHandler(async (req, res) => {
  const previewData = await templateService.getTemplateForPreview(req.params.code);
  await servePreview(res, previewData);
});

// Toggle publish status of template upload
export const togglePublishTemplate = asyncHandler(async (req, res) => {
  const result = await templateService.togglePublishTemplate(req.params.id);
  const data = mapTemplateUpload(result, req);
  res.json({
    message: `template status changed to ${result.isPublish ? "published" : "unpublished"}`,
    data,
  });
});

// Toggle required status of template upload
export const toggleRequiredTemplate = asyncHandler(async (req, res) => {
  const result = await templateService.toggleRequiredTemplate(req.params.id);
  const data = mapTemplateUpload(result, req);
  res.json({
    message: `template requirement status changed to ${result.isRequired ? "required" : "optional"}`,
    data,
  });
});
