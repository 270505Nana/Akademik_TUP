/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  getAcademicStaffData,
  getLecturerData,
  getStudentData,
} from "../service/api";

const AuthContext = createContext(null);
const INACTIVITY_ROLES = ["ADMIN", "DOSEN"];
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
  // Flag untuk mencegah mount effect menimpa fetch profil yang sedang dilakukan oleh login()
  const isLoggingIn = useRef(false);

  // login
  const login = async (userData) => {
    // Bersihkan sesi lama sebelum menyimpan data sesi baru
    localStorage.removeItem("simta_user");
    localStorage.removeItem("simta_profile");
    localStorage.removeItem("simta_token");
    localStorage.removeItem("student_data");

    const { token: tkn, ...rest } = userData;

    // Tandai bahwa proses login sedang berlangsung agar mount effect tidak ikut fetch
    isLoggingIn.current = true;

    setUser(rest);
    setToken(tkn);
    localStorage.setItem("simta_user", JSON.stringify(rest));
    localStorage.setItem("simta_token", tkn);

    async function fetchProfile(role, id) {
      let profileRes;
      if (role === "MAHASISWA") {
        profileRes = await getStudentData(id);
      } else if (role === "DOSEN") {
        profileRes = await getLecturerData(id);
      } else if (role === "ADMIN") {
        profileRes = await getAcademicStaffData(id);
      }
      return profileRes;
    }

    try {
      const profileRes = await fetchProfile(rest?.role, rest?.id);
      const profileData = profileRes?.data || profileRes;
      if (profileData) {
        setProfile(profileData);
        localStorage.setItem("simta_profile", JSON.stringify(profileData));
      }
    } catch (err) {
      console.error("Gagal memuat profil saat login:", err);
    } finally {
      isLoggingIn.current = false;
    }
  };

  // Fetch fresh profil dari BE setiap kali halaman di-refresh selama token valid.
  // langsung terlihat tanpa perlu logout-login ulang.
  useEffect(() => {
    if (!user || !token) return;
    if (isLoggingIn.current) return;

    async function refreshProfile() {
      try {
        let profileRes;
        if (user.role === "MAHASISWA") {
          profileRes = await getStudentData(user.id);
        } else if (user.role === "DOSEN") {
          profileRes = await getLecturerData(user.id);
        } else if (user.role === "ADMIN") {
          profileRes = await getAcademicStaffData(user.id);
        }
        const profileData = profileRes?.data || profileRes;
        if (profileData) {
          setProfile(profileData);
          localStorage.setItem("simta_profile", JSON.stringify(profileData));
        }
      } catch (err) {
        console.error("Gagal refresh profil saat inisialisasi:", err);
      }
    }

    refreshProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Cukup dijalankan sekali saat mount — user dan token sudah stabil dari localStorage

  const logout = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    setUser(null);
    setToken(null);
    localStorage.removeItem("simta_user");
    localStorage.removeItem("simta_profile");
    localStorage.removeItem("simta_token");
    localStorage.removeItem("student_data");
  }, []);

  // Logout dengan redirect ke login + pesan expired
  const logoutExpired = useCallback((message) => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    setUser(null);
    setToken(null);
    localStorage.removeItem("simta_user");
    localStorage.removeItem("simta_profile");
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

    const events = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];
    const handleActivity = () => resetInactivityTimer();

    resetInactivityTimer();

    events.forEach((e) =>
      window.addEventListener(e, handleActivity, { passive: true }),
    );
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
        profile,
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
