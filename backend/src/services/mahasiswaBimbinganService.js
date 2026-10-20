import prisma from "../config/prisma.js";

/**
 * Mendapatkan daftar pendaftaran sidang bimbingan dosen yang sedang login
 */
export const getMahasiswaBimbingan = async ({
  userId,
  search,
  studyProgramId,
  sortBy,
  sortOrder,
  skip,
  take,
}) => {
  // Cari data dosen berdasarkan userId
  const dosen = await prisma.dosen.findUnique({
    where: { userId, deletedAt: null },
  });

  if (!dosen) {
    const error = new Error("Data Dosen tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  // Filter dasar: dosen pembimbing 1 atau pembimbing 2 adalah dosen yang sedang login
  const where = {
    deletedAt: null,
    AND: [
      {
        OR: [
          { dosenPembimbing1Id: dosen.id },
          { dosenPembimbing2Id: dosen.id },
        ],
      },
    ],
  };

  // 1. Search keyword (nama mahasiswa, nim, judul TA Indonesia / Inggris)
  if (search && typeof search === "string" && search.trim() !== "") {
    const searchTerm = search.trim();
    where.AND.push({
      OR: [
        {
          mahasiswa: {
            user: {
              name: { contains: searchTerm, mode: "insensitive" },
            },
          },
        },
        {
          mahasiswa: {
            nim: { contains: searchTerm, mode: "insensitive" },
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

  // 2. Filter Study Program
  if (
    studyProgramId &&
    typeof studyProgramId === "string" &&
    studyProgramId.trim() !== ""
  ) {
    where.AND.push({
      mahasiswa: {
        studyProgramId: studyProgramId.trim(),
      },
    });
  }

  // 3. Sorting
  const sortParam = (sortBy || "createdAt").toLowerCase().trim();
  const orderDirection =
    (sortOrder || "desc").toLowerCase() === "asc" ? "asc" : "desc";
  let orderBy = { createdAt: "desc" };

  if (
    sortParam === "studyprogramasc" ||
    (sortParam === "studyprogram" && orderDirection === "asc") ||
    sortParam === "a-z" ||
    sortParam === "prodi-asc"
  ) {
    orderBy = {
      mahasiswa: {
        studyProgram: {
          name: "asc",
        },
      },
    };
  } else if (
    sortParam === "studyprogramdesc" ||
    (sortParam === "studyprogram" && orderDirection === "desc") ||
    sortParam === "z-a" ||
    sortParam === "prodi-desc"
  ) {
    orderBy = {
      mahasiswa: {
        studyProgram: {
          name: "desc",
        },
      },
    };
  } else if (
    sortParam === "nameasc" ||
    (sortParam === "name" && orderDirection === "asc")
  ) {
    orderBy = {
      mahasiswa: {
        user: {
          name: "asc",
        },
      },
    };
  } else if (
    sortParam === "namedesc" ||
    (sortParam === "name" && orderDirection === "desc")
  ) {
    orderBy = {
      mahasiswa: {
        user: {
          name: "desc",
        },
      },
    };
  } else if (
    sortParam === "nimasc" ||
    (sortParam === "nim" && orderDirection === "asc")
  ) {
    orderBy = {
      mahasiswa: {
        nim: "asc",
      },
    };
  } else if (
    sortParam === "nimdesc" ||
    (sortParam === "nim" && orderDirection === "desc")
  ) {
    orderBy = {
      mahasiswa: {
        nim: "desc",
      },
    };
  } else if (
    sortParam === "oldest" ||
    sortParam === "lama-baru" ||
    (sortParam === "createdat" && orderDirection === "asc")
  ) {
    orderBy = { createdAt: "asc" };
  } else if (
    sortParam === "newest" ||
    sortParam === "baru-lama" ||
    (sortParam === "createdat" && orderDirection === "desc")
  ) {
    orderBy = { createdAt: "desc" };
  }

  const [total, registrations] = await Promise.all([
    prisma.sidangRegistration.count({ where }),
    prisma.sidangRegistration.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        mahasiswa: {
          include: {
            studyProgram: true,
            user: true,
            permohonanSkta: {
              where: { deletedAt: null },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
            yudisiumRegistrations: {
              where: { deletedAt: null },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
    }),
  ]);

  return { total, registrations };
};
