import prisma from "../config/prisma.js";

// === SIDANG PERIOD ===
export const getSidangPeriods = async ({ skip, take }) => {
  const where = { deletedAt: null };
  const [total, periods] = await Promise.all([
    prisma.sidangPeriod.count({ where }),
    prisma.sidangPeriod.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return { total, periods };
};

export const getSidangPeriodById = async (id) => {
  return await prisma.sidangPeriod.findFirst({
    where: { id, deletedAt: null },
  });
};

export const getActiveSidangPeriod = async () => {
  return await prisma.sidangPeriod.findFirst({
    where: { isOpen: true, deletedAt: null },
    orderBy: { updatedAt: "desc" },
  });
};

// === YUDISIUM PERIOD ===
export const getYudisiumPeriods = async ({ skip, take }) => {
  const where = { deletedAt: null };
  const [total, periods] = await Promise.all([
    prisma.yudisiumPeriod.count({ where }),
    prisma.yudisiumPeriod.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return { total, periods };
};

export const getYudisiumPeriodById = async (id) => {
  return await prisma.yudisiumPeriod.findFirst({
    where: { id, deletedAt: null },
  });
};

export const getActiveYudisiumPeriod = async () => {
  return await prisma.yudisiumPeriod.findFirst({
    where: { isOpen: true, deletedAt: null },
    orderBy: { updatedAt: "desc" },
  });
};
