import prisma from "../config/prisma.js";

// Mapping nama sub-role ke field model Dosen
const SUB_ROLE_MAP = {
  KETUAKK: "isKetuaKK",
  KAPRODI: "isKetuaProdi",
  KEPALAURUSANAKADEMIK: "isKepalaUrusanAkademik",
};

/**
 * Middleware otorisasi dinamis berbasis role & sub-role
 * @param  {...string} allowedRoles - Contoh: "ADMIN", "MAHASISWA", "DOSEN", "DOSEN_KAPRODI", "DOSEN_KETUAKK", "DOSEN_KEPALAURUSANAKADEMIK"
 */
export const authorize = (...allowedRoles) => {
  const normalizedAllowedRoles = allowedRoles.map((role) =>
    role.toUpperCase().trim()
  );

  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Token not found" });
    }

    const userRole = req.user.role?.toUpperCase();

    // 1. Cek kecocokan role dasar langsung (misal: "ADMIN", "MAHASISWA", "DOSEN")
    if (normalizedAllowedRoles.includes(userRole)) {
      return next();
    }

    // 2. Jika user adalah DOSEN dan ada aturan sub-role (misal: "DOSEN_KETUAKK")
    if (userRole === "DOSEN") {
      const allowedSubRoles = normalizedAllowedRoles
        .filter((role) => role.startsWith("DOSEN_"))
        .map((role) => role.split("_")[1]);

      if (allowedSubRoles.length > 0) {
        try {
          const dosen =
            req.dosen ||
            (await prisma.dosen.findUnique({
              where: { userId: req.user.id },
            }));

          if (dosen && !dosen.deletedAt) {
            req.dosen = dosen; // Simpan ke req.dosen untuk digunakan controller/helper selanjutnya

            const isAuthorized = allowedSubRoles.some((subRole) => {
              const fieldName = SUB_ROLE_MAP[subRole];
              return fieldName && Boolean(dosen[fieldName]);
            });

            if (isAuthorized) {
              return next();
            }
          }
        } catch (error) {
          return next(error);
        }
      }
    }

    return res.status(403).json({
      message: "Access denied. Anda tidak memiliki hak akses untuk endpoint ini.",
    });
  };
};

/**
 * Helper konteks kurikulum / OBE untuk controller
 */
export const getAcademicAccessContext = async (req) => {
  if (req.user?.role === "ADMIN") {
    return {
      isFullAccess: true,
      isRestrictedKaprodi: false,
      isRestrictedKetuaKK: false,
      studyProgramId: null,
      allowedStudyProgramIds: [],
    };
  }

  if (req.user?.role === "DOSEN") {
    let dosen = req.dosen;
    if (!dosen) {
      dosen = await prisma.dosen.findUnique({
        where: { userId: req.user.id },
      });
      if (dosen && !dosen.deletedAt) {
        req.dosen = dosen;
      }
    }

    if (dosen && !dosen.deletedAt) {
      const isKetuaKK = Boolean(dosen.isKetuaKK);
      const isKetuaProdi = Boolean(dosen.isKetuaProdi);

      if (!isKetuaKK && !isKetuaProdi) {
        return {
          isFullAccess: false,
          isRestrictedKaprodi: false,
          isRestrictedKetuaKK: false,
          studyProgramId: null,
          allowedStudyProgramIds: [],
        };
      }

      let kkStudyProgramIds = [];
      if (isKetuaKK && dosen.researchGroupId) {
        const mappings = await prisma.researchGroupStudyProgram.findMany({
          where: {
            researchGroupId: dosen.researchGroupId,
            deletedAt: null,
          },
          select: {
            studyProgramId: true,
          },
        });
        kkStudyProgramIds = mappings.map((m) => m.studyProgramId);
      }

      if (isKetuaKK && isKetuaProdi) {
        const combined = new Set(kkStudyProgramIds);
        if (dosen.studyProgramId) {
          combined.add(dosen.studyProgramId);
        }
        return {
          isFullAccess: false,
          isRestrictedKaprodi: false,
          isRestrictedKetuaKK: true,
          studyProgramId: dosen.studyProgramId || null,
          allowedStudyProgramIds: Array.from(combined),
          dosen,
        };
      }

      if (isKetuaKK) {
        return {
          isFullAccess: false,
          isRestrictedKaprodi: false,
          isRestrictedKetuaKK: true,
          studyProgramId: null,
          allowedStudyProgramIds: kkStudyProgramIds,
          dosen,
        };
      }

      if (isKetuaProdi) {
        return {
          isFullAccess: false,
          isRestrictedKaprodi: true,
          isRestrictedKetuaKK: false,
          studyProgramId: dosen.studyProgramId || null,
          allowedStudyProgramIds: dosen.studyProgramId
            ? [dosen.studyProgramId]
            : [],
          dosen,
        };
      }
    }
  }

  return {
    isFullAccess: false,
    isRestrictedKaprodi: false,
    isRestrictedKetuaKK: false,
    studyProgramId: null,
    allowedStudyProgramIds: [],
    dosen: null,
  };
};
