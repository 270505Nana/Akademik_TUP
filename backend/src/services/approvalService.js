import prisma from "../config/prisma.js";

/**
 * Menerapkan perubahan yang telah disetujui (APPROVED) ke tabel utama secara atomik/terpusat.
 * Mendukung entitas CLO, SUB_CLO, JENIS_ASESMEN, dan mudah diekspansi untuk entitas baru.
 */
export const applyChangeRequest = async (changeRequest) => {
  const { entityType, action, targetId, payload } = changeRequest;

  if (entityType === "CLO") {
    if (action === "CREATE") {
      return await prisma.cloProdi.create({
        data: payload,
      });
    }
    if (action === "UPDATE") {
      return await prisma.cloProdi.update({
        where: { id: targetId },
        data: payload,
      });
    }
    if (action === "DELETE") {
      return await prisma.cloProdi.update({
        where: { id: targetId },
        data: { deletedAt: new Date() },
      });
    }
  }

  if (entityType === "SUB_CLO") {
    if (action === "CREATE") {
      return await prisma.subcloProdi.create({
        data: payload,
      });
    }
    if (action === "UPDATE") {
      return await prisma.subcloProdi.update({
        where: { id: targetId },
        data: payload,
      });
    }
    if (action === "DELETE") {
      return await prisma.subcloProdi.update({
        where: { id: targetId },
        data: { deletedAt: new Date() },
      });
    }
  }

  if (entityType === "JENIS_ASESMEN") {
    if (action === "CREATE") {
      return await prisma.jenisAsesmenClo.create({
        data: payload,
      });
    }
    if (action === "UPDATE") {
      return await prisma.jenisAsesmenClo.update({
        where: { id: targetId },
        data: payload,
      });
    }
    if (action === "DELETE") {
      return await prisma.jenisAsesmenClo.update({
        where: { id: targetId },
        data: { deletedAt: new Date() },
      });
    }
  }

  throw new Error(`EntityType '${entityType}' tidak didukung untuk penerapan persetujuan.`);
};

/**
 * Cek apakah ada permohonan pending yang aktif untuk target record yang sama.
 */
export const checkActivePendingRequest = async ({ entityType, targetId }) => {
  if (!targetId) return null;
  return await prisma.approvalChangeRequest.findFirst({
    where: {
      entityType,
      targetId,
      status: "PENDING",
      deletedAt: null,
    },
    include: {
      requestedBy: {
        select: { id: true, name: true },
      },
    },
  });
};
