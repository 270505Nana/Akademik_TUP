import asyncHandler from "express-async-handler";
import excel from "exceljs";
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
import { mapYudisiumRegistrationToFrontend } from "../mappers/index.js";
import {
  yudisiumInclude,
  getRequiredSlugsFromDb,
  getWirausahaSlugsFromDb,
  getCumlaudeSlugsFromDb,
  deleteUploadsByCategory,
  checkYudisiumEditable,
  getYudisiumRegistrationById as fetchYudisiumById,
  getYudisiumRegistrationByMahasiswaId as fetchYudisiumByMahasiswaId,
} from "../services/yudisiumRegistrationService.js";

// Yudisium Registration List (with search, filter, sort, and pagination)
const listYudisiumRegistrations = asyncHandler(async (req, res) => {
  const paginationParams = getPaginationParams(req.query);
  const {
    search,
    status,
    isDraft,
    yudisiumRegistrationPeriodId,
    yudisiumPeriodId,
    studyProgramId,
    facultyId,
    tahunAngkatan,
    program,
    skemaSidang,
    pengajuanCumlaude,
    skemaCumlaude,
    berminatWirausaha,
    dosenWaliId,
    sortBy,
  } = req.query;

  const where = {
    deletedAt: null,
  };

  // 1. Global Search across mahasiswa name, nim, and thesis title
  const searchTerm = (search || "").trim();
  if (searchTerm) {
    where.OR = [
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
    ];
  }

  // 2. Status Filter
  if (status && typeof status === "string" && status.trim() !== "") {
    const s = status.trim().toLowerCase();
    if (s === "draft") {
      where.isDraft = true;
      where.isEdit = null;
    } else if (s === "submitted") {
      where.isDraft = false;
      where.yudisiumPeriodId = null;
      where.message = null;
      where.isEdit = null;
    } else if (s === "approved") {
      where.yudisiumPeriodId = { not: null };
    } else if (s === "rejected") {
      where.message = { not: null };
      where.isEdit = null;
      where.yudisiumPeriodId = null;
    } else if (s === "revision") {
      where.isEdit = { not: null };
    }
  }

  // Explicit isDraft filter if provided
  const parsedIsDraft = parseBoolean(isDraft);
  if (parsedIsDraft !== undefined) {
    where.isDraft = parsedIsDraft;
  }

  // 3. Periode Yudisium (Pendaftaran dan Pelaksanaan)
  if (
    yudisiumRegistrationPeriodId &&
    typeof yudisiumRegistrationPeriodId === "string" &&
    yudisiumRegistrationPeriodId.trim() !== ""
  ) {
    where.yudisiumRegistrationPeriodId = yudisiumRegistrationPeriodId.trim();
  }

  if (
    yudisiumPeriodId &&
    typeof yudisiumPeriodId === "string" &&
    yudisiumPeriodId.trim() !== ""
  ) {
    where.yudisiumPeriodId = yudisiumPeriodId.trim();
  }

  // 4. Akademik & Program Studi Mahasiswa
  if (
    studyProgramId &&
    typeof studyProgramId === "string" &&
    studyProgramId.trim() !== ""
  ) {
    where.mahasiswa = where.mahasiswa || {};
    where.mahasiswa.studyProgramId = studyProgramId.trim();
  }

  if (facultyId && typeof facultyId === "string" && facultyId.trim() !== "") {
    where.mahasiswa = where.mahasiswa || {};
    where.mahasiswa.studyProgram = {
      ...where.mahasiswa.studyProgram,
      facultyId: facultyId.trim(),
    };
  }

  if (
    tahunAngkatan !== undefined &&
    tahunAngkatan !== null &&
    String(tahunAngkatan).trim() !== ""
  ) {
    const parsedAngkatan = parseInt(tahunAngkatan, 10);
    if (!isNaN(parsedAngkatan)) {
      where.mahasiswa = where.mahasiswa || {};
      where.mahasiswa.tahunAngkatan = parsedAngkatan;
    }
  }

  // Program (Reguler / Alih Jenjang)
  if (program && typeof program === "string" && program.trim() !== "") {
    where.program = {
      contains: program.trim(),
      mode: "insensitive",
    };
  }

  // Skema Sidang
  if (
    skemaSidang &&
    typeof skemaSidang === "string" &&
    skemaSidang.trim() !== ""
  ) {
    where.skemaSidang = {
      contains: skemaSidang.trim(),
      mode: "insensitive",
    };
  }

  // Dosen Wali
  if (
    dosenWaliId &&
    typeof dosenWaliId === "string" &&
    dosenWaliId.trim() !== ""
  ) {
    where.dosenWaliId = dosenWaliId.trim();
  }

  // 5. Cumlaude & Wirausaha
  if (
    pengajuanCumlaude &&
    typeof pengajuanCumlaude === "string" &&
    pengajuanCumlaude.trim() !== ""
  ) {
    where.pengajuanCumlaude = {
      contains: pengajuanCumlaude.trim(),
      mode: "insensitive",
    };
  }

  if (
    skemaCumlaude &&
    typeof skemaCumlaude === "string" &&
    skemaCumlaude.trim() !== ""
  ) {
    where.skemaCumlaude = {
      contains: skemaCumlaude.trim(),
      mode: "insensitive",
    };
  }

  const parsedWirausaha = parseBoolean(berminatWirausaha);
  if (parsedWirausaha !== undefined) {
    where.berminatWirausaha = parsedWirausaha;
  }

  // 6. Sorting (Single unified sortBy param matching other endpoints)
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
  } else if (sortParam === "oldest" || sortParam === "createdatasc" || sortParam === "lama-baru") {
    orderBy = { createdAt: "asc" };
  } else if (sortParam === "newest" || sortParam === "createdatdesc" || sortParam === "baru-lama") {
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

  res.json(formatPaginationResponse(data, total, paginationParams));
});

// Get Yudisium Registration by ID
const getYudisiumRegistrationById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const yudisiumRegistration = await fetchYudisiumById(id);

  if (!yudisiumRegistration) {
    res.status(404);
    throw new Error("Pendaftaran yudisium tidak ditemukan");
  }

  res.json({
    data: mapYudisiumRegistrationToFrontend(yudisiumRegistration, req),
  });
});

// Get Yudisium Registration by Mahasiswa ID
const getYudisiumRegistrationByMahasiswaId = asyncHandler(async (req, res) => {
  const { mahasiswaId } = req.params;
  const yudisiumRegistration = await fetchYudisiumByMahasiswaId(mahasiswaId);

  if (!yudisiumRegistration) {
    res.status(404);
    throw new Error("Pendaftaran yudisium tidak ditemukan");
  }

  res.json({
    data: mapYudisiumRegistrationToFrontend(yudisiumRegistration, req),
  });
});

// Save Draft Yudisium Registration (Upsert)
const saveYudisiumRegistration = asyncHandler(async (req, res) => {
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
  } = req.body;

  const program =
    req.body.program !== undefined ? req.body.program : req.body.programType;
  const judulTugasAkhirIndonesia =
    req.body.judulTugasAkhirIndonesia !== undefined
      ? req.body.judulTugasAkhirIndonesia
      : req.body.thesisTitleId;
  const judulTugasAkhirInggris =
    req.body.judulTugasAkhirInggris !== undefined
      ? req.body.judulTugasAkhirInggris
      : req.body.thesisTitleEn;
  const skemaSidang =
    req.body.skemaSidang !== undefined
      ? req.body.skemaSidang
      : req.body.sidangScheme;
  const pengajuanCumlaude =
    req.body.pengajuanCumlaude !== undefined
      ? req.body.pengajuanCumlaude
      : req.body.jalurYudisium;

  let skemaCumlaude =
    req.body.skemaCumlaude !== undefined
      ? req.body.skemaCumlaude
      : req.body.cumlaudeScheme;
  if (skemaCumlaude === undefined && req.body.skemaTambahan !== undefined) {
    skemaCumlaude = Array.isArray(req.body.skemaTambahan)
      ? req.body.skemaTambahan.join(", ")
      : req.body.skemaTambahan;
  } else if (Array.isArray(skemaCumlaude)) {
    skemaCumlaude = skemaCumlaude.join(", ");
  }

  const evidenCumlaude =
    req.body.evidenCumlaude !== undefined
      ? req.body.evidenCumlaude
      : req.body.eviden_cumlaude !== undefined
        ? req.body.eviden_cumlaude
        : req.body.evidenList;

  const parsedBerminatWirausaha = parseBoolean(req.body.berminatWirausaha);
  const finalDosenWaliId = dosenWaliId !== undefined ? dosenWaliId : doswalId;

  const errors = [];

  if (!isNil(id) && typeof id !== "string") {
    errors.push({ field: "id", message: "ID harus berupa string" });
  }

  if (!isNil(program) && typeof program !== "string") {
    errors.push({ field: "program", message: "Program harus berupa string" });
  }

  if (!isNil(tak) && isNaN(parseInt(tak))) {
    errors.push({ field: "tak", message: "TAK harus berupa integer" });
  }

  if (!isNil(tglSidang) && isNaN(new Date(tglSidang).getTime())) {
    errors.push({ field: "tglSidang", message: "Tanggal sidang tidak valid" });
  }

  if (
    !isNil(judulTugasAkhirIndonesia) &&
    typeof judulTugasAkhirIndonesia !== "string"
  ) {
    errors.push({
      field: "judulTugasAkhirIndonesia",
      message: "Judul TA (Indonesia) harus berupa string",
    });
  }

  if (
    !isNil(judulTugasAkhirInggris) &&
    typeof judulTugasAkhirInggris !== "string"
  ) {
    errors.push({
      field: "judulTugasAkhirInggris",
      message: "Judul TA (Inggris) harus berupa string",
    });
  }

  if (!isNil(skemaSidang) && typeof skemaSidang !== "string") {
    errors.push({
      field: "skemaSidang",
      message: "Skema sidang harus berupa string jika diisi",
    });
  }

  if (!isNil(pengajuanCumlaude) && typeof pengajuanCumlaude !== "string") {
    errors.push({
      field: "pengajuanCumlaude",
      message: "Pengajuan cumlaude harus berupa string jika diisi",
    });
  }

  if (!isNil(skemaCumlaude) && typeof skemaCumlaude !== "string") {
    errors.push({
      field: "skemaCumlaude",
      message: "Skema cumlaude harus berupa string jika diisi",
    });
  }

  if (!isNil(evidenCumlaude) && typeof evidenCumlaude !== "string") {
    errors.push({
      field: "evidenCumlaude",
      message: "Eviden cumlaude harus berupa string jika diisi",
    });
  }

  if (
    !isNil(req.body.berminatWirausaha) &&
    parsedBerminatWirausaha === undefined
  ) {
    errors.push({
      field: "berminatWirausaha",
      message: "Minat wirausaha harus berupa boolean",
    });
  }

  if (!isNil(mahasiswaId) && typeof mahasiswaId !== "string") {
    errors.push({
      field: "mahasiswaId",
      message: "ID mahasiswa harus berupa string",
    });
  }

  if (!isNil(finalDosenWaliId) && typeof finalDosenWaliId !== "string") {
    errors.push({
      field: "dosenWaliId",
      message: "ID dosen wali harus berupa string",
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

  if (!isNil(yudisiumPeriodId) && typeof yudisiumPeriodId !== "string") {
    errors.push({
      field: "yudisiumPeriodId",
      message: "ID periode yudisium harus berupa string",
    });
  }

  if (
    !isNil(yudisiumRegistrationPeriodId) &&
    typeof yudisiumRegistrationPeriodId !== "string"
  ) {
    errors.push({
      field: "yudisiumRegistrationPeriodId",
      message: "ID periode pendaftaran yudisium harus berupa string",
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

  if (finalDosenWaliId) {
    const doswalExists = await prisma.dosen.findUnique({
      where: { id: finalDosenWaliId },
    });
    if (!doswalExists) {
      res.status(404);
      throw new Error("Dosen wali tidak ditemukan");
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
  const activePeriod = await prisma.yudisiumPeriod.findFirst({
    where: { category: "pendaftaran yudisium", isOpen: true, deletedAt: null },
  });

  // Check edit permission if updating an existing registration by ID
  if (id) {
    const editCheck = await checkYudisiumEditable(id);
    if (!editCheck.exists) {
      res.status(404);
      throw new Error(editCheck.reason);
    }
    if (!editCheck.editable) {
      res.status(403);
      throw new Error(editCheck.reason);
    }
  }

  const upsertData = {
    program: program !== undefined ? program : undefined,
    tak: tak !== undefined ? parseInt(tak) : undefined,
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
        res.status(403);
        throw new Error(editCheck.reason);
      }

      yudisiumRegistration = await prisma.yudisiumRegistration.update({
        where: { id: existing.id },
        data: upsertData,
        include: yudisiumInclude,
      });
    } else {
      // Check active period
      const targetPeriodId = upsertData.yudisiumRegistrationPeriodId;
      if (!targetPeriodId) {
        res.status(400);
        throw new Error(
          "Tidak ada periode pendaftaran yudisium yang aktif saat ini.",
        );
      }

      // Check if student is already registered in this period
      const existingInPeriod = await prisma.yudisiumRegistration.findFirst({
        where: {
          mahasiswaId,
          yudisiumRegistrationPeriodId: targetPeriodId,
          deletedAt: null,
        },
      });

      if (existingInPeriod) {
        res.status(400);
        throw new Error(
          "Mahasiswa sudah terdaftar pada periode pendaftaran yudisium ini.",
        );
      }

      yudisiumRegistration = await prisma.yudisiumRegistration.create({
        data: upsertData,
        include: yudisiumInclude,
      });
    }
  } else {
    // Check active period
    const targetPeriodId = upsertData.yudisiumRegistrationPeriodId;
    if (!targetPeriodId) {
      res.status(400);
      throw new Error(
        "Tidak ada periode pendaftaran yudisium yang aktif saat ini.",
      );
    }

    yudisiumRegistration = await prisma.yudisiumRegistration.create({
      data: upsertData,
      include: yudisiumInclude,
    });
  }

  res.status(200).json({
    message: "Yudisium registration saved as draft successfully",
    data: mapYudisiumRegistrationToFrontend(yudisiumRegistration, req),
  });
});

// Submit Yudisium Registration (Update isDraft to false with Validation)
const submitYudisiumRegistration = asyncHandler(async (req, res) => {
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
  } = req.body;

  const program =
    req.body.program !== undefined ? req.body.program : req.body.programType;
  const judulTugasAkhirIndonesia =
    req.body.judulTugasAkhirIndonesia !== undefined
      ? req.body.judulTugasAkhirIndonesia
      : req.body.thesisTitleId;
  const judulTugasAkhirInggris =
    req.body.judulTugasAkhirInggris !== undefined
      ? req.body.judulTugasAkhirInggris
      : req.body.thesisTitleEn;
  const skemaSidang =
    req.body.skemaSidang !== undefined
      ? req.body.skemaSidang
      : req.body.sidangScheme;
  const pengajuanCumlaude =
    req.body.pengajuanCumlaude !== undefined
      ? req.body.pengajuanCumlaude
      : req.body.jalurYudisium;

  let skemaCumlaude =
    req.body.skemaCumlaude !== undefined
      ? req.body.skemaCumlaude
      : req.body.cumlaudeScheme;
  if (skemaCumlaude === undefined && req.body.skemaTambahan !== undefined) {
    skemaCumlaude = Array.isArray(req.body.skemaTambahan)
      ? req.body.skemaTambahan.join(", ")
      : req.body.skemaTambahan;
  } else if (Array.isArray(skemaCumlaude)) {
    skemaCumlaude = skemaCumlaude.join(", ");
  }

  const evidenCumlaude =
    req.body.evidenCumlaude !== undefined
      ? req.body.evidenCumlaude
      : req.body.eviden_cumlaude !== undefined
        ? req.body.eviden_cumlaude
        : req.body.evidenList;

  const parsedBerminatWirausaha = parseBoolean(req.body.berminatWirausaha);
  const finalDosenWaliId = dosenWaliId !== undefined ? dosenWaliId : doswalId;

  const errors = [];

  if (isNil(id)) {
    errors.push({ field: "id", message: "ID wajib diisi untuk submit" });
  } else if (typeof id !== "string") {
    errors.push({ field: "id", message: "ID harus berupa string" });
  }

  if (isNil(program)) {
    errors.push({ field: "program", message: "Program wajib diisi" });
  } else if (typeof program !== "string") {
    errors.push({ field: "program", message: "Program harus berupa string" });
  }

  if (isNil(tak)) {
    errors.push({ field: "tak", message: "TAK wajib diisi" });
  } else if (isNaN(parseInt(tak))) {
    errors.push({ field: "tak", message: "TAK harus berupa integer" });
  }

  if (isNil(tglSidang)) {
    errors.push({ field: "tglSidang", message: "Tanggal sidang wajib diisi" });
  } else if (isNaN(new Date(tglSidang).getTime())) {
    errors.push({ field: "tglSidang", message: "Tanggal sidang tidak valid" });
  }

  if (isNil(judulTugasAkhirIndonesia)) {
    errors.push({
      field: "judulTugasAkhirIndonesia",
      message: "Judul TA (Indonesia) wajib diisi",
    });
  } else if (typeof judulTugasAkhirIndonesia !== "string") {
    errors.push({
      field: "judulTugasAkhirIndonesia",
      message: "Judul TA (Indonesia) harus berupa string",
    });
  }

  if (isNil(judulTugasAkhirInggris)) {
    errors.push({
      field: "judulTugasAkhirInggris",
      message: "Judul TA (Inggris) wajib diisi",
    });
  } else if (typeof judulTugasAkhirInggris !== "string") {
    errors.push({
      field: "judulTugasAkhirInggris",
      message: "Judul TA (Inggris) harus berupa string",
    });
  }

  if (isNil(req.body.berminatWirausaha)) {
    errors.push({
      field: "berminatWirausaha",
      message: "Minat wirausaha wajib diisi",
    });
  } else if (parsedBerminatWirausaha === undefined) {
    errors.push({
      field: "berminatWirausaha",
      message: "Minat wirausaha harus berupa boolean",
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

  if (!isNil(finalDosenWaliId) && typeof finalDosenWaliId !== "string") {
    errors.push({
      field: "dosenWaliId",
      message: "ID dosen wali harus berupa string jika diisi",
    });
  }

  if (!isNil(dosenPembimbing1Id) && typeof dosenPembimbing1Id !== "string") {
    errors.push({
      field: "dosenPembimbing1Id",
      message: "ID dosen pembimbing 1 harus berupa string jika diisi",
    });
  }

  if (!isNil(dosenPembimbing2Id) && typeof dosenPembimbing2Id !== "string") {
    errors.push({
      field: "dosenPembimbing2Id",
      message: "ID dosen pembimbing 2 harus berupa string jika diisi",
    });
  }

  if (!isNil(skemaSidang) && typeof skemaSidang !== "string") {
    errors.push({
      field: "skemaSidang",
      message: "Skema sidang harus berupa string jika diisi",
    });
  }

  if (!isNil(pengajuanCumlaude) && typeof pengajuanCumlaude !== "string") {
    errors.push({
      field: "pengajuanCumlaude",
      message: "Pengajuan cumlaude harus berupa string jika diisi",
    });
  }

  if (!isNil(skemaCumlaude) && typeof skemaCumlaude !== "string") {
    errors.push({
      field: "skemaCumlaude",
      message: "Skema cumlaude harus berupa string jika diisi",
    });
  }

  if (!isNil(evidenCumlaude) && typeof evidenCumlaude !== "string") {
    errors.push({
      field: "evidenCumlaude",
      message: "Eviden cumlaude harus berupa string jika diisi",
    });
  }

  if (!isNil(yudisiumPeriodId) && typeof yudisiumPeriodId !== "string") {
    errors.push({
      field: "yudisiumPeriodId",
      message: "ID periode yudisium harus berupa string",
    });
  }

  if (
    !isNil(yudisiumRegistrationPeriodId) &&
    typeof yudisiumRegistrationPeriodId !== "string"
  ) {
    errors.push({
      field: "yudisiumRegistrationPeriodId",
      message: "ID periode pendaftaran yudisium harus berupa string",
    });
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  const existingRegistration = await prisma.yudisiumRegistration.findUnique({
    where: { id },
    include: {
      yudisiumRegistrationUploads: true,
    },
  });

  if (!existingRegistration) {
    res.status(404);
    throw new Error("Pendaftaran yudisium tidak ditemukan");
  }

  const editCheck = await checkYudisiumEditable(id);
  if (!editCheck.editable) {
    res.status(403);
    throw new Error(editCheck.reason);
  }

  const updateData = {
    program: program !== undefined ? program : undefined,
    tak: tak !== undefined ? parseInt(tak) : undefined,
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
    where: { category: "pendaftaran yudisium", isOpen: true, deletedAt: null },
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
      res.status(400);
      throw new Error("Periode pendaftaran yudisium ini sudah ditutup.");
    }
    updateData.yudisiumRegistrationPeriodId = periodIdToCheck;
  } else {
    res.status(400);
    throw new Error(
      "Tidak ada periode pendaftaran yudisium yang aktif saat ini.",
    );
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
    res.status(400);
    throw new Error(
      `Tidak dapat submit. Field wajib belum lengkap: ${missingFields.join(", ")}`,
    );
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

  // 2. Yudisium - Evidence Wirausaha (wajib jika berminatWirausaha bernilai true)
  if (mergedData.berminatWirausaha === true) {
    const wirausahaSlugs = await getWirausahaSlugsFromDb();
    for (const slug of wirausahaSlugs) {
      if (!uploadedCategories.includes(slug)) missingFiles.push(slug);
    }
  }

  // 3. Yudisium - Evidence Cumlaude (wajib sesuai skemaCumlaude: Publikasi Jurnal, Pameran, Lomba, HKI)
  if (mergedData.skemaCumlaude) {
    const cumlaudeSlugs = await getCumlaudeSlugsFromDb(
      mergedData.skemaCumlaude,
    );
    for (const slug of cumlaudeSlugs) {
      if (!uploadedCategories.includes(slug)) missingFiles.push(slug);
    }
  }

  if (missingFiles.length > 0) {
    res.status(400);
    throw new Error(
      `Tidak dapat submit. Berkas wajib belum lengkap: ${missingFiles.join(", ")}`,
    );
  }

  // Bersihkan berkas wirausaha jika berminatWirausaha false
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
      res.status(404);
      throw new Error("Mahasiswa tidak ditemukan");
    }
  }

  if (mergedData.dosenWaliId) {
    const dw = await prisma.dosen.findUnique({
      where: { id: mergedData.dosenWaliId },
    });
    if (!dw) {
      res.status(404);
      throw new Error("Dosen wali tidak ditemukan");
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

  updateData.isDraft = false;
  updateData.submittedAt = new Date();

  const updatedYudisiumRegistration = await prisma.yudisiumRegistration.update({
    where: { id },
    data: updateData,
    include: yudisiumInclude,
  });

  res.status(200).json({
    message: "Yudisium registration submitted successfully",
    data: mapYudisiumRegistrationToFrontend(updatedYudisiumRegistration, req),
  });
});

// Delete Yudisium Registration (soft delete)
const deleteYudisiumRegistration = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const yudisiumRegistrationExists =
    await prisma.yudisiumRegistration.findUnique({
      where: { id },
    });

  if (!yudisiumRegistrationExists) {
    res.status(404);
    throw new Error("Pendaftaran yudisium tidak ditemukan");
  }

  const deletedYudisiumRegistration = await prisma.yudisiumRegistration.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  });

  res.json({
    message: "Yudisium registration deleted successfully",
    data: deletedYudisiumRegistration,
  });
});

// Upload Dokumen Persyaratan Yudisium
const uploadYudisiumRegistrationFile = asyncHandler(async (req, res) => {
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

  const editCheck = await checkYudisiumEditable(id);
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

  const responseData = {
    id: uploadRecord.id,
    name: uploadRecord.name,
    category: uploadRecord.category,
    filepath: uploadRecord.filepath,
    isValid: uploadRecord.isValid,
    yudisiumRegistrationId: uploadRecord.yudisiumRegistrationId,
    downloadUrl: `${req.protocol}://${req.get("host")}/api/yudisium-registrations/uploads/${uploadRecord.id}/download`,
  };

  res.status(200).json({
    message: existingUpload
      ? "File updated successfully"
      : "File uploaded successfully",
    data: responseData,
  });
});

// Get All Uploaded Files by Yudisium Registration ID
const getYudisiumRegistrationFiles = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const uploads = await prisma.yudisiumRegistrationUpload.findMany({
    where: { yudisiumRegistrationId: id },
  });

  const data = uploads.map((upload) => ({
    id: upload.id,
    name: upload.name,
    category: upload.category,
    filepath: upload.filepath,
    isValid: upload.isValid,
    yudisiumRegistrationId: upload.yudisiumRegistrationId,
    downloadUrl: `${req.protocol}://${req.get(
      "host",
    )}/api/yudisium-registrations/uploads/${upload.id}/download`,
  }));

  res.json({ data });
});

// Download Yudisium Registration Upload
const downloadYudisiumRegistrationFile = asyncHandler(async (req, res) => {
  const uploadId = req.params.uploadId;

  const upload = await prisma.yudisiumRegistrationUpload.findFirst({
    where: { id: uploadId },
  });

  if (!upload) {
    res.status(404);
    throw new Error("Unggahan tidak ditemukan");
  }

  const ext = path.extname(upload.filepath || "") || ".pdf";
  const baseName =
    (upload.name || "").replace(/[\\/:*?"<>|]/g, "-").trim() ||
    "dokumen-yudisium";
  const downloadName = baseName.toLowerCase().endsWith(ext.toLowerCase())
    ? baseName
    : `${baseName}${ext}`;

  await serveDownload(res, {
    filepath: upload.filepath,
    downloadName,
  });
});

// Approve Yudisium Registration (Admin Response)
const approveYudisiumRegistration = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { adminId, yudisiumPeriodId, yudisiumRegistrationUploadIds } = req.body;

  const errors = [];
  if (isNil(adminId)) {
    errors.push({ field: "adminId", message: "ID staf akademik wajib diisi" });
  }
  if (isNil(yudisiumPeriodId)) {
    errors.push({
      field: "yudisiumPeriodId",
      message: "ID periode yudisium wajib diisi",
    });
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  const registration = await prisma.yudisiumRegistration.findUnique({
    where: { id },
  });

  if (!registration) {
    res.status(404);
    throw new Error("Pendaftaran yudisium tidak ditemukan");
  }

  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
  });

  if (!admin) {
    res.status(404);
    throw new Error("Staf akademik tidak ditemukan");
  }

  const period = await prisma.yudisiumPeriod.findUnique({
    where: { id: yudisiumPeriodId },
  });

  if (!period) {
    res.status(404);
    throw new Error("Periode yudisium tidak ditemukan");
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
      yudisiumPeriodId,
      message: null,
      isEdit: null,
    },
    include: yudisiumInclude,
  });

  res.json({
    message: "Pendaftaran yudisium berhasil disetujui",
    data: mapYudisiumRegistrationToFrontend(updatedRegistration, req),
  });
});

// Reject/Request Revision for Yudisium Registration (Admin Response)
const rejectYudisiumRegistration = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { adminId, message, isEdit, yudisiumRegistrationUploadIds } = req.body;

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

  const registration = await prisma.yudisiumRegistration.findUnique({
    where: { id },
  });

  if (!registration) {
    res.status(404);
    throw new Error("Pendaftaran yudisium tidak ditemukan");
  }

  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
  });

  if (!admin) {
    res.status(404);
    throw new Error("Staf akademik tidak ditemukan");
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
      isDraft: isEdit ? true : false,
      submittedAt: isEdit ? null : undefined,
    },
    include: yudisiumInclude,
  });

  res.json({
    message: "Pendaftaran yudisium berhasil ditolak / diminta revisi",
    data: mapYudisiumRegistrationToFrontend(updatedRegistration, req),
  });
});

const exportYudisium = asyncHandler(async (req, res) => {

  let targetPeriodId = req.query.yudisiumPeriodId;
  let selectedPeriod = null;

  if (targetPeriodId) {
    selectedPeriod = await prisma.yudisiumPeriod.findUnique({
      where: { id: targetPeriodId },
    });
  } else {
    selectedPeriod = await prisma.yudisiumPeriod.findFirst({
      where: { category: "yudisium", deletedAt: null },
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
    let tglAkad = "", blnAkad = "", thnAkad = "";
    if (yudisium.tglSidang) {
      const d = new Date(yudisium.tglSidang);
      tglAkad = d.getDate();
      blnAkad = d.getMonth() + 1;
      thnAkad = d.getFullYear();
    }

    let tglTa = "", blnTa = "", thnTa = "";
    const sidangTA = yudisium.mahasiswa?.sidangRegistrations?.[0];
    if (sidangTA?.tglSidang) {
      const d = new Date(sidangTA.tglSidang);
      tglTa = d.getDate();
      blnTa = d.getMonth() + 1;
      thnTa = d.getFullYear();
    }

    const kodeDosenWali = yudisium.mahasiswa?.dosenWali?.kodeDosen || yudisium.dosenWali?.kodeDosen || "";

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
      status: yudisium.status || "",
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

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}"`);

  await workbook.xlsx.write(res);
  res.end();
});
export {
  listYudisiumRegistrations,
  getYudisiumRegistrationById,
  getYudisiumRegistrationByMahasiswaId,
  saveYudisiumRegistration,
  submitYudisiumRegistration,
  deleteYudisiumRegistration,
  uploadYudisiumRegistrationFile,
  getYudisiumRegistrationFiles,
  downloadYudisiumRegistrationFile,
  approveYudisiumRegistration,
  rejectYudisiumRegistration,
  exportYudisium,
};
