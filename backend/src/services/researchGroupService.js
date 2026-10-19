import prisma from "../config/prisma.js";

const includeStudyPrograms = {
  researchGroupStudyPrograms: {
    where: { deletedAt: null },
    include: {
      studyProgram: {
        select: {
          id: true,
          name: true,
          isActive: true,
          facultyId: true,
        },
      },
    },
  },
};

export const getResearchGroups = async ({
  search,
  isActive,
  studyProgramId,
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

  if (studyProgramId) {
    where.researchGroupStudyPrograms = {
      some: {
        studyProgramId: studyProgramId.trim(),
        deletedAt: null,
      },
    };
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

  const [total, researchGroups] = await Promise.all([
    prisma.researchGroup.count({ where }),
    prisma.researchGroup.findMany({
      where,
      orderBy,
      skip,
      take,
      include: includeStudyPrograms,
    }),
  ]);

  return { total, researchGroups };
};

export const getResearchGroupById = async (id) => {
  const researchGroup = await prisma.researchGroup.findFirst({
    where: {
      id,
      deletedAt: null,
    },
    include: includeStudyPrograms,
  });

  if (!researchGroup) {
    const error = new Error("Kelompok keahlian tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  return researchGroup;
};

export const createResearchGroup = async ({
  name,
  isActive = true,
  studyProgramIds,
}) => {
  const trimmedName = name.trim();

  // Cari apakah ada data dengan nama yang sama (termasuk yang soft-deleted)
  const existing = await prisma.researchGroup.findFirst({
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
        { field: "name", message: "Nama kelompok keahlian sudah terdaftar" },
      ];
      throw error;
    }

    // Jika sebelumnya soft-deleted, lakukan pemulihan (restore)
    await prisma.$transaction(async (tx) => {
      await tx.researchGroup.update({
        where: { id: existing.id },
        data: {
          name: trimmedName,
          deletedAt: null,
          isActive: isActive !== undefined ? isActive : true,
        },
      });

      if (Array.isArray(studyProgramIds)) {
        for (const spId of studyProgramIds) {
          const existingMapping = await tx.researchGroupStudyProgram.findFirst({
            where: { researchGroupId: existing.id, studyProgramId: spId },
          });
          if (existingMapping) {
            if (existingMapping.deletedAt !== null) {
              await tx.researchGroupStudyProgram.update({
                where: { id: existingMapping.id },
                data: { deletedAt: null },
              });
            }
          } else {
            await tx.researchGroupStudyProgram.create({
              data: { researchGroupId: existing.id, studyProgramId: spId },
            });
          }
        }
      }
    });

    const restored = await prisma.researchGroup.findUnique({
      where: { id: existing.id },
      include: includeStudyPrograms,
    });

    return {
      isRestored: true,
      researchGroup: restored,
    };
  }

  const researchGroup = await prisma.researchGroup.create({
    data: {
      name: trimmedName,
      isActive: isActive !== undefined ? isActive : true,
      ...(Array.isArray(studyProgramIds) && studyProgramIds.length > 0 && {
        researchGroupStudyPrograms: {
          create: studyProgramIds.map((spId) => ({
            studyProgramId: spId,
          })),
        },
      }),
    },
    include: includeStudyPrograms,
  });

  return {
    isRestored: false,
    researchGroup,
  };
};

export const updateResearchGroup = async (
  id,
  { name, isActive, studyProgramIds },
) => {
  const existing = await prisma.researchGroup.findFirst({
    where: { id, deletedAt: null },
  });

  if (!existing) {
    const error = new Error("Kelompok keahlian tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const updateData = {};
  if (name !== undefined) {
    const trimmedName = name.trim();
    const duplicate = await prisma.researchGroup.findFirst({
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
        { field: "name", message: "Nama kelompok keahlian sudah terdaftar" },
      ];
      throw error;
    }
    updateData.name = trimmedName;
  }

  if (isActive !== undefined) {
    updateData.isActive = isActive;
  }

  await prisma.$transaction(async (tx) => {
    if (Array.isArray(studyProgramIds)) {
      // Soft delete relasi yang dihapus
      await tx.researchGroupStudyProgram.updateMany({
        where: {
          researchGroupId: id,
          deletedAt: null,
          studyProgramId: { notIn: studyProgramIds },
        },
        data: { deletedAt: new Date() },
      });

      // Restore atau buat relasi baru
      for (const spId of studyProgramIds) {
        const existingMapping = await tx.researchGroupStudyProgram.findFirst({
          where: { researchGroupId: id, studyProgramId: spId },
        });

        if (existingMapping) {
          if (existingMapping.deletedAt !== null) {
            await tx.researchGroupStudyProgram.update({
              where: { id: existingMapping.id },
              data: { deletedAt: null },
            });
          }
        } else {
          await tx.researchGroupStudyProgram.create({
            data: {
              researchGroupId: id,
              studyProgramId: spId,
            },
          });
        }
      }
    }

    if (Object.keys(updateData).length > 0) {
      await tx.researchGroup.update({
        where: { id },
        data: updateData,
      });
    }
  });

  return await prisma.researchGroup.findUnique({
    where: { id },
    include: includeStudyPrograms,
  });
};

export const deleteResearchGroup = async (id) => {
  const researchGroup = await prisma.researchGroup.findFirst({
    where: { id, deletedAt: null },
  });

  if (!researchGroup) {
    const error = new Error("Kelompok keahlian tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const [deletedResearchGroup] = await Promise.all([
    prisma.researchGroup.update({
      where: { id },
      data: { deletedAt: new Date() },
    }),
    prisma.researchGroupStudyProgram.updateMany({
      where: { researchGroupId: id, deletedAt: null },
      data: { deletedAt: new Date() },
    }),
  ]);

  return deletedResearchGroup;
};

export const toggleResearchGroupActive = async (id) => {
  const researchGroup = await prisma.researchGroup.findFirst({
    where: { id, deletedAt: null },
  });

  if (!researchGroup) {
    const error = new Error("Kelompok keahlian tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const nextStatus = !researchGroup.isActive;

  const updatedResearchGroup = await prisma.researchGroup.update({
    where: { id },
    data: { isActive: nextStatus },
  });

  return {
    nextStatus,
    researchGroup: updatedResearchGroup,
  };
};
