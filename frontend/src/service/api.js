import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor: buat token ke semua request
// KL udh exp jga di handle di response interceptor, jd g usah cek exp di sini
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

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("simta_user");
      localStorage.removeItem("simta_token");
      localStorage.removeItem("student_data");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;

// AUTHENTICATION
export const registerUser = async ({ username, email, no_telp, password, confirmPassword }) => {
  const response = await api.post("/api/auth/register", {
    username,
    email,
    no_telp,
    password,
    confirmPassword,
  });
  return response.data;
};

export const loginUser = async ({ email, password }) => {
  const response = await api.post("/api/auth/login", { email, password });
  return response.data;
};

export const logoutUser = async () => {
  // await api.post("/api/auth/logout");
};

// STUDENT

export const getStudentData = async (userId) => {
  const response = await api.get(`/api/students/${userId}`);
  return response.data?.data ?? response.data;
};

export const saveStudentData = async (userId, payload) => {
  const response = await api.put(`/api/students/${userId}`, payload);
  return response.data;
};

// DOSEN

export const getLecturers = async () => {
  const response = await api.get("/api/lecturers");
  return response.data?.data ?? response.data;
};

// FAKULTAS

export const getFaculties = async () => {
  const response = await api.get("/api/faculties");
  return response.data?.data ?? response.data;
};

// PRODI

export const getStudyPrograms = async () => {
  const response = await api.get("/api/study-programs");
  return response.data?.data ?? response.data;
};