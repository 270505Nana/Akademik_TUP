import prisma from "../config/prisma.js";
import { checkActivePendingRequest } from "./approvalService.js";

/**
 * Mendapatkan daftar Sub CLO dengan filter, sorting, dan pagination
 */
export const getSubcloProdis = async (
  {
    search,
    cloProdiId,
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
    if (cloProdiId) {
      const clo = await prisma.cloProdi.findUnique({
        where: { id: cloProdiId },
      });
      if (
        !clo ||
        clo.deletedAt ||
        clo.studyProgramId !== access.studyProgramId
      ) {
        const error = new Error(
          "Access denied. Ketua Prodi hanya dapat mengakses data untuk program studinya sendiri."
        );
        error.statusCode = 403;
        throw error;
      }
    }
  } else if (access.isRestrictedKetuaKK) {
    if (access.allowedStudyProgramIds.length === 0) {
      const error = new Error(
        "Access denied. Kelompok Keahlian akun Ketua KK belum terhubung dengan Program Studi manapun."
      );
      error.statusCode = 403;
      throw error;
    }
    if (cloProdiId) {
      const clo = await prisma.cloProdi.findUnique({
        where: { id: cloProdiId },
      });
      if (
        !clo ||
        clo.deletedAt ||
        !access.allowedStudyProgramIds.includes(clo.studyProgramId)
      ) {
        const error = new Error(
          "Access denied. Ketua KK hanya dapat mengakses data untuk program studi yang terhubung dengan kelompok keahliannya."
        );
        error.statusCode = 403;
        throw error;
      }
    }
  }

  const where = { deletedAt: null };

  if (access.isRestrictedKaprodi) {
    if (cloProdiId) {
      where.cloProdiId = cloProdiId;
    } else {
      where.cloProdi = {
        studyProgramId: access.studyProgramId,
        deletedAt: null,
      };
    }
  } else if (access.isRestrictedKetuaKK) {
    if (cloProdiId) {
      where.cloProdiId = cloProdiId;
    } else {
      where.cloProdi = {
        studyProgramId: { in: access.allowedStudyProgramIds },
        deletedAt: null,
      };
    }
  } else if (cloProdiId) {
    where.cloProdiId = cloProdiId;
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

  const [total, subcloList] = await Promise.all([
    prisma.subcloProdi.count({ where }),
    prisma.subcloProdi.findMany({
      where,
      skip,
      take,
      include: {
        cloProdi: true,
      },
      orderBy,
    }),
  ]);

  return { total, subcloList };
};

/**
 * Mendapatkan data Sub CLO berdasarkan ID
 */
export const getSubcloProdiById = async (id, access) => {
  const subclo = await prisma.subcloProdi.findUnique({
    where: { id },
    include: { cloProdi: true },
  });

  if (!subclo || subclo.deletedAt) {
    const error = new Error("Sub clo tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  if (access.isRestrictedKaprodi) {
    if (
      !access.studyProgramId ||
      subclo.cloProdi?.studyProgramId !== access.studyProgramId
    ) {
      const error = new Error(
        "Access denied. Ketua Prodi hanya dapat mengakses data untuk program studinya sendiri."
      );
      error.statusCode = 403;
      throw error;
    }
  } else if (access.isRestrictedKetuaKK) {
    if (
      !access.allowedStudyProgramIds.includes(
        subclo.cloProdi?.studyProgramId
      )
    ) {
      const error = new Error(
        "Access denied. Ketua KK hanya dapat mengakses data untuk program studi yang terhubung dengan kelompok keahliannya."
      );
      error.statusCode = 403;
      throw error;
    }
  }

  return subclo;
};

/**
 * Membuat data Sub CLO baru atau mengajukan approval change request bila Kaprodi
 */
export const createSubcloProdi = async (
  { name, description, cloProdiId },
  access
) => {
  const clo = await prisma.cloProdi.findUnique({
    where: { id: cloProdiId },
  });

  if (!clo || clo.deletedAt) {
    const error = new Error("CLO tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  if (access.isRestrictedKaprodi) {
    if (!access.studyProgramId || clo.studyProgramId !== access.studyProgramId) {
      const error = new Error(
        "Access denied. Ketua Prodi hanya dapat membuat data untuk program studinya sendiri."
      );
      error.statusCode = 403;
      throw error;
    }
  } else if (access.isRestrictedKetuaKK) {
    if (!access.allowedStudyProgramIds.includes(clo.studyProgramId)) {
      const error = new Error(
        "Access denied. Ketua KK hanya dapat membuat data Sub-CLO untuk program studi yang terhubung dengan kelompok keahliannya."
      );
      error.statusCode = 403;
      throw error;
    }
  }

  // Jika pembuat adalah Kaprodi, alihkan ke antrean persetujuan (menunggu approval Ketua KK)
  if (access.isRestrictedKaprodi) {
    const changeRequest = await prisma.approvalChangeRequest.create({
      data: {
        entityType: "SUB_CLO",
        action: "CREATE",
        targetId: null,
        title: `Penambahan Sub-CLO: ${name} (Induk CLO: ${clo.name})`,
        payload: { name, description, cloProdiId },
        oldData: null,
        status: "PENDING",
        studyProgramId: clo.studyProgramId,
        requestedById: access.dosen.id,
      },
    });

    return {
      isApproval: true,
      statusCode: 202,
      message:
        "Permohonan penambahan Sub-CLO berhasil diajukan dan sedang menunggu persetujuan Ketua Kelompok Keahlian",
      data: {
        requestId: changeRequest.id,
        status: changeRequest.status,
        entityType: changeRequest.entityType,
        action: changeRequest.action,
      },
    };
  }

  const subclo = await prisma.subcloProdi.create({
    data: { name, description, cloProdiId },
  });

  return {
    isApproval: false,
    subclo,
  };
};

/**
 * Memperbarui data Sub CLO atau mengajukan approval change request bila Kaprodi
 */
export const updateSubcloProdi = async (id, { name, description }, access) => {
  const existingSubclo = await prisma.subcloProdi.findUnique({
    where: { id },
    include: { cloProdi: true },
  });

  if (!existingSubclo || existingSubclo.deletedAt) {
    const error = new Error("Sub clo tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  if (access.isRestrictedKaprodi) {
    if (
      !access.studyProgramId ||
      existingSubclo.cloProdi?.studyProgramId !== access.studyProgramId
    ) {
      const error = new Error(
        "Access denied. Ketua Prodi hanya dapat mengubah data untuk program studinya sendiri."
      );
      error.statusCode = 403;
      throw error;
    }

    const existingPending = await checkActivePendingRequest({
      entityType: "SUB_CLO",
      targetId: id,
    });

    if (existingPending) {
      if (existingPending.requestedById === access.dosen.id) {
        const payload = {
          name: name !== undefined ? name : existingSubclo.name,
          description:
            description !== undefined ? description : existingSubclo.description,
        };
        const updatedRequest = await prisma.approvalChangeRequest.update({
          where: { id: existingPending.id },
          data: {
            action: "UPDATE",
            title: `Pembaruan Sub-CLO: ${payload.name}`,
            payload,
          },
        });

        return {
          isApproval: true,
          statusCode: 200,
          message:
            "Permohonan pembaruan Sub-CLO berhasil diperbarui dengan data terbaru dan sedang menunggu persetujuan Ketua Kelompok Keahlian",
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
      name: name !== undefined ? name : existingSubclo.name,
      description:
        description !== undefined ? description : existingSubclo.description,
    };

    const changeRequest = await prisma.approvalChangeRequest.create({
      data: {
        entityType: "SUB_CLO",
        action: "UPDATE",
        targetId: id,
        title: `Pembaruan Sub-CLO: ${payload.name}`,
        payload,
        oldData: {
          name: existingSubclo.name,
          description: existingSubclo.description,
        },
        status: "PENDING",
        studyProgramId: existingSubclo.cloProdi.studyProgramId,
        requestedById: access.dosen.id,
      },
    });

    return {
      isApproval: true,
      statusCode: 202,
      message:
        "Permohonan pembaruan Sub-CLO berhasil diajukan dan sedang menunggu persetujuan Ketua Kelompok Keahlian",
      data: {
        requestId: changeRequest.id,
        status: changeRequest.status,
        entityType: changeRequest.entityType,
        action: changeRequest.action,
      },
    };
  } else if (access.isRestrictedKetuaKK) {
    if (
      !access.allowedStudyProgramIds.includes(
        existingSubclo.cloProdi?.studyProgramId
      )
    ) {
      const error = new Error(
        "Access denied. Ketua KK hanya dapat mengubah data untuk program studi yang terhubung dengan kelompok keahliannya."
      );
      error.statusCode = 403;
      throw error;
    }
  }

  const updatedSubclo = await prisma.subcloProdi.update({
    where: { id },
    data: {
      name: name !== undefined ? name : existingSubclo.name,
      description:
        description !== undefined ? description : existingSubclo.description,
    },
  });

  return {
    isApproval: false,
    subclo: updatedSubclo,
  };
};

/**
 * Menghapus data Sub CLO (soft delete) atau mengajukan approval change request bila Kaprodi
 */
export const deleteSubcloProdi = async (id, access) => {
  const existingSubclo = await prisma.subcloProdi.findUnique({
    where: { id },
    include: { cloProdi: true },
  });

  if (!existingSubclo || existingSubclo.deletedAt) {
    const error = new Error("Sub clo tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  if (access.isRestrictedKaprodi) {
    if (
      !access.studyProgramId ||
      existingSubclo.cloProdi?.studyProgramId !== access.studyProgramId
    ) {
      const error = new Error(
        "Access denied. Ketua Prodi hanya dapat menghapus data untuk program studinya sendiri."
      );
      error.statusCode = 403;
      throw error;
    }

    const existingPending = await checkActivePendingRequest({
      entityType: "SUB_CLO",
      targetId: id,
    });

    if (existingPending) {
      if (existingPending.requestedById === access.dosen.id) {
        const updatedRequest = await prisma.approvalChangeRequest.update({
          where: { id: existingPending.id },
          data: {
            action: "DELETE",
            title: `Penghapusan Sub-CLO: ${existingSubclo.name}`,
            payload: {},
          },
        });

        return {
          isApproval: true,
          statusCode: 200,
          message:
            "Permohonan Sub-CLO berhasil diperbarui menjadi permohonan penghapusan dan sedang menunggu persetujuan Ketua Kelompok Keahlian",
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
        entityType: "SUB_CLO",
        action: "DELETE",
        targetId: id,
        title: `Penghapusan Sub-CLO: ${existingSubclo.name}`,
        payload: {},
        oldData: {
          name: existingSubclo.name,
          description: existingSubclo.description,
        },
        status: "PENDING",
        studyProgramId: existingSubclo.cloProdi.studyProgramId,
        requestedById: access.dosen.id,
      },
    });

    return {
      isApproval: true,
      statusCode: 202,
      message:
        "Permohonan penghapusan Sub-CLO berhasil diajukan dan sedang menunggu persetujuan Ketua Kelompok Keahlian",
      data: {
        requestId: changeRequest.id,
        status: changeRequest.status,
        entityType: changeRequest.entityType,
        action: changeRequest.action,
      },
    };
  } else if (access.isRestrictedKetuaKK) {
    if (
      !access.allowedStudyProgramIds.includes(
        existingSubclo.cloProdi?.studyProgramId
      )
    ) {
      const error = new Error(
        "Access denied. Ketua KK hanya dapat menghapus data untuk program studi yang terhubung dengan kelompok keahliannya."
      );
      error.statusCode = 403;
      throw error;
    }
  }

  await prisma.subcloProdi.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return {
    isApproval: false,
  };
};
