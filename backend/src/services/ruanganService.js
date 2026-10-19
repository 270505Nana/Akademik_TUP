import prisma from "../config/prisma.js";

export const getRuangans = async ({
  search,
  gedung,
  isActive,
  sortBy = "gedung",
  sortOrder = "asc",
} = {}) => {
  const where = { deletedAt: null };

  const searchTerm = (search || "").trim();
  if (searchTerm) {
    where.OR = [
      { name: { contains: searchTerm, mode: "insensitive" } },
      { gedung: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  if (gedung) {
    where.gedung = {
      contains: gedung.trim(),
      mode: "insensitive",
    };
  }

  if (isActive !== undefined && isActive !== null) {
    where.isActive = isActive;
  }

  const orderDirection = (sortOrder || "asc").toLowerCase() === "desc" ? "desc" : "asc";
  const sortField = (sortBy || "gedung").trim();

  let orderBy = [{ gedung: orderDirection }, { name: "asc" }];
  if (sortField === "name") {
    orderBy = { name: orderDirection };
  } else if (sortField === "gedung") {
    orderBy = [{ gedung: orderDirection }, { name: "asc" }];
  } else if (sortField === "isActive") {
    orderBy = [{ isActive: orderDirection }, { gedung: "asc" }, { name: "asc" }];
  } else if (sortField === "createdAt") {
    orderBy = { createdAt: orderDirection };
  }

  return await prisma.ruangan.findMany({
    where,
    orderBy,
  });
};

export const getRuanganById = async (id) => {
  const ruangan = await prisma.ruangan.findFirst({
    where: { id, deletedAt: null },
  });

  if (!ruangan) {
    const error = new Error("Data ruangan tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  return ruangan;
};

export const createRuangan = async ({ name, gedung, isActive = true }) => {
  return await prisma.ruangan.create({
    data: {
      name: name.trim(),
      gedung: gedung.trim(),
      isActive: isActive !== undefined ? isActive : true,
    },
  });
};

export const updateRuangan = async (id, data) => {
  const existing = await prisma.ruangan.findFirst({
    where: { id, deletedAt: null },
  });

  if (!existing) {
    const error = new Error("Data ruangan tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.gedung !== undefined) updateData.gedung = data.gedung.trim();
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  return await prisma.ruangan.update({
    where: { id },
    data: updateData,
  });
};

export const deleteRuangan = async (id) => {
  const existing = await prisma.ruangan.findFirst({
    where: { id, deletedAt: null },
  });

  if (!existing) {
    const error = new Error("Data ruangan tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  return await prisma.ruangan.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
};
