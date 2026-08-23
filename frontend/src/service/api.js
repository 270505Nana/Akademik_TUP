import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ------------------------------------------- INTERCEPTORS -------------------------------------------

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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("simta_user");
      localStorage.removeItem("simta_token");
      localStorage.removeItem("student_data");

      const event = new CustomEvent("auth-expired", {
        detail: {
          message: "Maaf sesi anda sudah habis, silahkan login kembali",
        },
      });
      window.dispatchEvent(event);

      sessionStorage.setItem("simta_expired_msg", "Maaf sesi kamu sudah habis, silakan login kembali.");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// ------------------------------------------- AUTH -------------------------------------------
export const registerUser = async ({ username, email, no_telp, password, confirmPassword }) => {
  const response = await api.post("/api/auth/register", {
    username, email, phone: no_telp, password, confirmPassword,
  });
  return response.data;
};

export const loginUser = async ({ email, password }) => {
  const response = await api.post("/api/auth/login", { email, password });
  return response.data;
};

// ------------------------------------------- MAHASISWA SIDE-------------------------------------------
export const getStudentData = async (userId) => {
  const response = await api.get(`/api/mahasiswa/${userId}`);
  return response.data;
};

export const saveStudentData = async (userId, payload) => {
  const response = await api.put(`/api/mahasiswa/${userId}`, payload);
  return response.data;
};

// ------------------------------------------- MAHASISWA SIDE SK-------------------------------------------
export const getSKTARequest = async (studentId) => {
  try {
    const response = await api.get(`/api/skta-requests/${studentId}`);
    return response.data?.data ?? response.data;
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw err;
  }
};

export const submitSKTARequest = async ({ proposalTitleId, proposalTitleEn, studentId, dosenPembimbing1Id, dosenPembimbing2Id, evidence }) => {
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

export const resubmitSKTARequest = async ({ sktaRequestId, studentId, proposalTitleId, proposalTitleEn, dosenPembimbing1Id, dosenPembimbing2Id, evidence }) => {
  const formData = new FormData();
  if (studentId) formData.append("studentId", String(studentId));
  formData.append("proposalTitleId", proposalTitleId);
  formData.append("proposalTitleEn", proposalTitleEn);
  formData.append("dosenPembimbing1Id", String(dosenPembimbing1Id));
  formData.append("dosenPembimbing2Id", String(dosenPembimbing2Id));
  if (evidence) formData.append("evidence", evidence);

  const response = await api.patch(`/api/skta-requests/${sktaRequestId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
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

// ------------------------------------------- DOSEN -------------------------------------------
export const getLecturersData = async (userId) => {
  const response = await api.get(`/api/lecturers`);
  return response.data;
};

export const getLecturerData = async (userId) => {
  const response = await api.get(`/api/lecturers/${userId}`);
  return response.data;
};

// ------------------------------------------- ADMIN (Permohonan SK) -------------------------------------------
export const getAcademicStaffData = async (userId) => {
  const response = await api.get(`/api/academic-staff/${userId}`);
  return response.data;
};

export const getAllSktaRequests = async (params = {}) => {
  try {
    const response = await api.get("/api/skta-requests", { params });
    return response.data?.data ?? response.data;            
  } catch (err) {
    console.error("Error fetching all SKTA requests:", err);
    throw err;
  }
};

export const getSktaRequestById = async (id) => {
  const response = await api.get(`/api/skta-requests/${id}`);
  return response.data;
};

export const getSktaResponseByRequestId = async (sktaRequestId) => {
  try {
    const response = await api.get(`/api/skta-responses/${sktaRequestId}`);
    return response.data?.data ?? response.data;
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw err;
  }
};

export const getSktaResponseUploadByStudentId = async (studentId) => {
  try {
    const response = await api.get(`/api/skta-responses/requests/${studentId}/uploads`);
    return response.data;
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw err;
  }
};

export const createOrUpdateSktaResponse = async (payload) => {
  if (payload instanceof FormData) {
    const existingId = payload.get('id');
    if (existingId) {
      payload.delete('id'); 
      return api.patch(`/api/skta-responses/${existingId}`, payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
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

  const response = await api.post(`/api/skta-responses/${sktaResponseId}/uploads`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const downloadFileFromUrl = async (url) => {
  const response = await api.get(url, { responseType: 'blob' });
  return response.data;
};

export const downloadEvidence = async (uploadId) => {
  const response = await api.get(`/api/skta-requests/uploads/${uploadId}/download`, { responseType: 'blob' });
  return response.data;
};
 
export const getEvidenceUploadsByStudentId = async (studentId) => {
  try {
    const response = await api.get(`/api/skta-requests/${studentId}`);
    const requestData = response.data?.data ?? response.data;
    return requestData?.sktaRequestUploads || [];
  } catch (err) {
    if (err.response?.status === 404) return [];
    throw err;
  }
};

export const downloadSK = async (uploadId) => {
  const response = await api.get(`/api/skta-responses/uploads/${uploadId}/download`, { responseType: "blob" });
  return response.data;
};

export const uploadDokumenValidasi = async (studentId, pdfBlob, namaFile) => {
  const formData = new FormData();
  formData.append('studentId', String(studentId));
  formData.append('name', namaFile || `Dokumen_Validasi_SKTA_${studentId}`);
  formData.append('dokumenFile', pdfBlob, `validasi-skta-${studentId}.pdf`);

  const response = await api.post('/api/dokumen-validasi-skta', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  return response.data?.data ?? response.data;
};

// Menambahkan fungsi Approve SK
export const approvePermohonanSK = async (permohonanId, payload) => {
  const formData = new FormData();
  formData.append("sktaRequestId", permohonanId);
  formData.append("adminId", payload.adminId);
  formData.append("hasUploadedFinalProposal", payload.hasUploadedFinalProposal);
  formData.append("hasTakenLanguageTest", payload.hasTakenLanguageTest);
  
  if (payload.expDate) formData.append("expDate", payload.expDate);
  if (payload.sktaFile) formData.append("file", payload.sktaFile);

  const response = await api.post("/api/skta-responses", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data?.data ?? response.data;
};

// Menambahkan fungsi Reject SK
export const rejectPermohonanSK = async (permohonanId, payload) => {
  const response = await api.post("/api/skta-responses", {
    sktaRequestId: permohonanId,
    message: payload.message,
    adminId: payload.adminId,
  });
  return response.data?.data ?? response.data;
};

// ------------------------------------------- SIDANG STUDENT -------------------------------------------
export const getSidangRegistrationByStudentId = async (studentId) => {
  try {
    const response = await api.get(`/api/sidang-registrations/student/${studentId}`);
    return response.data?.data ?? response.data;
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw err;
  }
};

export const saveSidangRegistration = async (payload) => {
  const response = await api.post("/api/sidang-registrations/save", payload);
  return response.data?.data ?? response.data;
};

export const uploadSidangRegistrationFile = async (registrationId, payload) => {
  const formData = new FormData();
  formData.append("file", payload.file);
  formData.append("slug", payload.slug);
  formData.append("name", payload.name);

  const response = await api.post(`/api/sidang-registrations/${registrationId}/uploads`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data?.data ?? response.data;
};

export const submitSidangRegistration = async (payload) => {
  const response = await api.post("/api/sidang-registrations/submit", payload);
  return response.data?.data ?? response.data;
};


// ------------------------------------------- YUDISIUM STUDENT -------------------------------------------
export const saveYudisiumRegistration = async (payload) => {
  const response = await api.post("/api/yudisium-registrations/", payload);
  return response.data?.data ?? response.data;
};

export const uploadYudisiumRegistrationFile = async (registrationId, payload) => {
  const formData = new FormData();
  formData.append("file", payload.file);
  formData.append("slug", payload.slug);
  formData.append("name", payload.name);

  const response = await api.post(
    `/api/yudisium-registrations/${registrationId}/uploads`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return response.data?.data ?? response.data;
};

export const submitYudisiumRegistration = async (payload) => {
  const response = await api.post("/api/yudisium-registrations/submit", payload);
  return response.data?.data ?? response.data;
};

// ------------------------------------------- SIDANG ADMIN -------------------------------------------
export const getAllSidangRegistrations = async () => {
  const response = await api.get('/api/sidang-registrations');
  return response.data?.data ?? response.data;
};

export const getSidangRegistrationById = async (id) => {
  const response = await api.get(`/api/sidang-registrations/${id}`);
  return response.data?.data ?? response.data;
};

export const getSidangRegistrationUploads = async (registrationId) => {
  try {
    const response = await api.get(`/api/sidang-registrations/${registrationId}/uploads`);
    return response.data?.data ?? response.data ?? [];
  } catch (err) {
    if (err.response?.status === 404) return [];
    throw err;
  }
};

export const downloadSidangRegistrationUpload = async (uploadId) => {
  const response = await api.get(`/api/sidang-registrations/uploads/${uploadId}/download`, { responseType: 'blob' });
  return response.data;
};

export const getSidangRegistrationResponse = async (sidangRegistrationId) => {
  try {
    const response = await api.get(`/api/sidang-registration-responses/registration/${sidangRegistrationId}`);
    return response.data?.data ?? response.data;
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw err;
  }
};

export const getAllSidangRegistrationResponses = async () => {
  const response = await api.get('/api/sidang-registration-responses');
  return response.data?.data ?? response.data;
};

export const getSidangRegistrationResponseById = async (id) => {
  const response = await api.get(`/api/sidang-registration-responses/${id}`);
  return response.data?.data ?? response.data;
};

// Memperbaiki parameter agar sesuai dengan yang dikirim VerifikasiBerkasModal
export const createSidangRegistrationResponse = async (sidangRegistrationId, payload) => {
  const response = await api.post('/api/sidang-registration-responses', {
    sidangRegistrationId, 
    ...payload
  });
  return response.data?.data ?? response.data;
};

export const updateSidangRegistrationResponse = async (id, payload) => {
  const response = await api.put(`/api/sidang-registration-responses/${id}`, payload);
  return response.data?.data ?? response.data;
};

export const deleteSidangRegistrationResponse = async (id) => {
  const response = await api.delete(`/api/sidang-registration-responses/${id}`);
  return response.data;
};

export const upsertSidangRegistrationResponse = async (payload, existingId) => {
  if (existingId) {
    return updateSidangRegistrationResponse(existingId, payload);
  }
  return createSidangRegistrationResponse(payload.sidangRegistrationId, payload); // Disesuaikan
};

// ------------------------------------------- ETC -------------------------------------------
export const getLecturers = async () => api.get("/api/dosen").then((r) => r.data?.data ?? r.data);
export const getFaculties = async () => api.get("/api/faculties").then((r) => r.data?.data ?? r.data);
export const getStudyPrograms = async () => api.get("/api/study-programs").then((r) => r.data?.data ?? r.data);
export const getStudyProgramById = async (id) => api.get(`/api/study-programs/${id}`).then((r) => r.data?.data ?? r.data);

export const getSidangPeriods = async () => {
  try {
    const response = await api.get("/api/sidang-periods");
    return response.data?.data ?? response.data;
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw err;
  }
};

export const getYudisiumPeriods = async () => {
  try {
    const response = await api.get("/api/yudisium-periods");
    return response.data?.data ?? response.data;
  } catch (err) {
    if (err.response?.status === 404) return [];
    throw err;
  }
};

export const createSidangPeriod = async ({ name, startDate, endDate }) => {
  const now = new Date();
  const start = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);
  const isOpen = now >= start && now <= end;
 
  const response = await api.post("/api/sidang-periods", { name, startDate, endDate, isOpen });
  return response.data?.data ?? response.data;
};
 
export const updateSidangPeriod = async (id, { name, startDate, endDate }) => {
  const now = new Date();
  const start = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);
  const isOpen = now >= start && now <= end;
 
  const response = await api.patch(`/api/sidang-periods/${id}`, { name, startDate, endDate, isOpen });
  return response.data?.data ?? response.data;
};
 
export const createYudisiumPeriod = async ({ name, startDate, endDate }) => {
  const now = new Date();
  const start = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);
  const isOpen = now >= start && now <= end;
 
  const response = await api.post("/api/yudisium-periods", { name, startDate, endDate, isOpen });
  return response.data?.data ?? response.data;
};
 
export const updateYudisiumPeriod = async (id, { name, startDate, endDate }) => {
  const now = new Date();
  const start = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);
  const isOpen = now >= start && now <= end;
 
  const response = await api.patch(`/api/yudisium-periods/${id}`, { name, startDate, endDate, isOpen });
  return response.data?.data ?? response.data;
};

// ------------------------------------------- TEMPLATE -------------------------------------------
export const getTemplate = async (slug) => {
  const response = await api.get(`/api/templates/${slug}`);
  return response.data?.data ?? response.data;
};

export const downloadTemplate = async (slug) => {
  const meta = await getTemplate(slug);
  const downloadUrl = meta?.url;
  if (!downloadUrl) throw new Error('Download URL tidak ditemukan dalam response.');

  const response = await api.get(downloadUrl, { responseType: 'blob' });
  return {
    blob: response.data,
    name: meta?.name || meta?.filename || `template-${slug}`,
  };
};

export const generateDokumenValidasiSkta = async (permohonanId) => {
  const response = await api.get(`/api/permohonan-skta/${permohonanId}/generate/dokumen-validasi-skta`);
  return response.data?.data ?? response.data;
};

export default api;