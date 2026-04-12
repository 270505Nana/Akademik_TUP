
import axios from "axios";
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// REQUEST INTERCEPTOR -> add JWT token ke headernya
api.interceptors.request.use(
  (config) => {
    const savedUser = localStorage.getItem("simta_user");
    if (savedUser) {
      const { token } = JSON.parse(savedUser);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

//  RESPONSE INTERCEPTOR -> buat handle error 401 (redirect)
api.interceptors.response.use(
  (response) => response, // jika sukses, langsung kembalikan response
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("simta_user");
      window.location.href = "/login"; // paksa kembali ke login
    }
    return Promise.reject(error);
  }
);

export default api;
// authservisenya smeentara gabung aja,masih pake sso disini aku setnya, blm yg usn biasa
export const loginUser = async ({ ssoUsername, password, role }) => {
  const response = await api.post("/api/auth/login", {
    sso_username: ssoUsername,
    password,
    role, 
  });
  return response.data;
};

export const registerUser = async ({ username, email, no_telp, password }) => {
  const response = await api.post("/api/auth/register", {
    username,
    email,
    no_telp: no_telp,
    password,
  });
  return response.data;
};

export const logoutUser = async () => {
  try {
    await api.post("/api/auth/logout");
  } catch (e) {
    console.warn("Logout BE gagal, tetap logout FE:", e.message);
  }
};