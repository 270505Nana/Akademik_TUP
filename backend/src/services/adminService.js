import prisma from "../config/prisma.js";

export const getAdminPaginated = async ({ skip, take }) => {
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

export const upsertAdmin = async ({ userId, name }) => {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
  });

  if (!user) {
    const error = new Error("Pengguna tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }
  if (user.role !== "ADMIN") {
    const error = new Error("Pengguna bukan admin");
    error.statusCode = 400;
    throw error;
  }

  return prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: { name },
    });

    const admin = await tx.admin.upsert({
      where: { userId },
      update: {},
      create: { userId },
      include: { user: true },
    });

    return { ...admin, user: updatedUser };
  });
};
