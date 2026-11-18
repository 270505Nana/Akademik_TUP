import { v4 as uuidv4 } from "uuid";
import prisma from "../config/prisma.js";
import { uploadFile, deleteFile } from "./storageService.js";
import { getPaginationParams } from "../utils/paginationHelper.js";
import { getActiveOrLatestPelaksanaanSidangPeriod } from "../utils/beritaAcaraHelper.js";
import {
  mapBeritaAcaraListItem,
  mapBeritaAcaraDetail,
} from "../mappers/beritaAcaraMapper.js";

/**
 * 1. GET /api/berita-acara
 * Admin: mengambil seluruh berita acara pada periode aktif atau yang ditentukan
 */
export const getBeritaAcaraList = async ({ user, query }) => {
  let selectedPeriod = null;

  if (query.sidangPeriodId) {
    selectedPeriod = await prisma.sidangPeriod.findUnique({
      where: { id: query.sidangPeriodId, deletedAt: null },
    });
    if (!selectedPeriod) {
      const error = new Error("Periode sidang tidak ditemukan");
      error.statusCode = 404;
      throw error;
    }
  } else {
    selectedPeriod = await getActiveOrLatestPelaksanaanSidangPeriod();
  }

  const where = {
    deletedAt: null,
    sidangRegistration: {
      deletedAt: null,
      ...(selectedPeriod ? { sidangPeriodId: selectedPeriod.id } : {}),
    },
  };

  if (query.search && query.search.trim() !== "") {
    const search = query.search.trim();
    where.sidangRegistration = {
      ...where.sidangRegistration,
      OR: [
        { judulTugasAkhirIndonesia: { contains: search, mode: "insensitive" } },
        { judulTugasAkhirInggris: { contains: search, mode: "insensitive" } },
        { mahasiswa: { name: { contains: search, mode: "insensitive" } } },
        { mahasiswa: { nim: { contains: search, mode: "insensitive" } } },
      ],
    };
  }

  const paginationParams = getPaginationParams(query);
  const sortOrder = query.sort === "oldest" ? "asc" : "desc";

  const [total, beritaAcaraList] = await Promise.all([
    prisma.beritaAcaraSidangTugasAkhir.count({ where }),
    prisma.beritaAcaraSidangTugasAkhir.findMany({
      where,
      skip: paginationParams.skip,
      take: paginationParams.take,
      orderBy: { createdAt: sortOrder },
      include: {
        berkas: true,
        sidangRegistration: {
          include: {
            mahasiswa: { include: { studyProgram: true } },
            ruanganSidang: true,
          },
        },
      },
    }),
  ]);

  const formattedData = beritaAcaraList.map(mapBeritaAcaraListItem);
  const totalPages =
    paginationParams.isPaginated && paginationParams.limit
      ? Math.ceil(total / paginationParams.limit)
      : 1;

  return {
    data: formattedData,
    pagination: {
      page: paginationParams.page,
      limit: paginationParams.limit || total,
      total,
      totalPages,
    },
    selectedPeriod: selectedPeriod
      ? {
          id: selectedPeriod.id,
          name: selectedPeriod.name,
          period: selectedPeriod.period,
          isOpen: selectedPeriod.isOpen,
          startDate: selectedPeriod.startDate,
          endDate: selectedPeriod.endDate,
        }
      : null,
  };
};

/**
 * 2. GET /api/berita-acara/:id
 * Admin: mengambil detail berita acara berdasarkan ID
 */
export const getBeritaAcaraById = async ({ id }) => {
  const beritaAcara = await prisma.beritaAcaraSidangTugasAkhir.findFirst({
    where: { id, deletedAt: null },
    include: {
      berkas: true,
      sidangRegistration: {
        include: {
          mahasiswa: { include: { studyProgram: true } },
          dosenPembimbing1: true,
          dosenPembimbing2: true,
          dosenPenguji1: true,
          dosenPenguji2: true,
          ruanganSidang: true,
          sidangPeriod: true,
        },
      },
    },
  });

  if (!beritaAcara) {
    const error = new Error("Data berita acara sidang tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  return mapBeritaAcaraDetail(beritaAcara);
};

/**
 * 3. GET /api/berita-acara/me
 * Mahasiswa: mengambil berita acara terbaru jika sudah dipublikasikan
 */
export const getLatestBeritaAcaraMahasiswa = async ({ user }) => {
  const currentMahasiswa = await prisma.mahasiswa.findUnique({
    where: { userId: user.id, deletedAt: null },
  });

  if (!currentMahasiswa) {
    const error = new Error("Data Mahasiswa tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const latestBeritaAcara = await prisma.beritaAcaraSidangTugasAkhir.findFirst({
    where: {
      deletedAt: null,
      isPublish: { not: null },
      sidangRegistration: {
        mahasiswaId: currentMahasiswa.id,
        deletedAt: null,
      },
    },
    include: {
      berkas: true,
      sidangRegistration: {
        include: {
          mahasiswa: { include: { studyProgram: true } },
          dosenPembimbing1: true,
          dosenPembimbing2: true,
          dosenPenguji1: true,
          dosenPenguji2: true,
          ruanganSidang: true,
          sidangPeriod: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!latestBeritaAcara) {
    return null;
  }

  return mapBeritaAcaraDetail(latestBeritaAcara);
};

/**
 * 4. PUT /api/berita-acara/:id
 * Admin: mengubah isi berita acara
 */
export const updateBeritaAcara = async ({ id, payload }) => {
  const existing = await prisma.beritaAcaraSidangTugasAkhir.findFirst({
    where: { id, deletedAt: null },
  });

  if (!existing) {
    const error = new Error("Data berita acara sidang tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const updateData = {
    nilaiAkhir: String(payload.nilaiAkhir),
    keteranganLulus: payload.keteranganLulus,
    nilaiHuruf: payload.nilaiHuruf,
    justifikasi:
      payload.justifikasi !== undefined ? payload.justifikasi : existing.justifikasi,
  };

  if (payload.isPublish !== undefined) {
    updateData.isPublish = payload.isPublish
      ? existing.isPublish || new Date()
      : null;
  }

  await prisma.beritaAcaraSidangTugasAkhir.update({
    where: { id },
    data: updateData,
  });
};

/**
 * 5. PUT /api/berita-acara/:id/berkas
 * Admin: mengunggah berkas berita acara (mengganti berkas jika sudah ada)
 */
export const uploadBerkasBeritaAcara = async ({ id, file }) => {
  if (!file) {
    const error = new Error("Berkas file berita acara wajib diunggah");
    error.statusCode = 400;
    throw error;
  }

  const beritaAcara = await prisma.beritaAcaraSidangTugasAkhir.findFirst({
    where: { id, deletedAt: null },
    include: {
      sidangRegistration: true,
      berkas: true,
    },
  });

  if (!beritaAcara) {
    const error = new Error("Data berita acara sidang tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const mahasiswaId = beritaAcara.sidangRegistration?.mahasiswaId;
  if (!mahasiswaId) {
    const error = new Error("Data mahasiswa pada pendaftaran sidang tidak ditemukan");
    error.statusCode = 400;
    throw error;
  }

  // Jika sebelumnya sudah ada berkas, hapus file fisik dan hard delete record BerkasMahasiswa
  if (beritaAcara.berkasId) {
    const oldBerkas = await prisma.berkasMahasiswa.findUnique({
      where: { id: beritaAcara.berkasId },
    });
    if (oldBerkas && oldBerkas.filepath) {
      await deleteFile(oldBerkas.filepath);
    }
    await prisma.berkasMahasiswa
      .delete({
        where: { id: beritaAcara.berkasId },
      })
      .catch(() => {});
  }

  const filename = `${uuidv4()}_${file.originalname || "berita_acara_sidang.pdf"}`;
  const uploaded = await uploadFile({
    buffer: file.buffer,
    customFilename: filename,
    folder: "berkas-berita-acara",
    mimetype: file.mimetype || "application/pdf",
  });

  const newBerkas = await prisma.berkasMahasiswa.create({
    data: {
      id: uuidv4(),
      name: file.originalname || "Berkas Berita Acara Sidang",
      category: "Berita Acara Sidang",
      filepath: uploaded.filepath,
      mahasiswaId,
    },
  });

  await prisma.beritaAcaraSidangTugasAkhir.update({
    where: { id },
    data: {
      berkasId: newBerkas.id,
    },
  });
};

/**
 * 6. DELETE /api/berita-acara/:id/berkas
 * Admin: menghapus berkas berita acara
 */
export const deleteBerkasBeritaAcara = async ({ id }) => {
  const beritaAcara = await prisma.beritaAcaraSidangTugasAkhir.findFirst({
    where: { id, deletedAt: null },
    include: { berkas: true },
  });

  if (!beritaAcara) {
    const error = new Error("Data berita acara sidang tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  if (!beritaAcara.berkasId) {
    const error = new Error(
      "Tidak ada berkas berita acara yang diunggah untuk sidang ini"
    );
    error.statusCode = 400;
    throw error;
  }

  const berkasId = beritaAcara.berkasId;
  const berkas = await prisma.berkasMahasiswa.findUnique({
    where: { id: berkasId },
  });

  if (berkas && berkas.filepath) {
    await deleteFile(berkas.filepath);
  }

  await prisma.beritaAcaraSidangTugasAkhir.update({
    where: { id },
    data: { berkasId: null },
  });

  if (berkas) {
    await prisma.berkasMahasiswa
      .delete({
        where: { id: berkasId },
      })
      .catch(() => {});
  }
};

/**
 * 7. GET /api/berita-acara/:id/berkas/download
 * Admin: selalu diizinkan unduh
 * Mahasiswa & Dosen Terkait: hanya diizinkan unduh jika sudah dipublikasikan
 */
export const getDownloadBerkasBeritaAcara = async ({ id, user }) => {
  const beritaAcara = await prisma.beritaAcaraSidangTugasAkhir.findFirst({
    where: { id, deletedAt: null },
    include: {
      berkas: true,
      sidangRegistration: {
        include: {
          mahasiswa: true,
          dosenPembimbing1: true,
          dosenPembimbing2: true,
          dosenPenguji1: true,
          dosenPenguji2: true,
        },
      },
    },
  });

  if (!beritaAcara) {
    const error = new Error("Data berita acara sidang tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  if (!beritaAcara.berkas || !beritaAcara.berkas.filepath) {
    const error = new Error("Berkas berita acara belum diunggah");
    error.statusCode = 404;
    throw error;
  }

  const userRole = user.role;

  if (userRole === "ADMIN") {
    // Admin selalu diizinkan
  } else if (userRole === "MAHASISWA") {
    if (!beritaAcara.isPublish) {
      const error = new Error("Berita acara belum diterbitkan");
      error.statusCode = 403;
      throw error;
    }
    if (beritaAcara.sidangRegistration?.mahasiswa?.userId !== user.id) {
      const error = new Error(
        "Anda tidak memiliki hak akses untuk mengunduh berkas berita acara ini"
      );
      error.statusCode = 403;
      throw error;
    }
  } else if (userRole === "DOSEN") {
    if (!beritaAcara.isPublish) {
      const error = new Error("Berita acara belum diterbitkan");
      error.statusCode = 403;
      throw error;
    }
    const reg = beritaAcara.sidangRegistration || {};
    const isRelatedDosen = [
      reg.dosenPembimbing1?.userId,
      reg.dosenPembimbing2?.userId,
      reg.dosenPenguji1?.userId,
      reg.dosenPenguji2?.userId,
    ].includes(user.id);

    if (!isRelatedDosen) {
      const error = new Error(
        "Anda tidak memiliki hak akses untuk mengunduh berkas berita acara ini"
      );
      error.statusCode = 403;
      throw error;
    }
  } else {
    const error = new Error(
      "Peran pengguna tidak memiliki hak akses untuk mengunduh berkas ini"
    );
    error.statusCode = 403;
    throw error;
  }

  return {
    filepath: beritaAcara.berkas.filepath,
    downloadName: beritaAcara.berkas.name || "Berita_Acara_Sidang.pdf",
  };
};

/**
 * 8. PATCH /api/berita-acara/:id/publish
 * Admin: mengubah status publikasi berita acara
 */
export const publishBeritaAcara = async ({ id, isPublished }) => {
  const existing = await prisma.beritaAcaraSidangTugasAkhir.findFirst({
    where: { id, deletedAt: null },
  });

  if (!existing) {
    const error = new Error("Data berita acara sidang tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  await prisma.beritaAcaraSidangTugasAkhir.update({
    where: { id },
    data: {
      isPublish: isPublished ? existing.isPublish || new Date() : null,
    },
  });
};
