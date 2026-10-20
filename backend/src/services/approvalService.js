import prisma from "../config/prisma.js";

/**
 * Menerapkan perubahan yang telah disetujui (APPROVED) ke tabel utama secara atomik/terpusat.
 * Mendukung entitas CLO, SUB_CLO, JENIS_ASESMEN, dan mudah diekspansi untuk entitas baru.
 */
export const applyChangeRequest = async (changeRequest) => {
  const { entityType, action, targetId, payload } = changeRequest;

  if (entityType === "CLO") {
    if (action === "CREATE") {
      return await prisma.cloProdi.create({
        data: payload,
      });
    }
    if (action === "UPDATE") {
      return await prisma.cloProdi.update({
        where: { id: targetId },
        data: payload,
      });
    }
    if (action === "DELETE") {
      return await prisma.cloProdi.update({
        where: { id: targetId },
        data: { deletedAt: new Date() },
      });
    }
  }

  if (entityType === "SUB_CLO") {
    if (action === "CREATE") {
      return await prisma.subcloProdi.create({
        data: payload,
      });
    }
    if (action === "UPDATE") {
      return await prisma.subcloProdi.update({
        where: { id: targetId },
        data: payload,
      });
    }
    if (action === "DELETE") {
      return await prisma.subcloProdi.update({
        where: { id: targetId },
        data: { deletedAt: new Date() },
      });
    }
  }

  if (entityType === "JENIS_ASESMEN") {
    if (action === "CREATE") {
      return await prisma.jenisAsesmenClo.create({
        data: payload,
      });
    }
    if (action === "UPDATE") {
      return await prisma.jenisAsesmenClo.update({
        where: { id: targetId },
        data: payload,
      });
    }
    if (action === "DELETE") {
      return await prisma.jenisAsesmenClo.update({
        where: { id: targetId },
        data: { deletedAt: new Date() },
      });
    }
  }

  throw new Error(
    `EntityType '${entityType}' tidak didukung untuk penerapan persetujuan.`
  );
};

/**
 * Cek apakah ada permohonan pending yang aktif untuk target record yang sama.
 */
export const checkActivePendingRequest = async ({ entityType, targetId }) => {
  if (!targetId) return null;
  return await prisma.approvalChangeRequest.findFirst({
    where: {
      entityType,
      targetId,
      status: "PENDING",
      deletedAt: null,
    },
    include: {
      requestedBy: {
        select: { id: true, name: true },
      },
    },
  });
};

/**
 * Mendapatkan daftar Approval Requests dengan scoping role, filter, sort, dan pagination
 */
export const getApprovalRequests = async (
  {
    search,
    status,
    entityType,
    studyProgramId,
    sortBy = "createdAt",
    sortOrder = "desc",
    skip,
    take,
  },
  access
) => {
  const where = { deletedAt: null };

  // 1. Scoping Berdasarkan Role User
  if (access.isFullAccess) {
    // Admin: Memiliki akses melihat semua usulan
    if (studyProgramId) {
      where.studyProgramId = studyProgramId.trim();
    }
  } else if (access.isRestrictedKetuaKK) {
    // Ketua KK: Hanya melihat usulan dari prodi yang terhubung dengan kelompok keahliannya
    if (access.allowedStudyProgramIds.length === 0) {
      const error = new Error(
        "Access denied. Akun Ketua KK belum terhubung dengan Program Studi manapun."
      );
      error.statusCode = 403;
      throw error;
    }

    if (studyProgramId) {
      const trimmedSpId = studyProgramId.trim();
      if (!access.allowedStudyProgramIds.includes(trimmedSpId)) {
        const error = new Error(
          "Access denied. Program Studi di luar kewenangan Kelompok Keahlian Anda."
        );
        error.statusCode = 403;
        throw error;
      }
      where.studyProgramId = trimmedSpId;
    } else {
      where.studyProgramId = { in: access.allowedStudyProgramIds };
    }
  } else if (access.isRestrictedKaprodi) {
    // Kaprodi: Hanya melihat usulan yang diajukan oleh dirinya sendiri / prodinya
    if (!access.dosen) {
      const error = new Error(
        "Access denied. Profil Dosen Ketua Prodi tidak ditemukan."
      );
      error.statusCode = 403;
      throw error;
    }
    where.requestedById = access.dosen.id;

    if (
      studyProgramId &&
      access.studyProgramId &&
      studyProgramId !== access.studyProgramId
    ) {
      const error = new Error(
        "Access denied. Ketua Prodi hanya dapat mengakses data untuk program studinya sendiri."
      );
      error.statusCode = 403;
      throw error;
    }
  } else {
    // Role lain (dosen biasa / mahasiswa) tidak memiliki akses antrean persetujuan
    const error = new Error(
      "Access denied. Anda tidak memiliki akses ke antrean persetujuan."
    );
    error.statusCode = 403;
    throw error;
  }

  // 2. Filter status
  if (status) {
    where.status = status.toUpperCase().trim();
  }

  // 3. Filter entityType (CLO, SUB_CLO, JENIS_ASESMEN)
  if (entityType) {
    where.entityType = entityType.toUpperCase().trim();
  }

  // 4. Global Search
  if (search) {
    const trimmedSearch = search.trim();
    where.OR = [
      { title: { contains: trimmedSearch, mode: "insensitive" } },
      { rejectionNote: { contains: trimmedSearch, mode: "insensitive" } },
    ];
  }

  // 5. Sorting
  const allowedSortFields = [
    "createdAt",
    "updatedAt",
    "title",
    "status",
    "entityType",
    "action",
  ];
  const targetSortBy = allowedSortFields.includes(sortBy)
    ? sortBy
    : "createdAt";
  const targetSortOrder =
    (sortOrder || "desc").toLowerCase() === "asc" ? "asc" : "desc";
  const orderBy = { [targetSortBy]: targetSortOrder };

  const [total, requests] = await Promise.all([
    prisma.approvalChangeRequest.count({ where }),
    prisma.approvalChangeRequest.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        studyProgram: {
          select: { id: true, name: true, isActive: true },
        },
        requestedBy: {
          select: { id: true, name: true, nip: true, kodeDosen: true },
        },
        approvedBy: {
          select: { id: true, name: true, nip: true, kodeDosen: true },
        },
      },
    }),
  ]);

  return { total, requests };
};

/**
 * Mendapatkan detail Approval Request berdasarkan ID
 */
export const getApprovalRequestById = async (id, access) => {
  const changeRequest = await prisma.approvalChangeRequest.findFirst({
    where: { id, deletedAt: null },
    include: {
      studyProgram: {
        select: { id: true, name: true, isActive: true },
      },
      requestedBy: {
        select: { id: true, name: true, nip: true, kodeDosen: true },
      },
      approvedBy: {
        select: { id: true, name: true, nip: true, kodeDosen: true },
      },
    },
  });

  if (!changeRequest) {
    const error = new Error("Permohonan persetujuan tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  // Verifikasi Hak Akses Membaca
  if (!access.isFullAccess) {
    if (access.isRestrictedKetuaKK) {
      if (
        !access.allowedStudyProgramIds.includes(changeRequest.studyProgramId)
      ) {
        const error = new Error(
          "Access denied. Usulan ini berada di luar Program Studi binaan Kelompok Keahlian Anda."
        );
        error.statusCode = 403;
        throw error;
      }
    } else if (access.isRestrictedKaprodi) {
      if (changeRequest.requestedById !== access.dosen?.id) {
        const error = new Error(
          "Access denied. Anda hanya dapat melihat permohonan yang Anda ajukan sendiri."
        );
        error.statusCode = 403;
        throw error;
      }
    } else {
      const error = new Error(
        "Access denied. Anda tidak memiliki izin untuk melihat data ini."
      );
      error.statusCode = 403;
      throw error;
    }
  }

  return changeRequest;
};

/**
 * Menyetujui usulan perubahan (Approve)
 */
export const approveApprovalRequest = async (id, access) => {
  const changeRequest = await prisma.approvalChangeRequest.findFirst({
    where: { id, deletedAt: null },
  });

  if (!changeRequest) {
    const error = new Error("Permohonan persetujuan tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  if (changeRequest.status !== "PENDING") {
    const error = new Error(
      `Permohonan tidak dapat disetujui karena statusnya sudah '${changeRequest.status}'`
    );
    error.statusCode = 400;
    throw error;
  }

  // Hanya Admin atau Ketua KK yang boleh menyetujui
  if (!access.isFullAccess && !access.isRestrictedKetuaKK) {
    const error = new Error(
      "Access denied. Hanya Ketua Kelompok Keahlian atau Admin yang berhak menyetujui usulan ini."
    );
    error.statusCode = 403;
    throw error;
  }

  if (access.isRestrictedKetuaKK && !access.isFullAccess) {
    if (!access.allowedStudyProgramIds.includes(changeRequest.studyProgramId)) {
      const error = new Error(
        "Access denied. Program Studi usulan ini di luar kewenangan Kelompok Keahlian Anda."
      );
      error.statusCode = 403;
      throw error;
    }
  }

  // 1. Eksekusi perubahan ke tabel utama
  await applyChangeRequest(changeRequest);

  // 2. Tandai request sebagai APPROVED
  const updatedRequest = await prisma.approvalChangeRequest.update({
    where: { id },
    data: {
      status: "APPROVED",
      approvedById: access.dosen?.id || null,
    },
    include: {
      studyProgram: true,
      requestedBy: { select: { id: true, name: true, nip: true } },
      approvedBy: { select: { id: true, name: true, nip: true } },
    },
  });

  return updatedRequest;
};

/**
 * Menolak usulan perubahan (Reject)
 */
export const rejectApprovalRequest = async (id, rejectionNote, access) => {
  const changeRequest = await prisma.approvalChangeRequest.findFirst({
    where: { id, deletedAt: null },
  });

  if (!changeRequest) {
    const error = new Error("Permohonan persetujuan tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  if (changeRequest.status !== "PENDING") {
    const error = new Error(
      `Permohonan tidak dapat ditolak karena statusnya sudah '${changeRequest.status}'`
    );
    error.statusCode = 400;
    throw error;
  }

  // Hanya Admin atau Ketua KK yang boleh menolak
  if (!access.isFullAccess && !access.isRestrictedKetuaKK) {
    const error = new Error(
      "Access denied. Hanya Ketua Kelompok Keahlian atau Admin yang berhak menolak usulan ini."
    );
    error.statusCode = 403;
    throw error;
  }

  if (access.isRestrictedKetuaKK && !access.isFullAccess) {
    if (!access.allowedStudyProgramIds.includes(changeRequest.studyProgramId)) {
      const error = new Error(
        "Access denied. Program Studi usulan ini di luar kewenangan Kelompok Keahlian Anda."
      );
      error.statusCode = 403;
      throw error;
    }
  }

  const updatedRequest = await prisma.approvalChangeRequest.update({
    where: { id },
    data: {
      status: "REJECTED",
      rejectionNote: String(rejectionNote).trim(),
      approvedById: access.dosen?.id || null,
    },
    include: {
      studyProgram: true,
      requestedBy: { select: { id: true, name: true, nip: true } },
      approvedBy: { select: { id: true, name: true, nip: true } },
    },
  });

  return updatedRequest;
};

/**
 * Membatalkan usulan perubahan (Cancel oleh Pengusul)
 */
export const cancelApprovalRequest = async (id, access) => {
  const changeRequest = await prisma.approvalChangeRequest.findFirst({
    where: { id, deletedAt: null },
  });

  if (!changeRequest) {
    const error = new Error("Permohonan persetujuan tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  if (changeRequest.status !== "PENDING") {
    const error = new Error(
      `Permohonan tidak dapat dibatalkan karena statusnya sudah '${changeRequest.status}'`
    );
    error.statusCode = 400;
    throw error;
  }

  // Hanya pengusul asli (Kaprodi) atau Admin yang boleh membatalkan
  const isRequester =
    access.dosen && changeRequest.requestedById === access.dosen.id;
  if (!access.isFullAccess && !isRequester) {
    const error = new Error(
      "Access denied. Anda hanya dapat membatalkan permohonan yang Anda ajukan sendiri."
    );
    error.statusCode = 403;
    throw error;
  }

  const updatedRequest = await prisma.approvalChangeRequest.update({
    where: { id },
    data: {
      status: "CANCELLED",
    },
    include: {
      studyProgram: true,
      requestedBy: { select: { id: true, name: true, nip: true } },
    },
  });

  return updatedRequest;
};
