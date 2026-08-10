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

const isStudent = authorize("MAHASISWA");
const isLecturer = authorize("DOSEN");
const isAcademicStaff = authorize("ADMIN");

export { authorize,
  isStudent,
  isLecturer,
  isAcademicStaff, };
