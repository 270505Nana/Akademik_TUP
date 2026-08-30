import asyncHandler from 'express-async-handler';
import prisma from "../config/prisma.js";
import fs from 'fs';
import path from 'path';
import { ZipArchive } from 'archiver';
import { v4 as uuidv4 } from 'uuid';
import { getPaginationParams, formatPaginationResponse } from '../utils/paginationHelper.js';

const getUploadedFile = (files, fieldName) => files?.[fieldName]?.[0];

const removeUploadedFiles = (files) => {
  if (!files) return;

  if (Array.isArray(files)) {
    files.forEach((file) => {
      if (file?.path) {
        fs.unlink(file.path, () => {});
      }
    });
    return;
  }

  Object.values(files).forEach((value) => {
    removeUploadedFiles(value);
  });
};

const sanitizeFilenamePart = (str) => {
  if (!str) return "";
  return String(str)
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
};

// Helper untuk menyelaraskan model baru PermohonanSkta dengan format lama yang diharapkan Frontend
const mapPermohonanToFrontend = (item, req) => {
  if (!item) return null;
  return {
    id: item.id,
    createdAt: item.createdAt,
    category: item.category,
    mahasiswaId: item.mahasiswaId,
    judulProposalIndonesia: item.judulProposalIndonesia,
    judulProposalInggris: item.judulProposalInggris,
    dosenPembimbing1Id: item.dosenPembimbing1Id,
    dosenPembimbing2Id: item.dosenPembimbing2Id,
    researchGroupId: item.researchGroupId,
    adminId: item.adminId,
    hasUploadedFinalProposal: item.hasUploadedFinalProposal,
    hasTakenLanguageTest: item.hasTakenLanguageTest,
    expDate: item.expDate,
    wasRejectedBefore: item.wasRejectedBefore ?? false,
    message: item.message,
    isEdit: item.isEdit,
    evidenceUploadPath: item.evidenceUploadPath,
    sktaUploadPath: item.sktaUploadPath,
    mahasiswa: item.mahasiswa
      ? {
          id: item.mahasiswa.id,
          nim: item.mahasiswa.nim || '',
          kelasAsal: item.mahasiswa.kelasAsal || '',
          tahunAngkatan: item.mahasiswa.tahunAngkatan,
          sks: item.mahasiswa.sks,
          ipk: item.mahasiswa.ipk,
          tak: item.mahasiswa.tak,
          studyProgramId: item.mahasiswa.studyProgramId,
          dosenWaliId: item.mahasiswa.dosenWaliId,
          name: item.mahasiswa.user?.name || '',
          email: item.mahasiswa.user?.email || '',
          phone: item.mahasiswa.user?.phone || null,
          studyProgram: item.mahasiswa.studyProgram
            ? {
                id: item.mahasiswa.studyProgram.id,
                name: item.mahasiswa.studyProgram.name,
                isActive: item.mahasiswa.studyProgram.isActive,
                facultyId: item.mahasiswa.studyProgram.facultyId,
              }
            : null,
        }
      : null,
    dosenPembimbing1: item.dosenPembimbing1
      ? {
          id: item.dosenPembimbing1.id,
          nip: item.dosenPembimbing1.nip,
          nidn: item.dosenPembimbing1.nidn,
          kodeDosen: item.dosenPembimbing1.kodeDosen,
          researchGroupId: item.dosenPembimbing1.researchGroupId,
          userId: item.dosenPembimbing1.userId,
          name: item.dosenPembimbing1.user?.name || '',
          email: item.dosenPembimbing1.user?.email || '',
          phone: item.dosenPembimbing1.user?.phone || null,
        }
      : null,
    dosenPembimbing2: item.dosenPembimbing2
      ? {
          id: item.dosenPembimbing2.id,
          nip: item.dosenPembimbing2.nip,
          nidn: item.dosenPembimbing2.nidn,
          kodeDosen: item.dosenPembimbing2.kodeDosen,
          researchGroupId: item.dosenPembimbing2.researchGroupId,
          userId: item.dosenPembimbing2.userId,
          name: item.dosenPembimbing2.user?.name || '',
          email: item.dosenPembimbing2.user?.email || '',
          phone: item.dosenPembimbing2.user?.phone || null,
        }
      : null,
    researchGroup: item.researchGroup
      ? {
          id: item.researchGroup.id,
          name: item.researchGroup.name,
          isActive: item.researchGroup.isActive,
        }
      : null,
    admin: item.admin
      ? {
          id: item.admin.id,
          userId: item.admin.userId,
          name: item.admin.user?.name || '',
          email: item.admin.user?.email || '',
          phone: item.admin.user?.phone || null,
        }
      : null,
    evidenceDownloadUrl: item.evidenceUploadPath
      ? `${req.protocol}://${req.get("host")}/api/permohonan-skta/${item.id}/download/evidence`
      : null,
    sktaDownloadUrl: item.sktaUploadPath
      ? `${req.protocol}://${req.get("host")}/api/permohonan-skta/${item.id}/download/skta`
      : null,
  };
};

// [Route] Mendapatkan Semua Permohonan SKTA
const listPermohonanSkta = asyncHandler(async (req, res) => {
  const paginationParams = getPaginationParams(req.query);

  const [total, data] = await Promise.all([
    prisma.permohonanSkta.count(),
    prisma.permohonanSkta.findMany({
      skip: paginationParams.skip,
      take: paginationParams.take,
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
      orderBy: {
        createdAt: 'desc',
      },
    }),
  ]);

  const enriched = data.map((item) => mapPermohonanToFrontend(item, req));
  res.json(formatPaginationResponse(enriched, total, paginationParams));
});

// [Route] Membuat Permohonan SKTA Baru
const createPermohonanSkta = asyncHandler(async (req, res) => {
  try {
    const category = req.query.category || "Permohonan Baru";
    const {
      mahasiswaId,
      proposalTitleId,
      judulProposalIndonesia,
      proposalTitleEn,
      judulProposalInggris,
      dosenPembimbing1Id,
      dosenPembimbing2Id,
    } = req.body;

    const mhsId = mahasiswaId;
    const judulIndo = proposalTitleId || judulProposalIndonesia;
    const judulEng = proposalTitleEn || judulProposalInggris;

    if (!mhsId || !judulIndo || !judulEng || !dosenPembimbing1Id || !dosenPembimbing2Id) {
      res.status(400);
      throw new Error("Semua field wajib diisi");
    }

    const evidenceFile = getUploadedFile(req.files, "evidence");
    if (!evidenceFile) {
      res.status(400);
      throw new Error("Berkas evidence wajib diunggah");
    }

    // Cek apakah ada data mahasiswa
    const student = await prisma.mahasiswa.findFirst({
      where: { id: mhsId },
    });
    if (!student) {
      res.status(404);
      throw new Error("Mahasiswa tidak ditemukan");
    }

    // Cek apakah mahasiswa sudah punya pengajuan baru/aktif (jika mengajukan permohonan baru)
    if (category === "Permohonan Baru") {
      const existing = await prisma.permohonanSkta.findFirst({
        where: {
          mahasiswaId: mhsId,
          category: "Permohonan Baru",
          deletedAt: null,
        },
      });
      if (existing) {
        res.status(409);
        throw new Error(
          "Mahasiswa sudah memiliki pengajuan SK. Untuk pembaruan SK, gunakan kategori Perpanjangan atau Perubahan."
        );
      }
    }

    // Ambil researchGroupId otomatis dari Dosen Pembimbing 1
    const dosenPembimbing1 = await prisma.dosen.findUnique({
      where: { id: dosenPembimbing1Id },
    });
    if (!dosenPembimbing1) {
      res.status(404);
      throw new Error("Dosen pembimbing 1 tidak ditemukan");
    }
    const researchGroupId = dosenPembimbing1.researchGroupId;

    const data = await prisma.permohonanSkta.create({
      data: {
        category,
        mahasiswaId: mhsId,
        judulProposalIndonesia: judulIndo,
        judulProposalInggris: judulEng,
        dosenPembimbing1Id,
        dosenPembimbing2Id,
        researchGroupId,
        evidenceUploadPath: evidenceFile.path,
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

    res.status(201).json({
      message: "Permohonan SKTA berhasil diajukan",
      data: mapPermohonanToFrontend(data, req),
    });
  } catch (error) {
    removeUploadedFiles(req.files || req.file);
    throw error;
  }
});

// [Route] Mengedit Permohonan SKTA
const updatePermohonanSkta = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const permohonan = await prisma.permohonanSkta.findUnique({ where: { id } });
    if (!permohonan) {
      res.status(404);
      throw new Error("Permohonan SKTA tidak ditemukan");
    }

    const {
      proposalTitleId,
      judulProposalIndonesia,
      proposalTitleEn,
      judulProposalInggris,
      dosenPembimbing1Id,
      dosenPembimbing2Id,
    } = req.body;

    const judulIndo = proposalTitleId || judulProposalIndonesia;
    const judulEng = proposalTitleEn || judulProposalInggris;

    const evidenceFile = getUploadedFile(req.files, "evidence");

    const updateData = {
      judulProposalIndonesia: (judulProposalIndonesia || proposalTitleId || "").trim(),
      judulProposalInggris: (judulProposalInggris || proposalTitleEn || "").trim(),
      message: null, // Clear rejection message upon student resubmission
      isEdit: null,  // Clear revision deadline upon student resubmission
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
      if (permohonan.evidenceUploadPath && fs.existsSync(permohonan.evidenceUploadPath)) {
        fs.unlink(permohonan.evidenceUploadPath, () => {});
      }
      updateData.evidenceUploadPath = evidenceFile.path;
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
  } catch (error) {
    removeUploadedFiles(req.files || req.file);
    throw error;
  }
});

// [Route] Mendapatkan Permohonan SKTA berdasarkan ID Permohonan
const getPermohonanSktaById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = await prisma.permohonanSkta.findUnique({
    where: { id },
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

  if (!data) {
    res.status(404);
    throw new Error("Permohonan SKTA tidak ditemukan");
  }

  res.json({ data: mapPermohonanToFrontend(data, req) });
});

// [Route] Mendapatkan Permohonan SKTA Terbaru Berdasarkan ID Mahasiswa
const getLatestPermohonanSktaByMahasiswaId = asyncHandler(async (req, res) => {
  const { mahasiswaId } = req.params;
  const data = await prisma.permohonanSkta.findFirst({
    where: { mahasiswaId },
    orderBy: {
      createdAt: 'desc',
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

  const filePath = path.resolve(process.cwd(), permohonan.sktaUploadPath);
  if (!fs.existsSync(filePath)) {
    res.status(404);
    throw new Error("Berkas fisik SKTA tidak ditemukan di server");
  }

  const ext = path.extname(filePath) || ".pdf";
  const nim = sanitizeFilenamePart(permohonan.mahasiswa?.nim || "nim");
  const nama = sanitizeFilenamePart(permohonan.mahasiswa?.user?.name || "nama");
  const prodi = sanitizeFilenamePart(permohonan.mahasiswa?.studyProgram?.name || "study_program");
  const downloadName = `SKTA_${nim}_${nama}_${prodi}${ext}`;

  res.download(filePath, downloadName);
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

  const filePath = path.resolve(process.cwd(), permohonan.evidenceUploadPath);
  if (!fs.existsSync(filePath)) {
    res.status(404);
    throw new Error("Berkas fisik evidence tidak ditemukan di server");
  }

  res.download(filePath, path.basename(filePath));
});

// [Route] Menyetujui Permohonan SKTA (Approve)
const approvePermohonanSkta = asyncHandler(async (req, res) => {
  try {
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

    const {
      hasUploadedFinalProposal,
      hasTakenLanguageTest,
      expDate,
      adminId,
    } = req.body;

    const sktaFile = getUploadedFile(req.files, "skta");

    // Cek admin
    const adminExist = await prisma.admin.findUnique({ where: { id: adminId } });
    if (!adminExist) {
      res.status(404);
      throw new Error("Admin/Staf Akademik tidak ditemukan");
    }

    const updateData = {
      hasUploadedFinalProposal: hasUploadedFinalProposal === "true" || hasUploadedFinalProposal === true,
      hasTakenLanguageTest: hasTakenLanguageTest === "true" || hasTakenLanguageTest === true,
      expDate: expDate ? new Date(expDate) : null,
      adminId,
      message: null, // Hapus pesan penolakan sebelumnya jika ada
    };

    if (sktaFile) {
      if (permohonan.sktaUploadPath && fs.existsSync(permohonan.sktaUploadPath)) {
        fs.unlink(permohonan.sktaUploadPath, () => {});
      }

      const nim = sanitizeFilenamePart(permohonan.mahasiswa?.nim || "nim");
      const nama = sanitizeFilenamePart(permohonan.mahasiswa?.user?.name || "nama");
      const prodi = sanitizeFilenamePart(permohonan.mahasiswa?.studyProgram?.name || "study_program");
      const ext = path.extname(sktaFile.originalname || sktaFile.filename || ".pdf") || ".pdf";
      const timestamp = Date.now();
      const customFilename = `SKTA_${nim}_${nama}_${prodi}_${timestamp}${ext}`;

      const targetDir = path.dirname(sktaFile.path);
      const newFilePath = path.join(targetDir, customFilename);

      fs.renameSync(sktaFile.path, newFilePath);
      updateData.sktaUploadPath = newFilePath;
    }

    const data = await prisma.permohonanSkta.update({
      where: { id },
      data: updateData,
    });

    res.json({
      message: "Permohonan SKTA berhasil disetujui",
      data: mapPermohonanToFrontend(data, req),
    });
  } catch (error) {
    removeUploadedFiles(req.files || req.file);
    throw error;
  }
});

// [Route] Menolak Permohonan SKTA (Reject)
const rejectPermohonanSkta = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const permohonan = await prisma.permohonanSkta.findUnique({ where: { id } });
  if (!permohonan) {
    res.status(404);
    throw new Error("Permohonan SKTA tidak ditemukan");
  }

  const { message, adminId } = req.body;

  // Cek admin
  const adminExist = await prisma.admin.findUnique({ where: { id: adminId } });
  if (!adminExist) {
    res.status(404);
    throw new Error("Admin/Staf Akademik tidak ditemukan");
  }

  const data = await prisma.permohonanSkta.update({
     where: { id },
     data: {
       wasRejectedBefore: true,
       message,
       adminId,
       isEdit: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Memberikan izin edit selama 7 hari ke depan
     },
  });

  res.json({
    message: "Permohonan SKTA berhasil ditolak",
    data: mapPermohonanToFrontend(data, req),
  });
});

// [Route] Generate Dokumen Validasi SKTA
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

  if (existingBerkas) {
    return res.json({
      message: "Berkas validasi SKTA berhasil ditemukan (existing)",
      data: {
        ...existingBerkas,
        downloadUrl: buildDownloadUrl(req, existingBerkas.id),
      },
    });
  }

  // Jika tidak ada, generate data berkas baru
  const uploadPath = "uploads/berkas-mahasiswa";
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }

  const filename = `${uuidv4()}.pdf`;
  const filepath = path.join(uploadPath, filename);

  // Buffer PDF minimal yang valid
  const minimalPDFBuffer = Buffer.from(
    '%PDF-1.4\n' +
    '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
    '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
    '3 0 obj<</Type/Page/Parent 2 0 R/Resources<<>>/MediaBox[0 0 595 842]/Contents 4 0 R>>endobj\n' +
    '4 0 obj<</Length 49>>stream\n' +
    'BT\n' +
    '/F1 12 Tf\n' +
    '72 712 Td\n' +
    '(Dokumen Validasi SKTA Mahasiswa) Tj\n' +
    'ET\n' +
    'endstream\n' +
    'endobj\n' +
    'xref\n' +
    '0 5\n' +
    '0000000000 65535 f\n' +
    '0000000009 00000 n\n' +
    '0000000052 00000 n\n' +
    '0000000101 00000 n\n' +
    '0000000196 00000 n\n' +
    'trailer<</Size 5/Root 1 0 R>>\n' +
    'startxref\n' +
    '296\n' +
    '%%EOF'
  );

  fs.writeFileSync(filepath, minimalPDFBuffer);

  const nim = permohonan.mahasiswa?.nim || mahasiswaId;
  const name = `Dokumen_Validasi_SKTA_${nim}.pdf`;

  const createdUpload = await prisma.berkasMahasiswa.create({
    data: {
      id: uuidv4(),
      name,
      category,
      filepath,
      mahasiswaId,
    },
  });

  res.status(201).json({
    message: "Berkas validasi SKTA berhasil di-generate",
    data: {
      ...createdUpload,
      downloadUrl: buildDownloadUrl(req, createdUpload.id),
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

  const filePath = path.resolve(process.cwd(), upload.filepath);

  if (!fs.existsSync(filePath)) {
    res.status(404);
    throw new Error("File fisik tidak ditemukan di server");
  }

  res.download(filePath, upload.name);
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
    const validDateField = ["createdAt", "updatedAt", "expDate"].includes(dateField)
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
    throw new Error("Tidak ada berkas SKTA yang sesuai dengan filter yang dipilih");
  }

  const validFiles = [];
  const usedEntryNames = new Set();

  for (const item of list) {
    if (!item.sktaUploadPath) continue;
    const fullPath = path.resolve(process.cwd(), item.sktaUploadPath);
    if (fs.existsSync(fullPath)) {
      const ext = path.extname(fullPath) || ".pdf";
      const nim = sanitizeFilenamePart(item.mahasiswa?.nim || "nim");
      const nama = sanitizeFilenamePart(item.mahasiswa?.user?.name || "nama");
      const prodi = sanitizeFilenamePart(item.mahasiswa?.studyProgram?.name || "study_program");

      let entryName = `SKTA_${nim}_${nama}_${prodi}${ext}`;

      // Mencegah duplikasi nama di dalam zip yang sama
      if (usedEntryNames.has(entryName)) {
        const timePart = item.createdAt ? new Date(item.createdAt).getTime() : Date.now();
        entryName = `SKTA_${nim}_${nama}_${prodi}_${timePart}${ext}`;
        if (usedEntryNames.has(entryName)) {
          entryName = `SKTA_${nim}_${nama}_${prodi}_${item.id.slice(0, 8)}${ext}`;
        }
      }
      usedEntryNames.add(entryName);

      validFiles.push({
        fullPath,
        entryName,
      });
    }
  }

  if (validFiles.length === 0) {
    res.status(404);
    throw new Error("Berkas fisik SKTA tidak ditemukan di server");
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
    archive.file(file.fullPath, { name: file.entryName });
  }

  await archive.finalize();
});

export {
  listPermohonanSkta,
  createPermohonanSkta,
  updatePermohonanSkta,
  getPermohonanSktaById,
  getLatestPermohonanSktaByMahasiswaId,
  downloadSkta,
  downloadEvidence,
  approvePermohonanSkta,
  rejectPermohonanSkta,
  generateDokumenValidasiSkta,
  downloadValidasi,
  exportSktaZip,
};
