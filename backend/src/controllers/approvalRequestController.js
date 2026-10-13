import asyncHandler from "express-async-handler";
import prisma from "../config/prisma.js";
import { getPaginationParams, formatPaginationResponse } from "../utils/paginationHelper.js";
import { sendValidationError, isNil } from "../utils/validationHelper.js";
import { getAcademicAccessContext } from "../middlewares/authorize.js";
import { applyChangeRequest } from "../services/approvalService.js";

// Daftar Semua Permohonan Persetujuan (dengan filter, sort, search, dan pagination)
const listApprovalRequests = asyncHandler(async (req, res) => {
  const paginationParams = getPaginationParams(req.query);
  const { search, status, entityType, studyProgramId, sortBy, sortOrder } = req.query;

  const access = await getAcademicAccessContext(req);
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
      return res.status(403).json({
        message: "Access denied. Akun Ketua KK belum terhubung dengan Program Studi manapun.",
      });
    }

    if (studyProgramId) {
      const trimmedSpId = studyProgramId.trim();
      if (!access.allowedStudyProgramIds.includes(trimmedSpId)) {
        return res.status(403).json({
          message: "Access denied. Program Studi di luar kewenangan Kelompok Keahlian Anda.",
        });
      }
      where.studyProgramId = trimmedSpId;
    } else {
      where.studyProgramId = { in: access.allowedStudyProgramIds };
    }
  } else if (access.isRestrictedKaprodi) {
    // Kaprodi: Hanya melihat usulan yang diajukan oleh dirinya sendiri / prodinya
    if (!access.dosen) {
      return res.status(403).json({
        message: "Access denied. Profil Dosen Ketua Prodi tidak ditemukan.",
      });
    }
    where.requestedById = access.dosen.id;

    if (studyProgramId && access.studyProgramId && studyProgramId !== access.studyProgramId) {
      return res.status(403).json({
        message: "Access denied. Ketua Prodi hanya dapat mengakses data untuk program studinya sendiri.",
      });
    }
  } else {
    // Role lain (dosen biasa / mahasiswa) tidak memiliki akses antrean persetujuan
    return res.status(403).json({
      message: "Access denied. Anda tidak memiliki akses ke antrean persetujuan.",
    });
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
  const allowedSortFields = ["createdAt", "updatedAt", "title", "status", "entityType", "action"];
  const targetSortBy = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
  const targetSortOrder = (sortOrder || "desc").toLowerCase() === "asc" ? "asc" : "desc";
  const orderBy = { [targetSortBy]: targetSortOrder };

  const [total, requests] = await Promise.all([
    prisma.approvalChangeRequest.count({ where }),
    prisma.approvalChangeRequest.findMany({
      where,
      orderBy,
      skip: paginationParams.skip,
      take: paginationParams.take,
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

  res.json(formatPaginationResponse(requests, total, paginationParams));
});

// Ambil Detail Permohonan Persetujuan By ID
const findApprovalRequestById = asyncHandler(async (req, res) => {
  const { id } = req.params;

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
    res.status(404);
    throw new Error("Permohonan persetujuan tidak ditemukan");
  }

  const access = await getAcademicAccessContext(req);

  // Verifikasi Hak Akses Membaca
  if (!access.isFullAccess) {
    if (access.isRestrictedKetuaKK) {
      if (!access.allowedStudyProgramIds.includes(changeRequest.studyProgramId)) {
        return res.status(403).json({
          message: "Access denied. Usulan ini berada di luar Program Studi binaan Kelompok Keahlian Anda.",
        });
      }
    } else if (access.isRestrictedKaprodi) {
      if (changeRequest.requestedById !== access.dosen?.id) {
        return res.status(403).json({
          message: "Access denied. Anda hanya dapat melihat permohonan yang Anda ajukan sendiri.",
        });
      }
    } else {
      return res.status(403).json({
        message: "Access denied. Anda tidak memiliki izin untuk melihat data ini.",
      });
    }
  }

  res.json({ data: changeRequest });
});

// Setujui Usulan Perubahan (Approve)
const approveApprovalRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const changeRequest = await prisma.approvalChangeRequest.findFirst({
    where: { id, deletedAt: null },
  });

  if (!changeRequest) {
    res.status(404);
    throw new Error("Permohonan persetujuan tidak ditemukan");
  }

  if (changeRequest.status !== "PENDING") {
    res.status(400);
    throw new Error(`Permohonan tidak dapat disetujui karena statusnya sudah '${changeRequest.status}'`);
  }

  const access = await getAcademicAccessContext(req);

  // Hanya Admin atau Ketua KK yang boleh menyetujui
  if (!access.isFullAccess && !access.isRestrictedKetuaKK) {
    return res.status(403).json({
      message: "Access denied. Hanya Ketua Kelompok Keahlian atau Admin yang berhak menyetujui usulan ini.",
    });
  }

  if (access.isRestrictedKetuaKK && !access.isFullAccess) {
    if (!access.allowedStudyProgramIds.includes(changeRequest.studyProgramId)) {
      return res.status(403).json({
        message: "Access denied. Program Studi usulan ini di luar kewenangan Kelompok Keahlian Anda.",
      });
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

  res.json({
    message: "Permohonan perubahan berhasil disetujui dan diterapkan ke data aktif",
    data: updatedRequest,
  });
});

// Tolak Usulan Perubahan (Reject)
const rejectApprovalRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rejectionNote } = req.body;

  const errors = [];
  if (isNil(rejectionNote) || String(rejectionNote).trim().length === 0) {
    errors.push({ field: "rejectionNote", message: "Alasan penolakan wajib diisi" });
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors, req);
  }

  const changeRequest = await prisma.approvalChangeRequest.findFirst({
    where: { id, deletedAt: null },
  });

  if (!changeRequest) {
    res.status(404);
    throw new Error("Permohonan persetujuan tidak ditemukan");
  }

  if (changeRequest.status !== "PENDING") {
    res.status(400);
    throw new Error(`Permohonan tidak dapat ditolak karena statusnya sudah '${changeRequest.status}'`);
  }

  const access = await getAcademicAccessContext(req);

  // Hanya Admin atau Ketua KK yang boleh menolak
  if (!access.isFullAccess && !access.isRestrictedKetuaKK) {
    return res.status(403).json({
      message: "Access denied. Hanya Ketua Kelompok Keahlian atau Admin yang berhak menolak usulan ini.",
    });
  }

  if (access.isRestrictedKetuaKK && !access.isFullAccess) {
    if (!access.allowedStudyProgramIds.includes(changeRequest.studyProgramId)) {
      return res.status(403).json({
        message: "Access denied. Program Studi usulan ini di luar kewenangan Kelompok Keahlian Anda.",
      });
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

  res.json({
    message: "Permohonan perubahan berhasil ditolak",
    data: updatedRequest,
  });
});

// Batalkan Usulan Perubahan (Cancel oleh Pengusul)
const cancelApprovalRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const changeRequest = await prisma.approvalChangeRequest.findFirst({
    where: { id, deletedAt: null },
  });

  if (!changeRequest) {
    res.status(404);
    throw new Error("Permohonan persetujuan tidak ditemukan");
  }

  if (changeRequest.status !== "PENDING") {
    res.status(400);
    throw new Error(`Permohonan tidak dapat dibatalkan karena statusnya sudah '${changeRequest.status}'`);
  }

  const access = await getAcademicAccessContext(req);

  // Hanya pengusul asli (Kaprodi) atau Admin yang boleh membatalkan
  const isRequester = access.dosen && changeRequest.requestedById === access.dosen.id;
  if (!access.isFullAccess && !isRequester) {
    return res.status(403).json({
      message: "Access denied. Anda hanya dapat membatalkan permohonan yang Anda ajukan sendiri.",
    });
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

  res.json({
    message: "Permohonan perubahan berhasil dibatalkan",
    data: updatedRequest,
  });
});

export {
  listApprovalRequests,
  findApprovalRequestById,
  approveApprovalRequest,
  rejectApprovalRequest,
  cancelApprovalRequest,
};
