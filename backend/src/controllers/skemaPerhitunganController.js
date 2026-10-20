import asyncHandler from "express-async-handler";
import * as skemaService from "../services/skemaPerhitunganService.js";
import {
  mapSkemaPerhitungan,
  mapSkemaPerhitunganList,
} from "../mappers/skemaPerhitunganMapper.js";
import { getAcademicAccessContext } from "../middlewares/authorize.js";

const formatPendingResponse = (changeRequest) => ({
  requestId: changeRequest.id,
  status: changeRequest.status,
  entityType: changeRequest.entityType,
  action: changeRequest.action,
});

export const createSkemaPerhitungan = asyncHandler(async (req, res) => {
  const access = await getAcademicAccessContext(req);
  const result = await skemaService.createSkemaPerhitungan(req.body, access);

  if (result.isPending) {
    return res.status(202).json({
      message:
        "Permohonan penambahan Skema Perhitungan berhasil diajukan dan sedang menunggu persetujuan Ketua Kelompok Keahlian",
      data: formatPendingResponse(result.data),
    });
  }

  res.status(201).json({
    message: "Skema Perhitungan Nilai berhasil dibuat",
    data: mapSkemaPerhitungan(result.data),
  });
});

export const getSkemaPerhitungans = asyncHandler(async (req, res) => {
  const access = await getAcademicAccessContext(req);
  const result = await skemaService.getSkemaPerhitungans(req.query, access);
  res.json({ ...result, data: mapSkemaPerhitunganList(result.data) });
});

export const getSkemaPerhitunganById = asyncHandler(async (req, res) => {
  const access = await getAcademicAccessContext(req);
  const result = await skemaService.getSkemaPerhitunganById(
    req.params.id,
    access
  );
  res.json({ data: mapSkemaPerhitungan(result) });
});

export const updateSkemaPerhitungan = asyncHandler(async (req, res) => {
  const access = await getAcademicAccessContext(req);
  const result = await skemaService.updateSkemaPerhitungan(
    req.params.id,
    req.body,
    access
  );

  if (result.isPending) {
    return res.status(200).json({
      message: result.isUpdatedPending
        ? "Permohonan pembaruan Skema Perhitungan berhasil diperbarui dan sedang menunggu persetujuan Ketua Kelompok Keahlian"
        : "Permohonan pembaruan Skema Perhitungan berhasil diajukan dan sedang menunggu persetujuan Ketua Kelompok Keahlian",
      data: formatPendingResponse(result.data),
    });
  }

  res.json({
    message: "Skema Perhitungan Nilai berhasil diperbarui",
    data: mapSkemaPerhitungan(result.data),
  });
});

export const deleteSkemaPerhitungan = asyncHandler(async (req, res) => {
  const access = await getAcademicAccessContext(req);
  const result = await skemaService.deleteSkemaPerhitungan(
    req.params.id,
    access
  );

  if (result && result.isPending) {
    return res.status(200).json({
      message: result.isUpdatedPending
        ? "Permohonan Skema Perhitungan berhasil diperbarui menjadi permohonan penghapusan dan sedang menunggu persetujuan"
        : "Permohonan penghapusan Skema Perhitungan berhasil diajukan dan sedang menunggu persetujuan Ketua Kelompok Keahlian",
      data: formatPendingResponse(result.data),
    });
  }

  res.json({ message: "Skema Perhitungan Nilai berhasil dihapus" });
});
