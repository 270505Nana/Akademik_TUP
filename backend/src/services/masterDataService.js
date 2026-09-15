import prisma from "../config/prisma.js";

// === ADMIN ===
export const getAdmins = async ({ skip, take }) => {
  const [total, admins] = await Promise.all([
    prisma.admin.count({ where: { deletedAt: null } }),
    prisma.admin.findMany({
      where: { deletedAt: null },
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    }),
  ]);
  return { total, admins };
};

export const getAdminByIdOrUserId = async (idOrUserId) => {
  let admin = await prisma.admin.findUnique({
    where: { id: idOrUserId },
    include: { user: true },
  });
  if (!admin) {
    admin = await prisma.admin.findUnique({
      where: { userId: idOrUserId },
      include: { user: true },
    });
  }
  return admin;
};

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

// === FACULTY ===
export const getFaculties = async ({ skip, take }) => {
  const where = { deletedAt: null };
  const [total, faculties] = await Promise.all([
    prisma.faculty.count({ where }),
    prisma.faculty.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: { studyPrograms: { where: { deletedAt: null } } },
    }),
  ]);
  return { total, faculties };
};

export const getFacultyById = async (id) => {
  return await prisma.faculty.findFirst({
    where: { id, deletedAt: null },
    include: { studyPrograms: { where: { deletedAt: null } } },
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

// === RESEARCH GROUP ===
export const getResearchGroups = async ({ skip, take }) => {
  const where = { deletedAt: null };
  const [total, researchGroups] = await Promise.all([
    prisma.researchGroup.count({ where }),
    prisma.researchGroup.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: { dosen: { where: { deletedAt: null }, include: { user: true } } },
    }),
  ]);
  return { total, researchGroups };
};

export const getResearchGroupById = async (id) => {
  return await prisma.researchGroup.findFirst({
    where: { id, deletedAt: null },
    include: { dosen: { where: { deletedAt: null }, include: { user: true } } },
  });
};
