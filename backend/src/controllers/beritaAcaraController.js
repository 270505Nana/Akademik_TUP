import asyncHandler from "express-async-handler";
import * as beritaAcaraService from "../services/beritaAcaraService.js";
import { serveDownload } from "../services/storageService.js";

// GET /api/berita-acara (Admin)
export const getBeritaAcaraList = asyncHandler(async (req, res) => {
  const result = await beritaAcaraService.getBeritaAcaraList({
    user: req.user,
    query: req.query,
  });

  res.status(200).json({
    message: "Daftar berita acara sidang berhasil diambil",
    ...result,
  });
});

// GET /api/berita-acara/:id (Admin)
export const getBeritaAcaraById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    res.status(400);
    throw new Error("ID Berita Acara wajib diisi");
  }

  const data = await beritaAcaraService.getBeritaAcaraById({ id });

  res.status(200).json({
    message: "Data berita acara sidang berhasil diambil",
    data,
  });
});

// GET /api/berita-acara/me (Mahasiswa)
export const getLatestBeritaAcaraMahasiswa = asyncHandler(async (req, res) => {
  const data = await beritaAcaraService.getLatestBeritaAcaraMahasiswa({
    user: req.user,
  });

  if (!data) {
    return res.status(200).json({
      message: "Berita acara sidang belum diterbitkan atau belum tersedia",
      data: null,
    });
  }

  res.status(200).json({
    message: "Data berita acara sidang mahasiswa berhasil diambil",
    data,
  });
});

// PUT /api/berita-acara/:id (Admin)
export const updateBeritaAcara = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    res.status(400);
    throw new Error("ID Berita Acara wajib diisi");
  }

  const data = await beritaAcaraService.updateBeritaAcara({
    id,
    payload: req.body,
  });

  res.status(200).json({
    message: "Berita acara sidang berhasil diperbarui",
    data,
  });
});

// PUT /api/berita-acara/:id/berkas (Admin)
export const uploadBerkasBeritaAcara = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    res.status(400);
    throw new Error("ID Berita Acara wajib diisi");
  }

  const data = await beritaAcaraService.uploadBerkasBeritaAcara({
    id,
    file: req.file,
  });

  res.status(200).json({
    message: "Berkas berita acara sidang berhasil diunggah",
    data,
  });
});

// DELETE /api/berita-acara/:id/berkas (Admin)
export const deleteBerkasBeritaAcara = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    res.status(400);
    throw new Error("ID Berita Acara wajib diisi");
  }

  await beritaAcaraService.deleteBerkasBeritaAcara({ id });

  res.status(200).json({
    message: "Berkas berita acara sidang berhasil dihapus",
  });
});

// GET /api/berita-acara/:id/berkas/download (Admin, Mahasiswa, Dosen Terkait)
export const downloadBerkasBeritaAcara = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    res.status(400);
    throw new Error("ID Berita Acara wajib diisi");
  }

  const downloadInfo = await beritaAcaraService.getDownloadBerkasBeritaAcara({
    id,
    user: req.user,
  });

  await serveDownload(res, downloadInfo);
});

// PATCH /api/berita-acara/:id/publish (Admin)
export const publishBeritaAcara = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    res.status(400);
    throw new Error("ID Berita Acara wajib diisi");
  }

  const { isPublished } = req.body;

  const data = await beritaAcaraService.publishBeritaAcara({
    id,
    isPublished,
  });

  res.status(200).json({
    message: isPublished
      ? "Berita acara sidang berhasil dipublikasikan"
      : "Publikasi berita acara sidang berhasil dibatalkan",
    data,
  });
});
