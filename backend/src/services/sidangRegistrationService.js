import path from "path";
import prisma from "../config/prisma.js";
import { parseBoolean } from "../utils/validationHelper.js";
import {
  getPaginationParams,
  formatPaginationResponse,
} from "../utils/paginationHelper.js";
import { uploadFile, deleteFile } from "./storageService.js";
import { mapSidangRegistrationToFrontend } from "../mappers/sidangMapper.js";
import {
  DOCUMENT_CATEGORIES,
  NON_SIDANG_CATEGORY_MAP,
} from "../constants/documentCategories.js";

export const sidangInclude = {
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
  dosenPenguji1: {
    include: {
      user: true,
    },
  },
  dosenPenguji2: {
    include: {
      user: true,
    },
  },
  researchGroup: true,
  ruanganSidang: true,
  admin: {
    include: {
      user: true,
    },
  },
  sidangRegistrationPeriod: true,
  sidangPeriod: true,
  sidangRegistrationUploads: true,
};

export const getSlugsByCategory = async (categoryName) => {
  const docs = await prisma.dokumenPersyaratanBerkas.findMany({
    where: { category: categoryName, isRequired: true, deletedAt: null },
    select: { code: true },
  });
  return docs.map((doc) => doc.code);
};

export const getRequiredSlugsFromDb = () =>
  getSlugsByCategory(DOCUMENT_CATEGORIES.SIDANG_WAJIB);

export const getNonSidangSlugsFromDb = (jalur) => {
  const normalized = String(jalur || "").trim();
  const matchedKey = Object.keys(NON_SIDANG_CATEGORY_MAP).find(
    (key) => key.toLowerCase() === normalized.toLowerCase()
  );
  const categoryName = matchedKey
    ? NON_SIDANG_CATEGORY_MAP[matchedKey]
    : `Sidang - Evidence Non Sidang ${normalized}`;
  return getSlugsByCategory(categoryName);
};

export const getTestBahasaSlugsFromDb = (lulusTesBahasa) => {
  const categoryName =
    lulusTesBahasa === true
      ? DOCUMENT_CATEGORIES.SIDANG_BAHASA_SUDAH
      : DOCUMENT_CATEGORIES.SIDANG_BAHASA_BELUM;
  return getSlugsByCategory(categoryName);
};

export const deleteUploadsByCategory = async (registrationId, categories) => {
  if (!categories || !categories.length) return;
  const uploadsToDelete = await prisma.sidangRegistrationUpload.findMany({
    where: {
      sidangRegistrationId: registrationId,
      category: { in: categories },
    },
  });
  for (const upload of uploadsToDelete) {
    if (upload.filepath) await deleteFile(upload.filepath);
  }
  if (uploadsToDelete.length > 0) {
    await prisma.sidangRegistrationUpload.deleteMany({
      where: { id: { in: uploadsToDelete.map((u) => u.id) } },
    });
  }
};

export const checkSidangEditable = async (registrationId) => {
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

export const getSidangRegistrations = async ({
  where = {},
  orderBy = { createdAt: "desc" },
  skip,
  take,
} = {}) => {
  const [total, sidangRegistrations] = await Promise.all([
    prisma.sidangRegistration.count({ where }),
    prisma.sidangRegistration.findMany({
      where,
      skip,
      take,
      include: sidangInclude,
      orderBy,
    }),
  ]);

  return { total, sidangRegistrations };
};

/**
 * Mengambil daftar pendaftaran sidang dengan filter, pencarian, sorting, dan paginasi
 */
export const listSidangRegistrations = async ({ query = {}, req } = {}) => {
  const paginationParams = getPaginationParams(query);
  const {
    search,
    studyProgramId,
    skemaSidang,
    jalurNonSidang,
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
  if (studyProgramId && typeof studyProgramId === "string" && studyProgramId.trim() !== "") {
    where.mahasiswa = where.mahasiswa || {};
    where.mahasiswa.studyProgramId = studyProgramId.trim();
  }

  // 3. Filter by Skema Sidang
  if (skemaSidang && typeof skemaSidang === "string" && skemaSidang.trim() !== "") {
    const skema = skemaSidang.trim();
    where.AND = where.AND || [];
    where.AND.push({
      OR: [
        {
          skemaSidangFinal: {
            equals: skema,
            mode: "insensitive",
          },
        },
        {
          OR: [{ skemaSidangFinal: null }, { skemaSidangFinal: "" }],
          skemaSidang: {
            equals: skema,
            mode: "insensitive",
          },
        },
      ],
    });
  }

  // 4. Filter by Jalur Non Sidang
  if (jalurNonSidang && typeof jalurNonSidang === "string" && jalurNonSidang.trim() !== "") {
    const jalur = jalurNonSidang.trim();
    where.AND = where.AND || [];
    where.AND.push({
      OR: [
        {
          jalurNonSidangFinal: {
            equals: jalur,
            mode: "insensitive",
          },
        },
        {
          OR: [{ jalurNonSidangFinal: null }, { jalurNonSidangFinal: "" }],
          jalurNonSidang: {
            has: jalur,
          },
        },
      ],
    });
  }

  // 5. Filter by Status
  if (status && typeof status === "string" && status.trim() !== "") {
    const s = status.trim();
    if (s.toLowerCase() === "siap sidang") {
      where.status = "Pendaftaran Diterima";
      where.sidangPeriod = {
        isOpen: true,
        deletedAt: null,
      };
    } else {
      where.status = {
        equals: s,
        mode: "insensitive",
      };
    }
  }

  // 6. Sorting
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
    orderBy = { ipk: "asc" };
  } else if (sortParam === "ipkdesc") {
    orderBy = { ipk: "desc" };
  } else if (sortParam === "sksasc") {
    orderBy = { sks: "asc" };
  } else if (sortParam === "sksdesc") {
    orderBy = { sks: "desc" };
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

  const { total, sidangRegistrations } = await getSidangRegistrations({
    where,
    orderBy,
    skip: paginationParams.skip,
    take: paginationParams.take,
  });

  const data = sidangRegistrations.map((reg) =>
    mapSidangRegistrationToFrontend(reg, req)
  );

  return formatPaginationResponse(data, total, paginationParams);
};

/**
 * Mengambil detail pendaftaran sidang berdasarkan ID
 */
export const getSidangRegistrationById = async (id, req) => {
  const sidangRegistration = await prisma.sidangRegistration.findUnique({
    where: { id },
    include: sidangInclude,
  });

  if (!sidangRegistration) {
    const error = new Error("Pendaftaran sidang tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  return mapSidangRegistrationToFrontend(sidangRegistration, req);
};

/**
 * Mengambil detail pendaftaran sidang berdasarkan ID Mahasiswa
 */
export const getSidangRegistrationByMahasiswaId = async (mahasiswaId, req) => {
  const sidangRegistration = await prisma.sidangRegistration.findFirst({
    where: { mahasiswaId },
    include: sidangInclude,
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!sidangRegistration) {
    const error = new Error("Pendaftaran sidang tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  return mapSidangRegistrationToFrontend(sidangRegistration, req);
};

/**
 * Menyimpan draft pendaftaran sidang (upsert)
 */
export const saveSidangRegistration = async (body, req) => {
  const {
    id,
    programType,
    program,
    sidangScheme,
    skemaSidang,
    jalurNonSidang,
    lulusTesBahasa,
    sks,
    ipk,
    tak,
    sktaExpDate,
    thesisTitleId,
    thesisTitleEn,
    judulTugasAkhirIndonesia,
    judulTugasAkhirInggris,
    mahasiswaId,
    dosenPembimbing1Id,
    dosenPembimbing2Id,
  } = body;

  const parsedLulusTesBahasa = parseBoolean(lulusTesBahasa);

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

  const activePeriod = await prisma.sidangPeriod.findFirst({
    where: {
      category: "pendaftaran",
      isOpen: true,
      deletedAt: null,
    },
  });

  if (id) {
    const editCheck = await checkSidangEditable(id);
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

  const effectiveScheme = sidangScheme !== undefined ? sidangScheme : skemaSidang;
  const isNonSidangScheme =
    effectiveScheme !== undefined
      ? String(effectiveScheme).trim().toLowerCase() === "non sidang" ||
        String(effectiveScheme).trim().toLowerCase().includes("non")
      : undefined;

  const resolvedJalurNonSidang =
    isNonSidangScheme === false
      ? []
      : jalurNonSidang !== undefined
        ? Array.isArray(jalurNonSidang)
          ? jalurNonSidang
          : []
        : undefined;

  const resolvedProgram = programType !== undefined ? programType : program;
  const resolvedJudulId = thesisTitleId !== undefined ? thesisTitleId : judulTugasAkhirIndonesia;
  const resolvedJudulEn = thesisTitleEn !== undefined ? thesisTitleEn : judulTugasAkhirInggris;

  const upsertData = {
    program: resolvedProgram !== undefined ? resolvedProgram : undefined,
    skemaSidang: effectiveScheme !== undefined ? effectiveScheme : undefined,
    jalurNonSidang: resolvedJalurNonSidang,
    lulusTesBahasa:
      parsedLulusTesBahasa !== undefined ? parsedLulusTesBahasa : undefined,
    sks: sks !== undefined && sks !== null ? parseInt(sks, 10) : undefined,
    ipk: ipk !== undefined && ipk !== null ? parseFloat(ipk) : undefined,
    tak: tak !== undefined && tak !== null ? parseInt(tak, 10) : undefined,
    sktaExpDate: sktaExpDate ? new Date(sktaExpDate) : undefined,
    judulTugasAkhirIndonesia: resolvedJudulId !== undefined ? resolvedJudulId : undefined,
    judulTugasAkhirInggris: resolvedJudulEn !== undefined ? resolvedJudulEn : undefined,
    mahasiswaId: mahasiswaId !== undefined ? mahasiswaId : undefined,
    dosenPembimbing1Id:
      dosenPembimbing1Id !== undefined ? dosenPembimbing1Id : undefined,
    dosenPembimbing2Id:
      dosenPembimbing2Id !== undefined ? dosenPembimbing2Id : undefined,
    isDraft: true,
  };

  let sidangRegistration;

  if (id) {
    sidangRegistration = await prisma.sidangRegistration.update({
      where: { id },
      data: upsertData,
      include: sidangInclude,
    });
  } else if (mahasiswaId) {
    const existing = await prisma.sidangRegistration.findFirst({
      where: { mahasiswaId },
      orderBy: { createdAt: "desc" },
    });

    if (existing && existing.isDraft) {
      const editCheck = await checkSidangEditable(existing.id);
      if (!editCheck.editable) {
        const error = new Error(editCheck.reason);
        error.statusCode = 403;
        throw error;
      }

      sidangRegistration = await prisma.sidangRegistration.update({
        where: { id: existing.id },
        data: upsertData,
        include: sidangInclude,
      });
    } else {
      if (!activePeriod) {
        const error = new Error("Tidak ada periode pendaftaran sidang yang aktif saat ini.");
        error.statusCode = 400;
        throw error;
      }

      const existingInPeriod = await prisma.sidangRegistration.findFirst({
        where: {
          mahasiswaId,
          sidangRegistrationPeriodId: activePeriod.id,
          deletedAt: null,
        },
      });

      if (existingInPeriod) {
        const error = new Error("Mahasiswa sudah terdaftar pada periode pendaftaran sidang yang aktif.");
        error.statusCode = 400;
        throw error;
      }

      upsertData.sidangRegistrationPeriodId = activePeriod.id;

      sidangRegistration = await prisma.sidangRegistration.create({
        data: upsertData,
        include: sidangInclude,
      });
    }
  } else {
    if (!activePeriod) {
      const error = new Error("Tidak ada periode pendaftaran sidang yang aktif saat ini.");
      error.statusCode = 400;
      throw error;
    }

    upsertData.sidangRegistrationPeriodId = activePeriod.id;

    sidangRegistration = await prisma.sidangRegistration.create({
      data: upsertData,
      include: sidangInclude,
    });
  }

  return mapSidangRegistrationToFrontend(sidangRegistration, req);
};

/**
 * Mengirim (submit) pendaftaran sidang dengan validasi lengkap kelengkapan data & berkas
 */
export const submitSidangRegistration = async (body, req) => {
  const {
    id,
    programType,
    program,
    sidangScheme,
    skemaSidang,
    jalurNonSidang,
    lulusTesBahasa,
    sks,
    ipk,
    tak,
    sktaExpDate,
    thesisTitleId,
    thesisTitleEn,
    judulTugasAkhirIndonesia,
    judulTugasAkhirInggris,
    mahasiswaId,
    dosenPembimbing1Id,
    dosenPembimbing2Id,
  } = body;

  const parsedLulusTesBahasa = parseBoolean(lulusTesBahasa);

  const existingRegistration = await prisma.sidangRegistration.findUnique({
    where: { id },
    include: {
      sidangRegistrationUploads: true,
    },
  });

  if (!existingRegistration) {
    const error = new Error("Pendaftaran sidang tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const editCheck = await checkSidangEditable(id);
  if (!editCheck.editable) {
    const error = new Error(editCheck.reason);
    error.statusCode = 403;
    throw error;
  }

  const effectiveScheme = sidangScheme !== undefined ? sidangScheme : (skemaSidang !== undefined ? skemaSidang : existingRegistration.skemaSidang);

  const currentJalurNonSidang =
    jalurNonSidang !== undefined
      ? Array.isArray(jalurNonSidang)
        ? jalurNonSidang
        : []
      : existingRegistration.jalurNonSidang || [];

  const hasJalurNonSidang =
    Array.isArray(currentJalurNonSidang) && currentJalurNonSidang.length > 0;

  const isNonSidang =
    String(effectiveScheme || "")
      .trim()
      .toLowerCase() === "non sidang" ||
    String(effectiveScheme || "")
      .trim()
      .toLowerCase()
      .includes("non") ||
    hasJalurNonSidang;

  const resolvedSubmitJalurNonSidang = !isNonSidang ? [] : currentJalurNonSidang;
  const resolvedProgram = programType !== undefined ? programType : program;
  const resolvedJudulId = thesisTitleId !== undefined ? thesisTitleId : judulTugasAkhirIndonesia;
  const resolvedJudulEn = thesisTitleEn !== undefined ? thesisTitleEn : judulTugasAkhirInggris;

  const updateData = {
    program: resolvedProgram !== undefined ? resolvedProgram : undefined,
    skemaSidang: effectiveScheme !== undefined ? effectiveScheme : undefined,
    jalurNonSidang: resolvedSubmitJalurNonSidang,
    lulusTesBahasa:
      parsedLulusTesBahasa !== undefined ? parsedLulusTesBahasa : undefined,
    sks: sks !== undefined && sks !== null ? parseInt(sks, 10) : undefined,
    ipk: ipk !== undefined && ipk !== null ? parseFloat(ipk) : undefined,
    tak: tak !== undefined && tak !== null ? parseInt(tak, 10) : undefined,
    sktaExpDate: sktaExpDate ? new Date(sktaExpDate) : undefined,
    judulTugasAkhirIndonesia: resolvedJudulId !== undefined ? resolvedJudulId : undefined,
    judulTugasAkhirInggris: resolvedJudulEn !== undefined ? resolvedJudulEn : undefined,
    mahasiswaId: mahasiswaId !== undefined ? mahasiswaId : undefined,
    dosenPembimbing1Id:
      dosenPembimbing1Id !== undefined ? dosenPembimbing1Id : undefined,
    dosenPembimbing2Id:
      dosenPembimbing2Id !== undefined ? dosenPembimbing2Id : undefined,
    isEdit: null,
    message: null,
  };

  const activePeriod = await prisma.sidangPeriod.findFirst({
    where: {
      category: "pendaftaran",
      isOpen: true,
      deletedAt: null,
    },
  });

  if (existingRegistration.sidangRegistrationPeriodId) {
    const period = await prisma.sidangPeriod.findUnique({
      where: { id: existingRegistration.sidangRegistrationPeriodId },
    });
    if (!period || !period.isOpen) {
      const error = new Error("Periode pendaftaran sidang ini sudah ditutup.");
      error.statusCode = 400;
      throw error;
    }
  } else {
    if (!activePeriod) {
      const error = new Error("Tidak ada periode pendaftaran sidang yang aktif saat ini.");
      error.statusCode = 400;
      throw error;
    }
    updateData.sidangRegistrationPeriodId = activePeriod.id;
  }

  const mergedData = { ...existingRegistration, ...updateData };

  // 1. Validasi Field Required
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
    (field) => mergedData[field] === null || mergedData[field] === undefined
  );

  if (missingFields.length > 0) {
    const error = new Error(`Tidak dapat submit. Field wajib belum lengkap: ${missingFields.join(", ")}`);
    error.statusCode = 400;
    throw error;
  }

  // 2. Validasi Uploaded Files
  const uploadedCategories = (
    existingRegistration.sidangRegistrationUploads || []
  ).map((upload) => upload.category);

  const missingFiles = [];

  const requiredSlugs = await getRequiredSlugsFromDb();
  for (const slug of requiredSlugs) {
    if (!uploadedCategories.includes(slug)) missingFiles.push(slug);
  }

  if (mergedData.lulusTesBahasa === undefined || mergedData.lulusTesBahasa === null) {
    const error = new Error("Tidak dapat submit. Status Test Bahasa (Sudah/Belum) wajib dipilih.");
    error.statusCode = 400;
    throw error;
  }

  const testBahasaSlugs = await getTestBahasaSlugsFromDb(mergedData.lulusTesBahasa);

  const overlappingSlugs = requiredSlugs.filter((slug) =>
    testBahasaSlugs.includes(slug)
  );
  if (overlappingSlugs.length > 0) {
    console.error(
      `[Konfigurasi Bermasalah] Dokumen berikut terdaftar di kategori "Sidang - Berkas Wajib" DAN kategori Test Bahasa sekaligus: ${overlappingSlugs.join(", ")}. Periksa data di tabel dokumenPersyaratanBerkas.`
    );
  }

  for (const slug of testBahasaSlugs) {
    if (!uploadedCategories.includes(slug)) missingFiles.push(slug);
  }

  if (
    isNonSidang &&
    mergedData.jalurNonSidang &&
    Array.isArray(mergedData.jalurNonSidang)
  ) {
    for (const jalur of mergedData.jalurNonSidang) {
      const nonSidangSlugs = await getNonSidangSlugsFromDb(jalur);
      for (const slug of nonSidangSlugs) {
        if (!uploadedCategories.includes(slug)) missingFiles.push(slug);
      }
    }
  }

  if (missingFiles.length > 0) {
    const error = new Error(`Tidak dapat submit. Berkas wajib belum lengkap: ${missingFiles.join(", ")}`);
    error.statusCode = 400;
    throw error;
  }

  // Validasi referensi eksis
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

  if (mergedData.lulusTesBahasa === true) {
    const belumSlugs = await getTestBahasaSlugsFromDb(false);
    await deleteUploadsByCategory(id, belumSlugs);
  } else if (mergedData.lulusTesBahasa === false) {
    const sudahSlugs = await getTestBahasaSlugsFromDb(true);
    await deleteUploadsByCategory(id, sudahSlugs);
  }

  const isRevision =
    existingRegistration.status === "Perlu Revisi" ||
    existingRegistration.isEdit !== null ||
    existingRegistration.message !== null;

  updateData.status = isRevision ? "Revisi Diajukan" : "Dalam Proses";
  updateData.isDraft = false;
  updateData.submittedAt = new Date();

  const updatedSidangRegistration = await prisma.sidangRegistration.update({
    where: { id },
    data: updateData,
    include: sidangInclude,
  });

  return mapSidangRegistrationToFrontend(updatedSidangRegistration, req);
};

/**
 * Menghapus pendaftaran sidang (soft delete)
 */
export const deleteSidangRegistration = async (id) => {
  const sidangRegistrationExists = await prisma.sidangRegistration.findUnique({
    where: { id },
  });

  if (!sidangRegistrationExists) {
    const error = new Error("Pendaftaran sidang tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  return await prisma.sidangRegistration.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  });
};

/**
 * Mengunggah berkas persyaratan pendaftaran sidang
 */
export const uploadSidangRegistrationFile = async ({
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

  const editCheck = await checkSidangEditable(id);
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

  const downloadUrl = req
    ? `${req.protocol}://${req.get("host")}/api/sidang-registrations/uploads/${uploadRecord.id}/download`
    : null;

  return {
    isUpdated: Boolean(existingUpload),
    data: {
      id: uploadRecord.id,
      name: uploadRecord.name,
      category: uploadRecord.category,
      filepath: uploadRecord.filepath,
      isValid: uploadRecord.isValid,
      sidangRegistrationId: uploadRecord.sidangRegistrationId,
      downloadUrl,
    },
  };
};

/**
 * Mengambil semua berkas unggahan berdasarkan ID pendaftaran sidang
 */
export const getSidangRegistrationFiles = async (id, req) => {
  const uploads = await prisma.sidangRegistrationUpload.findMany({
    where: { sidangRegistrationId: id },
  });

  return uploads.map((upload) => ({
    id: upload.id,
    name: upload.name,
    category: upload.category,
    filepath: upload.filepath,
    isValid: upload.isValid,
    sidangRegistrationId: upload.sidangRegistrationId,
    downloadUrl: req
      ? `${req.protocol}://${req.get("host")}/api/sidang-registrations/uploads/${upload.id}/download`
      : null,
  }));
};

/**
 * Mengambil metadata file unggahan untuk di-download
 */
export const getDownloadFileInfo = async (uploadId) => {
  const upload = await prisma.sidangRegistrationUpload.findFirst({
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
    "dokumen-sidang";
  const downloadName = baseName.toLowerCase().endsWith(ext.toLowerCase())
    ? baseName
    : `${baseName}${ext}`;

  return {
    filepath: upload.filepath,
    downloadName,
  };
};

/**
 * Menyetujui pendaftaran sidang (Admin Response)
 */
export const approveSidangRegistration = async (
  {
    id,
    adminId,
    sidangPeriodId,
    sidangRegistrationUploadIds,
    skemaSidangFinal,
    jalurNonSidangFinal,
  },
  req
) => {
  const registration = await prisma.sidangRegistration.findUnique({
    where: { id },
  });

  if (!registration) {
    const error = new Error("Pendaftaran sidang tidak ditemukan");
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

  const period = await prisma.sidangPeriod.findUnique({
    where: { id: sidangPeriodId },
  });

  if (!period) {
    const error = new Error("Periode sidang tidak ditemukan");
    error.statusCode = 404;
    throw error;
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

  const finalSkemaSidang =
    typeof skemaSidangFinal === "string" && skemaSidangFinal.trim() !== ""
      ? skemaSidangFinal.trim()
      : null;

  const finalJalurNonSidang =
    typeof jalurNonSidangFinal === "string" && jalurNonSidangFinal.trim() !== ""
      ? jalurNonSidangFinal.trim()
      : null;

  const updatedRegistration = await prisma.sidangRegistration.update({
    where: { id },
    data: {
      adminId,
      sidangPeriodId,
      skemaSidangFinal: finalSkemaSidang,
      jalurNonSidangFinal: finalJalurNonSidang,
      status: "Pendaftaran Diterima",
      message: null,
      isEdit: null,
    },
    include: sidangInclude,
  });

  return mapSidangRegistrationToFrontend(updatedRegistration, req);
};

/**
 * Menolak / meminta revisi pendaftaran sidang (Admin Response)
 */
export const rejectSidangRegistration = async (
  { adminId, message, isEdit, sidangRegistrationUploadIds, id },
  req
) => {
  const registration = await prisma.sidangRegistration.findUnique({
    where: { id },
  });

  if (!registration) {
    const error = new Error("Pendaftaran sidang tidak ditemukan");
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
      status: "Perlu Revisi",
      isDraft: isEdit ? true : false,
      submittedAt: isEdit ? null : undefined,
    },
    include: sidangInclude,
  });

  return mapSidangRegistrationToFrontend(updatedRegistration, req);
};

/**
 * Mengubah status kunci (isLocked) pendaftaran sidang (Admin Only)
 */
export const toggleLockSidangRegistration = async (id, req) => {
  const registration = await prisma.sidangRegistration.findUnique({
    where: { id },
  });

  if (!registration || registration.deletedAt) {
    const error = new Error("Pendaftaran sidang tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const updatedRegistration = await prisma.sidangRegistration.update({
    where: { id },
    data: {
      isLocked: !registration.isLocked,
    },
    include: sidangInclude,
  });

  return {
    isLocked: updatedRegistration.isLocked,
    data: mapSidangRegistrationToFrontend(updatedRegistration, req),
  };
};
