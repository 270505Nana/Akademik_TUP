import { createContext, useContext, useState } from "react";
const AuthContext = createContext(null);

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

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("simta_user");
    localStorage.removeItem("simta_token");
    localStorage.removeItem("student_data");
  };

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

// export default AuthContext;
export default AuthContext;
