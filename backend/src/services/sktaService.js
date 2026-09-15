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

export const getPermohonanSktas = async ({ skip, take }) => {
  const [total, data] = await Promise.all([
    prisma.permohonanSkta.count(),
    prisma.permohonanSkta.findMany({
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

export const getDokumenValidasi = async (permohonanSktaId) => {
  return await prisma.berkasMahasiswa.findFirst({
    where: {
      category: "Dokumen Validasi Skta",
      permohonanSktaId,
      deletedAt: null,
    },
    include: {
      mahasiswa: {
        include: {
          user: true,
          studyProgram: true,
        },
      },
      permohonanSkta: {
        include: {
          dosenPembimbing1: {
            include: {
              user: true,
            },
          },
          dosenPembimbing2: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });
};
