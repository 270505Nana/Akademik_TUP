import path from "path";
import excel from "exceljs";
import prisma from "../config/prisma.js";
import { parseBoolean } from "../utils/validationHelper.js";
import {
  getPaginationParams,
  formatPaginationResponse,
} from "../utils/paginationHelper.js";
import { uploadFile, deleteFile } from "./storageService.js";
import { mapYudisiumRegistrationToFrontend } from "../mappers/yudisiumMapper.js";
import {
  DOCUMENT_CATEGORIES,
  CUMLAUDE_CATEGORY_MAP,
} from "../constants/documentCategories.js";

export const yudisiumInclude = {
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
  admin: {
    include: {
      user: true,
    },
  },
  yudisiumRegistrationPeriod: true,
  yudisiumPeriod: true,
  yudisiumRegistrationUploads: true,
};

export const getSlugsByCategory = async (categoryName) => {
  const docs = await prisma.dokumenPersyaratanBerkas.findMany({
    where: { category: categoryName, isRequired: true, deletedAt: null },
    select: { code: true },
  });
  return docs.map((doc) => doc.code);
};

export const getRequiredSlugsFromDb = () =>
  getSlugsByCategory(DOCUMENT_CATEGORIES.YUDISIUM_WAJIB);

export const getWirausahaSlugsFromDb = () =>
  getSlugsByCategory(DOCUMENT_CATEGORIES.YUDISIUM_WIRAUSAHA);

export const getCumlaudeSlugsFromDb = (skemaCumlaude) => {
  const categoryName =
    CUMLAUDE_CATEGORY_MAP[skemaCumlaude] ||
    `Yudisium - Evidence Cumlaude ${skemaCumlaude}`;
  return getSlugsByCategory(categoryName);
};

export const deleteUploadsByCategory = async (registrationId, categories) => {
  if (!categories || !categories.length) return;
  const uploadsToDelete = await prisma.yudisiumRegistrationUpload.findMany({
    where: {
      yudisiumRegistrationId: registrationId,
      category: { in: categories },
    },
  });
  for (const upload of uploadsToDelete) {
    if (upload.filepath) await deleteFile(upload.filepath);
  }
  if (uploadsToDelete.length > 0) {
    await prisma.yudisiumRegistrationUpload.deleteMany({
      where: { id: { in: uploadsToDelete.map((u) => u.id) } },
    });
  }
};

export const checkYudisiumEditable = async (registrationId) => {
  const registration = await prisma.yudisiumRegistration.findUnique({
    where: { id: registrationId },
  });

  if (!registration) {
    return {
      exists: false,
      editable: false,
      reason: "Pendaftaran yudisium tidak ditemukan.",
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

export const getYudisiumRegistrations = async ({ skip, take } = {}) => {
  const [total, yudisiumRegistrations] = await Promise.all([
    prisma.yudisiumRegistration.count(),
    prisma.yudisiumRegistration.findMany({
      skip,
      take,
      include: yudisiumInclude,
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  return { total, yudisiumRegistrations };
};

/**
 * Mengambil daftar pendaftaran yudisium dengan filter, pencarian, sorting, dan paginasi
 */
export const listYudisiumRegistrations = async ({ query = {}, req } = {}) => {
  const paginationParams = getPaginationParams(query);
  const {
    search,
    studyProgramId,
    skemaSidang,
    pengajuanCumlaude,
    skemaCumlaude,
    status,
    sortBy,
  } = query;

  const where = {
    deletedAt: null,
  };

  // 1. Global Search
  const searchTerm = (search || "").trim();
  if (searchTerm) {
    where.AND = where.AND || [];
    where.AND.push({
      OR: [
        {
          mahasiswa: {
            user: {
              name: {
                contains: searchTerm,
                mode: "insensitive",
              },
            },
          },
        },
        {
          mahasiswa: {
            nim: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
        },
        {
          judulTugasAkhirIndonesia: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
        {
          judulTugasAkhirInggris: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
      ],
    });
  }

  // 2. Filter by Study Program ID
  if (
    studyProgramId &&
    typeof studyProgramId === "string" &&
    studyProgramId.trim() !== ""
  ) {
    where.mahasiswa = where.mahasiswa || {};
    where.mahasiswa.studyProgramId = studyProgramId.trim();
  }

  // 3. Filter by Skema Sidang
  if (
    skemaSidang &&
    typeof skemaSidang === "string" &&
    skemaSidang.trim() !== ""
  ) {
    where.skemaSidang = {
      equals: skemaSidang.trim(),
      mode: "insensitive",
    };
  }

  // 4. Filter by Pengajuan Cumlaude
  if (
    pengajuanCumlaude &&
    typeof pengajuanCumlaude === "string" &&
    pengajuanCumlaude.trim() !== ""
  ) {
    const pengajuan = pengajuanCumlaude.trim();
    where.AND = where.AND || [];
    where.AND.push({
      OR: [
        {
          pengajuanCumlaudeFinal: {
            equals: pengajuan,
            mode: "insensitive",
          },
        },
        {
          OR: [
            { pengajuanCumlaudeFinal: null },
            { pengajuanCumlaudeFinal: "" },
          ],
          pengajuanCumlaude: {
            equals: pengajuan,
            mode: "insensitive",
          },
        },
      ],
    });
  }

  // 5. Filter by Skema Cumlaude
  if (
    skemaCumlaude &&
    typeof skemaCumlaude === "string" &&
    skemaCumlaude.trim() !== ""
  ) {
    const skema = skemaCumlaude.trim();
    where.AND = where.AND || [];
    where.AND.push({
      OR: [
        {
          skemaCumlaudeFinal: {
            equals: skema,
            mode: "insensitive",
          },
        },
        {
          OR: [{ skemaCumlaudeFinal: null }, { skemaCumlaudeFinal: "" }],
          skemaCumlaude: {
            equals: skema,
            mode: "insensitive",
          },
        },
      ],
    });
  }

  // 6. Filter by Status
  if (status && typeof status === "string" && status.trim() !== "") {
    where.status = {
      equals: status.trim(),
      mode: "insensitive",
    };
  }

  // 7. Sorting
  const sortParam = (sortBy || "").toLowerCase().trim();
  let orderBy = { createdAt: "desc" };

  if (sortParam === "nameasc" || sortParam === "a-z") {
    orderBy = { mahasiswa: { user: { name: "asc" } } };
  } else if (sortParam === "namedesc" || sortParam === "z-a") {
    orderBy = { mahasiswa: { user: { name: "desc" } } };
  } else if (sortParam === "nimasc") {
    orderBy = { mahasiswa: { nim: "asc" } };
  } else if (sortParam === "nimdesc") {
    orderBy = { mahasiswa: { nim: "desc" } };
  } else if (sortParam === "ipkasc") {
    orderBy = { mahasiswa: { ipk: "asc" } };
  } else if (sortParam === "ipkdesc") {
    orderBy = { mahasiswa: { ipk: "desc" } };
  } else if (sortParam === "takasc") {
    orderBy = { tak: "asc" };
  } else if (sortParam === "takdesc") {
    orderBy = { tak: "desc" };
  } else if (sortParam === "tglsidangasc") {
    orderBy = { tglSidang: "asc" };
  } else if (sortParam === "tglsidangdesc") {
    orderBy = { tglSidang: "desc" };
  } else if (sortParam === "submittedatasc") {
    orderBy = { submittedAt: "asc" };
  } else if (sortParam === "submittedatdesc") {
    orderBy = { submittedAt: "desc" };
  } else if (
    sortParam === "oldest" ||
    sortParam === "createdatasc" ||
    sortParam === "lama-baru"
  ) {
    orderBy = { createdAt: "asc" };
  } else if (
    sortParam === "newest" ||
    sortParam === "createdatdesc" ||
    sortParam === "baru-lama"
  ) {
    orderBy = { createdAt: "desc" };
  } else if (sortParam === "updatedatasc") {
    orderBy = { updatedAt: "asc" };
  } else if (sortParam === "updatedatdesc") {
    orderBy = { updatedAt: "desc" };
  }

  const [total, yudisiumRegistrations] = await Promise.all([
    prisma.yudisiumRegistration.count({ where }),
    prisma.yudisiumRegistration.findMany({
      where,
      skip: paginationParams.skip,
      take: paginationParams.take,
      include: yudisiumInclude,
      orderBy,
    }),
  ]);

  const data = yudisiumRegistrations.map((reg) =>
    mapYudisiumRegistrationToFrontend(reg, req),
  );

  return formatPaginationResponse(data, total, paginationParams);
};

/**
 * Mengambil detail pendaftaran yudisium berdasarkan ID
 */
export const getYudisiumRegistrationById = async (id, req) => {
  const yudisiumRegistration = await prisma.yudisiumRegistration.findUnique({
    where: { id },
    include: yudisiumInclude,
  });

  if (!yudisiumRegistration) {
    const error = new Error("Pendaftaran yudisium tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  return mapYudisiumRegistrationToFrontend(yudisiumRegistration, req);
};

/**
 * Mengambil detail pendaftaran yudisium berdasarkan ID Mahasiswa
 */
export const getYudisiumRegistrationByMahasiswaId = async (
  mahasiswaId,
  req,
) => {
  const yudisiumRegistration = await prisma.yudisiumRegistration.findFirst({
    where: { mahasiswaId },
    include: yudisiumInclude,
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!yudisiumRegistration) {
    const error = new Error("Pendaftaran yudisium tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  return mapYudisiumRegistrationToFrontend(yudisiumRegistration, req);
};

/**
 * Menyimpan draft pendaftaran yudisium (upsert)
 */
export const saveYudisiumRegistration = async (body, req) => {
  const {
    id,
    tak,
    tglSidang,
    mahasiswaId,
    dosenWaliId,
    doswalId,
    dosenPembimbing1Id,
    dosenPembimbing2Id,
    yudisiumPeriodId,
    yudisiumRegistrationPeriodId,
  } = body;

  const program = body.program !== undefined ? body.program : body.programType;
  const judulTugasAkhirIndonesia =
    body.judulTugasAkhirIndonesia !== undefined
      ? body.judulTugasAkhirIndonesia
      : body.thesisTitleId;
  const judulTugasAkhirInggris =
    body.judulTugasAkhirInggris !== undefined
      ? body.judulTugasAkhirInggris
      : body.thesisTitleEn;
  const skemaSidang =
    body.skemaSidang !== undefined ? body.skemaSidang : body.sidangScheme;
  const pengajuanCumlaude =
    body.pengajuanCumlaude !== undefined
      ? body.pengajuanCumlaude
      : body.jalurYudisium;

  let skemaCumlaude =
    body.skemaCumlaude !== undefined ? body.skemaCumlaude : body.cumlaudeScheme;
  if (skemaCumlaude === undefined && body.skemaTambahan !== undefined) {
    skemaCumlaude = Array.isArray(body.skemaTambahan)
      ? body.skemaTambahan.join(", ")
      : body.skemaTambahan;
  } else if (Array.isArray(skemaCumlaude)) {
    skemaCumlaude = skemaCumlaude.join(", ");
  }

  const evidenCumlaude =
    body.evidenCumlaude !== undefined
      ? body.evidenCumlaude
      : body.eviden_cumlaude !== undefined
        ? body.eviden_cumlaude
        : body.evidenList;

  const parsedBerminatWirausaha = parseBoolean(body.berminatWirausaha);
  const finalDosenWaliId = dosenWaliId !== undefined ? dosenWaliId : doswalId;

  // Validate references if provided
  if (mahasiswaId) {
    const studentExists = await prisma.mahasiswa.findUnique({
      where: { id: mahasiswaId },
    });
    if (!studentExists) {
      const error = new Error("Mahasiswa tidak ditemukan");
      error.statusCode = 404;
      throw error;
    }
  }

  if (finalDosenWaliId) {
    const doswalExists = await prisma.dosen.findUnique({
      where: { id: finalDosenWaliId },
    });
    if (!doswalExists) {
      const error = new Error("Dosen wali tidak ditemukan");
      error.statusCode = 404;
      throw error;
    }
  }

  if (dosenPembimbing1Id) {
    const dosenExists = await prisma.dosen.findUnique({
      where: { id: dosenPembimbing1Id },
    });
    if (!dosenExists) {
      const error = new Error("Dosen pembimbing 1 tidak ditemukan");
      error.statusCode = 404;
      throw error;
    }
  }

  if (dosenPembimbing2Id) {
    const dosenExists = await prisma.dosen.findUnique({
      where: { id: dosenPembimbing2Id },
    });
    if (!dosenExists) {
      const error = new Error("Dosen pembimbing 2 tidak ditemukan");
      error.statusCode = 404;
      throw error;
    }
  }

  // Get active registration period
  const activePeriod = await prisma.yudisiumPeriod.findFirst({
    where: {
      category: { in: ["pendaftaran", "pendaftaran yudisium"] },
      isOpen: true,
      deletedAt: null,
    },
  });

  if (id) {
    const editCheck = await checkYudisiumEditable(id);
    if (!editCheck.exists) {
      const error = new Error(editCheck.reason);
      error.statusCode = 404;
      throw error;
    }
    if (!editCheck.editable) {
      const error = new Error(editCheck.reason);
      error.statusCode = 403;
      throw error;
    }
  }

  const upsertData = {
    program: program !== undefined ? program : undefined,
    tak: tak !== undefined && tak !== null ? parseInt(tak, 10) : undefined,
    tglSidang:
      tglSidang !== undefined
        ? tglSidang
          ? new Date(tglSidang)
          : null
        : undefined,
    judulTugasAkhirIndonesia:
      judulTugasAkhirIndonesia !== undefined
        ? judulTugasAkhirIndonesia
        : undefined,
    judulTugasAkhirInggris:
      judulTugasAkhirInggris !== undefined ? judulTugasAkhirInggris : undefined,
    skemaSidang: skemaSidang !== undefined ? skemaSidang : undefined,
    pengajuanCumlaude:
      pengajuanCumlaude !== undefined ? pengajuanCumlaude : undefined,
    skemaCumlaude: skemaCumlaude !== undefined ? skemaCumlaude : undefined,
    evidenCumlaude: evidenCumlaude !== undefined ? evidenCumlaude : undefined,
    berminatWirausaha:
      parsedBerminatWirausaha !== undefined
        ? parsedBerminatWirausaha
        : undefined,
    mahasiswaId: mahasiswaId !== undefined ? mahasiswaId : undefined,
    dosenWaliId: finalDosenWaliId !== undefined ? finalDosenWaliId : undefined,
    dosenPembimbing1Id:
      dosenPembimbing1Id !== undefined ? dosenPembimbing1Id : undefined,
    dosenPembimbing2Id:
      dosenPembimbing2Id !== undefined ? dosenPembimbing2Id : undefined,
    yudisiumPeriodId:
      yudisiumPeriodId !== undefined ? yudisiumPeriodId : undefined,
    yudisiumRegistrationPeriodId:
      yudisiumRegistrationPeriodId !== undefined
        ? yudisiumRegistrationPeriodId
        : activePeriod
          ? activePeriod.id
          : undefined,
    isDraft: true,
  };

  let yudisiumRegistration;

  if (id) {
    yudisiumRegistration = await prisma.yudisiumRegistration.update({
      where: { id },
      data: upsertData,
      include: yudisiumInclude,
    });
  } else if (mahasiswaId) {
    const existing = await prisma.yudisiumRegistration.findFirst({
      where: { mahasiswaId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });

    if (existing && existing.isDraft) {
      const editCheck = await checkYudisiumEditable(existing.id);
      if (!editCheck.editable) {
        const error = new Error(editCheck.reason);
        error.statusCode = 403;
        throw error;
      }

      yudisiumRegistration = await prisma.yudisiumRegistration.update({
        where: { id: existing.id },
        data: upsertData,
        include: yudisiumInclude,
      });
    } else {
      const targetPeriodId = upsertData.yudisiumRegistrationPeriodId;
      if (!targetPeriodId) {
        const error = new Error(
          "Tidak ada periode pendaftaran yudisium yang aktif saat ini.",
        );
        error.statusCode = 400;
        throw error;
      }

      const existingInPeriod = await prisma.yudisiumRegistration.findFirst({
        where: {
          mahasiswaId,
          yudisiumRegistrationPeriodId: targetPeriodId,
          deletedAt: null,
        },
      });

      if (existingInPeriod) {
        const error = new Error(
          "Mahasiswa sudah terdaftar pada periode pendaftaran yudisium ini.",
        );
        error.statusCode = 400;
        throw error;
      }

      yudisiumRegistration = await prisma.yudisiumRegistration.create({
        data: upsertData,
        include: yudisiumInclude,
      });
    }
  } else {
    const targetPeriodId = upsertData.yudisiumRegistrationPeriodId;
    if (!targetPeriodId) {
      const error = new Error(
        "Tidak ada periode pendaftaran yudisium yang aktif saat ini.",
      );
      error.statusCode = 400;
      throw error;
    }

    yudisiumRegistration = await prisma.yudisiumRegistration.create({
      data: upsertData,
      include: yudisiumInclude,
    });
  }

  return mapYudisiumRegistrationToFrontend(yudisiumRegistration, req);
};

/**
 * Mengirim (submit) pendaftaran yudisium dengan validasi lengkap data & berkas
 */
export const submitYudisiumRegistration = async (body, req) => {
  const {
    id,
    tak,
    tglSidang,
    mahasiswaId,
    dosenWaliId,
    doswalId,
    dosenPembimbing1Id,
    dosenPembimbing2Id,
    yudisiumPeriodId,
    yudisiumRegistrationPeriodId,
  } = body;

  const program = body.program !== undefined ? body.program : body.programType;
  const judulTugasAkhirIndonesia =
    body.judulTugasAkhirIndonesia !== undefined
      ? body.judulTugasAkhirIndonesia
      : body.thesisTitleId;
  const judulTugasAkhirInggris =
    body.judulTugasAkhirInggris !== undefined
      ? body.judulTugasAkhirInggris
      : body.thesisTitleEn;
  const skemaSidang =
    body.skemaSidang !== undefined ? body.skemaSidang : body.sidangScheme;
  const pengajuanCumlaude =
    body.pengajuanCumlaude !== undefined
      ? body.pengajuanCumlaude
      : body.jalurYudisium;

  let skemaCumlaude =
    body.skemaCumlaude !== undefined ? body.skemaCumlaude : body.cumlaudeScheme;
  if (skemaCumlaude === undefined && body.skemaTambahan !== undefined) {
    skemaCumlaude = Array.isArray(body.skemaTambahan)
      ? body.skemaTambahan.join(", ")
      : body.skemaTambahan;
  } else if (Array.isArray(skemaCumlaude)) {
    skemaCumlaude = skemaCumlaude.join(", ");
  }

  const evidenCumlaude =
    body.evidenCumlaude !== undefined
      ? body.evidenCumlaude
      : body.eviden_cumlaude !== undefined
        ? body.eviden_cumlaude
        : body.evidenList;

  // NOOTE: kita sebenarnya sudah tidak mengurus berkas berminat wirausaha tapi untuk backward kompatibilitas fitur ini belum dihapus dari backend
  const parsedBerminatWirausaha = parseBoolean(body.berminatWirausaha);
  const finalDosenWaliId = dosenWaliId !== undefined ? dosenWaliId : doswalId;

  const existingRegistration = await prisma.yudisiumRegistration.findUnique({
    where: { id },
    include: {
      yudisiumRegistrationUploads: true,
    },
  });

  if (!existingRegistration) {
    const error = new Error("Pendaftaran yudisium tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const editCheck = await checkYudisiumEditable(id);
  if (!editCheck.editable) {
    const error = new Error(editCheck.reason);
    error.statusCode = 403;
    throw error;
  }

  const updateData = {
    program: program !== undefined ? program : undefined,
    tak: tak !== undefined && tak !== null ? parseInt(tak, 10) : undefined,
    tglSidang: tglSidang ? new Date(tglSidang) : undefined,
    judulTugasAkhirIndonesia:
      judulTugasAkhirIndonesia !== undefined
        ? judulTugasAkhirIndonesia
        : undefined,
    judulTugasAkhirInggris:
      judulTugasAkhirInggris !== undefined ? judulTugasAkhirInggris : undefined,
    skemaSidang: skemaSidang !== undefined ? skemaSidang : undefined,
    pengajuanCumlaude:
      pengajuanCumlaude !== undefined ? pengajuanCumlaude : undefined,
    skemaCumlaude: skemaCumlaude !== undefined ? skemaCumlaude : undefined,
    evidenCumlaude: evidenCumlaude !== undefined ? evidenCumlaude : undefined,
    berminatWirausaha:
      parsedBerminatWirausaha !== undefined
        ? parsedBerminatWirausaha
        : undefined,
    mahasiswaId: mahasiswaId !== undefined ? mahasiswaId : undefined,
    dosenWaliId: finalDosenWaliId !== undefined ? finalDosenWaliId : undefined,
    dosenPembimbing1Id:
      dosenPembimbing1Id !== undefined ? dosenPembimbing1Id : undefined,
    dosenPembimbing2Id:
      dosenPembimbing2Id !== undefined ? dosenPembimbing2Id : undefined,
    yudisiumPeriodId:
      yudisiumPeriodId !== undefined ? yudisiumPeriodId : undefined,
    isEdit: null,
    message: null,
  };

  const activePeriod = await prisma.yudisiumPeriod.findFirst({
    where: {
      category: { in: ["pendaftaran", "pendaftaran yudisium"] },
      isOpen: true,
      deletedAt: null,
    },
  });

  const periodIdToCheck = yudisiumRegistrationPeriodId
    ? yudisiumRegistrationPeriodId
    : existingRegistration.yudisiumRegistrationPeriodId ||
      (activePeriod ? activePeriod.id : null);

  if (periodIdToCheck) {
    const period = await prisma.yudisiumPeriod.findUnique({
      where: { id: periodIdToCheck },
    });
    if (!period || !period.isOpen) {
      const error = new Error(
        "Periode pendaftaran yudisium ini sudah ditutup.",
      );
      error.statusCode = 400;
      throw error;
    }
    updateData.yudisiumRegistrationPeriodId = periodIdToCheck;
  } else {
    const error = new Error(
      "Tidak ada periode pendaftaran yudisium yang aktif saat ini.",
    );
    error.statusCode = 400;
    throw error;
  }

  const mergedData = { ...existingRegistration, ...updateData };

  const requiredFields = [
    "program",
    "tak",
    "tglSidang",
    "judulTugasAkhirIndonesia",
    "judulTugasAkhirInggris",
    "mahasiswaId",
  ];

  const missingFields = requiredFields.filter(
    (field) => mergedData[field] === null || mergedData[field] === undefined,
  );

  if (missingFields.length > 0) {
    const error = new Error(
      `Tidak dapat submit. Field wajib belum lengkap: ${missingFields.join(", ")}`,
    );
    error.statusCode = 400;
    throw error;
  }

  const uploadedCategories = (
    existingRegistration.yudisiumRegistrationUploads || []
  ).map((upload) => upload.category);

  const missingFiles = [];

  // 1. Yudisium - Berkas Wajib
  const requiredSlugs = await getRequiredSlugsFromDb();
  for (const slug of requiredSlugs) {
    if (!uploadedCategories.includes(slug)) missingFiles.push(slug);
  }

  // 2. Yudisium - Evidence Wirausaha
  if (mergedData.berminatWirausaha === true) {
    const wirausahaSlugs = await getWirausahaSlugsFromDb();
    for (const slug of wirausahaSlugs) {
      if (!uploadedCategories.includes(slug)) missingFiles.push(slug);
    }
  }

  // 3. Yudisium - Evidence Cumlaude
  if (mergedData.skemaCumlaude) {
    const cumlaudeSlugs = await getCumlaudeSlugsFromDb(
      mergedData.skemaCumlaude,
    );
    for (const slug of cumlaudeSlugs) {
      if (!uploadedCategories.includes(slug)) missingFiles.push(slug);
    }
  }

  if (missingFiles.length > 0) {
    const error = new Error(
      `Tidak dapat submit. Berkas wajib belum lengkap: ${missingFiles.join(", ")}`,
    );
    error.statusCode = 400;
    throw error;
  }

  if (mergedData.berminatWirausaha === false) {
    const wirausahaSlugs = await getSlugsByCategory(
      "Yudisium - Evidence Wirausaha",
    );
    await deleteUploadsByCategory(id, wirausahaSlugs);
  }

  if (mergedData.mahasiswaId) {
    const s = await prisma.mahasiswa.findUnique({
      where: { id: mergedData.mahasiswaId },
    });
    if (!s) {
      const error = new Error("Mahasiswa tidak ditemukan");
      error.statusCode = 404;
      throw error;
    }
  }

  if (mergedData.dosenWaliId) {
    const dw = await prisma.dosen.findUnique({
      where: { id: mergedData.dosenWaliId },
    });
    if (!dw) {
      const error = new Error("Dosen wali tidak ditemukan");
      error.statusCode = 404;
      throw error;
    }
  }

  if (mergedData.dosenPembimbing1Id) {
    const d1 = await prisma.dosen.findUnique({
      where: { id: mergedData.dosenPembimbing1Id },
    });
    if (!d1) {
      const error = new Error("Dosen pembimbing 1 tidak ditemukan");
      error.statusCode = 404;
      throw error;
    }
  }

  if (mergedData.dosenPembimbing2Id) {
    const d2 = await prisma.dosen.findUnique({
      where: { id: mergedData.dosenPembimbing2Id },
    });
    if (!d2) {
      const error = new Error("Dosen pembimbing 2 tidak ditemukan");
      error.statusCode = 404;
      throw error;
    }
  }

  const isRevision =
    existingRegistration.status === "Perlu Revisi" ||
    existingRegistration.isEdit !== null ||
    existingRegistration.message !== null;

  updateData.status = isRevision ? "Revisi Diajukan" : "Dalam Proses";
  updateData.isDraft = false;
  updateData.submittedAt = new Date();

  const updatedYudisiumRegistration = await prisma.yudisiumRegistration.update({
    where: { id },
    data: updateData,
    include: yudisiumInclude,
  });

  return mapYudisiumRegistrationToFrontend(updatedYudisiumRegistration, req);
};

/**
 * Menghapus pendaftaran yudisium (soft delete)
 */
export const deleteYudisiumRegistration = async (id) => {
  const yudisiumRegistrationExists =
    await prisma.yudisiumRegistration.findUnique({
      where: { id },
    });

  if (!yudisiumRegistrationExists) {
    const error = new Error("Pendaftaran yudisium tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  return await prisma.yudisiumRegistration.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  });
};

/**
 * Mengunggah berkas persyaratan pendaftaran yudisium
 */
export const uploadYudisiumRegistrationFile = async ({
  id,
  fileCategory,
  name,
  file,
  req,
}) => {
  if (!file) {
    const error = new Error("Tidak ada file yang diunggah");
    error.statusCode = 400;
    throw error;
  }

  if (!fileCategory || !name) {
    const error = new Error("Kategori (slug) dan nama berkas wajib diisi");
    error.statusCode = 400;
    throw error;
  }

  const editCheck = await checkYudisiumEditable(id);
  if (!editCheck.exists) {
    const error = new Error(editCheck.reason);
    error.statusCode = 404;
    throw error;
  }

  if (!editCheck.editable) {
    const error = new Error(editCheck.reason);
    error.statusCode = 403;
    throw error;
  }

  const uploaded = await uploadFile({
    buffer: file.buffer,
    originalname: file.originalname,
    folder: "yudisium-registrations",
    mimetype: file.mimetype,
  });

  const existingUpload = await prisma.yudisiumRegistrationUpload.findFirst({
    where: {
      yudisiumRegistrationId: id,
      category: fileCategory,
    },
  });

  let uploadRecord;

  if (existingUpload) {
    if (existingUpload.filepath) {
      await deleteFile(existingUpload.filepath);
    }

    uploadRecord = await prisma.yudisiumRegistrationUpload.update({
      where: { id: existingUpload.id },
      data: {
        name,
        filepath: uploaded.filepath,
        isValid: null,
      },
    });
  } else {
    uploadRecord = await prisma.yudisiumRegistrationUpload.create({
      data: {
        name,
        category: fileCategory,
        filepath: uploaded.filepath,
        yudisiumRegistrationId: id,
        isValid: null,
      },
    });
  }

  const downloadUrl = req
    ? `${req.protocol}://${req.get("host")}/api/yudisium-registrations/uploads/${uploadRecord.id}/download`
    : null;

  return {
    isUpdated: Boolean(existingUpload),
    data: {
      id: uploadRecord.id,
      name: uploadRecord.name,
      category: uploadRecord.category,
      filepath: uploadRecord.filepath,
      isValid: uploadRecord.isValid,
      yudisiumRegistrationId: uploadRecord.sidangRegistrationId,
      downloadUrl,
    },
  };
};

/**
 * Mengambil semua berkas unggahan berdasarkan ID pendaftaran yudisium
 */
export const getYudisiumRegistrationFiles = async (id, req) => {
  const uploads = await prisma.yudisiumRegistrationUpload.findMany({
    where: { yudisiumRegistrationId: id },
  });

  return uploads.map((upload) => ({
    id: upload.id,
    name: upload.name,
    category: upload.category,
    filepath: upload.filepath,
    isValid: upload.isValid,
    yudisiumRegistrationId: upload.yudisiumRegistrationId,
    downloadUrl: req
      ? `${req.protocol}://${req.get("host")}/api/yudisium-registrations/uploads/${upload.id}/download`
      : null,
  }));
};

/**
 * Mengambil metadata file unggahan untuk di-download
 */
export const getDownloadFileInfo = async (uploadId) => {
  const upload = await prisma.yudisiumRegistrationUpload.findFirst({
    where: { id: uploadId },
  });

  if (!upload) {
    const error = new Error("Unggahan tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const ext = path.extname(upload.filepath || "") || ".pdf";
  const baseName =
    (upload.name || "").replace(/[\\/:*?"<>|]/g, "-").trim() ||
    "dokumen-yudisium";
  const downloadName = baseName.toLowerCase().endsWith(ext.toLowerCase())
    ? baseName
    : `${baseName}${ext}`;

  return {
    filepath: upload.filepath,
    downloadName,
  };
};

/**
 * Menyetujui pendaftaran yudisium (Admin Response)
 */
export const approveYudisiumRegistration = async (
  {
    id,
    adminId,
    yudisiumPeriodId,
    yudisiumRegistrationUploadIds,
    pengajuanCumlaudeFinal,
    skemaCumlaudeFinal,
  },
  req,
) => {
  const registration = await prisma.yudisiumRegistration.findUnique({
    where: { id },
  });

  if (!registration) {
    const error = new Error("Pendaftaran yudisium tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
  });

  if (!admin) {
    const error = new Error("Staf akademik tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const period = await prisma.yudisiumPeriod.findUnique({
    where: { id: yudisiumPeriodId },
  });

  if (!period) {
    const error = new Error("Periode yudisium tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  if (Array.isArray(yudisiumRegistrationUploadIds)) {
    await prisma.yudisiumRegistrationUpload.updateMany({
      where: {
        yudisiumRegistrationId: id,
        id: { in: yudisiumRegistrationUploadIds },
      },
      data: { isValid: true },
    });

    await prisma.yudisiumRegistrationUpload.updateMany({
      where: {
        yudisiumRegistrationId: id,
        id: { notIn: yudisiumRegistrationUploadIds },
      },
      data: { isValid: false },
    });
  }

  const finalPengajuanCumlaude =
    typeof pengajuanCumlaudeFinal === "string" &&
    pengajuanCumlaudeFinal.trim() !== ""
      ? pengajuanCumlaudeFinal.trim()
      : null;

  const finalSkemaCumlaude =
    typeof skemaCumlaudeFinal === "string" && skemaCumlaudeFinal.trim() !== ""
      ? skemaCumlaudeFinal.trim()
      : null;

  const hasCumlaudeFinal = Boolean(
    finalPengajuanCumlaude && finalSkemaCumlaude,
  );
  const status = hasCumlaudeFinal
    ? "Hasil Sidang Ditetapkan"
    : "Menunggu Sidang Yudisium";

  const updatedRegistration = await prisma.yudisiumRegistration.update({
    where: { id },
    data: {
      adminId,
      yudisiumPeriodId,
      pengajuanCumlaudeFinal: finalPengajuanCumlaude,
      skemaCumlaudeFinal: finalSkemaCumlaude,
      status,
      message: null,
      isEdit: null,
    },
    include: yudisiumInclude,
  });

  return mapYudisiumRegistrationToFrontend(updatedRegistration, req);
};

/**
 * Menolak / meminta revisi pendaftaran yudisium (Admin Response)
 */
export const rejectYudisiumRegistration = async (
  { adminId, message, isEdit, yudisiumRegistrationUploadIds, id },
  req,
) => {
  const registration = await prisma.yudisiumRegistration.findUnique({
    where: { id },
  });

  if (!registration) {
    const error = new Error("Pendaftaran yudisium tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
  });

  if (!admin) {
    const error = new Error("Staf akademik tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  if (Array.isArray(yudisiumRegistrationUploadIds)) {
    await prisma.yudisiumRegistrationUpload.updateMany({
      where: {
        yudisiumRegistrationId: id,
        id: { in: yudisiumRegistrationUploadIds },
      },
      data: { isValid: true },
    });

    await prisma.yudisiumRegistrationUpload.updateMany({
      where: {
        yudisiumRegistrationId: id,
        id: { notIn: yudisiumRegistrationUploadIds },
      },
      data: { isValid: false },
    });
  }

  const updatedRegistration = await prisma.yudisiumRegistration.update({
    where: { id },
    data: {
      adminId,
      message,
      isEdit: isEdit ? new Date(isEdit) : null,
      yudisiumPeriodId: null,
      status: "Perlu Revisi",
      isDraft: isEdit ? true : false,
      submittedAt: isEdit ? null : undefined,
    },
    include: yudisiumInclude,
  });

  return mapYudisiumRegistrationToFrontend(updatedRegistration, req);
};

/**
 * Mengekspor data pendaftaran yudisium ke format Excel Workbook
 */
export const exportYudisiumWorkbook = async ({ yudisiumPeriodId } = {}) => {
  let targetPeriodId = yudisiumPeriodId;
  let selectedPeriod = null;

  if (targetPeriodId) {
    selectedPeriod = await prisma.yudisiumPeriod.findUnique({
      where: { id: targetPeriodId },
    });
  } else {
    selectedPeriod = await prisma.yudisiumPeriod.findFirst({
      where: {
        category: { in: ["pelaksanaan", "yudisium"] },
        deletedAt: null,
      },
      orderBy: { endDate: "desc" },
    });

    if (selectedPeriod) {
      targetPeriodId = selectedPeriod.id;
    }
  }

  const whereClause = { deletedAt: null };
  if (targetPeriodId) {
    whereClause.yudisiumPeriodId = targetPeriodId;
  }

  const yudisiumList = await prisma.yudisiumRegistration.findMany({
    where: whereClause,
    include: {
      dosenWali: true,
      mahasiswa: {
        include: {
          dosenWali: true,
          sidangRegistrations: {
            where: { deletedAt: null, tglSidang: { not: null } },
            orderBy: { tglSidang: "desc" },
            take: 1,
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const workbook = new excel.Workbook();
  const worksheet = workbook.addWorksheet("Yudisium Registrations");

  worksheet.columns = [
    { header: "NIM", key: "nim", width: 15 },
    { header: "TANGGAL SIDANG AKAD", key: "tglAkad", width: 22 },
    { header: "BULAN SIDANG AKAD", key: "blnAkad", width: 20 },
    { header: "TAHUN SIDANG AKAD", key: "thnAkad", width: 20 },
    { header: "TANGGAL SIDANG TA/PA", key: "tglTa", width: 22 },
    { header: "BULAN SIDANG TA/PA", key: "blnTa", width: 20 },
    { header: "TAHUN SIDANG TA/PA", key: "thnTa", width: 20 },
    { header: "TANGGAL SURAT", key: "tglSurat", width: 15 },
    { header: "BULAN SURAT", key: "blnSurat", width: 20 },
    { header: "TAHUN SURAT", key: "thnSurat", width: 20 },
    { header: "NOMOR SURAT", key: "noSurat", width: 30 },
    { header: "KODE DOSEN WALI", key: "kodeDoswal", width: 30 },
    { header: "PREDIKAT YUDISIUM", key: "predikat", width: 20 },
    { header: "STATUS", key: "status", width: 15 },
    { header: "MEDIA JURNAL", key: "mediaJurnal", width: 15 },
    { header: "TANGGAL UPLOAD JURNAL", key: "tglJurnal", width: 25 },
    { header: "BULAN UPLOAD JURNAL", key: "blnJurnal", width: 25 },
    { header: "TAHUN UPLOAD JURNAL", key: "thnJurnal", width: 25 },
    { header: "AKUN GOOGLE SCHOLAR", key: "scholar", width: 30 },
  ];

  yudisiumList.forEach((yudisium) => {
    let tglAkad = "",
      blnAkad = "",
      thnAkad = "";
    if (yudisium.tglSidang) {
      const d = new Date(yudisium.tglSidang);
      tglAkad = d.getDate();
      blnAkad = d.getMonth() + 1;
      thnAkad = d.getFullYear();
    }

    let tglTa = "",
      blnTa = "",
      thnTa = "";
    const sidangTA = yudisium.mahasiswa?.sidangRegistrations?.[0];
    if (sidangTA?.tglSidang) {
      const d = new Date(sidangTA.tglSidang);
      tglTa = d.getDate();
      blnTa = d.getMonth() + 1;
      thnTa = d.getFullYear();
    }

    const kodeDosenWali =
      yudisium.mahasiswa?.dosenWali?.kodeDosen ||
      yudisium.dosenWali?.kodeDosen ||
      "";

    worksheet.addRow({
      nim: yudisium.mahasiswa?.nim || "",
      tglAkad,
      blnAkad,
      thnAkad,
      tglTa,
      blnTa,
      thnTa,
      tglSurat: "",
      blnSurat: "",
      thnSurat: "",
      noSurat: "",
      kodeDoswal: kodeDosenWali,
      predikat: yudisium.predikat || "",
      status: yudisium.statusKelulusan || "",
      mediaJurnal: "",
      tglJurnal: "",
      blnJurnal: "",
      thnJurnal: "",
      scholar: "",
    });
  });

  let filename = "List_Yudisium.xlsx";

  if (selectedPeriod) {
    const sanitizePart = (str) =>
      (str || "")
        .replace(/[/\\]/g, "")
        .replace(/[:*?"<>|]/g, "")
        .replace(/\s+/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "");

    const tahunAjaran = sanitizePart(selectedPeriod.period);
    const namaPeriode = sanitizePart(selectedPeriod.name);
    filename = `List_Yudisium_${tahunAjaran}_${namaPeriode}.xlsx`;
  }

  return { workbook, filename };
};
