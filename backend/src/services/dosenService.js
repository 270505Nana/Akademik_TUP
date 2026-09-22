import prisma from "../config/prisma.js";
import { ROLES } from "../constants/index.js";

export const getDosens = async ({
  search,
  researchGroupId,
  sortBy,
  skip,
  take,
}) => {
  const where = { deletedAt: null };

  // Search
  const searchTerm = (search || "").trim();

  if (searchTerm) {
    where.OR = [
      { user: { name: { contains: searchTerm, mode: "insensitive" } } },
      { nip: { contains: searchTerm, mode: "insensitive" } },
      { nidn: { contains: searchTerm, mode: "insensitive" } },
      { kodeDosen: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  // Filter
  if (researchGroupId) {
    where.researchGroupId = researchGroupId.trim();
  }

  // Sort
  const sortParam = (sortBy || "").toLowerCase().trim();
  let orderBy = { createdAt: "desc" };

  if (sortParam === "nameasc" || sortParam === "a-z") {
    orderBy = { user: { name: "asc" } };
  } else if (sortParam === "namedesc" || sortParam === "z-a") {
    orderBy = { user: { name: "desc" } };
  } else if (sortParam === "researchgroupasc") {
    orderBy = { researchGroup: { name: "asc" } };
  } else if (sortParam === "researchgroupdesc") {
    orderBy = { researchGroup: { name: "desc" } };
  } else if (sortParam === "oldest") {
    orderBy = { createdAt: "asc" };
  }

  const [total, dosens] = await Promise.all([
    prisma.dosen.count({ where }),
    prisma.dosen.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        user: true,
        researchGroup: true,
      },
    }),
  ]);

  return { total, dosens };
};

export const getDosenByIdOrUserId = async (idOrUserId) => {
  let dosen = await prisma.dosen.findUnique({
    where: { id: idOrUserId },
    include: { user: true, researchGroup: true },
  });

  if (!dosen) {
    dosen = await prisma.dosen.findUnique({
      where: { userId: idOrUserId },
      include: { user: true, researchGroup: true },
    });
  }

  if (!dosen || dosen.deletedAt) {
    const error = new Error("Dosen tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  return dosen;
};

export const upsertDosen = async (
  idOrUserId,
  { name, nip, nidn, kodeDosen, researchGroupId, isKetuaKK },
) => {
  let dosenRecord = await prisma.dosen.findUnique({
    where: { id: idOrUserId },
  });
  let userId = dosenRecord ? dosenRecord.userId : idOrUserId;

  if (!dosenRecord) {
    dosenRecord = await prisma.dosen.findUnique({
      where: { userId: idOrUserId },
    });
    if (dosenRecord) userId = dosenRecord.userId;
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
  });

  if (!user) {
    const error = new Error("Pengguna tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  if (user.role !== ROLES.DOSEN) {
    const error = new Error("Pengguna bukan dosen");
    error.statusCode = 400;
    throw error;
  }

  return await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { name },
    });

    return await tx.dosen.upsert({
      where: { userId },
      update: {
        nip,
        nidn: nidn || null,
        kodeDosen,
        researchGroupId,
        ...(isKetuaKK !== undefined ? { isKetuaKK } : {}),
      },
      create: {
        nip,
        nidn: nidn || null,
        kodeDosen,
        researchGroupId,
        isKetuaKK: isKetuaKK || false,
        userId,
      },
      include: {
        user: true,
        researchGroup: true,
      },
    });
  });
};

export const toggleKetuaKK = async (idOrUserId) => {
  const dosen = await getDosenByIdOrUserId(idOrUserId);

  return await prisma.dosen.update({
    where: { id: dosen.id },
    data: { isKetuaKK: !dosen.isKetuaKK },
    include: { user: true, researchGroup: true },
  });
};
