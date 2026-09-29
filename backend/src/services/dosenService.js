import prisma from "../config/prisma.js";
import { ROLES } from "../constants/index.js";
import { uploadFile, deleteFile } from "./storageService.js";

export const getDosens = async ({
  search,
  researchGroupId,
  studyProgramId,
  sortBy,
  skip,
  take,
}) => {
  const where = { deletedAt: null };

  // Search
  const searchTerm = (search || "").trim();

  if (searchTerm) {
    where.OR = [
      { user: { name: { contains: searchTerm, mode: "insensitive" } } },
      { nip: { contains: searchTerm, mode: "insensitive" } },
      { nidn: { contains: searchTerm, mode: "insensitive" } },
      { kodeDosen: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  // Filter
  if (researchGroupId) {
    where.researchGroupId = researchGroupId.trim();
  }

  if (studyProgramId) {
    where.studyProgramId = studyProgramId.trim();
  }

  // Sort
  const sortParam = (sortBy || "").toLowerCase().trim();
  let orderBy = { createdAt: "desc" };

  if (sortParam === "nameasc" || sortParam === "a-z") {
    orderBy = { user: { name: "asc" } };
  } else if (sortParam === "namedesc" || sortParam === "z-a") {
    orderBy = { user: { name: "desc" } };
  } else if (sortParam === "researchgroupasc") {
    orderBy = { researchGroup: { name: "asc" } };
  } else if (sortParam === "researchgroupdesc") {
    orderBy = { researchGroup: { name: "desc" } };
  } else if (sortParam === "oldest") {
    orderBy = { createdAt: "asc" };
  }

  const [total, dosens] = await Promise.all([
    prisma.dosen.count({ where }),
    prisma.dosen.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        user: true,
        researchGroup: true,
        studyProgram: true,
      },
    }),
  ]);

  return { total, dosens };
};

export const getDosenByIdOrUserId = async (idOrUserId) => {
  let dosen = await prisma.dosen.findUnique({
    where: { id: idOrUserId },
    include: { user: true, researchGroup: true, studyProgram: true },
  });

  if (!dosen) {
    dosen = await prisma.dosen.findUnique({
      where: { userId: idOrUserId },
      include: { user: true, researchGroup: true, studyProgram: true },
    });
  }

  if (!dosen || dosen.deletedAt) {
    const error = new Error("Dosen tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  return dosen;
};

export const upsertDosen = async (
  idOrUserId,
  {
    name,
    nip,
    nidn,
    kodeDosen,
    researchGroupId,
    studyProgramId,
    isKetuaKK,
    isKetuaProdi,
    isKepalaUrusanAkademik,
  },
) => {
  let dosenRecord = await prisma.dosen.findUnique({
    where: { id: idOrUserId },
  });
  let userId = dosenRecord ? dosenRecord.userId : idOrUserId;

  if (!dosenRecord) {
    dosenRecord = await prisma.dosen.findUnique({
      where: { userId: idOrUserId },
    });
    if (dosenRecord) userId = dosenRecord.userId;
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
  });

  if (!user) {
    const error = new Error("Pengguna tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  if (user.role !== ROLES.DOSEN) {
    const error = new Error("Pengguna bukan dosen");
    error.statusCode = 400;
    throw error;
  }

  return await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { name },
    });

    const targetStudyProgramId =
      studyProgramId || dosenRecord?.studyProgramId;

    // Jika dosen ini diset sebagai ketua prodi (isKetuaProdi === true),
    // pastikan dosen lain di program studi yang sama dinonaktifkan (isKetuaProdi: false)
    if (isKetuaProdi === true && targetStudyProgramId) {
      await tx.dosen.updateMany({
        where: {
          studyProgramId: targetStudyProgramId,
          isKetuaProdi: true,
          userId: { not: userId },
        },
        data: { isKetuaProdi: false },
      });
    }

    return await tx.dosen.upsert({
      where: { userId },
      update: {
        nip,
        nidn: nidn || null,
        kodeDosen,
        researchGroupId,
        studyProgramId,
        ...(isKetuaKK !== undefined ? { isKetuaKK } : {}),
        ...(isKetuaProdi !== undefined ? { isKetuaProdi } : {}),
        ...(isKepalaUrusanAkademik !== undefined
          ? { isKepalaUrusanAkademik: isKepalaUrusanAkademik || null }
          : {}),
      },
      create: {
        nip,
        nidn: nidn || null,
        kodeDosen,
        researchGroupId,
        studyProgramId,
        isKetuaKK: isKetuaKK || false,
        isKetuaProdi: isKetuaProdi || false,
        isKepalaUrusanAkademik: isKepalaUrusanAkademik || null,
        userId,
      },
      include: {
        user: true,
        researchGroup: true,
        studyProgram: true,
      },
    });
  });
};

export const uploadSignature = async (userId, file) => {
  if (!file) {
    const error = new Error("File tanda tangan wajib diunggah");
    error.statusCode = 400;
    throw error;
  }

  const dosen = await prisma.dosen.findUnique({
    where: { userId },
    include: { user: true, researchGroup: true, studyProgram: true },
  });

  if (!dosen || dosen.deletedAt) {
    const error = new Error("Data dosen tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  // Hapus file tanda tangan lama jika ada
  if (dosen.signature) {
    await deleteFile(dosen.signature);
  }

  // Upload file tanda tangan baru ke folder 'signatures'
  const uploaded = await uploadFile({
    buffer: file.buffer,
    originalname: file.originalname,
    folder: "signatures",
    mimetype: file.mimetype,
  });

  return await prisma.dosen.update({
    where: { id: dosen.id },
    data: { signature: uploaded.filepath },
    include: {
      user: true,
      researchGroup: true,
      studyProgram: true,
    },
  });
};

export const deleteSignature = async (userId) => {
  const dosen = await prisma.dosen.findUnique({
    where: { userId },
    include: { user: true, researchGroup: true, studyProgram: true },
  });

  if (!dosen || dosen.deletedAt) {
    const error = new Error("Data dosen tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  if (dosen.signature) {
    await deleteFile(dosen.signature);
  }

  return await prisma.dosen.update({
    where: { id: dosen.id },
    data: { signature: null },
    include: {
      user: true,
      researchGroup: true,
      studyProgram: true,
    },
  });
};

export const toggleKetuaKK = async (idOrUserId) => {
  const dosen = await getDosenByIdOrUserId(idOrUserId);

  return await prisma.dosen.update({
    where: { id: dosen.id },
    data: { isKetuaKK: !dosen.isKetuaKK },
    include: { user: true, researchGroup: true, studyProgram: true },
  });
};
