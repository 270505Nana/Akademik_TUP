import prisma from "../config/prisma.js";

// === RUANGAN ===
export const getRuangans = async () => {
  return await prisma.ruangan.findMany({
    where: { deletedAt: null },
    orderBy: [{ gedung: "asc" }, { name: "asc" }],
  });
};

export const getRuanganById = async (id) => {
  return await prisma.ruangan.findFirst({
    where: { id, deletedAt: null },
  });
};

export const createRuangan = async ({ name, gedung, isActive = true }) => {
  return await prisma.ruangan.create({
    data: { name, gedung, isActive },
  });
};

export const updateRuangan = async (id, data) => {
  return await prisma.ruangan.update({
    where: { id },
    data,
  });
};

export const deleteRuangan = async (id) => {
  return await prisma.ruangan.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
};

// === STUDY PROGRAM ===
export const getStudyPrograms = async ({ skip, take, facultyId }) => {
  const where = { deletedAt: null };
  if (facultyId) where.facultyId = facultyId;

  const [total, studyPrograms] = await Promise.all([
    prisma.studyProgram.count({ where }),
    prisma.studyProgram.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: { faculty: true },
    }),
  ]);
  return { total, studyPrograms };
};

export const getStudyProgramById = async (id) => {
  return await prisma.studyProgram.findFirst({
    where: { id, deletedAt: null },
    include: { faculty: true },
  });
};
