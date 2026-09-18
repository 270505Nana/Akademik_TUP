import asyncHandler from "express-async-handler";
import prisma from "../config/prisma.js";
import path from "path";
import { ZipArchive } from "archiver";
import { v4 as uuidv4 } from "uuid";
import {
  getPaginationParams,
  formatPaginationResponse,
} from "../utils/paginationHelper.js";
import {
  sendValidationError,
  isNil,
  isValidISO8601,
} from "../utils/validationHelper.js";
import {
  uploadFile,
  deleteFile,
  serveDownload,
  getFileStream,
} from "../services/storageService.js";
import { mapPermohonanToFrontend } from "../mappers/index.js";
import * as sktaService from "../services/sktaService.js";
import * as mahasiswaService from "../services/mahasiswaService.js";
import * as dosenService from "../services/dosenService.js";

const getUploadedFile = (files, fieldName) => files?.[fieldName]?.[0];

const sanitizeFilenamePart = (str) => {
  if (!str) return "";
  return String(str)
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
};

// [Route] Mendapatkan Semua Permohonan SKTA
const listPermohonanSkta = asyncHandler(async (req, res) => {
  const paginationParams = getPaginationParams(req.query);
  const { total, data } =
    await sktaService.getPermohonanSktas(paginationParams);
  const enriched = data.map((item) => mapPermohonanToFrontend(item, req));
  res.json(formatPaginationResponse(enriched, total, paginationParams));
});

// [Route] Menyimpan Draft Permohonan SKTA (Save Draft)
const createPermohonanSkta = asyncHandler(async (req, res) => {
  const category = req.query.category || req.body.category || "Permohonan Baru";
  const {
    id,
    mahasiswaId,
    judulProposalIndonesia,
    judulProposalInggris,
    dosenPembimbing1Id,
    dosenPembimbing2Id,
  } = req.body;

  const mhsId = mahasiswaId;
  const evidenceFile = getUploadedFile(req.files, "evidence");

  let permohonan;

  if (id) {
    // Update existing draft by id
    const existing = await prisma.permohonanSkta.findUnique({
      where: { id },
    });
    if (!existing) {
      res.status(404);
      throw new Error("Permohonan SKTA tidak ditemukan");
    }

    const editCheck = await sktaService.checkSktaEditable(id);
    if (!editCheck.editable) {
      res.status(403);
      throw new Error(editCheck.reason);
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

    permohonan = await prisma.permohonanSkta.update({
      where: { id },
      data: updateData,
      include: {
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
      },
    });
  } else if (mhsId) {
    // Cek apakah data mahasiswa ada
    const student = await prisma.mahasiswa.findFirst({
      where: { id: mhsId },
    });
    if (!student) {
      res.status(404);
      throw new Error("Mahasiswa tidak ditemukan");
    }

    // Cari draft permohonan yang sudah ada
    const existing = await prisma.permohonanSkta.findFirst({
      where: {
        mahasiswaId: mhsId,
        isDraft: true,
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      const editCheck = await sktaService.checkSktaEditable(existing.id);
      if (!editCheck.editable) {
        res.status(403);
        throw new Error(editCheck.reason);
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

      permohonan = await prisma.permohonanSkta.update({
        where: { id: existing.id },
        data: updateData,
        include: {
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
        },
      });
    } else {
      // Cek apakah mahasiswa sudah punya pengajuan baru/aktif non-draft (jika permohonan baru)
      if (category === "Permohonan Baru") {
        const existingSubmitted = await prisma.permohonanSkta.findFirst({
          where: {
            mahasiswaId: mhsId,
            category: "Permohonan Baru",
            deletedAt: null,
            isDraft: false,
          },
        });
        if (existingSubmitted) {
          res.status(409);
          throw new Error(
            "Mahasiswa sudah memiliki pengajuan SK. Untuk pembaruan SK, gunakan kategori Perpanjangan atau Perubahan.",
          );
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

      permohonan = await prisma.permohonanSkta.create({
        data: {
          category,
          mahasiswaId: mhsId,
          judulProposalIndonesia: (judulProposalIndonesia || "").trim(),
          judulProposalInggris: (judulProposalInggris || "").trim(),
          dosenPembimbing1Id: dosenPembimbing1Id || undefined,
          dosenPembimbing2Id: dosenPembimbing2Id || undefined,
          researchGroupId: researchGroupId || undefined,
          evidenceUploadPath: evidenceUploadPath || undefined,
          isDraft: true,
        },
        include: {
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
        },
      });
    }
  } else {
    res.status(400);
    throw new Error("mahasiswaId wajib diisi untuk membuat draft permohonan");
  }

  res.status(200).json({
    message: "Permohonan SKTA berhasil disimpan sebagai draft",
    data: mapPermohonanToFrontend(permohonan, req),
  });
});

// [Route] Submit Permohonan SKTA
const submitPermohonanSkta = asyncHandler(async (req, res) => {
  const category = req.query.category || req.body.category || "Permohonan Baru";
  const {
    id,
    mahasiswaId,
    judulProposalIndonesia,
    judulProposalInggris,
    dosenPembimbing1Id,
    dosenPembimbing2Id,
  } = req.body;

  const mhsId = mahasiswaId;
  const evidenceFile = getUploadedFile(req.files, "evidence");

  const errors = [];

  if (isNil(id)) {
    errors.push({ field: "id", message: "ID wajib diisi untuk submit" });
  } else if (typeof id !== "string") {
    errors.push({ field: "id", message: "ID harus berupa string" });
  }

  if (isNil(mhsId)) {
    errors.push({ field: "mahasiswaId", message: "Mahasiswa ID wajib diisi" });
  }
  if (isNil(judulProposalIndonesia)) {
    errors.push({
      field: "judulProposalIndonesia",
      message: "Judul proposal (Indonesia) wajib diisi",
    });
  }
  if (isNil(judulProposalInggris)) {
    errors.push({
      field: "judulProposalInggris",
      message: "Judul proposal (Inggris) wajib diisi",
    });
  }
  if (isNil(dosenPembimbing1Id)) {
    errors.push({
      field: "dosenPembimbing1Id",
      message: "Dosen Pembimbing 1 wajib diisi",
    });
  }
  if (isNil(dosenPembimbing2Id)) {
    errors.push({
      field: "dosenPembimbing2Id",
      message: "Dosen Pembimbing 2 wajib diisi",
    });
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors, req);
  }

  const existingRecord = await prisma.permohonanSkta.findUnique({
    where: { id },
  });

  if (!existingRecord) {
    res.status(404);
    throw new Error("Permohonan SKTA tidak ditemukan");
  }

  const editCheck = await sktaService.checkSktaEditable(id);
  if (!editCheck.editable) {
    res.status(403);
    throw new Error(editCheck.reason);
  }

  // Cek apakah data mahasiswa ada
  const student = await prisma.mahasiswa.findFirst({
    where: { id: mhsId },
  });
  if (!student) {
    res.status(404);
    throw new Error("Mahasiswa tidak ditemukan");
  }

  // Cek dosen 1
  const dosenPembimbing1 = await prisma.dosen.findUnique({
    where: { id: dosenPembimbing1Id },
  });
  if (!dosenPembimbing1) {
    res.status(404);
    throw new Error("Dosen pembimbing 1 tidak ditemukan");
  }

  // Cek dosen 2
  const dosenPembimbing2 = await prisma.dosen.findUnique({
    where: { id: dosenPembimbing2Id },
  });
  if (!dosenPembimbing2) {
    res.status(404);
    throw new Error("Dosen pembimbing 2 tidak ditemukan");
  }

  const researchGroupId = dosenPembimbing1.researchGroupId;

  // Cek apakah mahasiswa sudah punya pengajuan baru/aktif non-draft (jika permohonan baru)
  if (category === "Permohonan Baru") {
    const existingSubmitted = await prisma.permohonanSkta.findFirst({
      where: {
        mahasiswaId: mhsId,
        category: "Permohonan Baru",
        deletedAt: null,
        isDraft: false,
        id: { not: id },
      },
    });
    if (existingSubmitted) {
      res.status(409);
      throw new Error(
        "Mahasiswa sudah memiliki pengajuan SK. Untuk pembaruan SK, gunakan kategori Perpanjangan atau Perubahan.",
      );
    }
  }

  // Cek file evidence
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
    return sendValidationError(
      res,
      [{ field: "evidence", message: "Berkas evidence wajib diunggah" }],
      req,
    );
  }

  const result = await prisma.permohonanSkta.update({
    where: { id },
    data: {
      category,
      mahasiswaId: mhsId,
      judulProposalIndonesia: judulProposalIndonesia.trim(),
      judulProposalInggris: judulProposalInggris.trim(),
      dosenPembimbing1Id,
      dosenPembimbing2Id,
      researchGroupId,
      evidenceUploadPath,
      isDraft: false,
      message: null,
      isEdit: null,
    },
    include: {
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
    },
  });

  res.status(200).json({
    message: "Permohonan SKTA berhasil diajukan",
    data: mapPermohonanToFrontend(result, req),
  });
});

// [Route] Mengedit Permohonan SKTA
const updatePermohonanSkta = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const permohonan = await prisma.permohonanSkta.findUnique({ where: { id } });
  if (!permohonan) {
    res.status(404);
    throw new Error("Permohonan SKTA tidak ditemukan");
  }

  const editCheck = await sktaService.checkSktaEditable(id);
  if (!editCheck.editable) {
    res.status(403);
    throw new Error(editCheck.reason);
  }

  const {
    judulProposalIndonesia,
    judulProposalInggris,
    dosenPembimbing1Id,
    dosenPembimbing2Id,
  } = req.body;

  const evidenceFile = getUploadedFile(req.files, "evidence");

  const updateData = {
    judulProposalIndonesia: (judulProposalIndonesia || "").trim(),
    judulProposalInggris: (judulProposalInggris || "").trim(),
    message: null, // Clear rejection message upon student resubmission
    isEdit: null, // Clear revision deadline upon student resubmission
  };

  if (dosenPembimbing1Id) {
    updateData.dosenPembimbing1Id = dosenPembimbing1Id;
    // Update researchGroupId otomatis jika dospem 1 berubah
    const dosenPembimbing1 = await prisma.dosen.findUnique({
      where: { id: dosenPembimbing1Id },
    });
    if (dosenPembimbing1) {
      updateData.researchGroupId = dosenPembimbing1.researchGroupId;
    }
  }
  if (dosenPembimbing2Id) updateData.dosenPembimbing2Id = dosenPembimbing2Id;

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

  const data = await prisma.permohonanSkta.update({
    where: { id },
    data: updateData,
    include: {
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
    },
  });

  res.json({
    message: "Permohonan SKTA berhasil diubah",
    data: mapPermohonanToFrontend(data, req),
  });
});

// [Route] Mendapatkan Permohonan SKTA berdasarkan ID Permohonan
const getPermohonanSktaById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = await sktaService.getPermohonanSktaById(id);

  if (!data) {
    res.status(404);
    throw new Error("Permohonan SKTA tidak ditemukan");
  }

  res.json({ data: mapPermohonanToFrontend(data, req) });
});

// [Route] Mendapatkan Permohonan SKTA Terbaru Berdasarkan ID Mahasiswa
const getLatestPermohonanSktaByMahasiswaId = asyncHandler(async (req, res) => {
  const { mahasiswaId } = req.params;
  const data = await sktaService.getLatestPermohonanByMahasiswaId(mahasiswaId);

  if (!data) {
    res.status(404);
    throw new Error("Data permohonan SKTA untuk mahasiswa ini tidak ditemukan");
  }

  res.json({ data: mapPermohonanToFrontend(data, req) });
});

// [Route] Unduh Berkas SKTA
const downloadSkta = asyncHandler(async (req, res) => {
  const { id } = req.params;
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
    res.status(404);
    throw new Error("Berkas SKTA belum diterbitkan atau tidak ditemukan");
  }

  const ext = path.extname(permohonan.sktaUploadPath || "") || ".pdf";
  const nim = sanitizeFilenamePart(permohonan.mahasiswa?.nim || "nim");
  const nama = sanitizeFilenamePart(permohonan.mahasiswa?.user?.name || "nama");
  const prodi = sanitizeFilenamePart(
    permohonan.mahasiswa?.studyProgram?.name || "study_program",
  );
  const downloadName = `SKTA_${nim}_${nama}_${prodi}${ext}`;

  await serveDownload(res, {
    filepath: permohonan.sktaUploadPath,
    downloadName,
    mimeType: "application/pdf",
  });
});

// [Route] Unduh Berkas Evidence
const downloadEvidence = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const permohonan = await prisma.permohonanSkta.findUnique({
    where: { id },
  });

  if (!permohonan || !permohonan.evidenceUploadPath) {
    res.status(404);
    throw new Error("Berkas evidence tidak ditemukan");
  }

  const ext = path.extname(permohonan.evidenceUploadPath || "") || ".pdf";
  const downloadName = `Evidence_${id}${ext}`;

  await serveDownload(res, {
    filepath: permohonan.evidenceUploadPath,
    downloadName,
  });
});

// Helper untuk resolve admin record dari adminId (id / userId) atau user token
const resolveAdmin = async (adminId, currentUser) => {
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

// [Route] Menyetujui Permohonan SKTA (Approve)
const approvePermohonanSkta = asyncHandler(async (req, res) => {
  const { id } = req.params;
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
    res.status(404);
    throw new Error("Permohonan SKTA tidak ditemukan");
  }

  if (permohonan.isDraft) {
    res.status(400);
    throw new Error("Permohonan SKTA masih berupa draft dan belum disubmit");
  }

  const { hasUploadedFinalProposal, hasTakenLanguageTest, expDate, adminId } =
    req.body;

  const sktaFile = getUploadedFile(req.files, "skta");

  // Cek admin (mencakup admin.id, user.id, atau fallback ke user token)
  const adminExist = await resolveAdmin(adminId, req.user);
  if (!adminExist) {
    res.status(404);
    throw new Error("Admin/Staf Akademik tidak ditemukan");
  }

  const updateData = {
    hasUploadedFinalProposal:
      hasUploadedFinalProposal === "true" || hasUploadedFinalProposal === true,
    hasTakenLanguageTest:
      hasTakenLanguageTest === "true" || hasTakenLanguageTest === true,
    expDate: expDate ? new Date(expDate) : null,
    adminId: adminExist.id,
    message: null, // Hapus pesan penolakan sebelumnya jika ada
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

  const data = await prisma.permohonanSkta.update({
    where: { id },
    data: updateData,
    include: {
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
    },
  });

  res.json({
    message: "Permohonan SKTA berhasil disetujui",
    data: mapPermohonanToFrontend(data, req),
  });
});

// [Route] Menolak / Meminta Revisi Permohonan SKTA (Reject / Revision Request)
const rejectPermohonanSkta = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { message, adminId, isEdit } = req.body;

  const errors = [];
  if (isNil(adminId)) {
    errors.push({ field: "adminId", message: "ID staf akademik wajib diisi" });
  }
  if (isNil(message)) {
    errors.push({ field: "message", message: "Pesan penolakan wajib diisi" });
  }
  if (!isNil(isEdit) && !isValidISO8601(isEdit)) {
    errors.push({
      field: "isEdit",
      message: "isEdit harus berupa tanggal yang valid (format ISO 8601)",
    });
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  const permohonan = await prisma.permohonanSkta.findUnique({ where: { id } });
  if (!permohonan) {
    res.status(404);
    throw new Error("Permohonan SKTA tidak ditemukan");
  }

  if (permohonan.isDraft) {
    res.status(400);
    throw new Error("Permohonan SKTA masih berupa draft dan belum disubmit");
  }

  // Cek admin (mencakup admin.id, user.id, atau fallback ke user token)
  const adminExist = await resolveAdmin(adminId, req.user);
  if (!adminExist) {
    res.status(404);
    throw new Error("Admin/Staf Akademik tidak ditemukan");
  }

  const data = await prisma.permohonanSkta.update({
    where: { id },
    data: {
      isDraft: isEdit ? true : false,
      wasRejectedBefore: true,
      message,
      adminId: adminExist.id,
      isEdit: isEdit ? new Date(isEdit) : null,
    },
    include: {
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
    },
  });

  res.json({
    message: "Permohonan SKTA berhasil ditolak / diminta revisi",
    data: mapPermohonanToFrontend(data, req),
  });
});

// [Route] Get Existing Dokumen Validasi SKTA
const generateDokumenValidasiSkta = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const permohonan = await prisma.permohonanSkta.findUnique({
    where: { id },
    include: {
      mahasiswa: true,
    },
  });

  if (!permohonan) {
    res.status(404);
    throw new Error("Permohonan SKTA tidak ditemukan");
  }

  if (permohonan.isDraft) {
    res.status(400);
    throw new Error(
      "Dokumen validasi SKTA hanya dapat diakses untuk permohonan yang sudah disubmit (bukan draft)",
    );
  }

  const mahasiswaId = permohonan.mahasiswaId;
  const category = "Dokumen Validasi Skta";

  // Pengecekan apakah ada berkas dengan mahasiswaId dan category yang sama
  const existingBerkas = await prisma.berkasMahasiswa.findFirst({
    where: {
      mahasiswaId,
      category,
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  const buildDownloadUrl = (req, berkasId) => {
    if (!berkasId) return null;
    return `${req.protocol}://${req.get("host")}/api/permohonan-skta/download/validasi/${berkasId}`;
  };

  if (!existingBerkas) {
    res.status(404);
    throw new Error("Berkas validasi SKTA belum ditemukan di database");
  }

  res.json({
    message: "Berkas validasi SKTA berhasil ditemukan",
    data: {
      ...existingBerkas,
      downloadUrl: buildDownloadUrl(req, existingBerkas.id),
    },
  });
});

// [Route] Upload Dokumen Validasi SKTA (dibuat dari Frontend)
const uploadDokumenValidasiSkta = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const permohonan = await prisma.permohonanSkta.findUnique({
    where: { id },
    include: {
      mahasiswa: true,
    },
  });

  if (!permohonan) {
    res.status(404);
    throw new Error("Permohonan SKTA tidak ditemukan");
  }

  if (permohonan.isDraft) {
    res.status(400);
    throw new Error(
      "Dokumen validasi SKTA hanya dapat diunggah untuk permohonan yang sudah disubmit (bukan draft)",
    );
  }

  const file =
    getUploadedFile(req.files, "dokumenFile") ||
    getUploadedFile(req.files, "file") ||
    req.file;

  if (!file) {
    res.status(400);
    throw new Error("File dokumen validasi wajib diunggah");
  }

  if (file.mimetype !== "application/pdf") {
    res.status(400);
    throw new Error("Tipe file tidak valid (hanya diperbolehkan PDF)");
  }

  const mahasiswaId = permohonan.mahasiswaId;
  const category = "Dokumen Validasi Skta";

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
  const name = req.body.name || `Dokumen_Validasi_SKTA_${nim}.pdf`;

  let berkasRecord;
  if (existingBerkas) {
    berkasRecord = await prisma.berkasMahasiswa.update({
      where: { id: existingBerkas.id },
      data: {
        name,
        filepath: uploaded.filepath,
        updatedAt: new Date(),
      },
    });
  } else {
    berkasRecord = await prisma.berkasMahasiswa.create({
      data: {
        id: uuidv4(),
        name,
        category,
        filepath: uploaded.filepath,
        mahasiswaId,
      },
    });
  }

  const buildDownloadUrl = (req, berkasId) => {
    if (!berkasId) return null;
    return `${req.protocol}://${req.get("host")}/api/permohonan-skta/download/validasi/${berkasId}`;
  };

  res.status(201).json({
    message: "Berkas validasi SKTA berhasil diunggah",
    data: {
      ...berkasRecord,
      downloadUrl: buildDownloadUrl(req, berkasRecord.id),
    },
  });
});

// [Route] Download Dokumen Validasi SKTA
const downloadValidasi = asyncHandler(async (req, res) => {
  const { berkasId } = req.params;

  const upload = await prisma.berkasMahasiswa.findFirst({
    where: { id: berkasId, deletedAt: null },
  });

  if (!upload) {
    res.status(404);
    throw new Error("File dokumen tidak ditemukan");
  }

  await serveDownload(res, {
    filepath: upload.filepath,
    downloadName: upload.name,
    mimeType: "application/pdf",
  });
});

// [Route] Export Berkas SKTA sebagai ZIP dengan Filter
const exportSktaZip = asyncHandler(async (req, res) => {
  const {
    startDate,
    endDate,
    dateField = "createdAt",
    studyProgram,
    studyProgramId,
    tahunAngkatan,
    kelasAsal,
    category,
  } = req.query;

  const where = {
    sktaUploadPath: {
      not: null,
    },
    deletedAt: null,
  };

  // Filter Kategori
  if (category) {
    where.category = category;
  }

  // Filter Tanggal
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

  // Filter Mahasiswa (StudyProgram, Tahun Angkatan, Kelas Asal)
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
    res.status(404);
    throw new Error(
      "Tidak ada berkas SKTA yang sesuai dengan filter yang dipilih",
    );
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

    // Mencegah duplikasi nama di dalam zip yang sama
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
    res.status(404);
    throw new Error("Berkas SKTA tidak ditemukan");
  }

  const timestamp = new Date().toISOString().slice(0, 10);
  const zipFileName = `Export_SKTA_${timestamp}.zip`;

  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="${zipFileName}"`);

  const archive = new ZipArchive({
    zlib: { level: 6 },
  });

  archive.on("error", (err) => {
    throw err;
  });

  archive.pipe(res);

  for (const file of validFiles) {
    try {
      const fileData = await getFileStream(file.filepath);
      archive.append(fileData.stream, { name: file.entryName });
    } catch (err) {
      console.warn(
        `[exportSktaZip] Gagal menambahkan berkas ${file.filepath} ke archive:`,
        err.message,
      );
    }
  }

  await archive.finalize();
});

export {
  listPermohonanSkta,
  createPermohonanSkta,
  submitPermohonanSkta,
  updatePermohonanSkta,
  getPermohonanSktaById,
  getLatestPermohonanSktaByMahasiswaId,
  downloadSkta,
  downloadEvidence,
  approvePermohonanSkta,
  rejectPermohonanSkta,
  generateDokumenValidasiSkta,
  uploadDokumenValidasiSkta,
  downloadValidasi,
  exportSktaZip,
};
