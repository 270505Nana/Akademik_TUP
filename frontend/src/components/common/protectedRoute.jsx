import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useStudent } from "../../context/StudentContext";

const ProtectedRoute = ({ children, allowedRoles, requireCompleteProfile = false }) => {
  const { user, isAuthenticated } = useAuth();
  const { isComplete } = useStudent();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/forbidden" replace />;
  }

  // Mahasiswa baru yang belum lengkapi data diri dari (isComplete = false)
  if (
    user.role === "STUDENT" &&
    requireCompleteProfile &&
    !isComplete &&
    location.pathname !== "/lengkapi-data"
  ) {
    return <Navigate to="/lengkapi-data" replace />;
  }

  return children;
};

export default ProtectedRoute;