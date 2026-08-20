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
  name,
  email,
  no_telp,
  password,
  confirmPassword,
}) => {
  const response = await api.post("/api/auth/register", {
    name,
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
  const response = await api.get(`/api/mahasiswa/${userId}`);
  return response.data;
};

export const saveStudentData = async (userId, payload) => {
  const response = await api.put(`/api/mahasiswa/${userId}`, payload);
  return response.data;
};

// ------------------------------------------- MAHASISWA SIDE SK-------------------------------------------
// Cek request SK milik mahasiswa sendiri
// Helper to map backend's prisma fields to expected frontend legacy properties
const mapBackendSKTAToFrontend = (data) => {
  if (!data) return null;
  return {
    ...data,
    mahasiswaId: data.mahasiswaId,
    proposalTitleId: data.judulProposalIndonesia,
    proposalTitleEn: data.judulProposalInggris,
    student: data.mahasiswa,
  };
};

export const getSKTARequest = async (mahasiswaId) => {
  try {
    const response = await api.get(`/api/permohonan-skta/mahasiswa/${mahasiswaId}`);
    const data = response.data?.data ?? response.data;
    return mapBackendSKTAToFrontend(data);
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw err;
  }
};

// Submit pengajuan SK baru (Mahasiswa)
export const submitSKTARequest = async ({
  proposalTitleId,
  proposalTitleEn,
  mahasiswaId,
  dosenPembimbing1Id,
  dosenPembimbing2Id,
  evidence,
  category,
}) => {
  const formData = new FormData();
  formData.append("proposalTitleId", proposalTitleId);
  formData.append("proposalTitleEn", proposalTitleEn);
  formData.append("mahasiswaId", String(mahasiswaId));
  formData.append("dosenPembimbing1Id", String(dosenPembimbing1Id));
  formData.append("dosenPembimbing2Id", String(dosenPembimbing2Id));
  formData.append("evidence", evidence);

  const url = category
    ? `/api/permohonan-skta?category=${encodeURIComponent(category)}`
    : "/api/permohonan-skta";

  const response = await api.post(url, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

// Resubmit SK (jika BELUM_TERBIT / revisi, atau EXPIRED / pembaruan)
export const resubmitSKTARequest = async ({
  sktaRequestId,
  mahasiswaId,
  proposalTitleId,
  proposalTitleEn,
  dosenPembimbing1Id,
  dosenPembimbing2Id,
  evidence,
}) => {
  const formData = new FormData();
  if (mahasiswaId) formData.append("mahasiswaId", String(mahasiswaId));
  formData.append("proposalTitleId", proposalTitleId);
  formData.append("proposalTitleEn", proposalTitleEn);
  formData.append("dosenPembimbing1Id", String(dosenPembimbing1Id));
  formData.append("dosenPembimbing2Id", String(dosenPembimbing2Id));
  if (evidence) formData.append("evidence", evidence);

  const response = await api.put(
    `/api/permohonan-skta/${sktaRequestId}`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
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
  const response = await api.get(`/api/dosen`);
  return response.data;
};

export const getLecturerData = async (userId) => {
  const response = await api.get(`/api/dosen/${userId}`);
  return response.data;
};

// ------------------------------------------- ADMIN (Permohonan SK) -------------------------------------------
export const getAcademicStaffData = async (userId) => {
  const response = await api.get(`/api/admin/${userId}`);
  return response.data;
};

export const getAllSktaRequests = async (params = {}) => {
  try {
    const response = await api.get("/api/permohonan-skta", { params });
    const data = response.data?.data ?? response.data;
    if (Array.isArray(data)) {
      return data.map(mapBackendSKTAToFrontend);
    }
    return data;
  } catch (err) {
    console.error("Error fetching all SKTA requests:", err);
    throw err;
  }
};

export const getSktaRequestById = async (id) => {
  const response = await api.get(`/api/permohonan-skta/${id}`);
  const data = response.data?.data ?? response.data;
  return mapBackendSKTAToFrontend(data);
};

// Response Admin
export const getSktaResponseByRequestId = async (sktaRequestId) => {
  try {
    const response = await api.get(`/api/permohonan-skta/${sktaRequestId}`);
    const data = response.data?.data ?? response.data;
    return mapBackendSKTAToFrontend(data);
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw err;
  }
};

export const getSktaResponseUploadByMahasiswaId = async (mahasiswaId) => {
  try {
    const response = await api.get(`/api/permohonan-skta/mahasiswa/${mahasiswaId}`);
    const data = response.data?.data ?? response.data;
    if (!data || !data.sktaUploadPath) return [];

    const filename = data.sktaUploadPath.split(/[/\\]/).pop();

    return [
      {
        id: data.id,
        name: `SKTA_${data.id}`,
        filename,
        path: data.sktaUploadPath,
        mahasiswaId: data.mahasiswaId,
        downloadUrl: data.sktaDownloadUrl,
      }
    ];
  } catch (err) {
    if (err.response?.status === 404) return [];
    throw err;
  }
};

// Admin approve & reject endpoints
export const approvePermohonanSK = async (id, {
  hasUploadedFinalProposal,
  hasTakenLanguageTest,
  expDate,
  adminId,
  sktaFile,
}) => {
  const formData = new FormData();
  formData.append("hasUploadedFinalProposal", String(hasUploadedFinalProposal));
  formData.append("hasTakenLanguageTest", String(hasTakenLanguageTest));
  if (expDate) formData.append("expDate", expDate);
  formData.append("adminId", String(adminId));
  if (sktaFile) formData.append("skta", sktaFile);

  const response = await api.put(`/api/permohonan-skta/${id}/approve`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const rejectPermohonanSK = async (id, {
  message,
  adminId,
}) => {
  const response = await api.put(`/api/permohonan-skta/${id}/reject`, {
    message,
    adminId,
  });
  return response.data;
};

// Compatibility shim for legacy file upload
export const createOrUpdateSktaResponse = async (payload) => {
  // If payload is FormData, extract the fields and call the correct endpoint
  if (payload instanceof FormData) {
    const id = payload.get("id") || payload.get("sktaRequestId");
    const adminId = payload.get("adminId") || payload.get("academicStaffId");
    const message = payload.get("message");
    const sktaFile = payload.get("sktaFile") || payload.get("skta");

    if (message) {
      // It's a rejection
      return rejectPermohonanSK(id, { message, adminId });
    } else {
      // It's an approval
      return approvePermohonanSK(id, {
        hasUploadedFinalProposal: payload.get("hasUploadedFinalProposal") === "true",
        hasTakenLanguageTest: payload.get("hasTakenLanguageTest") === "true",
        expDate: payload.get("expDate"),
        adminId,
        sktaFile,
      });
    }
  }

  const { id, adminId, academicStaffId, message, ...data } = payload;
  const targetAdminId = adminId || academicStaffId;
  const targetId = id || payload.sktaRequestId;

  if (message) {
    return rejectPermohonanSK(targetId, { message, adminId: targetAdminId });
  } else {
    return approvePermohonanSK(targetId, { ...data, adminId: targetAdminId });
  }
};

// Download Evidence Mahasiswa
export const downloadEvidence = async (permohonanId) => {
  const response = await api.get(
    `/api/permohonan-skta/${permohonanId}/download/evidence`,
    { responseType: 'blob' }
  );
  return response.data;
};

// Get Evidence Uploads by Student ID
export const getEvidenceUploadsByMahasiswaId = async (mahasiswaId) => {
  try {
    const response = await api.get(`/api/permohonan-skta/mahasiswa/${mahasiswaId}`);
    const data = response.data?.data ?? response.data;
    if (!data || !data.evidenceUploadPath) return [];

    const filename = data.evidenceUploadPath.split(/[/\\]/).pop();

    return [
      {
        id: data.id,
        name: `Evidence_${data.mahasiswa?.nim || 'SKTA'}_${data.mahasiswa?.name || 'Mhs'}`,
        filename,
        path: data.evidenceUploadPath,
        mahasiswaId: data.mahasiswaId,
        downloadUrl: data.evidenceDownloadUrl,
      }
    ];
  } catch (err) {
    if (err.response?.status === 404) return [];
    throw err;
  }
};

// Download SK
export const downloadSK = async (permohonanId) => {
  const response = await api.get(
    `/api/permohonan-skta/${permohonanId}/download/skta`,
    { responseType: "blob" },
  );
  return response.data;
};


//  DOKUMEN VALIDASI SKTA 
/**
 * POST /api/dokumen-validasi-skta
 * Upload PDF dokumen validasi yang di-generate FE
 * BE simpan file → return downloadUrl untuk dijadikan QR
 */

export const uploadDokumenValidasi = async (mahasiswaId, pdfBlob, namaFile) => {
  const formData = new FormData();
  formData.append('mahasiswaId', String(mahasiswaId));
  formData.append('name',        namaFile || `Dokumen_Validasi_SKTA_${mahasiswaId}`);
  formData.append('category',    'Dokumen Validasi Skta');
  formData.append('berkas',      pdfBlob, `validasi-skta-${mahasiswaId}.pdf`);

  const response = await api.post(
    '/api/berkas-mahasiswa',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );

  return response.data?.data ?? response.data;
};

export const generateDokumenValidasiSkta = async (permohonanId) => {
  const response = await api.get(`/api/permohonan-skta/${permohonanId}/generate/dokumen-validasi-skta`);
  return response.data?.data ?? response.data;
};

// ------------------------------------------- SIDANG STUDENT -------------------------------------------
export const getSidangRegistrationByMahasiswaId = async (mahasiswaId) => {
  try {
    const response = await api.get(
      `/api/sidang-registrations/student/${mahasiswaId}`,
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

// buat di verifikasi modal, get by ID
export const getSidangRegistrationById = async (id) => {
  const response = await api.get(`/api/sidang-registrations/${id}`);
  return response.data?.data ?? response.data;
};


// GET /api/sidang-registrations/{id}/uploads
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
  const response = await api.get(
    `/api/sidang-registrations/uploads/${uploadId}/download`,
    { responseType: 'blob' }
  );
  return response.data;
};

export const approveSidangRegistration = async (id, { adminId, academicStaffId, sidangPeriodId }) => {
  const finalAdminId = adminId || academicStaffId;
  const response = await api.put(`/api/sidang-registrations/${id}/approve`, {
    adminId: finalAdminId,
    sidangPeriodId,
  });
  return response.data?.data ?? response.data;
};

export const rejectSidangRegistration = async (id, { adminId, academicStaffId, message, isEdit }) => {
  const finalAdminId = adminId || academicStaffId;
  const response = await api.put(`/api/sidang-registrations/${id}/reject`, {
    adminId: finalAdminId,
    message,
    isEdit,
  });
  return response.data?.data ?? response.data;
};



// ------------------------------------------- ETC -------------------------------------------
export const getLecturers = async () =>
  api.get("/api/dosen").then((r) => r.data?.data ?? r.data);
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
  const now    = new Date();
  const start  = new Date(`${startDate}T12:00:00`);
  const end    = new Date(`${endDate}T12:00:00`);
  const isOpen = now >= start && now <= end;
 
  const response = await api.post("/api/sidang-periods", {
    name,
    startDate, 
    endDate,   
    isOpen,
  });
  return response.data?.data ?? response.data;
};
 
export const updateSidangPeriod = async (id, { name, startDate, endDate }) => {
  const now    = new Date();
  const start  = new Date(`${startDate}T12:00:00`);
  const end    = new Date(`${endDate}T12:00:00`);
  const isOpen = now >= start && now <= end;
 
  const response = await api.put(`/api/sidang-periods/${id}`, {
    name,
    startDate, 
    endDate,   
    isOpen,
  });
  return response.data?.data ?? response.data;
};
 

export const createYudisiumPeriod = async ({ name, startDate, endDate }) => {
  const now    = new Date();
  const start  = new Date(`${startDate}T12:00:00`);
  const end    = new Date(`${endDate}T12:00:00`);
  const isOpen = now >= start && now <= end;
 
  const response = await api.post("/api/yudisium-periods", {
    name,
    startDate, 
    endDate,   
    isOpen,
  });
  return response.data?.data ?? response.data;
};
 
export const updateYudisiumPeriod = async (id, { name, startDate, endDate }) => {
  const now    = new Date();
  const start  = new Date(`${startDate}T12:00:00`);
  const end    = new Date(`${endDate}T12:00:00`);
  const isOpen = now >= start && now <= end;
 
  const response = await api.put(`/api/yudisium-periods/${id}`, {
    name,
    startDate, 
    endDate,   
    isOpen,
  });
  return response.data?.data ?? response.data;
};

// ------------------------------------------- TEMPLATE -------------------------------------------
export const getTemplate = async (code) => {
  const response = await api.get(`/api/templates/${code}`);
  return response.data?.data ?? response.data;
};

// Buat preview filenya, soalnya yg api swagger itu dia langsung ke download ak maunya ada preview
// export const getTemplateBlob = async (code) => {
//   const response = await api.get(`/api/templates/${code}`, {
//     responseType: 'blob',
//   });
//   return response.data; 
// };

export const downloadTemplate = async (code) => {
  const meta = await getTemplate(code);
  const downloadUrl = meta?.downloadUrl || meta?.url;
  if (!downloadUrl) throw new Error('Download URL tidak ditemukan dalam response.');

  // Fetch blob via axios agar Bearer token ikut
  const response = await api.get(downloadUrl, { responseType: 'blob' });
  return {
    blob: response.data,
    name: meta?.name || (meta?.filepath ? meta.filepath.split(/[/\\]/).pop() : null) || `template-${code}`,
  };
};

export const approveYudisiumRegistration = async (id, { adminId, academicStaffId, yudisiumPeriodId, yudisiumRegistrationUploadIds }) => {
  const finalAdminId = adminId || academicStaffId;
  const response = await api.put(`/api/yudisium-registrations/${id}/approve`, {
    adminId: finalAdminId,
    yudisiumPeriodId,
    yudisiumRegistrationUploadIds,
  });
  return response.data?.data ?? response.data;
};

export const rejectYudisiumRegistration = async (id, { adminId, academicStaffId, message, isEdit, yudisiumRegistrationUploadIds }) => {
  const finalAdminId = adminId || academicStaffId;
  const response = await api.put(`/api/yudisium-registrations/${id}/reject`, {
    adminId: finalAdminId,
    message,
    isEdit,
    yudisiumRegistrationUploadIds,
  });
  return response.data?.data ?? response.data;
};

export default api;