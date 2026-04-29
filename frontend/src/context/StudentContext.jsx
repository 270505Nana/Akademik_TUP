import React, { createContext, useContext, useState, useEffect } from 'react';
const StudentContext = createContext(undefined);

export const StudentProvider = ({ children }) => {
  const [student, setStudent] = useState(null);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const savedData = localStorage.getItem('student_data');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setStudent(parsedData);
        setIsComplete(true);
      } catch (e) {
        console.error("Gagal memuat data mahasiswa dari localStorage", e);
      }
    }
  }, []);

  const updateStudent = (data) => {
    setStudent(data);
    setIsComplete(true);
    localStorage.setItem('student_data', JSON.stringify(data));
  };

  const logoutStudentData = () => {
    setStudent(null);
    setIsComplete(false);
    localStorage.removeItem('student_data');
  };

  return (
    <StudentContext.Provider value={{ student, isComplete, updateStudent, logoutStudentData }}>
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
