import asyncHandler from "express-async-handler";
import * as revisiSidangService from "../services/revisiSidangService.js";

// GET /api/revisi-sidang (Admin & Dosen)
export const getRevisiSidangList = asyncHandler(async (req, res) => {
  const result = await revisiSidangService.getRevisiSidangList({
    user: req.user,
    query: req.query,
  });

  res.status(200).json({
    message: "Daftar revisi sidang berhasil diambil",
    ...result,
  });
});

// GET /api/revisi-sidang/me (Mahasiswa)
export const getLatestRevisiSidangMahasiswa = asyncHandler(async (req, res) => {
  const data = await revisiSidangService.getLatestRevisiSidangMahasiswa({
    user: req.user,
  });

  res.status(200).json({
    message: "Data revisi sidang mahasiswa berhasil diambil",
    data,
  });
});

// GET /api/revisi-sidang/:id (Admin & Dosen Pembimbing 1)
export const getRevisiSidangById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    res.status(400);
    throw new Error("ID Revisi Sidang wajib diisi");
  }

  const data = await revisiSidangService.getRevisiSidangById({
    id,
    user: req.user,
  });

  res.status(200).json({
    message: "Data revisi sidang berhasil diambil",
    data,
  });
});

// PUT /api/revisi-sidang/:id/submit (Mahasiswa)
export const submitRevisiSidang = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    res.status(400);
    throw new Error("ID Revisi Sidang wajib diisi");
  }

  const data = await revisiSidangService.submitRevisiSidang({
    id,
    user: req.user,
    file: req.file,
  });

  res.status(200).json({
    message: "Revisi sidang berhasil disubmit",
    data,
  });
});

// DELETE /api/revisi-sidang/:id/berkas (Mahasiswa)
export const deleteBerkasRevisiSidang = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    res.status(400);
    throw new Error("ID Revisi Sidang wajib diisi");
  }

  await revisiSidangService.deleteBerkasRevisiSidang({
    id,
    user: req.user,
  });

  res.status(200).json({
    message: "Berkas revisi sidang berhasil dihapus",
  });
});

// PUT /api/revisi-sidang/:id/verify (Dosen Pembimbing 1)
export const verifyRevisiSidang = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    res.status(400);
    throw new Error("ID Revisi Sidang wajib diisi");
  }

  const data = await revisiSidangService.verifyRevisiSidang({
    id,
    user: req.user,
    payload: req.body,
  });

  res.status(200).json({
    message: "Hasil revisi sidang berhasil diverifikasi dan Berita Acara telah diterbitkan",
    data,
  });
});
