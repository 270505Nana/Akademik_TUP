import prisma from "../config/prisma.js";
import { deleteFile } from "./storageService.js";
import { DOCUMENT_CATEGORIES, NON_SIDANG_CATEGORY_MAP } from "../constants/index.js";

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

export const getSidangRegistrations = async ({ skip, take }) => {
  const [total, sidangRegistrations] = await Promise.all([
    prisma.sidangRegistration.count(),
    prisma.sidangRegistration.findMany({
      skip,
      take,
      include: sidangInclude,
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  return { total, sidangRegistrations };
};

export const getSidangRegistrationById = async (id) => {
  return await prisma.sidangRegistration.findUnique({
    where: { id },
    include: sidangInclude,
  });
};

export const getSidangRegistrationByMahasiswaId = async (mahasiswaId) => {
  return await prisma.sidangRegistration.findFirst({
    where: { mahasiswaId },
    include: sidangInclude,
    orderBy: {
      createdAt: "desc",
    },
  });
};
