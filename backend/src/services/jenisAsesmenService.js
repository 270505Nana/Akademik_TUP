import prisma from "../config/prisma.js";
import { checkActivePendingRequest } from "./approvalService.js";

/**
 * Mendapatkan daftar Jenis Asesmen dengan filter, sorting, dan pagination
 */
export const getJenisAsesmens = async (
  {
    search,
    cloProdiId,
    sortBy = "createdAt",
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
      { content: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  const orderDirection =
    (sortOrder || "asc").toLowerCase() === "desc" ? "desc" : "asc";
  const sortField = (sortBy || "createdAt").trim();

  let orderBy = { createdAt: orderDirection };
  if (sortField === "content") {
    orderBy = { content: orderDirection };
  } else if (sortField === "bobot") {
    orderBy = { bobot: orderDirection };
  } else if (sortField === "createdAt") {
    orderBy = { createdAt: orderDirection };
  }

  const [total, jenisAsesmenList] = await Promise.all([
    prisma.jenisAsesmenClo.count({ where }),
    prisma.jenisAsesmenClo.findMany({
      where,
      skip,
      take,
      include: {
        cloProdi: true,
      },
      orderBy,
    }),
  ]);

  return { total, jenisAsesmenList };
};

/**
 * Mendapatkan data Jenis Asesmen berdasarkan ID
 */
export const getJenisAsesmenById = async (id, access) => {
  const jenisAsesmen = await prisma.jenisAsesmenClo.findUnique({
    where: { id },
    include: { cloProdi: true },
  });

  if (!jenisAsesmen || jenisAsesmen.deletedAt) {
    const error = new Error("Jenis Asesmen tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  if (access.isRestrictedKaprodi) {
    if (
      !access.studyProgramId ||
      jenisAsesmen.cloProdi?.studyProgramId !== access.studyProgramId
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
        jenisAsesmen.cloProdi?.studyProgramId
      )
    ) {
      const error = new Error(
        "Access denied. Ketua KK hanya dapat mengakses data untuk program studi yang terhubung dengan kelompok keahliannya."
      );
      error.statusCode = 403;
      throw error;
    }
  }

  return jenisAsesmen;
};

/**
 * Membuat data Jenis Asesmen baru atau mengajukan approval change request bila Kaprodi
 */
export const createJenisAsesmen = async (
  { content, bobot, cloProdiId },
  access
) => {
  const cloProdi = await prisma.cloProdi.findUnique({
    where: { id: cloProdiId },
  });

  if (!cloProdi || cloProdi.deletedAt) {
    const error = new Error("CLO tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  if (access.isRestrictedKaprodi) {
    if (
      !access.studyProgramId ||
      cloProdi.studyProgramId !== access.studyProgramId
    ) {
      const error = new Error(
        "Access denied. Ketua Prodi hanya dapat membuat data untuk program studinya sendiri."
      );
      error.statusCode = 403;
      throw error;
    }
  } else if (access.isRestrictedKetuaKK) {
    if (!access.allowedStudyProgramIds.includes(cloProdi.studyProgramId)) {
      const error = new Error(
        "Access denied. Ketua KK hanya dapat membuat data Jenis Asesmen untuk program studi yang terhubung dengan kelompok keahliannya."
      );
      error.statusCode = 403;
      throw error;
    }
  }

  const parsedBobot = typeof bobot === "number" ? bobot : parseFloat(bobot);

  // Jika pembuat adalah Kaprodi, alihkan ke antrean persetujuan (menunggu approval Ketua KK)
  if (access.isRestrictedKaprodi) {
    const changeRequest = await prisma.approvalChangeRequest.create({
      data: {
        entityType: "JENIS_ASESMEN",
        action: "CREATE",
        targetId: null,
        title: `Penambahan Jenis Asesmen: ${content} (CLO: ${cloProdi.name})`,
        payload: { content, bobot: parsedBobot, cloProdiId },
        oldData: null,
        status: "PENDING",
        studyProgramId: cloProdi.studyProgramId,
        requestedById: access.dosen.id,
      },
    });

    return {
      isApproval: true,
      statusCode: 202,
      message:
        "Permohonan penambahan Jenis Asesmen berhasil diajukan dan sedang menunggu persetujuan Ketua Kelompok Keahlian",
      data: {
        requestId: changeRequest.id,
        status: changeRequest.status,
        entityType: changeRequest.entityType,
        action: changeRequest.action,
      },
    };
  }

  const jenisAsesmen = await prisma.jenisAsesmenClo.create({
    data: {
      content,
      bobot: parsedBobot,
      cloProdiId,
    },
  });

  return {
    isApproval: false,
    jenisAsesmen,
  };
};

/**
 * Memperbarui data Jenis Asesmen atau mengajukan approval change request bila Kaprodi
 */
export const updateJenisAsesmen = async (
  id,
  { content, bobot },
  access
) => {
  const existingAsesmen = await prisma.jenisAsesmenClo.findUnique({
    where: { id },
    include: { cloProdi: true },
  });

  if (!existingAsesmen || existingAsesmen.deletedAt) {
    const error = new Error("Jenis Asesmen tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  if (access.isRestrictedKaprodi) {
    if (
      !access.studyProgramId ||
      existingAsesmen.cloProdi?.studyProgramId !== access.studyProgramId
    ) {
      const error = new Error(
        "Access denied. Ketua Prodi hanya dapat mengubah data untuk program studinya sendiri."
      );
      error.statusCode = 403;
      throw error;
    }

    const existingPending = await checkActivePendingRequest({
      entityType: "JENIS_ASESMEN",
      targetId: id,
    });

    if (existingPending) {
      if (existingPending.requestedById === access.dosen.id) {
        const payload = {
          content:
            content !== undefined ? content : existingAsesmen.content,
          bobot:
            bobot !== undefined
              ? typeof bobot === "number"
                ? bobot
                : parseFloat(bobot)
              : existingAsesmen.bobot,
        };
        const updatedRequest = await prisma.approvalChangeRequest.update({
          where: { id: existingPending.id },
          data: {
            action: "UPDATE",
            title: `Pembaruan Jenis Asesmen: ${payload.content}`,
            payload,
          },
        });

        return {
          isApproval: true,
          statusCode: 200,
          message:
            "Permohonan pembaruan Jenis Asesmen berhasil diperbarui dengan data terbaru dan sedang menunggu persetujuan Ketua Kelompok Keahlian",
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
      content:
        content !== undefined ? content : existingAsesmen.content,
      bobot:
        bobot !== undefined
          ? typeof bobot === "number"
            ? bobot
            : parseFloat(bobot)
          : existingAsesmen.bobot,
    };

    const changeRequest = await prisma.approvalChangeRequest.create({
      data: {
        entityType: "JENIS_ASESMEN",
        action: "UPDATE",
        targetId: id,
        title: `Pembaruan Jenis Asesmen: ${payload.content}`,
        payload,
        oldData: {
          content: existingAsesmen.content,
          bobot: existingAsesmen.bobot,
        },
        status: "PENDING",
        studyProgramId: existingAsesmen.cloProdi.studyProgramId,
        requestedById: access.dosen.id,
      },
    });

    return {
      isApproval: true,
      statusCode: 202,
      message:
        "Permohonan pembaruan Jenis Asesmen berhasil diajukan dan sedang menunggu persetujuan Ketua Kelompok Keahlian",
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
        existingAsesmen.cloProdi?.studyProgramId
      )
    ) {
      const error = new Error(
        "Access denied. Ketua KK hanya dapat mengubah data untuk program studi yang terhubung dengan kelompok keahliannya."
      );
      error.statusCode = 403;
      throw error;
    }
  }

  const updatedAsesmen = await prisma.jenisAsesmenClo.update({
    where: { id },
    data: {
      content:
        content !== undefined ? content : existingAsesmen.content,
      bobot:
        bobot !== undefined
          ? typeof bobot === "number"
            ? bobot
            : parseFloat(bobot)
          : existingAsesmen.bobot,
    },
  });

  return {
    isApproval: false,
    jenisAsesmen: updatedAsesmen,
  };
};

/**
 * Menghapus data Jenis Asesmen (soft delete) atau mengajukan approval change request bila Kaprodi
 */
export const deleteJenisAsesmen = async (id, access) => {
  const existingAsesmen = await prisma.jenisAsesmenClo.findUnique({
    where: { id },
    include: { cloProdi: true },
  });

  if (!existingAsesmen || existingAsesmen.deletedAt) {
    const error = new Error("Jenis Asesmen tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  if (access.isRestrictedKaprodi) {
    if (
      !access.studyProgramId ||
      existingAsesmen.cloProdi?.studyProgramId !== access.studyProgramId
    ) {
      const error = new Error(
        "Access denied. Ketua Prodi hanya dapat menghapus data untuk program studinya sendiri."
      );
      error.statusCode = 403;
      throw error;
    }

    const existingPending = await checkActivePendingRequest({
      entityType: "JENIS_ASESMEN",
      targetId: id,
    });

    if (existingPending) {
      if (existingPending.requestedById === access.dosen.id) {
        const updatedRequest = await prisma.approvalChangeRequest.update({
          where: { id: existingPending.id },
          data: {
            action: "DELETE",
            title: `Penghapusan Jenis Asesmen: ${existingAsesmen.content}`,
            payload: {},
          },
        });

        return {
          isApproval: true,
          statusCode: 200,
          message:
            "Permohonan Jenis Asesmen berhasil diperbarui menjadi permohonan penghapusan dan sedang menunggu persetujuan Ketua Kelompok Keahlian",
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
        entityType: "JENIS_ASESMEN",
        action: "DELETE",
        targetId: id,
        title: `Penghapusan Jenis Asesmen: ${existingAsesmen.content}`,
        payload: {},
        oldData: {
          content: existingAsesmen.content,
          bobot: existingAsesmen.bobot,
        },
        status: "PENDING",
        studyProgramId: existingAsesmen.cloProdi.studyProgramId,
        requestedById: access.dosen.id,
      },
    });

    return {
      isApproval: true,
      statusCode: 202,
      message:
        "Permohonan penghapusan Jenis Asesmen berhasil diajukan dan sedang menunggu persetujuan Ketua Kelompok Keahlian",
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
        existingAsesmen.cloProdi?.studyProgramId
      )
    ) {
      const error = new Error(
        "Access denied. Ketua KK hanya dapat menghapus data untuk program studi yang terhubung dengan kelompok keahliannya."
      );
      error.statusCode = 403;
      throw error;
    }
  }

  await prisma.jenisAsesmenClo.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return {
    isApproval: false,
  };
};
