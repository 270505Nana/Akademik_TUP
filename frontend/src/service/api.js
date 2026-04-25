import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("simta_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("simta_user");
      localStorage.removeItem("simta_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;

export const registerUser = async ({ username, email, no_telp, password, confirmPassword }) => {
  const response = await api.post("/api/auth/register", {
    username,
    email,
    phone: no_telp,          
    password,
    confirmPassword,          
    role: "STUDENT",          
  });
  return response.data;
};

// SSO nya aku hapus dl sementara, karena sekarang pakai login biasa
export const loginUser = async ({ email, password }) => {
  const response = await api.post("/api/auth/login", {
    email,
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