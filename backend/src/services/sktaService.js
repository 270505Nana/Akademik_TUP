import prisma from "../config/prisma.js";

const sktaInclude = {
  mahasiswa: {
    include: {
      studyProgram: true,
      user: true,
    },
  },
  dosenPembimbing1: {
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
  },
  dosenPembimbing2: {
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
  },
  researchGroup: true,
  admin: true,
};

export const checkSktaEditable = async (id) => {
  const permohonan = await prisma.permohonanSkta.findUnique({
    where: { id },
  });

  if (!permohonan) {
    return {
      exists: false,
      editable: false,
      reason: "Permohonan SKTA tidak ditemukan.",
    };
  }

  if (!permohonan.isDraft) {
    const hasActiveEditPermission =
      permohonan.isEdit && new Date(permohonan.isEdit) > new Date();

    if (!hasActiveEditPermission) {
      return {
        exists: true,
        editable: false,
        reason:
          "Permohonan SKTA sudah dikirim dan tidak memiliki izin edit yang aktif.",
      };
    }
  }

  if (permohonan.isEdit) {
    const isEditExpired = new Date(permohonan.isEdit) < new Date();
    if (isEditExpired) {
      return {
        exists: true,
        editable: false,
        reason: "Batas waktu izin edit dari admin telah kedaluwarsa.",
      };
    }
  }

  return { exists: true, editable: true };
};

export const getPermohonanSktas = async ({ skip, take }, customWhere = {}) => {
  const where = {
    deletedAt: null,
    isDraft: false,
    ...customWhere,
  };

  const [total, data] = await Promise.all([
    prisma.permohonanSkta.count({ where }),
    prisma.permohonanSkta.findMany({
      where,
      skip,
      take,
      include: sktaInclude,
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  return { total, data };
};

export const getPermohonanSktaById = async (id) => {
  return await prisma.permohonanSkta.findUnique({
    where: { id },
    include: sktaInclude,
  });
};

export const getLatestPermohonanByMahasiswaId = async (mahasiswaId) => {
  return await prisma.permohonanSkta.findFirst({
    where: { mahasiswaId },
    orderBy: {
      createdAt: "desc",
    },
    include: sktaInclude,
  });
};

export const findExistingPermohonanBaru = async (mahasiswaId) => {
  return await prisma.permohonanSkta.findFirst({
    where: {
      mahasiswaId,
      category: "Permohonan Baru",
      deletedAt: null,
    },
  });
};

export const createPermohonanSkta = async (data) => {
  return await prisma.permohonanSkta.create({
    data,
    include: sktaInclude,
  });
};

export const updatePermohonanSkta = async (id, data) => {
  return await prisma.permohonanSkta.update({
    where: { id },
    data,
    include: sktaInclude,
  });
};

