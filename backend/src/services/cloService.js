import prisma from "../config/prisma.js";
import { checkActivePendingRequest } from "./approvalService.js";

/**
 * Mendapatkan daftar CLO dengan filter, sorting, dan pagination
 */
export const getCloProdis = async (
  {
    search,
    studyProgramId,
    sortBy = "name",
    sortOrder = "asc",
    skip,
    take,
  },
  access
) => {
  if (access.isRestrictedKaprodi) {
    if (!access.studyProgramId) {
      const error = new Error(
        "Access denied. Akun Ketua Prodi belum terasosiasi dengan Program Studi manapun."
      );
      error.statusCode = 403;
      throw error;
    }
    if (studyProgramId && studyProgramId !== access.studyProgramId) {
      const error = new Error(
        "Access denied. Ketua Prodi hanya dapat mengakses data untuk program studinya sendiri."
      );
      error.statusCode = 403;
      throw error;
    }
  } else if (access.isRestrictedKetuaKK) {
    if (access.allowedStudyProgramIds.length === 0) {
      const error = new Error(
        "Access denied. Kelompok Keahlian akun Ketua KK belum terhubung dengan Program Studi manapun."
      );
      error.statusCode = 403;
      throw error;
    }
    if (
      studyProgramId &&
      !access.allowedStudyProgramIds.includes(studyProgramId)
    ) {
      const error = new Error(
        "Access denied. Ketua KK hanya dapat mengakses data untuk program studi yang terhubung dengan kelompok keahliannya."
      );
      error.statusCode = 403;
      throw error;
    }
  }

  const where = { deletedAt: null };

  if (access.isRestrictedKaprodi) {
    where.studyProgramId = access.studyProgramId;
  } else if (access.isRestrictedKetuaKK) {
    if (studyProgramId) {
      where.studyProgramId = studyProgramId;
    } else {
      where.studyProgramId = { in: access.allowedStudyProgramIds };
    }
  } else if (studyProgramId) {
    where.studyProgramId = studyProgramId;
  }

  const searchTerm = (search || "").trim();
  if (searchTerm) {
    where.OR = [
      { name: { contains: searchTerm, mode: "insensitive" } },
      { description: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  const orderDirection =
    (sortOrder || "asc").toLowerCase() === "desc" ? "desc" : "asc";
  const sortField = (sortBy || "name").trim();

  let orderBy = { name: orderDirection };
  if (sortField === "createdAt") {
    orderBy = { createdAt: orderDirection };
  } else if (sortField === "name") {
    orderBy = { name: orderDirection };
  }

  const [total, cloList] = await Promise.all([
    prisma.cloProdi.count({ where }),
    prisma.cloProdi.findMany({
      where,
      skip,
      take,
      include: {
        studyProgram: true,
        subcloProdi: {
          where: { deletedAt: null },
        },
      },
      orderBy,
    }),
  ]);

  return { total, cloList };
};

/**
 * Mendapatkan data CLO berdasarkan ID
 */
export const getCloProdiById = async (id, access) => {
  const clo = await prisma.cloProdi.findUnique({
    where: { id },
    include: {
      studyProgram: true,
      subcloProdi: {
        where: { deletedAt: null },
      },
    },
  });

  if (!clo || clo.deletedAt) {
    const error = new Error("CLO tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  if (access.isRestrictedKaprodi) {
    if (!access.studyProgramId || clo.studyProgramId !== access.studyProgramId) {
      const error = new Error(
        "Access denied. Ketua Prodi hanya dapat mengakses data untuk program studinya sendiri."
      );
      error.statusCode = 403;
      throw error;
    }
  } else if (access.isRestrictedKetuaKK) {
    if (!access.allowedStudyProgramIds.includes(clo.studyProgramId)) {
      const error = new Error(
        "Access denied. Ketua KK hanya dapat mengakses data untuk program studi yang terhubung dengan kelompok keahliannya."
      );
      error.statusCode = 403;
      throw error;
    }
  }

  return clo;
};

/**
 * Membuat data CLO baru atau mengajukan approval change request bila Kaprodi
 */
export const createCloProdi = async (
  { name, description, studyProgramId },
  access
) => {
  if (access.isRestrictedKaprodi) {
    if (!access.studyProgramId || studyProgramId !== access.studyProgramId) {
      const error = new Error(
        "Access denied. Ketua Prodi hanya dapat membuat data untuk program studinya sendiri."
      );
      error.statusCode = 403;
      throw error;
    }
  } else if (access.isRestrictedKetuaKK) {
    if (!access.allowedStudyProgramIds.includes(studyProgramId)) {
      const error = new Error(
        "Access denied. Ketua KK hanya dapat membuat data CLO untuk program studi yang terhubung dengan kelompok keahliannya."
      );
      error.statusCode = 403;
      throw error;
    }
  }

  const studyProgram = await prisma.studyProgram.findUnique({
    where: { id: studyProgramId },
  });
  if (!studyProgram || studyProgram.deletedAt) {
    const error = new Error("Program Studi tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  // Jika pembuat adalah Kaprodi, alihkan ke antrean persetujuan (menunggu approval Ketua KK)
  if (access.isRestrictedKaprodi) {
    const changeRequest = await prisma.approvalChangeRequest.create({
      data: {
        entityType: "CLO",
        action: "CREATE",
        targetId: null,
        title: `Penambahan CLO: ${name}`,
        payload: { name, description, studyProgramId },
        oldData: null,
        status: "PENDING",
        studyProgramId,
        requestedById: access.dosen.id,
      },
    });

    return {
      isApproval: true,
      statusCode: 202,
      message:
        "Permohonan penambahan CLO berhasil diajukan dan sedang menunggu persetujuan Ketua Kelompok Keahlian",
      data: {
        requestId: changeRequest.id,
        status: changeRequest.status,
        entityType: changeRequest.entityType,
        action: changeRequest.action,
      },
    };
  }

  const clo = await prisma.cloProdi.create({
    data: { name, description, studyProgramId },
  });

  return {
    isApproval: false,
    clo,
  };
};

/**
 * Memperbarui data CLO atau mengajukan approval change request bila Kaprodi
 */
export const updateCloProdi = async (id, { name, description }, access) => {
  const existingClo = await prisma.cloProdi.findUnique({ where: { id } });
  if (!existingClo || existingClo.deletedAt) {
    const error = new Error("CLO tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  if (access.isRestrictedKaprodi) {
    if (
      !access.studyProgramId ||
      existingClo.studyProgramId !== access.studyProgramId
    ) {
      const error = new Error(
        "Access denied. Ketua Prodi hanya dapat mengubah data untuk program studinya sendiri."
      );
      error.statusCode = 403;
      throw error;
    }

    const existingPending = await checkActivePendingRequest({
      entityType: "CLO",
      targetId: id,
    });

    if (existingPending) {
      if (existingPending.requestedById === access.dosen.id) {
        const payload = {
          name: name !== undefined ? name : existingClo.name,
          description:
            description !== undefined ? description : existingClo.description,
        };
        const updatedRequest = await prisma.approvalChangeRequest.update({
          where: { id: existingPending.id },
          data: {
            action: "UPDATE",
            title: `Pembaruan CLO: ${payload.name}`,
            payload,
          },
        });

        return {
          isApproval: true,
          statusCode: 200,
          message:
            "Permohonan pembaruan CLO berhasil diperbarui dengan data terbaru dan sedang menunggu persetujuan Ketua Kelompok Keahlian",
          data: {
            requestId: updatedRequest.id,
            status: updatedRequest.status,
            entityType: updatedRequest.entityType,
            action: updatedRequest.action,
          },
        };
      } else {
        return {
          isConflict: true,
          statusCode: 409,
          message: `Data ini sedang dalam proses permohonan persetujuan oleh ${
            existingPending.requestedBy?.name || "pengguna lain"
          }. Perubahan tidak dapat diajukan sampai usulan sebelumnya selesai.`,
          data: { requestId: existingPending.id },
        };
      }
    }

    const payload = {
      name: name !== undefined ? name : existingClo.name,
      description:
        description !== undefined ? description : existingClo.description,
    };

    const changeRequest = await prisma.approvalChangeRequest.create({
      data: {
        entityType: "CLO",
        action: "UPDATE",
        targetId: id,
        title: `Pembaruan CLO: ${payload.name}`,
        payload,
        oldData: {
          name: existingClo.name,
          description: existingClo.description,
        },
        status: "PENDING",
        studyProgramId: existingClo.studyProgramId,
        requestedById: access.dosen.id,
      },
    });

    return {
      isApproval: true,
      statusCode: 202,
      message:
        "Permohonan pembaruan CLO berhasil diajukan dan sedang menunggu persetujuan Ketua Kelompok Keahlian",
      data: {
        requestId: changeRequest.id,
        status: changeRequest.status,
        entityType: changeRequest.entityType,
        action: changeRequest.action,
      },
    };
  } else if (access.isRestrictedKetuaKK) {
    if (!access.allowedStudyProgramIds.includes(existingClo.studyProgramId)) {
      const error = new Error(
        "Access denied. Ketua KK hanya dapat mengubah data untuk program studi yang terhubung dengan kelompok keahliannya."
      );
      error.statusCode = 403;
      throw error;
    }
  }

  const updatedClo = await prisma.cloProdi.update({
    where: { id },
    data: {
      name: name !== undefined ? name : existingClo.name,
      description:
        description !== undefined ? description : existingClo.description,
    },
  });

  return {
    isApproval: false,
    clo: updatedClo,
  };
};

/**
 * Menghapus data CLO (soft delete) atau mengajukan approval change request bila Kaprodi
 */
export const deleteCloProdi = async (id, access) => {
  const existingClo = await prisma.cloProdi.findUnique({ where: { id } });
  if (!existingClo || existingClo.deletedAt) {
    const error = new Error("CLO tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  if (access.isRestrictedKaprodi) {
    if (
      !access.studyProgramId ||
      existingClo.studyProgramId !== access.studyProgramId
    ) {
      const error = new Error(
        "Access denied. Ketua Prodi hanya dapat menghapus data untuk program studinya sendiri."
      );
      error.statusCode = 403;
      throw error;
    }

    const existingPending = await checkActivePendingRequest({
      entityType: "CLO",
      targetId: id,
    });

    if (existingPending) {
      if (existingPending.requestedById === access.dosen.id) {
        const updatedRequest = await prisma.approvalChangeRequest.update({
          where: { id: existingPending.id },
          data: {
            action: "DELETE",
            title: `Penghapusan CLO: ${existingClo.name}`,
            payload: {},
          },
        });

        return {
          isApproval: true,
          statusCode: 200,
          message:
            "Permohonan CLO berhasil diperbarui menjadi permohonan penghapusan dan sedang menunggu persetujuan Ketua Kelompok Keahlian",
          data: {
            requestId: updatedRequest.id,
            status: updatedRequest.status,
            entityType: updatedRequest.entityType,
            action: updatedRequest.action,
          },
        };
      } else {
        return {
          isConflict: true,
          statusCode: 409,
          message: `Data ini sedang dalam proses permohonan persetujuan oleh ${
            existingPending.requestedBy?.name || "pengguna lain"
          }. Perubahan tidak dapat diajukan sampai usulan sebelumnya selesai.`,
          data: { requestId: existingPending.id },
        };
      }
    }

    const changeRequest = await prisma.approvalChangeRequest.create({
      data: {
        entityType: "CLO",
        action: "DELETE",
        targetId: id,
        title: `Penghapusan CLO: ${existingClo.name}`,
        payload: {},
        oldData: {
          name: existingClo.name,
          description: existingClo.description,
        },
        status: "PENDING",
        studyProgramId: existingClo.studyProgramId,
        requestedById: access.dosen.id,
      },
    });

    return {
      isApproval: true,
      statusCode: 202,
      message:
        "Permohonan penghapusan CLO berhasil diajukan dan sedang menunggu persetujuan Ketua Kelompok Keahlian",
      data: {
        requestId: changeRequest.id,
        status: changeRequest.status,
        entityType: changeRequest.entityType,
        action: changeRequest.action,
      },
    };
  } else if (access.isRestrictedKetuaKK) {
    if (!access.allowedStudyProgramIds.includes(existingClo.studyProgramId)) {
      const error = new Error(
        "Access denied. Ketua KK hanya dapat menghapus data untuk program studi yang terhubung dengan kelompok keahliannya."
      );
      error.statusCode = 403;
      throw error;
    }
  }

  await prisma.cloProdi.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return {
    isApproval: false,
  };
};
