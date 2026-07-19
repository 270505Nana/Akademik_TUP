import { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useStudent } from "../../context/StudentContext";

const ProtectedRoute = ({ children, allowedRoles, requireCompleteProfile = false }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { isComplete, isStudentLoading, fetchAndLoadStudent } = useStudent();
  const location = useLocation();

  const [isServerChecking, setIsServerChecking] = useState(false);
  const [serverCheckDone, setServerCheckDone] = useState(false);

  // Auto logout jika token expired / invalid
  useEffect(() => {
    if (!isAuthenticated && user) {
      logout();
    }
  }, [isAuthenticated, user, logout]);

  useEffect(() => {
    if (
      requireCompleteProfile &&
      isAuthenticated &&
      user?.id &&
      !isStudentLoading &&
      !isComplete &&
      !serverCheckDone &&
      !isServerChecking
    ) {
      setTimeout(() => {
        setIsServerChecking(true);
        fetchAndLoadStudent(user.id).finally(() => {
          setIsServerChecking(false);
          setServerCheckDone(true);
        });
      }, 0);
    }
    if (!isStudentLoading && isComplete && !serverCheckDone) {
      setTimeout(() => {
        setServerCheckDone(true);
      }, 0);
    }
  }, [isStudentLoading, isComplete, isAuthenticated, user?.id, requireCompleteProfile, fetchAndLoadStudent, serverCheckDone, isServerChecking]);

  // Jika belum login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/forbidden" replace />;
  }

  if (user.role === "ACADEMIC_STAFF" && !location.pathname.startsWith("/akademik")) {
    return <Navigate to="/akademik/dashboard" replace />;
  }

  if (requireCompleteProfile && (isStudentLoading || isServerChecking || !serverCheckDone)) {
    return <LoadingScreen />;
  }

  // Redirect mahasiswa yang belum lengkapi data
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

const LoadingScreen = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '1rem', background: '#F4F6FB' }}>
    <div style={{ width: 40, height: 40, border: '4px solid #e5e7eb', borderTop: '4px solid #C0182A', borderRadius: '50%', animation: 'simta-spin 0.8s linear infinite' }} />
    <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>Memuat data...</p>
    <style>{`@keyframes simta-spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

export default ProtectedRoute;