import prisma from "../config/prisma.js";

/**
 * Mencari periode pelaksanaan sidang yang aktif (isOpen: true) atau yang terakhir aktif
 */
export const getActiveOrLatestPelaksanaanSidangPeriod = async () => {
  const active = await prisma.sidangPeriod.findFirst({
    where: {
      category: "pelaksanaan",
      isOpen: true,
      deletedAt: null,
    },
    orderBy: { updatedAt: "desc" },
  });

  if (active) return active;

  return await prisma.sidangPeriod.findFirst({
    where: {
      category: "pelaksanaan",
      deletedAt: null,
    },
    orderBy: { endDate: "desc" },
  });
};
