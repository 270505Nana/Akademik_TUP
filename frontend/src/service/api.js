import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor (buat token)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("simta_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);
//  Response interceptor
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
  },
);

export default api;

// AUTH
export const registerUser = async ({
  username,
  email,
  no_telp,
  password,
  confirmPassword,
}) => {
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

//  STUDENT
export const getStudentData = async (userId) => {
  const response = await api.get(`/api/students/${userId}`);
  return response.data?.data ?? response.data;
};

export const saveStudentData = async (userId, payload) => {
  const response = await api.put(`/api/students/${userId}`, payload);
  return response.data;
};

//  LECTURER
export const getLecturers = async () => {
  const response = await api.get("/api/lecturers");
  return response.data?.data ?? response.data;
};

//  FACULTY
export const getFaculties = async () => {
  const response = await api.get("/api/faculties");
  return response.data?.data ?? response.data;
};

//  STUDY PROGRAM
export const getStudyPrograms = async () => {
  const response = await api.get("/api/study-programs");
  return response.data?.data ?? response.data;
};

//  SKTA REQUEST -> cek apakah mhs udh punya request sk sblmnya
// berdasarkan studentId
export const getSKTARequest = async (studentId) => {
  try {
    const response = await api.get(`/api/skta-requests/${studentId}`);
    return response.data?.data ?? response.data;
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw err;
  }
};

/**
 * POST /api/skta-requests
 *
 * @param {string} proposalTitleId
 * @param {string} proposalTitleEn
 * @param {number} studentId
 * @param {number} dosenPembimbing1Id
 * @param {number} dosenPembimbing2Id
 * @param {File}   evidence
 */

export const submitSKTARequest = async ({
  proposalTitleId,
  proposalTitleEn,
  studentId,
  dosenPembimbing1Id,
  dosenPembimbing2Id,
  evidence,
}) => {
  const formData = new FormData();
  formData.append("proposalTitleId", proposalTitleId);
  formData.append("proposalTitleEn", proposalTitleEn);
  formData.append("studentId", String(studentId));
  formData.append("dosenPembimbing1Id", String(dosenPembimbing1Id));
  formData.append("dosenPembimbing2Id", String(dosenPembimbing2Id));
  formData.append("evidence", evidence);

  const response = await api.post("/api/skta-requests", formData, {
    headers: { "Content-Type": undefined },
  });
  return response.data;
};
// PATCH /api/skta-requests/:id -> request ulang SK expired. dgn param
export const resubmitSKTARequest = async ({
  sktaRequestId,
  proposalTitleId,
  proposalTitleEn,
  dosenPembimbing1Id,
  dosenPembimbing2Id,
  evidence,
}) => {
  const formData = new FormData();
  formData.append("proposalTitleId", proposalTitleId);
  formData.append("proposalTitleEn", proposalTitleEn);
  formData.append("dosenPembimbing1Id", String(dosenPembimbing1Id));
  formData.append("dosenPembimbing2Id", String(dosenPembimbing2Id));
  if (evidence) formData.append("evidence", evidence);
  const response = await api.patch(
    `/api/skta-requests/${sktaRequestId}`,
    formData,
    {
      headers: { "Content-Type": undefined },
    },
  );
  return response.data;
};

// buat status yg didapet dri kolom  : dalam proses, belum terbit, sudah terbit, expired, revisi
export const getSKTAResponse = async (sktaRequestId) => {
  try {
    const response = await api.get(`/api/skta-responses/${sktaRequestId}`);
    return response.data?.data ?? response.data;
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw err;
  }
};

// get periode sidang
export const getSidangPeriods = async () => {
  try {
    const response = await api.get("/api/sidang-periods");
    return response.data?.data ?? response.data;
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw err;
  }
};

export const createSidangPeriod = async ({ name, startDate, endDate }) => {
  const now = new Date();
  const start = new Date(startDate);
  const end   = new Date(endDate);
  const isOpen = now >= start && now <= end;

  const response = await api.post('/api/sidang-periods', {
    name,
    startDate: start.toISOString(),
    endDate:   end.toISOString(),
    isOpen,
  });
  return response.data?.data ?? response.data;
};

export const updateSidangPeriod = async (id, { name, startDate, endDate }) => {
  const now = new Date();
  const start = new Date (startDate);
  const end = new Date(endDate);
  const isOpen = now >= start && now <= end;

  const response = await api.patch(`/api/sidang-periods/${id}`, {
    name,
    startDate: start.toISOString(),
    endDate:   end.toISOString(),
    isOpen,
  });
  return response.data?.data ?? response.data;
};

