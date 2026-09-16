import prisma from '../config/prisma.js';

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
      message: "Access denied. Hanya dosen dengan status Ketua KK yang dapat mengakses.",
    });
  }

  try {
    const dosen = await prisma.dosen.findUnique({
      where: { userId: req.user.id },
    });

    if (!dosen || !dosen.isKetuaKK || dosen.deletedAt) {
      return res.status(403).json({
        message: "Access denied. Hanya dosen dengan status Ketua KK yang dapat mengakses.",
      });
    }

    req.dosen = dosen;
    next();
  } catch (error) {
    return next(error);
  }
};

export {
  authorize,
  isMahasiswa,
  isDosen,
  isAdmin,
  isKetuaKK,
};
