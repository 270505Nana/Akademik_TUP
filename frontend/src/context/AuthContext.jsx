import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";

const AuthContext = createContext(null);
const INACTIVITY_ROLES = ["ACADEMIC_STAFF", "LECTURER"];
// Timeout inactivity: 30 menit tidak ada aktivitas 
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;

export const AuthProvider = ({ children }) => {
  // cek token di localstorage
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("simta_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // cek data profile di localstorage
  const [profile, setProfile] = useState(() => {
    try {
      const stored = localStorage.getItem("simta_profile");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("simta_token") || null;
  });

  const inactivityTimer = useRef(null);

  // login
  const login = async (userData) => {
    const { token: tkn, ...rest } = userData;
    setUser(rest);
    setToken(tkn);
    localStorage.setItem("simta_user", JSON.stringify(rest));
    localStorage.setItem("simta_token", tkn);

    async function fetchProfile(role, id) {
      let profile;

      if (role === "STUDENT") {
        profile = await getStudentData(id);
      } else if (role === "LECTURER") {
        profile = await getLecturerData(id);
      } else if (role === "ACADEMIC_STAFF") {
        profile = await getAcademicStaffData(id);
      }

      return profile;
    }

    const profile = await fetchProfile(role, data?.data?.id);

    setProfile(profile?.data);
    localStorage.setItem("simta_profile", JSON.stringify(profile?.data));
  };

  const logout = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    setUser(null);
    setToken(null);
    localStorage.removeItem("simta_user");
    localStorage.removeItem("simta_token");
    localStorage.removeItem("student_data");
  }, []);

  // Logout dengan redirect ke login + pesan expired
  const logoutExpired = useCallback((message) => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    setUser(null);
    setToken(null);
    localStorage.removeItem("simta_user");
    localStorage.removeItem("simta_token");
    localStorage.removeItem("student_data");
    window.location.href = `/login?expired=true&msg=${encodeURIComponent(message)}`;
  }, []);

  // Reset inactivity timer 
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      logoutExpired("Maaf sesi anda sudah habis, silahkan login kembali");
    }, INACTIVITY_TIMEOUT_MS);
  }, [logoutExpired]);

  useEffect(() => {
    if (!user || !token) return;
    if (!INACTIVITY_ROLES.includes(user.role)) return;

    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"];
    const handleActivity = () => resetInactivityTimer();

    resetInactivityTimer(); 

    events.forEach((e) => window.addEventListener(e, handleActivity, { passive: true }));
    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      events.forEach((e) => window.removeEventListener(e, handleActivity));
    };
  }, [user, token, resetInactivityTimer]);

  useEffect(() => {
    const handleAuthExpired = () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      setUser(null);
      setToken(null);
    };
    window.addEventListener("auth-expired", handleAuthExpired);
    return () => window.removeEventListener("auth-expired", handleAuthExpired);
  }, []);

  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam <AuthProvider>");
  return ctx;
};

export default AuthContext;
