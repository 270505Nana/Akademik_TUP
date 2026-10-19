import prisma from "../config/prisma.js";

export const getStudyPrograms = async ({
  search,
  isActive,
  facultyId,
  sortBy = "name",
  sortOrder = "asc",
  skip,
  take,
}) => {
  const where = { deletedAt: null };

  const searchTerm = (search || "").trim();
  if (searchTerm) {
    where.name = {
      contains: searchTerm,
      mode: "insensitive",
    };
  }

  if (isActive !== undefined && isActive !== null) {
    where.isActive = isActive;
  }

  if (facultyId) {
    where.facultyId = facultyId.trim();
  }

  const orderDirection = (sortOrder || "asc").toLowerCase() === "desc" ? "desc" : "asc";
  const sortField = (sortBy || "name").trim();

  let orderBy = { name: orderDirection };
  if (sortField === "name") {
    orderBy = { name: orderDirection };
  } else if (sortField === "faculty") {
    orderBy = { faculty: { name: orderDirection } };
  } else if (sortField === "isActive") {
    orderBy = [{ isActive: orderDirection }, { name: "asc" }];
  } else if (sortField === "createdAt") {
    orderBy = { createdAt: orderDirection };
  }

  const [total, studyPrograms] = await Promise.all([
    prisma.studyProgram.count({ where }),
    prisma.studyProgram.findMany({
      where,
      orderBy,
      skip,
      take,
      include: { faculty: true },
    }),
  ]);

  return { total, studyPrograms };
};

export const getStudyProgramById = async (id) => {
  const studyProgram = await prisma.studyProgram.findFirst({
    where: {
      id,
      deletedAt: null,
    },
    include: { faculty: true },
  });

  if (!studyProgram) {
    const error = new Error("Program studi tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  return studyProgram;
};

export const createStudyProgram = async ({
  name,
  facultyId,
  isActive = true,
}) => {
  const faculty = await prisma.faculty.findFirst({
    where: { id: facultyId, deletedAt: null },
  });

  if (!faculty) {
    const error = new Error("Fakultas tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const trimmedName = name.trim();

  // Cari apakah ada data dengan nama yang sama (termasuk yang soft-deleted)
  const existing = await prisma.studyProgram.findFirst({
    where: {
      name: {
        equals: trimmedName,
        mode: "insensitive",
      },
    },
  });

  if (existing) {
    if (existing.deletedAt === null) {
      const error = new Error("Validation error");
      error.statusCode = 400;
      error.errors = [
        { field: "name", message: "Nama program studi sudah terdaftar" },
      ];
      throw error;
    }

    // Jika sebelumnya soft-deleted, lakukan pemulihan (restore)
    const restored = await prisma.studyProgram.update({
      where: { id: existing.id },
      data: {
        name: trimmedName,
        facultyId,
        deletedAt: null,
        isActive: isActive !== undefined ? isActive : true,
      },
      include: { faculty: true },
    });

    return {
      isRestored: true,
      studyProgram: restored,
    };
  }

  const studyProgram = await prisma.studyProgram.create({
    data: {
      name: trimmedName,
      facultyId,
      isActive: isActive !== undefined ? isActive : true,
    },
    include: { faculty: true },
  });

  return {
    isRestored: false,
    studyProgram,
  };
};

export const updateStudyProgram = async (
  id,
  { name, facultyId, isActive },
) => {
  const existing = await prisma.studyProgram.findFirst({
    where: { id, deletedAt: null },
  });

  if (!existing) {
    const error = new Error("Program studi tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const updateData = {};

  if (facultyId !== undefined) {
    const faculty = await prisma.faculty.findFirst({
      where: { id: facultyId, deletedAt: null },
    });

    if (!faculty) {
      const error = new Error("Fakultas tidak ditemukan");
      error.statusCode = 404;
      throw error;
    }
    updateData.facultyId = facultyId;
  }

  if (name !== undefined) {
    const trimmedName = name.trim();
    const duplicate = await prisma.studyProgram.findFirst({
      where: {
        name: { equals: trimmedName, mode: "insensitive" },
        deletedAt: null,
        NOT: { id },
      },
    });

    if (duplicate) {
      const error = new Error("Validation error");
      error.statusCode = 400;
      error.errors = [
        { field: "name", message: "Nama program studi sudah terdaftar" },
      ];
      throw error;
    }
    updateData.name = trimmedName;
  }

  if (isActive !== undefined) {
    updateData.isActive = isActive;
  }

  return await prisma.studyProgram.update({
    where: { id },
    data: updateData,
    include: { faculty: true },
  });
};

export const deleteStudyProgram = async (id) => {
  const studyProgram = await prisma.studyProgram.findFirst({
    where: { id, deletedAt: null },
  });

  if (!studyProgram) {
    const error = new Error("Program studi tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  return await prisma.studyProgram.update({
    where: { id },
    data: { deletedAt: new Date() },
    include: { faculty: true },
  });
};

export const toggleStudyProgramActive = async (id) => {
  const studyProgram = await prisma.studyProgram.findFirst({
    where: { id, deletedAt: null },
  });

  if (!studyProgram) {
    const error = new Error("Program studi tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const nextStatus = !studyProgram.isActive;

  const updatedStudyProgram = await prisma.studyProgram.update({
    where: { id },
    data: { isActive: nextStatus },
    include: { faculty: true },
  });

  return {
    nextStatus,
    studyProgram: updatedStudyProgram,
  };
};
