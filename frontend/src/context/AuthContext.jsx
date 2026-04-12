import { createContext, useContext, useState } from "react";
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("simta_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("simta_token") || null;
  });

  const [loading] = useState(false);
  const login = (userData) => {
    const { token: tkn, ...rest } = userData;
    setUser(rest);
    setToken(tkn);
    localStorage.setItem("simta_user",  JSON.stringify(rest));
    localStorage.setItem("simta_token", tkn);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("simta_user");
    localStorage.removeItem("simta_token");
  };

  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      logout,
      isAuthenticated,
    }}>
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