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

      sessionStorage.setItem("simta_expired_msg", "Maaf sesi kamu sudah habis, silakan login kembali.");
      window.location.href = "/login";
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
    phone: no_telp,
    password,
    confirmPassword,
  });
  return response.data;
};

export const loginUser = async ({ email, password }) => {
  const response = await api.post("/api/auth/login", { email, password });
  return response.data;
};

// ------------------------------------------- MAHASISWA SIDE-------------------------------------------
export const getStudentData = async (userId) => {
  const response = await api.get(`/api/students/${userId}`);
  return response.data;
};

export const saveStudentData = async (userId, payload) => {
  const response = await api.put(`/api/students/${userId}`, payload);
  return response.data;
};

// ------------------------------------------- MAHASISWA SIDE SK-------------------------------------------
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

// Resubmit SK (jika BELUM_TERBIT / revisi, atau EXPIRED / pembaruan)
export const resubmitSKTARequest = async ({
  sktaRequestId,
  studentId,
  proposalTitleId,
  proposalTitleEn,
  dosenPembimbing1Id,
  dosenPembimbing2Id,
  evidence,
}) => {
  const formData = new FormData();
  if (studentId) formData.append("studentId", String(studentId));
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
    if (response.data?.data) {
      return response.data;         
    }
    
    return response.data;            
  } catch (err) {
    console.error("Error fetching all SKTA requests:", err);
    throw err;
  }
};

export const getSktaRequestById = async (id) => {
  const response = await api.get(`/api/skta-requests/${id}`);
  return response.data;
};

// Response Admin
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
    const existingId = payload.get('id');
    if (existingId) {
      // Update: gunakan PATCH dengan id yang sudah ada
      payload.delete('id'); 
      return api.patch(`/api/skta-responses/${existingId}`, payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    // Create baru
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

// Download Evidence Mahasiswa — endpoint confirmed 200 OK
// uploadId = upload.id (integer primary key dari tabel SktaRequestUpload)
export const downloadEvidence = async (uploadId) => {
  const response = await api.get(
    `/api/skta-requests/uploads/${uploadId}/download`,
    { responseType: 'blob' }
  );
  return response.data;
};
 
// Get Evidence Uploads by Student ID 
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
  const response = await api.get(
    `/api/skta-responses/uploads/${uploadId}/download`,
    {
      responseType: "blob",
    },
  );
  return response.data;
};


//  DOKUMEN VALIDASI SKTA 
/**
 * POST /api/dokumen-validasi-skta
 * Upload PDF dokumen validasi yang di-generate FE
 * BE simpan file → return downloadUrl untuk dijadikan QR
 */

export const uploadDokumenValidasi = async (studentId, pdfBlob, namaFile) => {
// buat debug
  console.log('pdfBlob type:', pdfBlob?.type);
  console.log('pdfBlob size:', pdfBlob?.size);
  console.log('studentId:', studentId);

  const formData = new FormData();
  formData.append('studentId',   String(studentId));
  formData.append('name',        namaFile || `Dokumen_Validasi_SKTA_${studentId}`);
  formData.append('dokumenFile', pdfBlob, `validasi-skta-${studentId}.pdf`);

  const response = await api.post(
    '/api/dokumen-validasi-skta',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );

  return response.data?.data ?? response.data;
};

// ------------------------------------------- SIDANG STUDENT -------------------------------------------
export const getSidangRegistrationByStudentId = async (studentId) => {
  try {
    const response = await api.get(
      `/api/sidang-registrations/student/${studentId}`,
    );
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

  const response = await api.post(
    `/api/sidang-registrations/${registrationId}/uploads`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return response.data?.data ?? response.data;
};

export const submitSidangRegistration = async (payload) => {
  const response = await api.post("/api/sidang-registrations/submit", payload);
  return response.data?.data ?? response.data;
};

// ------------------------------------------- SIDANG ADMIN -------------------------------------------
// GET ALL sidang registrasion
export const getAllSidangRegistrations = async () => {
  const response = await api.get('/api/sidang-registrations');
  return response.data?.data ?? response.data;
};

// GET /api/sidang-registrations/{id}/uploads
// Ambil semua berkas yang diupload mahasiswa untuk satu registration
// Dipakai oleh Dashboard untuk deteksi REVISI_DIPERBARUI via determineSidangStatus
export const getSidangRegistrationUploads = async (registrationId) => {
  try {
    const response = await api.get(`/api/sidang-registrations/${registrationId}/uploads`);
    return response.data?.data ?? response.data ?? [];
  } catch (err) {
    if (err.response?.status === 404) return [];
    throw err;
  }
};

// GET /api/sidang-registration-responses/registration/{sidangRegistrationId}
// Ambil response verifikasi berdasarkan sidangRegistrationId
export const getSidangRegistrationResponse = async (sidangRegistrationId) => {
  try {
    const response = await api.get(
      `/api/sidang-registration-responses/registration/${sidangRegistrationId}`
    );
    return response.data?.data ?? response.data;
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw err;
  }
};

// GET /api/sidang-registration-responses : Ambil semua responses (admin)
export const getAllSidangRegistrationResponses = async () => {
  const response = await api.get('/api/sidang-registration-responses');
  return response.data?.data ?? response.data;
};

// GET /api/sidang-registration-responses/{id}
export const getSidangRegistrationResponseById = async (id) => {
  const response = await api.get(`/api/sidang-registration-responses/${id}`);
  return response.data?.data ?? response.data;
};

// POST /api/sidang-registration-responses
// Buat response baru (waktu admin verifikasi pertama kali)
// payload: {
//   sidangRegistrationId: number,
//   isApproved: boolean,
//   sidangPeriodId: number | null,   
//   dueDate: string | null,         
//   message: string | null,         
//   berkasStatuses: string,})
// }
export const createSidangRegistrationResponse = async (payload) => {
  const response = await api.post('/api/sidang-registration-responses', payload);
  return response.data?.data ?? response.data;
};

// PUT /api/sidang-registration-responses/{id} : Update response
export const updateSidangRegistrationResponse = async (id, payload) => {
  const response = await api.put(`/api/sidang-registration-responses/${id}`, payload);
  return response.data?.data ?? response.data;
};

// DELETE /api/sidang-registration-responses/{id} : Hapus response
export const deleteSidangRegistrationResponse = async (id) => {
  const response = await api.delete(`/api/sidang-registration-responses/${id}`);
  return response.data;
};

// Helper: create or update di cek dari ada/tidaknya existing response
export const upsertSidangRegistrationResponse = async (payload, existingId) => {
  if (existingId) {
    return updateSidangRegistrationResponse(existingId, payload);
  }
  return createSidangRegistrationResponse(payload);
};

// ------------------------------------------- ETC -------------------------------------------
export const getLecturers = async () =>
  api.get("/api/lecturers").then((r) => r.data?.data ?? r.data);
export const getFaculties = async () =>
  api.get("/api/faculties").then((r) => r.data?.data ?? r.data);
export const getStudyPrograms = async () =>
  api.get("/api/study-programs").then((r) => r.data?.data ?? r.data);

export const getStudyProgramById = async (id) =>
  api.get(`/api/study-programs/${id}`).then((r) => r.data?.data ?? r.data);

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