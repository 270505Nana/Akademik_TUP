import prisma from "../config/prisma.js";

/**
 * Mendapatkan daftar Skema Penilai dengan filter, sorting, dan pagination
 */
export const getSkemaPenilais = async ({
  search,
  studyProgramId,
  sortBy = "createdAt",
  sortOrder = "asc",
  skip,
  take,
}) => {
  const where = { deletedAt: null };

  if (studyProgramId) {
    where.studyProgramId = studyProgramId;
  }

  const searchTerm = (search || "").trim();
  if (searchTerm) {
    where.OR = [
      { type: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  const orderDirection =
    (sortOrder || "asc").toLowerCase() === "desc" ? "desc" : "asc";
  const sortField = (sortBy || "createdAt").trim();

  let orderBy = { createdAt: orderDirection };
  if (sortField === "type") {
    orderBy = { type: orderDirection };
  } else if (sortField === "bobot") {
    orderBy = { bobot: orderDirection };
  } else if (sortField === "createdAt") {
    orderBy = { createdAt: orderDirection };
  }

  const [total, skemaList] = await Promise.all([
    prisma.skemaPenilaiProdi.count({ where }),
    prisma.skemaPenilaiProdi.findMany({
      where,
      skip,
      take,
      include: {
        studyProgram: true,
      },
      orderBy,
    }),
  ]);

  return { total, skemaList };
};

/**
 * Mendapatkan data Skema Penilai berdasarkan ID
 */
export const getSkemaPenilaiById = async (id) => {
  const skema = await prisma.skemaPenilaiProdi.findUnique({
    where: { id },
    include: {
      studyProgram: true,
    },
  });

  if (!skema || skema.deletedAt) {
    const error = new Error("Skema Penilai tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  return skema;
};

/**
 * Membuat data Skema Penilai baru
 */
export const createSkemaPenilai = async ({
  type,
  bobot,
  studyProgramId,
}) => {
  const studyProgram = await prisma.studyProgram.findUnique({
    where: { id: studyProgramId },
  });

  if (!studyProgram || studyProgram.deletedAt) {
    const error = new Error("Program Studi tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const skema = await prisma.skemaPenilaiProdi.create({
    data: {
      type,
      bobot: typeof bobot === "number" ? bobot : parseFloat(bobot),
      studyProgramId,
    },
  });

  return skema;
};

/**
 * Memperbarui data Skema Penilai
 */
export const updateSkemaPenilai = async (id, { type, bobot }) => {
  const existingSkema = await prisma.skemaPenilaiProdi.findUnique({
    where: { id },
  });

  if (!existingSkema || existingSkema.deletedAt) {
    const error = new Error("Skema Penilai tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const updatedSkema = await prisma.skemaPenilaiProdi.update({
    where: { id },
    data: {
      type: type !== undefined ? type : existingSkema.type,
      bobot:
        bobot !== undefined
          ? typeof bobot === "number"
            ? bobot
            : parseFloat(bobot)
          : existingSkema.bobot,
    },
  });

  return updatedSkema;
};

/**
 * Menghapus data Skema Penilai (soft delete)
 */
export const deleteSkemaPenilai = async (id) => {
  const existingSkema = await prisma.skemaPenilaiProdi.findUnique({
    where: { id },
  });

  if (!existingSkema || existingSkema.deletedAt) {
    const error = new Error("Skema Penilai tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  await prisma.skemaPenilaiProdi.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
};
