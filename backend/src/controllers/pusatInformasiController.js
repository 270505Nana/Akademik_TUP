import asyncHandler from "express-async-handler";
import prisma from "../config/prisma.js";
import { sendValidationError, isNil } from "../utils/validationHelper.js";
import {
  getPaginationParams,
  formatPaginationResponse,
} from "../utils/paginationHelper.js";
import { mapPusatInformasi } from "../mappers/documentMapper.js";

const generateCodeFromCategoryAndName = (category, name) => {
  const raw = `${category || ""} ${name || ""}`;
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
};

/**
 * Mencari periode yang paling dekat dengan waktu sekarang (current time).
 * Logika penentuan:
 * 1. Jika ada periode yang sedang aktif/berlangsung (startDate <= now <= endDate), distance = 0 (prioritas utama).
 * 2. Jika tidak ada yang aktif, hitung selisih waktu terdekat ke startDate (periode mendatang) atau endDate (periode lampau).
 * 3. Mengembalikan null jika belum ada data periode.
 */
const findNearestPeriod = (periods) => {
  if (!periods || periods.length === 0) return null;
  const now = new Date().getTime();

  let nearest = null;
  let minDistance = Infinity;

  for (const p of periods) {
    const start = new Date(p.startDate).getTime();
    const end = new Date(p.endDate).getTime();

    let distance;
    if (now >= start && now <= end) {
      distance = 0; // Sedang berlangsung
    } else if (now < start) {
      distance = start - now; // Periode mendatang
    } else {
      distance = now - end; // Periode lampau
    }

    if (distance < minDistance) {
      minDistance = distance;
      nearest = p;
    }
  }

  if (!nearest) return null;

  return {
    name: nearest.name,
    category: nearest.category,
    period: nearest.period,
    startDate: nearest.startDate ? nearest.startDate.toISOString() : null,
    endDate: nearest.endDate ? nearest.endDate.toISOString() : null,
  };
};

/**
 * @desc    Ambil data preview periode sidang, yudisium terdekat dan DokumenPanduanTugasAkhir (grouped by category, ordered by showInPreview asc)
 * @route   GET /api/pusat-informasi/preview
 * @access  Public
 */
const getPusatInformasiPreview = asyncHandler(async (req, res) => {
  const [sidangPeriods, yudisiumPeriods, dokumenPanduan] = await Promise.all([
    prisma.sidangPeriod.findMany({
      where: { deletedAt: null, isOpen: true },
      orderBy: { startDate: "asc" },
    }),
    prisma.yudisiumPeriod.findMany({
      where: { deletedAt: null, isOpen: true },
      orderBy: { startDate: "asc" },
    }),
    prisma.dokumenPanduanTugasAkhir.findMany({
      where: {
        deletedAt: null,
        isPublish: true,
        showInPreview: { not: null },
      },
      orderBy: {
        showInPreview: "asc",
      },
    }),
  ]);

  const periodeSidang = findNearestPeriod(sidangPeriods);
  const periodeYudisium = findNearestPeriod(yudisiumPeriods);

  const groupedMap = new Map();
  for (const item of dokumenPanduan) {
    if (!groupedMap.has(item.category)) {
      groupedMap.set(item.category, []);
    }
    groupedMap.get(item.category).push(mapPusatInformasi(item));
  }

  const dataDokumen = Array.from(groupedMap.entries()).map(
    ([category, list]) => ({
      category,
      data: list,
    }),
  );

  res.json({
    periodeSidang,
    periodeYudisium,
    dokumenPanduanTugasAkhir: dataDokumen,
  });
});

/**
 * @desc    Ambil semua pusat informasi yang dipublish, dikelompokkan berdasarkan kategori dan diurutkan berdasarkan queue
 * @route   GET /api/pusat-informasi/public
 * @access  Public
 */
const getPusatInformasiPublic = asyncHandler(async (req, res) => {
  const items = await prisma.dokumenPanduanTugasAkhir.findMany({
    where: {
      deletedAt: null,
      isPublish: true,
    },
    orderBy: [
      { category: "asc" },
      { queue: "asc" },
      { createdAt: "desc" },
    ],
  });

  const groupedMap = new Map();
  for (const item of items) {
    if (!groupedMap.has(item.category)) {
      groupedMap.set(item.category, []);
    }
    groupedMap.get(item.category).push(mapPusatInformasi(item));
  }

  const data = Array.from(groupedMap.entries()).map(([category, list]) => ({
    category,
    data: list,
  }));

  res.json({ data });
});

/**
 * @desc    Ambil seluruh data pusat informasi dengan pagination, search, category filter, dan sort (newest, oldest)
 * @route   GET /api/pusat-informasi
 * @access  Private
 */
const listPusatInformasi = asyncHandler(async (req, res) => {
  const paginationParams = getPaginationParams(req.query);
  const { category, search, sortBy, sort } = req.query;

  const whereClause = {
    deletedAt: null,
    ...(category && { category }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const sortParam = (sortBy || sort || "").toLowerCase().trim();
  let orderBy = [{ createdAt: "desc" }];

  if (sortParam === "oldest") {
    orderBy = [{ createdAt: "asc" }];
  } else if (sortParam === "newest") {
    orderBy = [{ createdAt: "desc" }];
  }

  const [total, items] = await Promise.all([
    prisma.dokumenPanduanTugasAkhir.count({ where: whereClause }),
    prisma.dokumenPanduanTugasAkhir.findMany({
      where: whereClause,
      skip: paginationParams.skip,
      take: paginationParams.take,
      orderBy,
    }),
  ]);

  const data = items.map(mapPusatInformasi);
  res.json(formatPaginationResponse(data, total, paginationParams));
});

/**
 * @desc    Ambil detail data pusat informasi berdasarkan ID
 * @route   GET /api/pusat-informasi/:id
 * @access  Private
 */
const getPusatInformasiById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const item = await prisma.dokumenPanduanTugasAkhir.findFirst({
    where: { id, deletedAt: null },
  });

  if (!item) {
    res.status(404);
    throw new Error("Pusat informasi tidak ditemukan");
  }

  res.json({
    data: mapPusatInformasi(item),
  });
});

/**
 * @desc    Tambah data pusat informasi baru
 * @route   POST /api/pusat-informasi
 * @access  Private (Admin)
 */
const createPusatInformasi = asyncHandler(async (req, res) => {
  const {
    category,
    name,
    description,
    icon,
    url,
    isPublish,
    showInPreview,
  } = req.body;

  const errors = [];
  if (isNil(name)) {
    errors.push({ field: "name", message: "name wajib diisi" });
  }
  if (isNil(category)) {
    errors.push({ field: "category", message: "category wajib diisi" });
  }
  if (isNil(url)) {
    errors.push({ field: "url", message: "url wajib diisi" });
  }

  if (errors.length > 0) return sendValidationError(res, errors, req);

  const autoCode = generateCodeFromCategoryAndName(category, name);
  const codeExists = await prisma.dokumenPanduanTugasAkhir.findUnique({
    where: { code: autoCode },
  });

  if (codeExists) {
    return sendValidationError(
      res,
      [
        {
          field: "name",
          message: "Nama dan kategori dokumen sudah digunakan di dokumen lain",
        },
      ],
      req,
    );
  }

  const lastDoc = await prisma.dokumenPanduanTugasAkhir.findFirst({
    where: { category, deletedAt: null },
    orderBy: { queue: "desc" },
    select: { queue: true },
  });
  const nextQueue = (lastDoc?.queue ?? 0) + 1;

  let parsedShowInPreview = null;
  if (showInPreview === true || showInPreview === "true") {
    parsedShowInPreview = new Date();
  } else if (showInPreview && !isNaN(Date.parse(showInPreview))) {
    parsedShowInPreview = new Date(showInPreview);
  }

  const parsedIsPublish = isPublish === "true" || isPublish === true;

  const created = await prisma.dokumenPanduanTugasAkhir.create({
    data: {
      code: autoCode,
      name: name.trim(),
      description: description ? description.trim() : "",
      category: category.trim(),
      icon: icon ? icon.trim() : "",
      type: "url",
      path: url.trim(),
      isPublish: parsedIsPublish,
      showInPreview: parsedShowInPreview,
      queue: nextQueue,
    },
  });

  res.status(201).json({
    message: "Pusat informasi created successfully",
    data: mapPusatInformasi(created),
  });
});

/**
 * @desc    Perbarui data pusat informasi berdasarkan ID
 * @route   PUT /api/pusat-informasi/:id
 * @access  Private (Admin)
 */
const updatePusatInformasi = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    category,
    name,
    description,
    icon,
    url,
    isPublish,
    showInPreview,
    queue,
  } = req.body;

  const errors = [];
  let parsedQueue;
  if (queue !== undefined && queue !== null && queue !== "") {
    parsedQueue = parseInt(queue, 10);
    if (isNaN(parsedQueue) || parsedQueue < 1) {
      errors.push({
        field: "queue",
        message: "queue harus berupa angka integer positif (minimal 1)",
      });
    }
  }

  if (errors.length > 0) return sendValidationError(res, errors, req);

  const existing = await prisma.dokumenPanduanTugasAkhir.findFirst({
    where: { id, deletedAt: null },
  });

  if (!existing) {
    res.status(404);
    throw new Error("Pusat informasi tidak ditemukan");
  }

  const newCategory =
    category !== undefined ? category.trim() : existing.category;
  const newName = name !== undefined ? name.trim() : existing.name;
  let updatedCode = existing.code;

  if (newCategory !== existing.category || newName !== existing.name) {
    updatedCode = generateCodeFromCategoryAndName(newCategory, newName);

    const codeExists = await prisma.dokumenPanduanTugasAkhir.findUnique({
      where: { code: updatedCode },
    });
    if (codeExists && codeExists.id !== id) {
      return sendValidationError(
        res,
        [
          {
            field: "name",
            message:
              "Nama dan kategori dokumen baru sudah digunakan di dokumen lain",
          },
        ],
        req,
      );
    }
  }

  let parsedShowInPreview = undefined;
  if (showInPreview !== undefined) {
    if (showInPreview === true || showInPreview === "true") {
      parsedShowInPreview = existing.showInPreview || new Date();
    } else if (
      showInPreview === false ||
      showInPreview === "false" ||
      showInPreview === null ||
      showInPreview === ""
    ) {
      parsedShowInPreview = null;
    } else if (!isNaN(Date.parse(showInPreview))) {
      parsedShowInPreview = new Date(showInPreview);
    }
  }

  const updated = await prisma.dokumenPanduanTugasAkhir.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      code: updatedCode,
      ...(category !== undefined && { category: newCategory }),
      ...(description !== undefined && {
        description: description ? description.trim() : "",
      }),
      ...(icon !== undefined && { icon: icon ? icon.trim() : "" }),
      ...(url !== undefined && { path: url.trim() }),
      ...(isPublish !== undefined && {
        isPublish: isPublish === "true" || isPublish === true,
      }),
      ...(parsedShowInPreview !== undefined && {
        showInPreview: parsedShowInPreview,
      }),
      ...(parsedQueue !== undefined && { queue: parsedQueue }),
    },
  });

  res.json({
    message: "Pusat informasi updated successfully",
    data: mapPusatInformasi(updated),
  });
});

/**
 * @desc    Hapus permanen data pusat informasi berdasarkan ID
 * @route   DELETE /api/pusat-informasi/:id
 * @access  Private (Admin)
 */
const deletePusatInformasi = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.dokumenPanduanTugasAkhir.findFirst({
    where: { id },
  });

  if (!existing) {
    res.status(404);
    throw new Error("Pusat informasi tidak ditemukan");
  }

  await prisma.dokumenPanduanTugasAkhir.delete({
    where: { id },
  });

  res.json({
    message: "Pusat informasi deleted successfully",
  });
});

export {
  getPusatInformasiPreview,
  getPusatInformasiPublic,
  listPusatInformasi,
  getPusatInformasiById,
  createPusatInformasi,
  updatePusatInformasi,
  deletePusatInformasi,
  findNearestPeriod,
};
