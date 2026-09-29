import React, { createContext, useContext, useState } from "react";
import {
  getStudentData,
  getLecturers,
  getFaculties,
  getStudyPrograms,
} from "../service/api";

const StudentContext = createContext(undefined);

export const StudentProvider = ({ children }) => {
  const [student, setStudent] = useState(() => {
    const savedData = localStorage.getItem("student_data");
    if (savedData) {
      try {
        return JSON.parse(savedData);
      } catch (e) {
        console.error("Gagal parse student_data dari localStorage:", e);
        localStorage.removeItem("student_data");
      }
    }
    return null;
  });

  const [isComplete, setIsComplete] = useState(() => {
    const savedData = localStorage.getItem("student_data");
    if (savedData) {
      try {
        JSON.parse(savedData);
        return true;
      } catch {
        // Handled in student initialization
      }
    }
    return false;
  });

  const [isStudentLoading, setIsStudentLoading] = useState(false);
  const [sktaRequestId, setSktaRequestId] = useState(null); 

  const updateStudent = (data) => {
    setStudent(data);
    setIsComplete(true);
    localStorage.setItem("student_data", JSON.stringify(data));
  };

  const updateSktaRequestId = (id) => {
    setSktaRequestId(id);
  };

  // Fetch data student dari server
  const fetchAndLoadStudent = async (userId) => {
    setIsStudentLoading(true); 
    try {
      // 1. FETCH DATA UTAMA (MAHASISWA) TERLEBIH DAHULU
      const studentResponse = await getStudentData(userId);
      const studentData = studentResponse?.data ?? studentResponse;

      // Jika data mahasiswa benar-benar kosong atau tidak valid, baru kita batalkan
      if (!studentData || (!studentData.nim && !studentData.id)) {
        setIsStudentLoading(false);
        return false;
      }

      // 2. FETCH DATA PENDUKUNG DENGAN AMAN (TIDAK MEMBATALKAN PROSES JIKA GAGAL)
      let rawLecturers = [];
      let rawStudyPrograms = [];
      let rawFaculties = [];

      try {
        const resLecturers = await getLecturers().catch(() => []);
        rawLecturers = Array.isArray(resLecturers) ? resLecturers : [];
        
        const resProdi = await getStudyPrograms().catch(() => []);
        rawStudyPrograms = Array.isArray(resProdi) ? resProdi : [];
        
        const resFaculties = await getFaculties().catch(() => []);
        rawFaculties = Array.isArray(resFaculties) ? resFaculties : [];
      } catch (e) {
        console.warn("Ada data referensi yang gagal dimuat, dilanjutkan dengan data dasar.");
      }

      // 3. LAKUKAN MAPPING DATA (Gunakan fallbacks jika data referensi kosong)
      const matchedProdi = rawStudyPrograms.find(
        (p) => String(p.id) === String(studentData.studyProgramId)
      );
      const matchedFakultas = rawFaculties.find(
        (f) => String(f.id) === String(matchedProdi?.facultyId ?? matchedProdi?.faculty_id)
      );
      const matchedDosen = rawLecturers.find(
        (d) => String(d.id) === String(studentData.dosenWaliId)
      );

      const mapped = {
        mahasiswaId: studentData.id ?? null,
        namaLengkap: studentData.name ?? "",
        nim: studentData.nim ?? "",
        kelas: studentData.kelasAsal ?? studentData.className ?? "",
        angkatan: String(studentData.tahunAngkatan ?? studentData.year ?? ""),
        studyProgramId: String(studentData.studyProgramId ?? ""),
        studyProgramNama: matchedProdi?.name ?? "",
        fakultasId: String(
          matchedFakultas?.id ?? matchedProdi?.facultyId ?? ""
        ),
        fakultasNama: matchedFakultas?.name ?? "",
        dosenWaliId: String(studentData.dosenWaliId ?? ""),
        dosenWaliKode: matchedDosen?.kodeDosen ?? matchedDosen?.lecturerCode ?? matchedDosen?.kode ?? "",
        dosenWaliNama: matchedDosen?.user?.name ?? matchedDosen?.name ?? matchedDosen?.nama ?? "",
        dosenWaliNip: matchedDosen?.nip ?? "",
      };

      // 4. SIMPAN KE CONTEXT & LOCAL STORAGE
      updateStudent(mapped);
      setIsStudentLoading(false); 
      return true;
    } catch (err) {
      if (err.response?.status === 404) {
        console.info("Data student belum ada di server (404), arahkan ke lengkapi-data");
      } else {
        console.error("Gagal fetch data student dari server:", err);
      }
      setIsStudentLoading(false); 
      return false;
    }
  };

  const logoutStudentData = () => {
    setStudent(null);
    setIsComplete(false);
    setIsStudentLoading(false);
    setSktaRequestId(null);
    localStorage.removeItem("student_data");
  };

  return (
    <StudentContext.Provider
      value={{
        student,
        isComplete,
        isStudentLoading,
        sktaRequestId,
        updateStudent,
        updateSktaRequestId,
        fetchAndLoadStudent,
        logoutStudentData,
      }}
    >
      {children}
    </StudentContext.Provider>
  );
};

export const useStudent = () => {
  const context = useContext(StudentContext);
  if (context === undefined) {
    throw new Error("useStudent must be used within a StudentProvider");
  }
  return context;
};