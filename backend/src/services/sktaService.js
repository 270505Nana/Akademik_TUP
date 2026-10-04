import path from "path";
import { v4 as uuidv4 } from "uuid";
import prisma from "../config/prisma.js";
import { uploadFile, deleteFile } from "./storageService.js";

export const sktaInclude = {
  mahasiswa: {
    include: {
      studyProgram: true,
      user: true,
    },
  },
  dosenPembimbing1: {
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
  },
  dosenPembimbing2: {
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
  },
  researchGroup: true,
  admin: true,
};

export const sanitizeFilenamePart = (str) => {
  if (!str) return "";
  return String(str)
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
};

/**
 * Pengecekan apakah permohonan SKTA dapat diedit oleh mahasiswa
 */
export const checkSktaEditable = async (id) => {
  const permohonan = await prisma.permohonanSkta.findUnique({
    where: { id },
  });

  if (!permohonan) {
    return {
      exists: false,
      editable: false,
      reason: "Permohonan SKTA tidak ditemukan.",
    };
  }

  if (!permohonan.isDraft) {
    const hasActiveEditPermission =
      permohonan.isEdit && new Date(permohonan.isEdit) > new Date();

    if (!hasActiveEditPermission) {
      return {
        exists: true,
        editable: false,
        reason:
          "Permohonan SKTA sudah dikirim dan tidak memiliki izin edit yang aktif.",
      };
    }
  }

  if (permohonan.isEdit) {
    const isEditExpired = new Date(permohonan.isEdit) < new Date();
    if (isEditExpired) {
      return {
        exists: true,
        editable: false,
        reason: "Batas waktu izin edit dari admin telah kedaluwarsa.",
      };
    }
  }

  return { exists: true, editable: true };
};

/**
 * Resolve data admin / staff akademik dari adminId (id / userId) atau currentUser session
 */
export const resolveAdmin = async (adminId, currentUser) => {
  const targetId = adminId || currentUser?.id;
  if (!targetId) return null;

  let admin = await prisma.admin.findUnique({
    where: { id: targetId },
  });

  if (!admin) {
    admin = await prisma.admin.findUnique({
      where: { userId: targetId },
    });
  }

  if (!admin && currentUser?.id) {
    admin = await prisma.admin.findUnique({
      where: { userId: currentUser.id },
    });
  }

  // Jika user ber-role ADMIN tetapi belum ada record di tabel admin, buatkan secara otomatis
  if (!admin && currentUser?.role === "ADMIN") {
    admin = await prisma.admin.create({
      data: {
        userId: currentUser.id,
      },
    });
  }

  return admin;
};

/**
 * Mengambil daftar permohonan SKTA dengan paginasi
 */
export const getPermohonanSktas = async ({ skip, take }, customWhere = {}) => {
  const where = {
    deletedAt: null,
    OR: [
      { isDraft: false },
      {
        isDraft: true,
        OR: [
          { isEdit: { not: null } },
          { wasRejectedBefore: true },
          { message: { not: null } },
        ],
      },
    ],
    ...customWhere,
  };

  const [total, data] = await Promise.all([
    prisma.permohonanSkta.count({ where }),
    prisma.permohonanSkta.findMany({
      where,
      skip,
      take,
      include: sktaInclude,
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  return { total, data };
};

/**
 * Mengambil data permohonan SKTA berdasarkan ID
 */
export const getPermohonanSktaById = async (id) => {
  return await prisma.permohonanSkta.findUnique({
    where: { id },
    include: sktaInclude,
  });
};

/**
 * Mengambil permohonan SKTA terbaru berdasarkan ID Mahasiswa atau User ID
 */
export const getLatestPermohonanByMahasiswaId = async (idOrUserId) => {
  if (!idOrUserId) return null;

  let resolvedMahasiswaId = idOrUserId;

  const student = await prisma.mahasiswa.findFirst({
    where: {
      OR: [{ id: idOrUserId }, { userId: idOrUserId }],
      deletedAt: null,
    },
  });

  if (student) {
    resolvedMahasiswaId = student.id;
  }

  return await prisma.permohonanSkta.findFirst({
    where: {
      OR: [
        { mahasiswaId: resolvedMahasiswaId },
        { mahasiswa: { userId: idOrUserId } },
      ],
      deletedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: sktaInclude,
  });
};

/**
 * Menyimpan / memperbarui draft permohonan SKTA
 */
export const saveDraftPermohonanSkta = async ({
  id,
  mahasiswaId,
  category = "Permohonan Baru",
  judulProposalIndonesia,
  judulProposalInggris,
  dosenPembimbing1Id,
  dosenPembimbing2Id,
  evidenceFile,
}) => {
  if (id) {
    const existing = await prisma.permohonanSkta.findUnique({
      where: { id },
    });
    if (!existing) {
      const error = new Error("Permohonan SKTA tidak ditemukan");
      error.statusCode = 404;
      throw error;
    }

    const editCheck = await checkSktaEditable(id);
    if (!editCheck.editable) {
      const error = new Error(editCheck.reason);
      error.statusCode = 403;
      throw error;
    }

    let researchGroupId;
    if (dosenPembimbing1Id) {
      const dosenPembimbing1 = await prisma.dosen.findUnique({
        where: { id: dosenPembimbing1Id },
      });
      if (dosenPembimbing1) {
        researchGroupId = dosenPembimbing1.researchGroupId;
      }
    }

    const updateData = {
      isDraft: true,
      category: category !== undefined ? category : undefined,
      judulProposalIndonesia:
        judulProposalIndonesia !== undefined
          ? (judulProposalIndonesia || "").trim()
          : undefined,
      judulProposalInggris:
        judulProposalInggris !== undefined
          ? (judulProposalInggris || "").trim()
          : undefined,
      dosenPembimbing1Id:
        dosenPembimbing1Id !== undefined ? dosenPembimbing1Id : undefined,
      dosenPembimbing2Id:
        dosenPembimbing2Id !== undefined ? dosenPembimbing2Id : undefined,
      researchGroupId:
        researchGroupId !== undefined ? researchGroupId : undefined,
    };

    if (evidenceFile) {
      const uploadedEvidence = await uploadFile({
        buffer: evidenceFile.buffer,
        originalname: evidenceFile.originalname,
        folder: "berkas-evidence",
        mimetype: evidenceFile.mimetype,
      });

      if (existing.evidenceUploadPath) {
        await deleteFile(existing.evidenceUploadPath);
      }
      updateData.evidenceUploadPath = uploadedEvidence.filepath;
    }

    return await prisma.permohonanSkta.update({
      where: { id },
      data: updateData,
      include: sktaInclude,
    });
  } else if (mahasiswaId) {
    const student = await prisma.mahasiswa.findFirst({
      where: { id: mahasiswaId },
    });
    if (!student) {
      const error = new Error("Mahasiswa tidak ditemukan");
      error.statusCode = 404;
      throw error;
    }

    const existing = await prisma.permohonanSkta.findFirst({
      where: {
        mahasiswaId,
        isDraft: true,
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      const editCheck = await checkSktaEditable(existing.id);
      if (!editCheck.editable) {
        const error = new Error(editCheck.reason);
        error.statusCode = 403;
        throw error;
      }

      let researchGroupId;
      if (dosenPembimbing1Id) {
        const dosenPembimbing1 = await prisma.dosen.findUnique({
          where: { id: dosenPembimbing1Id },
        });
        if (dosenPembimbing1) {
          researchGroupId = dosenPembimbing1.researchGroupId;
        }
      }

      const updateData = {
        isDraft: true,
        category: category !== undefined ? category : undefined,
        judulProposalIndonesia:
          judulProposalIndonesia !== undefined
            ? (judulProposalIndonesia || "").trim()
            : undefined,
        judulProposalInggris:
          judulProposalInggris !== undefined
            ? (judulProposalInggris || "").trim()
            : undefined,
        dosenPembimbing1Id:
          dosenPembimbing1Id !== undefined ? dosenPembimbing1Id : undefined,
        dosenPembimbing2Id:
          dosenPembimbing2Id !== undefined ? dosenPembimbing2Id : undefined,
        researchGroupId:
          researchGroupId !== undefined ? researchGroupId : undefined,
      };

      if (evidenceFile) {
        const uploadedEvidence = await uploadFile({
          buffer: evidenceFile.buffer,
          originalname: evidenceFile.originalname,
          folder: "berkas-evidence",
          mimetype: evidenceFile.mimetype,
        });

        if (existing.evidenceUploadPath) {
          await deleteFile(existing.evidenceUploadPath);
        }
        updateData.evidenceUploadPath = uploadedEvidence.filepath;
      }

      return await prisma.permohonanSkta.update({
        where: { id: existing.id },
        data: updateData,
        include: sktaInclude,
      });
    } else {
      if (category === "Permohonan Baru") {
        const existingSubmitted = await prisma.permohonanSkta.findFirst({
          where: {
            mahasiswaId,
            category: "Permohonan Baru",
            deletedAt: null,
            isDraft: false,
          },
        });
        if (existingSubmitted) {
          const error = new Error(
            "Mahasiswa sudah memiliki pengajuan SK. Untuk pembaruan SK, gunakan kategori Perpanjangan atau Perubahan.",
          );
          error.statusCode = 409;
          throw error;
        }
      }

      let researchGroupId;
      if (dosenPembimbing1Id) {
        const dosenPembimbing1 = await prisma.dosen.findUnique({
          where: { id: dosenPembimbing1Id },
        });
        if (dosenPembimbing1) {
          researchGroupId = dosenPembimbing1.researchGroupId;
        }
      }

      let evidenceUploadPath;
      if (evidenceFile) {
        const uploadedEvidence = await uploadFile({
          buffer: evidenceFile.buffer,
          originalname: evidenceFile.originalname,
          folder: "berkas-evidence",
          mimetype: evidenceFile.mimetype,
        });
        evidenceUploadPath = uploadedEvidence.filepath;
      }

      return await prisma.permohonanSkta.create({
        data: {
          category,
          mahasiswaId,
          judulProposalIndonesia: (judulProposalIndonesia || "").trim(),
          judulProposalInggris: (judulProposalInggris || "").trim(),
          dosenPembimbing1Id: dosenPembimbing1Id || undefined,
          dosenPembimbing2Id: dosenPembimbing2Id || undefined,
          researchGroupId: researchGroupId || undefined,
          evidenceUploadPath: evidenceUploadPath || undefined,
          isDraft: true,
        },
        include: sktaInclude,
      });
    }
  } else {
    const error = new Error(
      "mahasiswaId wajib diisi untuk membuat draft permohonan",
    );
    error.statusCode = 400;
    throw error;
  }
};

/**
 * Final submit permohonan SKTA
 */
export const submitPermohonanSkta = async ({
  id,
  mahasiswaId,
  category = "Permohonan Baru",
  judulProposalIndonesia,
  judulProposalInggris,
  dosenPembimbing1Id,
  dosenPembimbing2Id,
  evidenceFile,
}) => {
  const existingRecord = await prisma.permohonanSkta.findUnique({
    where: { id },
  });

  if (!existingRecord) {
    const error = new Error("Permohonan SKTA tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const editCheck = await checkSktaEditable(id);
  if (!editCheck.editable) {
    const error = new Error(editCheck.reason);
    error.statusCode = 403;
    throw error;
  }

  const student = await prisma.mahasiswa.findFirst({
    where: { id: mahasiswaId },
  });
  if (!student) {
    const error = new Error("Mahasiswa tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const dosenPembimbing1 = await prisma.dosen.findUnique({
    where: { id: dosenPembimbing1Id },
  });
  if (!dosenPembimbing1) {
    const error = new Error("Dosen pembimbing 1 tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const dosenPembimbing2 = await prisma.dosen.findUnique({
    where: { id: dosenPembimbing2Id },
  });
  if (!dosenPembimbing2) {
    const error = new Error("Dosen pembimbing 2 tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const researchGroupId = dosenPembimbing1.researchGroupId;

  if (category === "Permohonan Baru") {
    const existingSubmitted = await prisma.permohonanSkta.findFirst({
      where: {
        mahasiswaId,
        category: "Permohonan Baru",
        deletedAt: null,
        isDraft: false,
        id: { not: id },
      },
    });
    if (existingSubmitted) {
      const error = new Error(
        "Mahasiswa sudah memiliki pengajuan SK. Untuk pembaruan SK, gunakan kategori Perpanjangan atau Perubahan.",
      );
      error.statusCode = 409;
      throw error;
    }
  }

  let evidenceUploadPath = existingRecord.evidenceUploadPath;
  if (evidenceFile) {
    const uploadedEvidence = await uploadFile({
      buffer: evidenceFile.buffer,
      originalname: evidenceFile.originalname,
      folder: "berkas-evidence",
      mimetype: evidenceFile.mimetype,
    });

    if (existingRecord.evidenceUploadPath) {
      await deleteFile(existingRecord.evidenceUploadPath);
    }
    evidenceUploadPath = uploadedEvidence.filepath;
  }

  if (!evidenceUploadPath) {
    const error = new Error("Berkas evidence wajib diunggah");
    error.statusCode = 400;
    error.errors = [{ field: "evidence", message: "Berkas evidence wajib diunggah" }];
    throw error;
  }

  return await prisma.permohonanSkta.update({
    where: { id },
    data: {
      category,
      mahasiswaId,
      judulProposalIndonesia: (judulProposalIndonesia || "").trim(),
      judulProposalInggris: (judulProposalInggris || "").trim(),
      dosenPembimbing1Id,
      dosenPembimbing2Id,
      researchGroupId,
      evidenceUploadPath,
      isDraft: false,
      message: null,
      isEdit: null,
    },
    include: sktaInclude,
  });
};

/**
 * Memperbarui data permohonan SKTA yang masih berstatus edit/draft
 */
export const updatePermohonanSktaData = async (
  id,
  {
    judulProposalIndonesia,
    judulProposalInggris,
    dosenPembimbing1Id,
    dosenPembimbing2Id,
    evidenceFile,
  },
) => {
  const permohonan = await prisma.permohonanSkta.findUnique({
    where: { id },
  });
  if (!permohonan) {
    const error = new Error("Permohonan SKTA tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const editCheck = await checkSktaEditable(id);
  if (!editCheck.editable) {
    const error = new Error(editCheck.reason);
    error.statusCode = 403;
    throw error;
  }

  const updateData = {
    judulProposalIndonesia:
      judulProposalIndonesia !== undefined
        ? (judulProposalIndonesia || "").trim()
        : undefined,
    judulProposalInggris:
      judulProposalInggris !== undefined
        ? (judulProposalInggris || "").trim()
        : undefined,
    message: null,
    isEdit: null,
  };

  if (dosenPembimbing1Id) {
    updateData.dosenPembimbing1Id = dosenPembimbing1Id;
    const dosenPembimbing1 = await prisma.dosen.findUnique({
      where: { id: dosenPembimbing1Id },
    });
    if (dosenPembimbing1) {
      updateData.researchGroupId = dosenPembimbing1.researchGroupId;
    }
  }
  if (dosenPembimbing2Id) {
    updateData.dosenPembimbing2Id = dosenPembimbing2Id;
  }

  if (evidenceFile) {
    const uploadedEvidence = await uploadFile({
      buffer: evidenceFile.buffer,
      originalname: evidenceFile.originalname,
      folder: "berkas-evidence",
      mimetype: evidenceFile.mimetype,
    });

    if (permohonan.evidenceUploadPath) {
      await deleteFile(permohonan.evidenceUploadPath);
    }
    updateData.evidenceUploadPath = uploadedEvidence.filepath;
  }

  return await prisma.permohonanSkta.update({
    where: { id },
    data: updateData,
    include: sktaInclude,
  });
};

/**
 * Mengambil informasi berkas SKTA untuk diunduh
 */
export const getSktaDownloadInfo = async (id) => {
  const permohonan = await prisma.permohonanSkta.findUnique({
    where: { id },
    include: {
      mahasiswa: {
        include: {
          user: true,
          studyProgram: true,
        },
      },
    },
  });

  if (!permohonan || !permohonan.sktaUploadPath) {
    const error = new Error(
      "Berkas SKTA belum diterbitkan atau tidak ditemukan",
    );
    error.statusCode = 404;
    throw error;
  }

  const ext = path.extname(permohonan.sktaUploadPath || "") || ".pdf";
  const nim = sanitizeFilenamePart(permohonan.mahasiswa?.nim || "nim");
  const nama = sanitizeFilenamePart(permohonan.mahasiswa?.user?.name || "nama");
  const prodi = sanitizeFilenamePart(
    permohonan.mahasiswa?.studyProgram?.name || "study_program",
  );
  const downloadName = `SKTA_${nim}_${nama}_${prodi}${ext}`;

  return {
    filepath: permohonan.sktaUploadPath,
    downloadName,
    mimeType: "application/pdf",
  };
};

/**
 * Mengambil informasi berkas evidence untuk diunduh
 */
export const getEvidenceDownloadInfo = async (id) => {
  const permohonan = await prisma.permohonanSkta.findUnique({
    where: { id },
  });

  if (!permohonan || !permohonan.evidenceUploadPath) {
    const error = new Error("Berkas evidence tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const ext = path.extname(permohonan.evidenceUploadPath || "") || ".pdf";
  const downloadName = `Evidence_${id}${ext}`;

  return {
    filepath: permohonan.evidenceUploadPath,
    downloadName,
  };
};

/**
 * Menyetujui permohonan SKTA (Approve)
 */
export const approvePermohonanSkta = async ({
  id,
  hasUploadedFinalProposal,
  hasTakenLanguageTest,
  expDate,
  adminId,
  sktaFile,
  currentUser,
}) => {
  const permohonan = await prisma.permohonanSkta.findUnique({
    where: { id },
    include: {
      mahasiswa: {
        include: {
          user: true,
          studyProgram: true,
        },
      },
    },
  });

  if (!permohonan) {
    const error = new Error("Permohonan SKTA tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  if (permohonan.isDraft) {
    const error = new Error(
      "Permohonan SKTA masih berupa draft dan belum disubmit",
    );
    error.statusCode = 400;
    throw error;
  }

  const adminExist = await resolveAdmin(adminId, currentUser);
  if (!adminExist) {
    const error = new Error("Admin/Staf Akademik tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const updateData = {
    hasUploadedFinalProposal:
      hasUploadedFinalProposal === "true" || hasUploadedFinalProposal === true,
    hasTakenLanguageTest:
      hasTakenLanguageTest === "true" || hasTakenLanguageTest === true,
    expDate: expDate ? new Date(expDate) : null,
    adminId: adminExist.id,
    message: null,
  };

  if (sktaFile) {
    const nim = sanitizeFilenamePart(permohonan.mahasiswa?.nim || "nim");
    const nama = sanitizeFilenamePart(
      permohonan.mahasiswa?.user?.name || "nama",
    );
    const prodi = sanitizeFilenamePart(
      permohonan.mahasiswa?.studyProgram?.name || "study_program",
    );
    const ext = path.extname(sktaFile.originalname || ".pdf") || ".pdf";
    const timestamp = Date.now();
    const customFilename = `SKTA_${nim}_${nama}_${prodi}_${timestamp}${ext}`;

    const uploadedSkta = await uploadFile({
      buffer: sktaFile.buffer,
      originalname: sktaFile.originalname,
      customFilename,
      folder: "berkas-skta",
      mimetype: sktaFile.mimetype,
    });

    if (permohonan.sktaUploadPath) {
      await deleteFile(permohonan.sktaUploadPath);
    }
    updateData.sktaUploadPath = uploadedSkta.filepath;
  }

  return await prisma.permohonanSkta.update({
    where: { id },
    data: updateData,
    include: sktaInclude,
  });
};

/**
 * Menolak atau meminta revisi permohonan SKTA (Reject)
 */
export const rejectPermohonanSkta = async ({
  id,
  message,
  adminId,
  isEdit,
  currentUser,
}) => {
  const permohonan = await prisma.permohonanSkta.findUnique({
    where: { id },
  });

  if (!permohonan) {
    const error = new Error("Permohonan SKTA tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  if (
    permohonan.isDraft &&
    !permohonan.wasRejectedBefore &&
    !permohonan.isEdit
  ) {
    const error = new Error(
      "Permohonan SKTA masih berupa draft awal dan belum pernah diajukan",
    );
    error.statusCode = 400;
    throw error;
  }

  const adminExist = await resolveAdmin(adminId, currentUser);
  if (!adminExist) {
    const error = new Error("Admin/Staf Akademik tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  return await prisma.permohonanSkta.update({
    where: { id },
    data: {
      isDraft: isEdit ? true : false,
      wasRejectedBefore: true,
      message,
      adminId: adminExist.id,
      isEdit: isEdit ? new Date(isEdit) : null,
    },
    include: sktaInclude,
  });
};

/**
 * Mendapatkan berkas mahasiswa berdasarkan permohonanId dan category
 */
export const getBerkasByPermohonanIdAndCategory = async ({
  permohonanId,
  category,
  notFoundMessage,
}) => {
  const permohonan = await prisma.permohonanSkta.findUnique({
    where: { id: permohonanId },
    include: {
      mahasiswa: true,
    },
  });

  if (!permohonan) {
    const error = new Error("Permohonan SKTA tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  if (permohonan.isDraft) {
    const error = new Error(
      "Dokumen validasi SKTA hanya dapat diakses untuk permohonan yang sudah disubmit (bukan draft)",
    );
    error.statusCode = 400;
    throw error;
  }

  const existingBerkas = await prisma.berkasMahasiswa.findFirst({
    where: {
      mahasiswaId: permohonan.mahasiswaId,
      category,
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!existingBerkas) {
    const error = new Error(
      notFoundMessage || "Berkas tidak ditemukan di database",
    );
    error.statusCode = 404;
    throw error;
  }

  return existingBerkas;
};

/**
 * Mengunggah berkas mahasiswa (validasi/formulir) untuk permohonan SKTA
 */
export const uploadBerkasMahasiswaForSkta = async ({
  permohonanId,
  category,
  file,
  filePrefix,
}) => {
  const permohonan = await prisma.permohonanSkta.findUnique({
    where: { id: permohonanId },
    include: {
      mahasiswa: true,
    },
  });

  if (!permohonan) {
    const error = new Error("Permohonan SKTA tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  if (permohonan.isDraft) {
    const error = new Error(
      "Dokumen SKTA hanya dapat diunggah untuk permohonan yang sudah disubmit (bukan draft)",
    );
    error.statusCode = 400;
    throw error;
  }

  const mahasiswaId = permohonan.mahasiswaId;

  const existingBerkas = await prisma.berkasMahasiswa.findFirst({
    where: {
      mahasiswaId,
      category,
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  if (existingBerkas && existingBerkas.filepath) {
    await deleteFile(existingBerkas.filepath);
  }

  const filename = `${uuidv4()}.pdf`;
  const uploaded = await uploadFile({
    buffer: file.buffer,
    customFilename: filename,
    folder: "berkas-mahasiswa",
    mimetype: "application/pdf",
  });

  const nim = sanitizeFilenamePart(permohonan.mahasiswa?.nim || mahasiswaId);
  const name = `${filePrefix}${nim}.pdf`;

  if (existingBerkas) {
    return await prisma.berkasMahasiswa.update({
      where: { id: existingBerkas.id },
      data: {
        name,
        filepath: uploaded.filepath,
        updatedAt: new Date(),
      },
    });
  } else {
    return await prisma.berkasMahasiswa.create({
      data: {
        id: uuidv4(),
        name,
        category,
        filepath: uploaded.filepath,
        mahasiswaId,
      },
    });
  }
};

/**
 * Mengambil record BerkasMahasiswa berdasarkan berkasId
 */
export const getBerkasMahasiswaById = async (berkasId) => {
  const upload = await prisma.berkasMahasiswa.findFirst({
    where: { id: berkasId, deletedAt: null },
  });

  if (!upload) {
    const error = new Error("File dokumen tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  return upload;
};

/**
 * Mengambil data berkas SKTA untuk export file ZIP beserta filter-filternya
 */
export const getSktaFilesForExport = async ({
  startDate,
  endDate,
  dateField = "createdAt",
  studyProgram,
  studyProgramId,
  tahunAngkatan,
  kelasAsal,
  category,
}) => {
  const where = {
    sktaUploadPath: {
      not: null,
    },
    deletedAt: null,
  };

  if (category) {
    where.category = category;
  }

  if (startDate || endDate) {
    const validDateField = ["createdAt", "updatedAt", "expDate"].includes(
      dateField,
    )
      ? dateField
      : "createdAt";

    where[validDateField] = {};
    if (startDate) {
      where[validDateField].gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      if (!endDate.includes("T")) {
        end.setHours(23, 59, 59, 999);
      }
      where[validDateField].lte = end;
    }
  }

  const mahasiswaWhere = {};

  if (tahunAngkatan) {
    const parsedAngkatan = parseInt(tahunAngkatan, 10);
    if (!isNaN(parsedAngkatan)) {
      mahasiswaWhere.tahunAngkatan = parsedAngkatan;
    }
  }

  if (kelasAsal) {
    mahasiswaWhere.kelasAsal = {
      contains: String(kelasAsal).trim(),
      mode: "insensitive",
    };
  }

  const spFilter = studyProgramId || studyProgram;
  if (spFilter) {
    mahasiswaWhere.OR = [
      { studyProgramId: spFilter },
      {
        studyProgram: {
          name: {
            contains: String(spFilter).trim(),
            mode: "insensitive",
          },
        },
      },
    ];
  }

  if (Object.keys(mahasiswaWhere).length > 0) {
    where.mahasiswa = mahasiswaWhere;
  }

  const list = await prisma.permohonanSkta.findMany({
    where,
    include: {
      mahasiswa: {
        include: {
          user: true,
          studyProgram: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!list || list.length === 0) {
    const error = new Error(
      "Tidak ada berkas SKTA yang sesuai dengan filter yang dipilih",
    );
    error.statusCode = 404;
    throw error;
  }

  const validFiles = [];
  const usedEntryNames = new Set();

  for (const item of list) {
    if (!item.sktaUploadPath) continue;
    const ext = path.extname(item.sktaUploadPath || "") || ".pdf";
    const nim = sanitizeFilenamePart(item.mahasiswa?.nim || "nim");
    const nama = sanitizeFilenamePart(item.mahasiswa?.user?.name || "nama");
    const prodi = sanitizeFilenamePart(
      item.mahasiswa?.studyProgram?.name || "study_program",
    );

    let entryName = `SKTA_${nim}_${nama}_${prodi}${ext}`;

    if (usedEntryNames.has(entryName)) {
      const timePart = item.createdAt
        ? new Date(item.createdAt).getTime()
        : Date.now();
      entryName = `SKTA_${nim}_${nama}_${prodi}_${timePart}${ext}`;
      if (usedEntryNames.has(entryName)) {
        entryName = `SKTA_${nim}_${nama}_${prodi}_${item.id.slice(0, 8)}${ext}`;
      }
    }
    usedEntryNames.add(entryName);

    validFiles.push({
      filepath: item.sktaUploadPath,
      entryName,
    });
  }

  if (validFiles.length === 0) {
    const error = new Error("Berkas SKTA tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  return validFiles;
};

export const findExistingPermohonanBaru = async (mahasiswaId) => {
  return await prisma.permohonanSkta.findFirst({
    where: {
      mahasiswaId,
      category: "Permohonan Baru",
      deletedAt: null,
    },
  });
};

export const createPermohonanSkta = async (data) => {
  return await prisma.permohonanSkta.create({
    data,
    include: sktaInclude,
  });
};

export const updatePermohonanSkta = async (id, data) => {
  return await prisma.permohonanSkta.update({
    where: { id },
    data,
    include: sktaInclude,
  });
};
