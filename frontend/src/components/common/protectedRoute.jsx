import { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useStudent } from "../../context/StudentContext";

const ProtectedRoute = ({ children, allowedRoles, requireCompleteProfile = false }) => {
  const { user, isAuthenticated }                             = useAuth();
  const { isComplete, isStudentLoading, fetchAndLoadStudent } = useStudent();
  const location = useLocation();
  const [isServerChecking, setIsServerChecking] = useState(false);
  const [serverCheckDone, setServerCheckDone]   = useState(false);

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
      setIsServerChecking(true);
      fetchAndLoadStudent(user.id).finally(() => {
        setIsServerChecking(false);
        setServerCheckDone(true);
      });
    }

    if (!isStudentLoading && isComplete) {
      setServerCheckDone(true); //lngsg true kl datanya ada di lcalstorage
    }
  }, [isStudentLoading, isComplete, isAuthenticated, user?.id, requireCompleteProfile]);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/forbidden" replace />;
  }
  if (requireCompleteProfile && (isStudentLoading || isServerChecking)) {
    return <LoadingScreen />;
  }
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
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    gap: '1rem',
    background: '#F4F6FB',
  }}>
    <style>{`
      @keyframes simta-spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
    <div style={{
      width: 40,
      height: 40,
      border: '4px solid #e5e7eb',
      borderTop: '4px solid #C0182A',
      borderRadius: '50%',
      animation: 'simta-spin 0.8s linear infinite',
    }} />
    <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: 0 }}>
      Memuat data...
    </p>
  </div>
);

export default ProtectedRoute;