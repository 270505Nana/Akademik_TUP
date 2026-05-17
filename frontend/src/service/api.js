import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ------------------------------------------- INTERCEPTORS -------------------------------------------

// Request Interceptor
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

// Response Interceptor - Session Expired Handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("simta_user");
      localStorage.removeItem("simta_token");
      localStorage.removeItem("student_data");
      // localStorage.removeItem("skta_request_id");

      const event = new CustomEvent("auth-expired", {
        detail: {
          message: "Maaf sesi anda sudah habis, silahkan login kembali",
        },
      });
      window.dispatchEvent(event);

      window.location.href = "/login?expired=true";
    }
    return Promise.reject(error);
  },
);

// ------------------------------------------- AUTH -------------------------------------------
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

// ------------------------------------------- MAHASISWA SIDE -------------------------------------------
export const getStudentData = async (userId) => {
  const response = await api.get(`/api/students/${userId}`);
  return response.data;
};

export const saveStudentData = async (userId, payload) => {
  const response = await api.put(`/api/students/${userId}`, payload);
  return response.data;
};

// Cek request SK milik mahasiswa sendiri
export const getSKTARequest = async (studentId) => {
  try {
    const response = await api.get(`/api/skta-requests/${studentId}`);
    return response.data?.data ?? response.data;
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw err;
  }
};

// Submit pengajuan SK baru (Mahasiswa)
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
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

// Resubmit SK (jika expired)
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
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return response.data;
};

export const getSKTAResponse = async (sktaRequestId) => {
  try {
    const response = await api.get(`/api/skta-responses/${sktaRequestId}`);
    return response.data?.data ?? response.data;
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw err;
  }
};

// ------------------------------------------- DOSEN SIDE () -------------------------------------------
export const getLecturerData = async (userId) => {
  const response = await api.get(`/api/lecturer/${userId}`);
  return response.data;
};

// ------------------------------------------- ADMIN SIDE (Permohonan SK) -------------------------------------------
export const getAcademicStaffData = async (userId) => {
  const response = await api.get(`/api/academic-staff/${userId}`);
  return response.data;
};

// List semua pengajuan SK (Admin)
export const getAllSktaRequests = async (params = {}) => {
  const response = await api.get("/api/skta-requests", { params });
  return response.data;
};

export const getSktaRequestById = async (id) => {
  const response = await api.get(`/api/skta-requests/${id}`);
  return response.data;
};

// Response Admin
export const getSktaResponseByRequestId = async (sktaRequestId) => {
  try {
    const response = await api.get(`/api/skta-responses/${sktaRequestId}`);
    return response.data;
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw err;
  }
};

// export const createOrUpdateSktaResponse = async (payload) => {
//   const { id, ...data } = payload;
//   if (id) {
//     return api.patch(`/api/skta-responses/${id}`, data);
//   }
//   return api.post('/api/skta-responses', data);
// };
export const getSktaResponseUploadByStudentId = async (studentId) => {
  try {
    const response = await api.get(
      `/api/skta-responses/requests/${studentId}/uploads`,
    );
    return response.data;
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw err;
  }
};

export const createOrUpdateSktaResponse = async (payload) => {
  if (payload instanceof FormData) {
    return api.post("/api/skta-responses", payload, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }

  const { id, ...data } = payload;
  if (id) {
    return api.patch(`/api/skta-responses/${id}`, data);
  }
  return api.post("/api/skta-responses", data);
};

export const uploadSkFinal = async (sktaResponseId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("sktaResponseId", sktaResponseId);

  const response = await api.post(
    `/api/skta-responses/${sktaResponseId}/uploads`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return response.data;
};

// Download Evidence Mahasiswa
export const downloadEvidence = async (uploadId) => {
  const response = await api.get(
    `/api/skta-requests/uploads/${uploadId}/download`,
    {
      responseType: "blob",
    },
  );
  return response.data;
};

// ------------------------------------------- LAINNYA (Sidang, dll) -------------------------------------------
export const getLecturers = async () =>
  api.get("/api/lecturers").then((r) => r.data?.data ?? r.data);
export const getFaculties = async () =>
  api.get("/api/faculties").then((r) => r.data?.data ?? r.data);
export const getStudyPrograms = async () =>
  api.get("/api/study-programs").then((r) => r.data?.data ?? r.data);

// [periode sidang]
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
  const end = new Date(endDate);
  const isOpen = now >= start && now <= end;

  const response = await api.post("/api/sidang-periods", {
    name,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    isOpen,
  });
  return response.data?.data ?? response.data;
};

export const updateSidangPeriod = async (id, { name, startDate, endDate }) => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  const isOpen = now >= start && now <= end;

  const response = await api.patch(`/api/sidang-periods/${id}`, {
    name,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    isOpen,
  });
  return response.data?.data ?? response.data;
};

// ------------------------------------------- YUDISIUM PERIODS -------------------------------------------
export const getYudisiumPeriods = async () => {
  try {
    const response = await api.get("/api/yudisium-periods");
    return response.data?.data ?? response.data;
  } catch (err) {
    if (err.response?.status === 404) return [];
    throw err;
  }
};

export const createYudisiumPeriod = async ({ name, startDate, endDate }) => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  const isOpen = now >= start && now <= end;

  const response = await api.post("/api/yudisium-periods", {
    name,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    isOpen,
  });
  return response.data?.data ?? response.data;
};

export const updateYudisiumPeriod = async (
  id,
  { name, startDate, endDate },
) => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  const isOpen = now >= start && now <= end;

  const response = await api.patch(`/api/yudisium-periods/${id}`, {
    name,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    isOpen,
  });
  return response.data?.data ?? response.data;
};

export default api;
