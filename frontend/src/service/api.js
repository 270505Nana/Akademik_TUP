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
export const registerUser = async ({ name, email, no_telp, password, confirmPassword }) => {
  const response = await api.post("/api/auth/register", {
    name, email, phone: no_telp, password, confirmPassword,
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
    const response = await api.get(`/api/permohonan-skta/mahasiswa/${studentId}`);
    return response.data?.data || response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return null;
    }
    throw error;
  }
};

export const submitSKTARequest = async ({ proposalTitleId, proposalTitleEn, studentId, mahasiswaId, dosenPembimbing1Id, dosenPembimbing2Id, evidence, category }) => {
  const formData = new FormData();

  formData.append("judulProposalIndonesia", proposalTitleId);
  formData.append("judulProposalInggris", proposalTitleEn);
  formData.append("mahasiswaId", String(mahasiswaId || studentId)); 
  formData.append("dosenPembimbing1Id", String(dosenPembimbing1Id));
  formData.append("dosenPembimbing2Id", String(dosenPembimbing2Id));
  formData.append("evidence", evidence);
  const endpoint = category 
    ? `/api/permohonan-skta?category=${encodeURIComponent(category)}` 
    : "/api/permohonan-skta";

  const response = await api.post(endpoint, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const resubmitSKTARequest = async ({ sktaRequestId, studentId, mahasiswaId, proposalTitleId, proposalTitleEn, dosenPembimbing1Id, dosenPembimbing2Id, evidence }) => {
  const formData = new FormData();
  const activeStudentId = mahasiswaId || studentId;
  if (activeStudentId) formData.append("mahasiswaId", String(activeStudentId));
  formData.append("judulProposalIndonesia", proposalTitleId);
  formData.append("judulProposalInggris", proposalTitleEn);
  formData.append("dosenPembimbing1Id", String(dosenPembimbing1Id));
  formData.append("dosenPembimbing2Id", String(dosenPembimbing2Id));
  
  if (evidence) formData.append("evidence", evidence);

  const response = await api.patch(`/api/permohonan-skta/${sktaRequestId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const getSKTAResponse = async (sktaRequestId) => {
  try {
    const response = await api.get(`/api/permohonan-skta/${sktaRequestId}`);
    return response.data?.data ?? response.data;
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw err;
  }
};

// ------------------------------------------- DOSEN -------------------------------------------
export const getLecturersData = async () => {
  const response = await api.get('/api/dosen');
  return response.data?.data ?? response.data;
};

export const getLecturerData = async (userId) => {
  // Endpoint /api/dosen/:id mengembalikan semua field dosen termasuk isKetuaKK
  const response = await api.get(`/api/dosen/${userId}`);
  return response.data;
};

export const getAllDosen = async (params = {}) => {
  const response = await api.get('/api/dosen', { params });
  // Kembalikan seluruh response (data + pagination) agar FE bisa baca metadata
  return response.data;
};

export const getResearchGroups = async () => {
  const response = await api.get('/api/research-groups');
  return response.data?.data ?? response.data;
};

export const toggleDosenKetuaKK = async (dosenId) => {
  const response = await api.patch(`/api/dosen/${dosenId}/toggle-ketua-kk`);
  return response.data;
};

export const updateDosenKK = async (dosenId, { nip, name, researchGroupId, kodeDosen }) => {
  const response = await api.put(`/api/dosen/${dosenId}`, {
    nip, name, researchGroupId, kodeDosen,
  });

  return response.data;
};

// ------------------------------------------- RESEARCH GROUPS (CRUD) -------------------------------------------

// POST /api/research-groups — Buat KK baru; BE otomatis restore jika nama sama pernah di-soft-delete.
// Response body: { message, data: { id (UUID), name, isActive, ... } }
export const createResearchGroup = async (name) => {
  const response = await api.post('/api/research-groups', { name });
  return response.data?.data ?? response.data;
};

// PUT /api/research-groups/:id — Ganti nama KK.
// Response body: { message, data: { id, name, ... } }
export const updateResearchGroup = async (id, name) => {
  const response = await api.put(`/api/research-groups/${id}`, { name });
  return response.data?.data ?? response.data;
};

// DELETE /api/research-groups/:id — Soft-delete KK.
// Response body: { message, data: { id, deletedAt, ... } }
export const deleteResearchGroup = async (id) => {
  const response = await api.delete(`/api/research-groups/${id}`);
  return response.data;
};

// ------------------------------------------- ADMIN (Permohonan SK & Sidang) -------------------------------------------
export const getAcademicStaffData = async (userId) => {
  const response = await api.get(`/api/admin/${userId}`);
  return response.data?.data ?? response.data;
};

export const getAllSktaRequests = async (params = {}) => {
  try {
    const response = await api.get("/api/permohonan-skta", { params }); 
    return response.data?.data ?? response.data;            
  } catch (err) {
    console.error("Error fetching all SKTA requests:", err);
    throw err;
  }
};

export const getSktaRequestById = async (id) => {
  const response = await api.get(`/api/permohonan-skta/${id}`); 
  return response.data;
};

export const getSktaResponseByRequestId = async (sktaRequestId) => {
  try {
    const response = await api.get(`/api/permohonan-skta/${sktaRequestId}`);
    return response.data?.data ?? response.data;
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw err;
  }
};

export const getSktaResponseUploadByStudentId = async (studentId) => {
  try {
    const response = await api.get(`/api/permohonan-skta/mahasiswa/${studentId}`);
    return response.data?.data ?? response.data;
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
      return api.put(`/api/permohonan-skta/${existingId}`, payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return api.post("/api/permohonan-skta", payload, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }

  const { id, ...data } = payload;
  if (id) {
    return api.put(`/api/permohonan-skta/${id}`, data);
  }
  return api.post("/api/permohonan-skta", data);
};

export const uploadSkFinal = async (sktaResponseId, file) => {
  const formData = new FormData();
  formData.append("skta", file);

  const response = await api.put(`/api/permohonan-skta/${sktaResponseId}/approve`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data?.data ?? response.data;
};

export const downloadFileFromUrl = async (url) => {
  const response = await api.get(url, { responseType: 'blob' });
  return response.data;
};

export const downloadEvidence = async (id) => {
  const response = await api.get(`/api/permohonan-skta/${id}/download/evidence`, { responseType: 'blob' });
  return response.data;
};

export const getEvidenceUploadsByStudentId = async (studentId) => {
  try {
    const response = await api.get(`/api/permohonan-skta/${studentId}`); 
    const requestData = response.data?.data ?? response.data;
    return requestData?.evidenceUploadPath ? [requestData] : [];
  } catch (err) {
    if (err.response?.status === 404) return [];
    throw err;
  }
};

export const downloadSK = async (id) => {
  const response = await api.get(`/api/permohonan-skta/${id}/download/skta`, { responseType: "blob" });
  let filename = null;
  const disposition = response.headers?.["content-disposition"];
  if (disposition && disposition.includes("filename=")) {
    const filenameMatch = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1].replace(/['"]/g, "").trim();
    }
  }
  const blob = response.data;
  if (blob && filename) {
    blob.filename = filename;
  }
  return blob;
};

export const uploadDokumenValidasi = async (studentId, pdfBlob, namaFile) => {
  const formData = new FormData();
  formData.append('studentId', String(studentId));
  formData.append('name', namaFile || `Dokumen_Validasi_SKTA_${studentId}`);
  formData.append('dokumenFile', pdfBlob, `validasi-skta-${studentId}.pdf`);

  const response = await api.post('/api/dokumen-validasi-skta', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  return response.data?.data ?? response.data;
};

export const approvePermohonanSK = async (permohonanId, payload) => {
  const formData = new FormData();
  formData.append("adminId", payload.adminId);
  formData.append("hasUploadedFinalProposal", payload.hasUploadedFinalProposal);
  formData.append("hasTakenLanguageTest", payload.hasTakenLanguageTest);

  if (payload.expDate) formData.append("expDate", payload.expDate);
  if (payload.sktaFile) formData.append("skta", payload.sktaFile);

  const response = await api.put(`/api/permohonan-skta/${permohonanId}/approve`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data?.data ?? response.data;
};

export const rejectPermohonanSK = async (permohonanId, payload) => {
  const response = await api.put(`/api/permohonan-skta/${permohonanId}/reject`, {
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
  const response = await api.post("/api/sidang-registrations/", payload);
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

export const getYudisiumTemplates = async () => {
  try {
    const response = await api.get('/api/templates?limit=all');
    const data = response.data?.data ?? response.data ?? response;
    const arr = Array.isArray(data) ? data : (data.data || []);
    return arr.filter(t => t.category && t.category.toLowerCase().includes('yudisium'));
  } catch (e) {
    console.error("Gagal mengambil template yudisium:", e);
    return [];
  }
};
export const getMyYudisiumRegistrations = async (mahasiswaId) => {
  try {
    const response = await api.get(`/api/yudisium-registrations/student/${mahasiswaId}`);
    const data = response.data?.data ?? response.data;
    return Array.isArray(data) ? data : (data ? [data] : []);
  } catch (e) {
    console.error("Gagal mengambil data registrasi yudisium:", e);
    return [];
  }
};
// ---------------------------------------- YUDISIUM ADMIN -------------------------------------------
export const getAllYudisiumRegistrations = async () => {
  const response = await api.get('/api/yudisium-registrations?limit=all');
  return response.data?.data || response.data || [];
};

export const getYudisiumRegistrationById = async (id) => {
  const response = await api.get(`/api/yudisium-registrations/${id}`);
  return response.data?.data ?? response.data;
};

// API Approve
export const approveYudisiumRegistration = async (registrationId, payload) => {
  // payload: { adminId, yudisiumPeriodId, yudisiumRegistrationUploadIds: [] }
  const response = await api.put(`/api/yudisium-registrations/${registrationId}/approve`, payload);
  return response.data?.data ?? response.data;
};

// API Reject 
export const rejectYudisiumRegistration = async (registrationId, payload) => {
  // payload: { adminId, message, isEdit, yudisiumRegistrationUploadIds: [] }
  const response = await api.put(`/api/yudisium-registrations/${registrationId}/reject`, payload);
  return response.data?.data ?? response.data;
};

// API file upload mahasiswa review
export const downloadYudisiumRegistrationUpload = async (uploadId) => {
  const response = await api.get(`/api/yudisium-registrations/uploads/${uploadId}/download`, { responseType: 'blob' });
  return response.data;
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
  return createSidangRegistrationResponse(payload.sidangRegistrationId, payload);
};

export const approveSidangRegistration = async (registrationId, payload) => {
  const response = await api.put(`/api/sidang-registrations/${registrationId}/approve`, payload);
  return response.data?.data ?? response.data;
};

export const rejectSidangRegistration = async (registrationId, payload) => {
  const response = await api.put(`/api/sidang-registrations/${registrationId}/reject`, payload);
  return response.data?.data ?? response.data;
};

// ------------------------------------------- ETC -------------------------------------------
export const getLecturers = async (params = { limit: "all", sortBy: "a-z" }) =>
  api.get("/api/dosen", { params }).then((r) => r.data?.data ?? r.data);
export const getFaculties = async () => api.get("/api/faculties").then((r) => r.data?.data ?? r.data);
export const getStudyPrograms = async () => api.get("/api/study-programs").then((r) => r.data?.data ?? r.data);
export const getStudyProgramById = async (id) => api.get(`/api/study-programs/${id}`).then((r) => r.data?.data ?? r.data);

export const getSidangPeriods = async () => {
  try {
    const response = await api.get("/api/sidang-periods?limit=all");
    return response.data?.data ?? response.data;
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw err;
  }
};

export const getYudisiumPeriods = async (category = '') => {
  try {
    const url = category 
      ? `/api/yudisium-periods?category=${encodeURIComponent(category)}&limit=all` 
      : `/api/yudisium-periods?limit=all`;
      
    const response = await api.get(url);
    return response.data?.data || response.data || [];
  } catch (err) {
    if (err.response?.status === 404) return [];
    throw err;
  }
};

export const getActiveYudisiumPeriod = async () => {
  try {
    const response = await api.get('/api/yudisium-periods?category=pendaftaran yudisium&limit=all');
    const periods = response.data?.data ?? response.data;

    const now = new Date();

    const activePeriod = periods.find(p => {
      const start = new Date(p.startDate);
      const end = new Date(p.endDate);
      return p.isOpen === true && now >= start && now <= end;
    });

    return activePeriod || null;
  } catch (err) {
    return null;
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

export const createYudisiumPeriod = async ({ name, category, startDate, endDate }) => {
  const now = new Date();
  const start = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);
  const isOpen = now >= start && now <= end;
  const response = await api.post("/api/yudisium-periods", { name, category, startDate, endDate, isOpen });
  return response.data?.data ?? response.data;
};

export const updateYudisiumPeriod = async (id, { name, category, startDate, endDate }) => {
  const now = new Date();
  const start = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);
  const isOpen = now >= start && now <= end;

  const response = await api.patch(`/api/yudisium-periods/${id}`, { name, category, startDate, endDate, isOpen });
  return response.data?.data ?? response.data;
};

// ------------------------------------------- TEMPLATE -------------------------------------------
export const getTemplatesByCategory = async (category) => {
  const response = await api.get(`/api/templates?category=${encodeURIComponent(category)}&limit=all`);
  const data = response.data?.data ?? response.data;
  return Array.isArray(data) ? data : (data?.data || []);
};

export const getSidangWajibTemplates = () => getTemplatesByCategory("Sidang - Berkas Wajib");

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