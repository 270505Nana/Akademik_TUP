import prisma from "../config/prisma.js";

export const getFaculties = async ({
  search,
  isActive,
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

  const orderDirection = (sortOrder || "asc").toLowerCase() === "desc" ? "desc" : "asc";
  const sortField = (sortBy || "name").trim();

  let orderBy = { name: orderDirection };
  if (sortField === "name") {
    orderBy = { name: orderDirection };
  } else if (sortField === "isActive") {
    orderBy = [{ isActive: orderDirection }, { name: "asc" }];
  } else if (sortField === "createdAt") {
    orderBy = { createdAt: orderDirection };
  }

  const [total, faculties] = await Promise.all([
    prisma.faculty.count({ where }),
    prisma.faculty.findMany({
      where,
      orderBy,
      skip,
      take,
    }),
  ]);

  return { total, faculties };
};

export const getFacultyById = async (id) => {
  const faculty = await prisma.faculty.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!faculty) {
    const error = new Error("Fakultas tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  return faculty;
};

export const createFaculty = async ({ name, isActive = true }) => {
  const trimmedName = name.trim();

  // Cari apakah ada data dengan nama yang sama (termasuk yang soft-deleted)
  const existing = await prisma.faculty.findFirst({
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
        { field: "name", message: "Nama fakultas sudah terdaftar" },
      ];
      throw error;
    }

    // Jika sebelumnya soft-deleted, lakukan pemulihan (restore)
    const restored = await prisma.faculty.update({
      where: { id: existing.id },
      data: {
        name: trimmedName,
        deletedAt: null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return {
      isRestored: true,
      faculty: restored,
    };
  }

  const faculty = await prisma.faculty.create({
    data: {
      name: trimmedName,
      isActive: isActive !== undefined ? isActive : true,
    },
  });

  return {
    isRestored: false,
    faculty,
  };
};

export const updateFaculty = async (id, { name, isActive }) => {
  const existing = await prisma.faculty.findFirst({
    where: { id, deletedAt: null },
  });

  if (!existing) {
    const error = new Error("Fakultas tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const updateData = {};
  if (name !== undefined) {
    const trimmedName = name.trim();
    const duplicate = await prisma.faculty.findFirst({
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
        { field: "name", message: "Nama fakultas sudah terdaftar" },
      ];
      throw error;
    }
    updateData.name = trimmedName;
  }

  if (isActive !== undefined) {
    updateData.isActive = isActive;
  }

  return await prisma.faculty.update({
    where: { id },
    data: updateData,
  });
};

export const deleteFaculty = async (id) => {
  const faculty = await prisma.faculty.findFirst({
    where: { id, deletedAt: null },
  });

  if (!faculty) {
    const error = new Error("Fakultas tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  return await prisma.faculty.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
};

export const toggleFacultyActive = async (id) => {
  const faculty = await prisma.faculty.findFirst({
    where: { id, deletedAt: null },
  });

  if (!faculty) {
    const error = new Error("Fakultas tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const nextStatus = !faculty.isActive;

  const updatedFaculty = await prisma.faculty.update({
    where: { id },
    data: { isActive: nextStatus },
  });

  return {
    nextStatus,
    faculty: updatedFaculty,
  };
};
