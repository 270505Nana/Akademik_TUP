import asyncHandler from "express-async-handler";
import prisma from "../config/prisma.js";
import path from "path";
import {
  sendValidationError,
  isNil,
  parseBoolean,
  isValidISO8601,
} from "../utils/validationHelper.js";
import {
  getPaginationParams,
  formatPaginationResponse,
} from "../utils/paginationHelper.js";
import {
  uploadFile,
  deleteFile,
  serveDownload,
} from "../services/storageService.js";

// Constants for File Validation (Lama - dicomment)
// const REQUIRED_SLUGS = [
//   "berkas-form-validasi-dosen-wali",
//   "berkas-rekomendasi-sidang-pembimbing",
//   "berkas-scan-pernyataan-biodata-ijazah-bermaterai",
//   "berkas-dummy-ijazah-bermaterai",
//   "berkas-scan-akta-kelahiran",
//   "berkas-scan-ijazah-terakhir",
//   "berkas-scan-khs-dengan-ttd-doswal-kaprodi",
//   "berkas-log-bimbingan",
//   "berkas-sertifikat-tak",
//   "berkas-rekomendasi-berkas-evidence-ta-pa-igracias-pembimbing",
//   "upload-draft-buku-ta-siap-sidang",
// ];
//
// const NON_SIDANG_SLUGS = {
//   "Publikasi Jurnal": [
//     "berkas-loa-jurnal",
//     "berkas-persetujuan-publikasi-ta-sebagai-pengganti-sidang-jurnal",
//     "berkas-camera-ready-paper-yang-sudah-terbit",
//     "berkas-camera-ready-paper-jurnal",
//     "berkas-riwayat-review-oleh-reviewers",
//     "berkas-response-jurnal",
//   ],
//   "Proceeding International": [
//     "berkas-loa-proceeding",
//     "berkas-persetujuan-publikasi-ta-sebagai-pengganti-sidang-proceeding",
//     "berkas-camera-ready-paper-proceeding",
//     "berkas-pakta-integritas",
//     "berkas-response-proceeding",
//   ],
//   HKI: [
//     "sertifikat-hki",
//     "sertifikat-dari-mitra-dudi",
//     "sertifikat-pendukung-lainnya",
//   ],
// };

const NON_SIDANG_CATEGORY_MAP = {
  "Publikasi Jurnal": "Sidang - Evidence Non Sidang Publikasi Jurnal",
  "Proceeding International":
    "Sidang - Evidence Non Sidang Proceeding International",
  HKI: "Sidang - Evidence Non Sidang HKI",
};

// Ambil slug berkas wajib sidang dari database dokumen persyaratan berkas
const getRequiredSlugsFromDb = async () => {
  const docs = await prisma.dokumenPersyaratanBerkas.findMany({
    where: {
      category: {
        in: ["Sidang - Berkas Wajib"],
      },
      deletedAt: null,
    },
    select: { code: true },
  });
  return docs.map((doc) => doc.code);
};

// Ambil slug berkas evidence non sidang dari database dokumen persyaratan berkas sesuai jalur
const getNonSidangSlugsFromDb = async (jalur) => {
  const categoryName =
    NON_SIDANG_CATEGORY_MAP[jalur] || `Sidang - Evidence Non Sidang ${jalur}`;
  const docs = await prisma.dokumenPersyaratanBerkas.findMany({
    where: {
      category: {
        in: [categoryName],
      },
      deletedAt: null,
    },
    select: { code: true },
  });
  return docs.map((doc) => doc.code);
};

const mapMahasiswa = (mahasiswa) => {
  if (!mahasiswa) return null;
  return {
    id: mahasiswa.id,
    nim: mahasiswa.nim || "",
    kelasAsal: mahasiswa.kelasAsal || "",
    tahunAngkatan: mahasiswa.tahunAngkatan,
    sks: mahasiswa.sks,
    ipk: mahasiswa.ipk,
    tak: mahasiswa.tak,
    studyProgramId: mahasiswa.studyProgramId,
    dosenWaliId: mahasiswa.dosenWaliId,
    name: mahasiswa.user?.name || "",
    email: mahasiswa.user?.email || "",
    phone: mahasiswa.user?.phone || null,
    studyProgram: mahasiswa.studyProgram
      ? {
          id: mahasiswa.studyProgram.id,
          name: mahasiswa.studyProgram.name,
          isActive: mahasiswa.studyProgram.isActive,
          facultyId: mahasiswa.studyProgram.facultyId,
        }
      : null,
  };
};

const mapDosen = (dosen) => {
  if (!dosen) return null;
  return {
    id: dosen.id,
    nip: dosen.nip,
    nidn: dosen.nidn,
    kodeDosen: dosen.kodeDosen,
    researchGroupId: dosen.researchGroupId,
    userId: dosen.userId,
    name: dosen.user?.name || "",
    email: dosen.user?.email || "",
    phone: dosen.user?.phone || null,
  };
};

const mapAdmin = (admin) => {
  if (!admin) return null;
  return {
    id: admin.id,
    userId: admin.userId,
    name: admin.user?.name || "",
    email: admin.user?.email || "",
    phone: admin.user?.phone || null,
  };
};

const mapSidangRegistrationToFrontend = (item, req) => {
  if (!item) return null;
  return {
    id: item.id,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    isDraft: item.isDraft,
    mahasiswaId: item.mahasiswaId,
    program: item.program,
    dosenWaliId: item.dosenWaliId,
    sks: item.sks,
    ipk: item.ipk,
    tak: item.tak,
    sktaExpDate: item.sktaExpDate,
    judulTugasAkhirIndonesia: item.judulTugasAkhirIndonesia,
    judulTugasAkhirInggris: item.judulTugasAkhirInggris,
    dosenPembimbing1Id: item.dosenPembimbing1Id,
    dosenPembimbing2Id: item.dosenPembimbing2Id,
    researchGroupId: item.researchGroupId,
    skemaSidang: item.skemaSidang,
    jalurNonSidang: item.jalurNonSidang || [],
    lulusTesBahasa: item.lulusTesBahasa,
    submittedAt: item.submittedAt,
    sidangRegistrationPeriodId: item.sidangRegistrationPeriodId,
    sidangPeriodId: item.sidangPeriodId,
    message: item.message,
    isEdit: item.isEdit,
    adminId: item.adminId,
    mahasiswa: mapMahasiswa(item.mahasiswa),
    dosenWali: mapDosen(item.dosenWali),
    dosenPembimbing1: mapDosen(item.dosenPembimbing1),
    dosenPembimbing2: mapDosen(item.dosenPembimbing2),
    researchGroup: item.researchGroup
      ? {
          id: item.researchGroup.id,
          name: item.researchGroup.name,
          isActive: item.researchGroup.isActive,
        }
      : null,
    admin: mapAdmin(item.admin),
    sidangRegistrationPeriod: item.sidangRegistrationPeriod
      ? {
          id: item.sidangRegistrationPeriod.id,
          name: item.sidangRegistrationPeriod.name,
          category: item.sidangRegistrationPeriod.category,
          period: item.sidangRegistrationPeriod.period,
          startDate: item.sidangRegistrationPeriod.startDate,
          endDate: item.sidangRegistrationPeriod.endDate,
          isOpen: item.sidangRegistrationPeriod.isOpen,
        }
      : null,
    sidangPeriod: item.sidangPeriod
      ? {
          id: item.sidangPeriod.id,
          name: item.sidangPeriod.name,
          category: item.sidangPeriod.category,
          period: item.sidangPeriod.period,
          startDate: item.sidangPeriod.startDate,
          endDate: item.sidangPeriod.endDate,
          isOpen: item.sidangPeriod.isOpen,
        }
      : null,
    sidangRegistrationUploads: item.sidangRegistrationUploads
      ? item.sidangRegistrationUploads.map((upload) => ({
          id: upload.id,
          name: upload.name,
          category: upload.category,
          filepath: upload.filepath,
          isValid: upload.isValid,
          sidangRegistrationId: upload.sidangRegistrationId,
          downloadUrl: `${req.protocol}://${req.get("host")}/api/sidang-registrations/uploads/${upload.id}/download`,
        }))
      : [],
  };
};

const sidangInclude = {
  mahasiswa: {
    include: {
      studyProgram: true,
      user: true,
    },
  },
  dosenWali: {
    include: {
      user: true,
    },
  },
  dosenPembimbing1: {
    include: {
      user: true,
    },
  },
  dosenPembimbing2: {
    include: {
      user: true,
    },
  },
  researchGroup: true,
  admin: {
    include: {
      user: true,
    },
  },
  sidangRegistrationPeriod: true,
  sidangPeriod: true,
  sidangRegistrationUploads: true,
};

const checkSidangEditable = async (registrationId) => {
  const registration = await prisma.sidangRegistration.findUnique({
    where: { id: registrationId },
  });

  if (!registration) {
    return {
      exists: false,
      editable: false,
      reason: "Pendaftaran sidang tidak ditemukan.",
    };
  }

  if (!registration.isDraft) {
    const hasActiveEditPermission =
      registration.isEdit && new Date(registration.isEdit) > new Date();

    if (!hasActiveEditPermission) {
      return {
        exists: true,
        editable: false,
        reason:
          "Pendaftaran sudah dikirim dan tidak memiliki izin edit yang aktif.",
      };
    }
  }

  if (registration.isEdit) {
    const isEditExpired = new Date(registration.isEdit) < new Date();
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

// Sidang Registration List
const listSidangRegistrations = asyncHandler(async (req, res) => {
  const paginationParams = getPaginationParams(req.query);

  const [total, sidangRegistrations] = await Promise.all([
    prisma.sidangRegistration.count(),
    prisma.sidangRegistration.findMany({
      skip: paginationParams.skip,
      take: paginationParams.take,
      include: sidangInclude,
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  const data = sidangRegistrations.map((reg) =>
    mapSidangRegistrationToFrontend(reg, req),
  );

  res.json(formatPaginationResponse(data, total, paginationParams));
});

// Get Sidang Registration by ID
const getSidangRegistrationById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const sidangRegistration = await prisma.sidangRegistration.findUnique({
    where: {
      id,
    },
    include: sidangInclude,
  });

  if (!sidangRegistration) {
    res.status(404);
    throw new Error("Pendaftaran sidang tidak ditemukan");
  }

  res.json({
    data: mapSidangRegistrationToFrontend(sidangRegistration, req),
  });
});

// Get Sidang Registration by Mahasiswa ID
const getSidangRegistrationByMahasiswaId = asyncHandler(async (req, res) => {
  const { mahasiswaId } = req.params;

  const sidangRegistration = await prisma.sidangRegistration.findFirst({
    where: {
      mahasiswaId,
    },
    include: sidangInclude,
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!sidangRegistration) {
    res.status(404);
    throw new Error("Pendaftaran sidang tidak ditemukan");
  }

  res.json({
    data: mapSidangRegistrationToFrontend(sidangRegistration, req),
  });
});

// Save Draft Sidang Registration (Upsert)
const saveSidangRegistration = asyncHandler(async (req, res) => {
  const {
    id,
    programType,
    sidangScheme,
    jalurNonSidang,
    lulusTesBahasa,
    sks,
    ipk,
    tak,
    sktaExpDate,
    thesisTitleId,
    thesisTitleEn,
    mahasiswaId,
    dosenPembimbing1Id,
    dosenPembimbing2Id,
  } = req.body;

  const parsedLulusTesBahasa = parseBoolean(lulusTesBahasa);

  const errors = [];

  if (!isNil(id) && typeof id !== "string") {
    errors.push({ field: "id", message: "ID harus berupa string" });
  }

  if (!isNil(programType) && typeof programType !== "string") {
    errors.push({
      field: "programType",
      message: "Tipe program harus berupa string",
    });
  }

  if (!isNil(jalurNonSidang) && !Array.isArray(jalurNonSidang)) {
    errors.push({
      field: "jalurNonSidang",
      message: "Jalur non sidang harus berupa array jika diisi",
    });
  }

  if (!isNil(lulusTesBahasa) && parsedLulusTesBahasa === undefined) {
    errors.push({
      field: "lulusTesBahasa",
      message: "lulusTesBahasa harus berupa boolean",
    });
  }

  if (!isNil(sks) && isNaN(parseInt(sks))) {
    errors.push({ field: "sks", message: "SKS harus berupa integer" });
  }

  if (!isNil(ipk) && isNaN(parseFloat(ipk))) {
    errors.push({ field: "ipk", message: "IPK harus berupa float" });
  }

  if (!isNil(tak) && isNaN(parseInt(tak))) {
    errors.push({ field: "tak", message: "TAK harus berupa integer" });
  }

  if (!isNil(sktaExpDate) && !isValidISO8601(sktaExpDate)) {
    errors.push({
      field: "sktaExpDate",
      message:
        "Tanggal berlaku SKTA harus berupa tanggal yang valid (format ISO 8601)",
    });
  }

  if (!isNil(thesisTitleId) && typeof thesisTitleId !== "string") {
    errors.push({
      field: "thesisTitleId",
      message: "Judul TA (ID) harus berupa string",
    });
  }

  if (!isNil(thesisTitleEn) && typeof thesisTitleEn !== "string") {
    errors.push({
      field: "thesisTitleEn",
      message: "Judul TA (EN) harus berupa string",
    });
  }

  if (!isNil(mahasiswaId) && typeof mahasiswaId !== "string") {
    errors.push({
      field: "mahasiswaId",
      message: "ID mahasiswa harus berupa string",
    });
  }

  if (!isNil(dosenPembimbing1Id) && typeof dosenPembimbing1Id !== "string") {
    errors.push({
      field: "dosenPembimbing1Id",
      message: "ID dosen pembimbing 1 harus berupa string",
    });
  }

  if (!isNil(dosenPembimbing2Id) && typeof dosenPembimbing2Id !== "string") {
    errors.push({
      field: "dosenPembimbing2Id",
      message: "ID dosen pembimbing 2 harus berupa string",
    });
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  // Validate references if provided
  if (mahasiswaId) {
    const studentExists = await prisma.mahasiswa.findUnique({
      where: { id: mahasiswaId },
    });
    if (!studentExists) {
      res.status(404);
      throw new Error("Mahasiswa tidak ditemukan");
    }
  }

  if (dosenPembimbing1Id) {
    const dosenExists = await prisma.dosen.findUnique({
      where: { id: dosenPembimbing1Id },
    });
    if (!dosenExists) {
      res.status(404);
      throw new Error("Dosen pembimbing 1 tidak ditemukan");
    }
  }

  if (dosenPembimbing2Id) {
    const dosenExists = await prisma.dosen.findUnique({
      where: { id: dosenPembimbing2Id },
    });
    if (!dosenExists) {
      res.status(404);
      throw new Error("Dosen pembimbing 2 tidak ditemukan");
    }
  }

  // Get active registration period
  const activePeriod = await prisma.sidangPeriod.findFirst({
    where: { category: "pendaftaran sidang", isOpen: true, deletedAt: null },
  });

  // Check edit permission if updating an existing registration by ID
  if (id) {
    const editCheck = await checkSidangEditable(id);
    if (!editCheck.exists) {
      res.status(404);
      throw new Error(editCheck.reason);
    }
    if (!editCheck.editable) {
      res.status(403);
      throw new Error(editCheck.reason);
    }
  }

  // Map req.body field names → Prisma model field names (source of truth: schema.prisma)
  const upsertData = {
    program: programType !== undefined ? programType : undefined, // Prisma: program
    skemaSidang: sidangScheme !== undefined ? sidangScheme : undefined, // Prisma: skemaSidang
    jalurNonSidang: jalurNonSidang !== undefined ? jalurNonSidang : undefined,
    lulusTesBahasa:
      parsedLulusTesBahasa !== undefined
        ? parsedLulusTesBahasa
        : undefined,
    sks: sks !== undefined ? parseInt(sks) : undefined,
    ipk: ipk !== undefined ? parseFloat(ipk) : undefined,
    tak: tak !== undefined ? parseInt(tak) : undefined,
    sktaExpDate: sktaExpDate ? new Date(sktaExpDate) : undefined,
    judulTugasAkhirIndonesia:
      thesisTitleId !== undefined ? thesisTitleId : undefined, // Prisma: judulTugasAkhirIndonesia
    judulTugasAkhirInggris:
      thesisTitleEn !== undefined ? thesisTitleEn : undefined, // Prisma: judulTugasAkhirInggris
    mahasiswaId: mahasiswaId !== undefined ? mahasiswaId : undefined,
    dosenPembimbing1Id:
      dosenPembimbing1Id !== undefined ? dosenPembimbing1Id : undefined,
    dosenPembimbing2Id:
      dosenPembimbing2Id !== undefined ? dosenPembimbing2Id : undefined,
    isDraft: true,
  };

  let sidangRegistration;

  if (id) {
    // Update existing
    sidangRegistration = await prisma.sidangRegistration.update({
      where: { id },
      data: upsertData,
      include: sidangInclude,
    });
  } else if (mahasiswaId) {
    // Look for existing draft
    const existing = await prisma.sidangRegistration.findFirst({
      where: { mahasiswaId },
      orderBy: { createdAt: "desc" },
    });

    if (existing && existing.isDraft) {
      const editCheck = await checkSidangEditable(existing.id);
      if (!editCheck.editable) {
        res.status(403);
        throw new Error(editCheck.reason);
      }

      sidangRegistration = await prisma.sidangRegistration.update({
        where: { id: existing.id },
        data: upsertData,
        include: sidangInclude,
      });
    } else {
      // Creating a new registration: Must have an active open period
      if (!activePeriod) {
        res.status(400);
        throw new Error(
          "Tidak ada periode pendaftaran sidang yang aktif saat ini.",
        );
      }

      // Check if student is already registered in this active period
      const existingInPeriod = await prisma.sidangRegistration.findFirst({
        where: {
          mahasiswaId,
          sidangRegistrationPeriodId: activePeriod.id,
          deletedAt: null,
        },
      });

      if (existingInPeriod) {
        res.status(400);
        throw new Error(
          "Mahasiswa sudah terdaftar pada periode pendaftaran sidang yang aktif.",
        );
      }

      upsertData.sidangRegistrationPeriodId = activePeriod.id;

      sidangRegistration = await prisma.sidangRegistration.create({
        data: upsertData,
        include: sidangInclude,
      });
    }
  } else {
    // Create new
    if (!activePeriod) {
      res.status(400);
      throw new Error(
        "Tidak ada periode pendaftaran sidang yang aktif saat ini.",
      );
    }

    upsertData.sidangRegistrationPeriodId = activePeriod.id;

    sidangRegistration = await prisma.sidangRegistration.create({
      data: upsertData,
      include: sidangInclude,
    });
  }

  res.status(200).json({
    message: "Sidang registration saved as draft successfully",
    data: mapSidangRegistrationToFrontend(sidangRegistration, req),
  });
});

// Submit Sidang Registration (Update isDraft to false with Validation)
const submitSidangRegistration = asyncHandler(async (req, res) => {
  const {
    id,
    programType,
    sidangScheme,
    jalurNonSidang,
    lulusTesBahasa,
    sks,
    ipk,
    tak,
    sktaExpDate,
    thesisTitleId,
    thesisTitleEn,
    mahasiswaId,
    dosenPembimbing1Id,
    dosenPembimbing2Id,
  } = req.body;

  const parsedLulusTesBahasa = parseBoolean(lulusTesBahasa);

  const errors = [];

  if (isNil(id)) {
    errors.push({ field: "id", message: "ID wajib diisi untuk submit" });
  } else if (typeof id !== "string") {
    errors.push({ field: "id", message: "ID harus berupa string" });
  }

  if (isNil(programType)) {
    errors.push({ field: "programType", message: "Tipe program wajib diisi" });
  } else if (typeof programType !== "string") {
    errors.push({
      field: "programType",
      message: "Tipe program harus berupa string",
    });
  }

  if (!isNil(jalurNonSidang) && !Array.isArray(jalurNonSidang)) {
    errors.push({
      field: "jalurNonSidang",
      message: "Jalur non sidang harus berupa array jika diisi",
    });
  }

  if (!isNil(lulusTesBahasa) && parsedLulusTesBahasa === undefined) {
    errors.push({
      field: "lulusTesBahasa",
      message: "lulusTesBahasa harus berupa boolean",
    });
  }

  if (isNil(sks)) {
    errors.push({ field: "sks", message: "SKS wajib diisi" });
  } else if (isNaN(parseInt(sks))) {
    errors.push({ field: "sks", message: "SKS harus berupa integer" });
  }

  if (isNil(ipk)) {
    errors.push({ field: "ipk", message: "IPK wajib diisi" });
  } else if (isNaN(parseFloat(ipk))) {
    errors.push({ field: "ipk", message: "IPK harus berupa float" });
  }

  if (isNil(tak)) {
    errors.push({ field: "tak", message: "TAK wajib diisi" });
  } else if (isNaN(parseInt(tak))) {
    errors.push({ field: "tak", message: "TAK harus berupa integer" });
  }

  if (isNil(sktaExpDate)) {
    errors.push({
      field: "sktaExpDate",
      message: "Tanggal berlaku SKTA wajib diisi",
    });
  } else if (!isValidISO8601(sktaExpDate)) {
    errors.push({
      field: "sktaExpDate",
      message:
        "Tanggal berlaku SKTA harus berupa tanggal yang valid (format ISO 8601)",
    });
  }

  if (isNil(thesisTitleId)) {
    errors.push({
      field: "thesisTitleId",
      message: "Judul TA (ID) wajib diisi",
    });
  } else if (typeof thesisTitleId !== "string") {
    errors.push({
      field: "thesisTitleId",
      message: "Judul TA (ID) harus berupa string",
    });
  }

  if (isNil(thesisTitleEn)) {
    errors.push({
      field: "thesisTitleEn",
      message: "Judul TA (EN) wajib diisi",
    });
  } else if (typeof thesisTitleEn !== "string") {
    errors.push({
      field: "thesisTitleEn",
      message: "Judul TA (EN) harus berupa string",
    });
  }

  if (isNil(mahasiswaId)) {
    errors.push({ field: "mahasiswaId", message: "ID mahasiswa wajib diisi" });
  } else if (typeof mahasiswaId !== "string") {
    errors.push({
      field: "mahasiswaId",
      message: "ID mahasiswa harus berupa string",
    });
  }

  if (isNil(dosenPembimbing1Id)) {
    errors.push({
      field: "dosenPembimbing1Id",
      message: "ID dosen pembimbing 1 wajib diisi",
    });
  } else if (typeof dosenPembimbing1Id !== "string") {
    errors.push({
      field: "dosenPembimbing1Id",
      message: "ID dosen pembimbing 1 harus berupa string",
    });
  }

  if (isNil(dosenPembimbing2Id)) {
    errors.push({
      field: "dosenPembimbing2Id",
      message: "ID dosen pembimbing 2 wajib diisi",
    });
  } else if (typeof dosenPembimbing2Id !== "string") {
    errors.push({
      field: "dosenPembimbing2Id",
      message: "ID dosen pembimbing 2 harus berupa string",
    });
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  const existingRegistration = await prisma.sidangRegistration.findUnique({
    where: { id },
    include: {
      sidangRegistrationUploads: true,
    },
  });

  if (!existingRegistration) {
    res.status(404);
    throw new Error("Pendaftaran sidang tidak ditemukan");
  }

  const editCheck = await checkSidangEditable(id);
  if (!editCheck.editable) {
    res.status(403);
    throw new Error(editCheck.reason);
  }

  // Update field sebelum validasi (supaya merge) — gunakan nama field Prisma sebagai key
  const updateData = {
    program: programType !== undefined ? programType : undefined, // Prisma: program
    skemaSidang: sidangScheme !== undefined ? sidangScheme : undefined, // Prisma: skemaSidang
    jalurNonSidang: jalurNonSidang !== undefined ? jalurNonSidang : undefined,
    lulusTesBahasa:
      parsedLulusTesBahasa !== undefined
        ? parsedLulusTesBahasa
        : undefined,
    sks: sks !== undefined ? parseInt(sks) : undefined,
    ipk: ipk !== undefined ? parseFloat(ipk) : undefined,
    tak: tak !== undefined ? parseInt(tak) : undefined,
    sktaExpDate: sktaExpDate ? new Date(sktaExpDate) : undefined,
    judulTugasAkhirIndonesia:
      thesisTitleId !== undefined ? thesisTitleId : undefined, // Prisma: judulTugasAkhirIndonesia
    judulTugasAkhirInggris:
      thesisTitleEn !== undefined ? thesisTitleEn : undefined, // Prisma: judulTugasAkhirInggris
    mahasiswaId: mahasiswaId !== undefined ? mahasiswaId : undefined,
    dosenPembimbing1Id:
      dosenPembimbing1Id !== undefined ? dosenPembimbing1Id : undefined,
    dosenPembimbing2Id:
      dosenPembimbing2Id !== undefined ? dosenPembimbing2Id : undefined,
    isEdit: null,
    message: null,
  };

  const activePeriod = await prisma.sidangPeriod.findFirst({
    where: { category: "pendaftaran sidang", isOpen: true, deletedAt: null },
  });

  if (existingRegistration.sidangRegistrationPeriodId) {
    const period = await prisma.sidangPeriod.findUnique({
      where: { id: existingRegistration.sidangRegistrationPeriodId },
    });
    if (!period || !period.isOpen) {
      res.status(400);
      throw new Error("Periode pendaftaran sidang ini sudah ditutup.");
    }
  } else {
    if (!activePeriod) {
      res.status(400);
      throw new Error(
        "Tidak ada periode pendaftaran sidang yang aktif saat ini.",
      );
    }
    updateData.sidangRegistrationPeriodId = activePeriod.id;
  }

  const mergedData = { ...existingRegistration, ...updateData };

  // 1. Validasi Field Required — pakai nama field Prisma agar cocok saat merge dengan existingRegistration
  const requiredFields = [
    "program",
    "sks",
    "ipk",
    "tak",
    "sktaExpDate",
    "judulTugasAkhirIndonesia",
    "judulTugasAkhirInggris",
    "mahasiswaId",
    "dosenPembimbing1Id",
    "dosenPembimbing2Id",
  ];

  const missingFields = requiredFields.filter(
    (field) => mergedData[field] === null || mergedData[field] === undefined,
  );

  if (missingFields.length > 0) {
    res.status(400);
    throw new Error(
      `Tidak dapat submit. Field wajib belum lengkap: ${missingFields.join(", ")}`,
    );
  }

  // 2. Validasi Uploaded Files
  const uploadedCategories = (
    existingRegistration.sidangRegistrationUploads || []
  ).map((upload) => upload.category);

  const missingFiles = [];

  // Wajib (ambil dari database dokumen persyaratan berkas)
  const requiredSlugs = await getRequiredSlugsFromDb();
  for (const slug of requiredSlugs) {
    if (!uploadedCategories.includes(slug)) missingFiles.push(slug);
  }

  // Jalur Non Sidang (ambil dari database dokumen persyaratan berkas sesuai jalur)
  if (mergedData.jalurNonSidang && Array.isArray(mergedData.jalurNonSidang)) {
    for (const jalur of mergedData.jalurNonSidang) {
      const nonSidangSlugs = await getNonSidangSlugsFromDb(jalur);
      for (const slug of nonSidangSlugs) {
        if (!uploadedCategories.includes(slug)) missingFiles.push(slug);
      }
    }
  }

  if (missingFiles.length > 0) {
    res.status(400);
    throw new Error(
      `Tidak dapat submit. Berkas wajib belum lengkap: ${missingFiles.join(", ")}`,
    );
  }

  // Validasi referensi eksis
  if (mergedData.mahasiswaId) {
    const s = await prisma.mahasiswa.findUnique({
      where: { id: mergedData.mahasiswaId },
    });
    if (!s) {
      res.status(404);
      throw new Error("Mahasiswa tidak ditemukan");
    }
  }
  if (mergedData.dosenPembimbing1Id) {
    const d1 = await prisma.dosen.findUnique({
      where: { id: mergedData.dosenPembimbing1Id },
    });
    if (!d1) {
      res.status(404);
      throw new Error("Dosen pembimbing 1 tidak ditemukan");
    }
  }
  if (mergedData.dosenPembimbing2Id) {
    const d2 = await prisma.dosen.findUnique({
      where: { id: mergedData.dosenPembimbing2Id },
    });
    if (!d2) {
      res.status(404);
      throw new Error("Dosen pembimbing 2 tidak ditemukan");
    }
  }

  // Jika lulusTesBahasa bernilai true, hapus semua berkas SidangRegistrationUpload milik SidangRegistration tersebut dengan category "Sidang - Berkas Tes Bahasa (Belum)"
  if (mergedData.lulusTesBahasa === true) {
    const tesBahasaBelumDocs = await prisma.dokumenPersyaratanBerkas.findMany({
      where: {
        category: "Sidang - Berkas Tes Bahasa (Belum)",
        deletedAt: null,
      },
      select: { code: true },
    });
    const tesBahasaBelumCodes = tesBahasaBelumDocs.map((doc) => doc.code);
    const categoriesToDelete = Array.from(
      new Set(["Sidang - Berkas Tes Bahasa (Belum)", ...tesBahasaBelumCodes])
    );

    const uploadsToDelete = await prisma.sidangRegistrationUpload.findMany({
      where: {
        sidangRegistrationId: id,
        category: { in: categoriesToDelete },
      },
    });

    for (const upload of uploadsToDelete) {
      if (upload.filepath) {
        await deleteFile(upload.filepath);
      }
    }

    if (uploadsToDelete.length > 0) {
      await prisma.sidangRegistrationUpload.deleteMany({
        where: {
          id: { in: uploadsToDelete.map((u) => u.id) },
        },
      });
    }
  }

  updateData.isDraft = false; // Finalize submit
  updateData.submittedAt = new Date(); // Record student submission time

  const updatedSidangRegistration = await prisma.sidangRegistration.update({
    where: { id },
    data: updateData,
    include: sidangInclude,
  });

  res.status(200).json({
    message: "Sidang registration submitted successfully",
    data: mapSidangRegistrationToFrontend(updatedSidangRegistration, req),
  });
});

// Delete Sidang Registration (soft delete)
const deleteSidangRegistration = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const sidangRegistrationExists = await prisma.sidangRegistration.findUnique({
    where: { id },
  });

  if (!sidangRegistrationExists) {
    res.status(404);
    throw new Error("Pendaftaran sidang tidak ditemukan");
  }

  const deletedSidangRegistration = await prisma.sidangRegistration.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  });

  res.json({
    message: "Sidang registration deleted successfully",
    data: deletedSidangRegistration,
  });
});

// Upload Dokumen Persyaratan Sidang
const uploadSidangRegistrationFile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { slug, category, name } = req.body;
  const fileCategory = category || slug;
  const file = req.files?.file?.[0] || req.file;

  if (!file) {
    res.status(400);
    throw new Error("Tidak ada file yang diunggah");
  }

  if (!fileCategory || !name) {
    res.status(400);
    throw new Error("Kategori (slug) dan nama berkas wajib diisi");
  }

  const editCheck = await checkSidangEditable(id);
  if (!editCheck.exists) {
    res.status(404);
    throw new Error(editCheck.reason);
  }

  if (!editCheck.editable) {
    res.status(403);
    throw new Error(editCheck.reason);
  }

  // Upload file via Storage Service (R2 atau Local)
  const uploaded = await uploadFile({
    buffer: file.buffer,
    originalname: file.originalname,
    folder: "sidang-registrations",
    mimetype: file.mimetype,
  });

  const existingUpload = await prisma.sidangRegistrationUpload.findFirst({
    where: {
      sidangRegistrationId: id,
      category: fileCategory,
    },
  });

  let uploadRecord;

  if (existingUpload) {
    if (existingUpload.filepath) {
      await deleteFile(existingUpload.filepath);
    }

    uploadRecord = await prisma.sidangRegistrationUpload.update({
      where: { id: existingUpload.id },
      data: {
        name,
        filepath: uploaded.filepath,
        isValid: null,
      },
    });
  } else {
    uploadRecord = await prisma.sidangRegistrationUpload.create({
      data: {
        name,
        category: fileCategory,
        filepath: uploaded.filepath,
        sidangRegistrationId: id,
        isValid: null,
      },
    });
  }

  const responseData = {
    id: uploadRecord.id,
    name: uploadRecord.name,
    category: uploadRecord.category,
    filepath: uploadRecord.filepath,
    isValid: uploadRecord.isValid,
    sidangRegistrationId: uploadRecord.sidangRegistrationId,
    downloadUrl: `${req.protocol}://${req.get("host")}/api/sidang-registrations/uploads/${uploadRecord.id}/download`,
  };

  res.status(200).json({
    message: existingUpload
      ? "File updated successfully"
      : "File uploaded successfully",
    data: responseData,
  });
});

// Get All Uploaded Files by Sidang Registration ID
const getSidangRegistrationFiles = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const uploads = await prisma.sidangRegistrationUpload.findMany({
    where: { sidangRegistrationId: id },
  });

  const data = uploads.map((upload) => ({
    id: upload.id,
    name: upload.name,
    category: upload.category,
    filepath: upload.filepath,
    isValid: upload.isValid,
    sidangRegistrationId: upload.sidangRegistrationId,
    downloadUrl: `${req.protocol}://${req.get(
      "host",
    )}/api/sidang-registrations/uploads/${upload.id}/download`,
  }));

  res.json({ data });
});

// Download Sidang Registration Upload
const downloadSidangRegistrationFile = asyncHandler(async (req, res) => {
  const uploadId = req.params.uploadId;

  const upload = await prisma.sidangRegistrationUpload.findFirst({
    where: { id: uploadId },
  });

  if (!upload) {
    res.status(404);
    throw new Error("Unggahan tidak ditemukan");
  }

  const ext = path.extname(upload.filepath || "") || ".pdf";
  const baseName = (upload.name || "").replace(/[\\/:*?"<>|]/g, "-").trim() || "dokumen-sidang";
  const downloadName = baseName.toLowerCase().endsWith(ext.toLowerCase()) ? baseName : `${baseName}${ext}`;

  await serveDownload(res, {
    filepath: upload.filepath,
    downloadName,
  });
});

// Approve Sidang Registration (Admin Response)
const approveSidangRegistration = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { adminId, sidangPeriodId, sidangRegistrationUploadIds } = req.body;

  const errors = [];
  if (isNil(adminId)) {
    errors.push({ field: "adminId", message: "ID staf akademik wajib diisi" });
  }
  if (isNil(sidangPeriodId)) {
    errors.push({
      field: "sidangPeriodId",
      message: "ID periode sidang wajib diisi",
    });
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  const registration = await prisma.sidangRegistration.findUnique({
    where: { id },
  });

  if (!registration) {
    res.status(404);
    throw new Error("Pendaftaran sidang tidak ditemukan");
  }

  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
  });

  if (!admin) {
    res.status(404);
    throw new Error("Staf akademik tidak ditemukan");
  }

  const period = await prisma.sidangPeriod.findUnique({
    where: { id: sidangPeriodId },
  });

  if (!period) {
    res.status(404);
    throw new Error("Periode sidang tidak ditemukan");
  }

  if (Array.isArray(sidangRegistrationUploadIds)) {
    await prisma.sidangRegistrationUpload.updateMany({
      where: {
        sidangRegistrationId: id,
        id: { in: sidangRegistrationUploadIds },
      },
      data: { isValid: true },
    });

    await prisma.sidangRegistrationUpload.updateMany({
      where: {
        sidangRegistrationId: id,
        id: { notIn: sidangRegistrationUploadIds },
      },
      data: { isValid: false },
    });
  }

  const updatedRegistration = await prisma.sidangRegistration.update({
    where: { id },
    data: {
      adminId,
      sidangPeriodId,
      message: null,
      isEdit: null,
    },
    include: sidangInclude,
  });

  res.json({
    message: "Pendaftaran sidang berhasil disetujui",
    data: mapSidangRegistrationToFrontend(updatedRegistration, req),
  });
});

// Reject/Request Revision for Sidang Registration (Admin Response)
const rejectSidangRegistration = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { adminId, message, isEdit, sidangRegistrationUploadIds } = req.body;

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

  const registration = await prisma.sidangRegistration.findUnique({
    where: { id },
  });

  if (!registration) {
    res.status(404);
    throw new Error("Pendaftaran sidang tidak ditemukan");
  }

  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
  });

  if (!admin) {
    res.status(404);
    throw new Error("Staf akademik tidak ditemukan");
  }

  if (Array.isArray(sidangRegistrationUploadIds)) {
    await prisma.sidangRegistrationUpload.updateMany({
      where: {
        sidangRegistrationId: id,
        id: { in: sidangRegistrationUploadIds },
      },
      data: { isValid: true },
    });

    await prisma.sidangRegistrationUpload.updateMany({
      where: {
        sidangRegistrationId: id,
        id: { notIn: sidangRegistrationUploadIds },
      },
      data: { isValid: false },
    });
  }

  const updatedRegistration = await prisma.sidangRegistration.update({
    where: { id },
    data: {
      adminId,
      message,
      isEdit: isEdit ? new Date(isEdit) : null,
      sidangPeriodId: null,
      isDraft: isEdit ? true : false,
      submittedAt: isEdit ? null : undefined,
    },
    include: sidangInclude,
  });

  res.json({
    message: "Pendaftaran sidang berhasil ditolak / diminta revisi",
    data: mapSidangRegistrationToFrontend(updatedRegistration, req),
  });
});

export {
  listSidangRegistrations,
  getSidangRegistrationById,
  getSidangRegistrationByMahasiswaId,
  saveSidangRegistration,
  submitSidangRegistration,
  deleteSidangRegistration,
  uploadSidangRegistrationFile,
  getSidangRegistrationFiles,
  downloadSidangRegistrationFile,
  approveSidangRegistration,
  rejectSidangRegistration,
};
