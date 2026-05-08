import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStudentData, getLecturers, getFaculties, getStudyPrograms } from '../service/api';

const StudentContext = createContext(undefined);

export const StudentProvider = ({ children }) => {
  const [student, setStudent]       = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isStudentLoading, setIsStudentLoading] = useState(true);

  useEffect(() => {
    const savedData = localStorage.getItem('student_data');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setStudent(parsed);
        setIsComplete(true);
      } catch (e) {
        console.error('Gagal parse student_data dari localStorage:', e);
        localStorage.removeItem('student_data');
      }
    }
    setIsStudentLoading(false);
  }, []);

  const updateStudent = (data) => {
    setStudent(data);
    setIsComplete(true);
    localStorage.setItem('student_data', JSON.stringify(data));
  };

  const fetchAndLoadStudent = async (userId) => {
    try {
      const [studentData, rawLecturers, rawStudyPrograms, rawFaculties] = await Promise.all([
        getStudentData(userId),
        getLecturers(),
        getStudyPrograms(),
        getFaculties(),
      ]);

      if (!studentData?.nim) return false;

      const matchedProdi = rawStudyPrograms.find(
        (p) => p.id === Number(studentData.studyProgramId)
      );
      const matchedFakultas = rawFaculties.find(
        (f) => f.id === Number(matchedProdi?.facultyId ?? matchedProdi?.faculty_id)
      );
      const matchedDosen = rawLecturers.find(
        (d) => d.id === Number(studentData.dosenWaliId)
      );

      const mapped = {
        studentId:        studentData.id                                  ?? null,

        namaLengkap:      studentData.name                                ?? '',
        nim:              studentData.nim                                  ?? '',
        kelas:            studentData.className                            ?? '',
        angkatan:         String(studentData.year                         ?? ''),

        studyProgramId:   String(studentData.studyProgramId               ?? ''),
        studyProgramNama: matchedProdi?.name                              ?? '',
        fakultasId:       String(matchedFakultas?.id                      ??
                                 matchedProdi?.facultyId                  ?? ''),
        fakultasNama:     matchedFakultas?.name                           ?? '',

        dosenWaliId:      String(studentData.dosenWaliId                  ?? ''),
        dosenWaliKode:    matchedDosen?.lecturerCode ?? matchedDosen?.kode ?? '',
        dosenWaliNama:    matchedDosen?.name         ?? matchedDosen?.nama ?? '',
        dosenWaliNip:     matchedDosen?.nip                               ?? '',
      };

      updateStudent(mapped);
      return true;

    } catch (err) {
      if (err.response?.status === 404) {
        console.info('Data student belum ada di server (404), arahkan ke lengkapi-data');
      } else {
        console.error('Gagal fetch data student dari server:', err);
      }
      return false;
    }
  };

  const logoutStudentData = () => {
    setStudent(null);
    setIsComplete(false);
    setIsStudentLoading(false); 
    localStorage.removeItem('student_data');
  };

  return (
    <StudentContext.Provider value={{
      student,
      isComplete,
      isStudentLoading,
      updateStudent,
      fetchAndLoadStudent,
      logoutStudentData,
    }}>
      {children}
    </StudentContext.Provider>
  );
};

export const useStudent = () => {
  const context = useContext(StudentContext);
  if (context === undefined) {
    throw new Error('useStudent must be used within a StudentProvider');
  }
  return context;
};