import prisma from "../config/prisma.js";
import { deleteFile } from "./storageService.js";
import { DOCUMENT_CATEGORIES, CUMLAUDE_CATEGORY_MAP } from "../constants/index.js";

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

export const getYudisiumRegistrations = async ({ skip, take }) => {
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

export const getYudisiumRegistrationById = async (id) => {
  return await prisma.yudisiumRegistration.findUnique({
    where: { id },
    include: yudisiumInclude,
  });
};

export const getYudisiumRegistrationByMahasiswaId = async (mahasiswaId) => {
  return await prisma.yudisiumRegistration.findFirst({
    where: { mahasiswaId },
    include: yudisiumInclude,
    orderBy: {
      createdAt: "desc",
    },
  });
};
