import prisma from "../config/prisma.js";

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Token not found" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    next();
  };
};

const isMahasiswa = authorize("MAHASISWA");
const isDosen = authorize("DOSEN");
const isAdmin = authorize("ADMIN");

const isKetuaKK = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Token not found" });
  }

  if (req.user.role !== "DOSEN") {
    return res.status(403).json({
      message:
        "Access denied. Hanya dosen dengan status Ketua KK yang dapat mengakses.",
    });
  }

  try {
    const dosen = await prisma.dosen.findUnique({
      where: { userId: req.user.id },
    });

    if (!dosen || !dosen.isKetuaKK || dosen.deletedAt) {
      return res.status(403).json({
        message:
          "Access denied. Hanya dosen dengan status Ketua KK yang dapat mengakses.",
      });
    }

    req.dosen = dosen;
    next();
  } catch (error) {
    return next(error);
  }
};

const isKetuaProdi = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Token not found" });
  }

  if (req.user.role !== "DOSEN") {
    return res.status(403).json({
      message:
        "Access denied. Hanya dosen dengan status Ketua Prodi yang dapat mengakses.",
    });
  }

  try {
    const dosen = await prisma.dosen.findUnique({
      where: { userId: req.user.id },
    });

    if (!dosen || !dosen.isKetuaProdi || dosen.deletedAt) {
      return res.status(403).json({
        message:
          "Access denied. Hanya dosen dengan status Ketua Prodi yang dapat mengakses.",
      });
    }

    req.dosen = dosen;
    next();
  } catch (error) {
    return next(error);
  }
};

const isKepalaUrusanAkademik = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Token not found" });
  }

  if (req.user.role !== "DOSEN") {
    return res.status(403).json({
      message:
        "Access denied. Hanya dosen dengan status Kepala Urusan Akademik yang dapat mengakses.",
    });
  }

  try {
    const dosen = await prisma.dosen.findUnique({
      where: { userId: req.user.id },
    });

    if (!dosen || !dosen.isKepalaUrusanAkademik || dosen.deletedAt) {
      return res.status(403).json({
        message:
          "Access denied. Hanya dosen dengan status Kepala Urusan Akademik yang dapat mengakses.",
      });
    }

    req.dosen = dosen;
    next();
  } catch (error) {
    return next(error);
  }
};

const isAdminOrDosen = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Token not found" });
  }

  if (req.user.role === "ADMIN") {
    return next();
  }

  if (req.user.role === "DOSEN") {
    return next();
  }

  return res.status(403).json({
    message: "Access denied. Hanya admin dan dosen yang dapat mengakses.",
  });
};

const isAdminOrKetuaKKOrKetuaProdi = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Token not found" });
  }

  if (req.user.role === "ADMIN") {
    return next();
  }

  if (req.user.role === "DOSEN") {
    try {
      const dosen =
        req.dosen ||
        (await prisma.dosen.findUnique({
          where: { userId: req.user.id },
        }));

      if (dosen && !dosen.deletedAt && (dosen.isKetuaKK || dosen.isKetuaProdi)) {
        req.dosen = dosen;
        return next();
      }

      return res.status(403).json({
        message:
          "Access denied. Hanya Admin, Ketua KK, atau Ketua Prodi yang dapat mengakses.",
      });
    } catch (error) {
      return next(error);
    }
  }

  return res.status(403).json({
    message:
      "Access denied. Hanya Admin, Ketua KK, atau Ketua Prodi yang dapat mengakses.",
  });
};

const getAcademicAccessContext = async (req) => {
  if (req.user?.role === "ADMIN") {
    return { isFullAccess: true, isRestrictedKaprodi: false, studyProgramId: null };
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
      if (dosen.isKetuaKK) {
        return { isFullAccess: true, isRestrictedKaprodi: false, studyProgramId: null };
      }
      if (dosen.isKetuaProdi) {
        return {
          isFullAccess: false,
          isRestrictedKaprodi: true,
          studyProgramId: dosen.studyProgramId || null,
        };
      }
    }
  }

  return { isFullAccess: false, isRestrictedKaprodi: false, studyProgramId: null };
};

export {
  authorize,
  isMahasiswa,
  isDosen,
  isAdmin,
  isKetuaKK,
  isAdminOrDosen,
  isKetuaProdi,
  isKepalaUrusanAkademik,
  isAdminOrKetuaKKOrKetuaProdi,
  getAcademicAccessContext,
};
