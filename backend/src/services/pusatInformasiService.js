import prisma from "../config/prisma.js";
import { getPaginationParams } from "../utils/paginationHelper.js";
import { generateCodeFromCategoryAndName } from "../utils/templateHelper.js";

const throwError = (statusCode, message, errors) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  if (errors) error.errors = errors;
  throw error;
};

/**
 * Mencari periode yang paling dekat dengan waktu sekarang (current time).
 * 1. Jika ada periode yang sedang aktif (startDate <= now <= endDate), distance = 0 (prioritas utama).
 * 2. Jika tidak ada yang aktif, hitung selisih waktu terdekat ke startDate (mendatang) atau endDate (lampau).
 * 3. Mengembalikan null jika belum ada data periode.
 */
export const findNearestPeriod = (periods) => {
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

export const getPusatInformasiPreview = async () => {
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

  return {
    periodeSidang,
    periodeYudisium,
    dokumenPanduan,
  };
};

export const getPusatInformasiPublic = async () => {
  return await prisma.dokumenPanduanTugasAkhir.findMany({
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
};

export const listPusatInformasi = async (query = {}) => {
  const paginationParams = getPaginationParams(query);
  const { category, search, sortBy, sortOrder } = query;

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

  const sortField = (sortBy || "createdAt").trim();
  const orderDirection =
    (sortOrder || "desc").toLowerCase() === "asc" ? "asc" : "desc";

  let orderBy = [{ createdAt: "desc" }];

  if (sortField === "oldest") {
    orderBy = [{ createdAt: "asc" }];
  } else if (sortField === "newest") {
    orderBy = [{ createdAt: "desc" }];
  } else if (sortField === "name") {
    orderBy = [{ name: orderDirection }];
  } else if (sortField === "category") {
    orderBy = [{ category: orderDirection }, { queue: "asc" }];
  } else if (sortField === "queue") {
    orderBy = [{ queue: orderDirection }];
  } else if (sortField === "createdAt") {
    orderBy = [{ createdAt: orderDirection }];
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

  return {
    data: items,
    total,
    paginationParams,
  };
};

export const getPusatInformasiById = async (id) => {
  const item = await prisma.dokumenPanduanTugasAkhir.findFirst({
    where: { id, deletedAt: null },
  });

  if (!item) {
    throwError(404, "Pusat informasi tidak ditemukan");
  }

  return item;
};

export const createPusatInformasi = async (body) => {
  const {
    category,
    name,
    description,
    icon,
    url,
    isPublish,
    showInPreview,
  } = body;

  const autoCode = generateCodeFromCategoryAndName(category, name);
  const codeExists = await prisma.dokumenPanduanTugasAkhir.findUnique({
    where: { code: autoCode },
  });

  if (codeExists) {
    throwError(400, "Validation error", [
      {
        field: "name",
        message: "Nama dan kategori dokumen sudah digunakan di dokumen lain",
      },
    ]);
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

  return await prisma.dokumenPanduanTugasAkhir.create({
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
};

export const updatePusatInformasi = async (id, body) => {
  const {
    category,
    name,
    description,
    icon,
    url,
    isPublish,
    showInPreview,
    queue,
  } = body;

  const existing = await prisma.dokumenPanduanTugasAkhir.findFirst({
    where: { id, deletedAt: null },
  });

  if (!existing) {
    throwError(404, "Pusat informasi tidak ditemukan");
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
      throwError(400, "Validation error", [
        {
          field: "name",
          message:
            "Nama dan kategori dokumen baru sudah digunakan di dokumen lain",
        },
      ]);
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

  return await prisma.dokumenPanduanTugasAkhir.update({
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
      ...(queue !== undefined && { queue }),
    },
  });
};

export const deletePusatInformasi = async (id) => {
  const existing = await prisma.dokumenPanduanTugasAkhir.findFirst({
    where: { id },
  });

  if (!existing) {
    throwError(404, "Pusat informasi tidak ditemukan");
  }

  await prisma.dokumenPanduanTugasAkhir.delete({
    where: { id },
  });

  return true;
};
