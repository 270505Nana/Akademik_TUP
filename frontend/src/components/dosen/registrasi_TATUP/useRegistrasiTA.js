// ============================================================
// useRegistrasiTA.js
// Custom hook untuk mengambil data registrasi sidang, fakultas, dan
// program studi dari API BE, lengkap dengan state loading dan error.
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { getFaculties, getStudyPrograms, getAllSidangRegistrations } from '../../../service/api';
import { normalizeRegistration, isEmptyDraft } from './registrasiTAHelpers';

/**
 * useRegistrasiTA
 * Mengambil:
 * - Semua registrasi sidang (tanpa paginasi, untuk filter & diagram di FE)
 * - Daftar fakultas (label diagram dan pemetaan nama)
 * - Daftar program studi (dropdown filter prodi)
 *
 * @returns {Object} {
 *   registrations,        // Data registrasi yang sudah dinormalisasi
 *   faculties,            // Array fakultas {id, name, code, ...}
 *   studyPrograms,        // Array prodi {id, name, facultyId, ...}
 *   isLoadingData,        // Loading registrasi (tabel & diagram)
 *   isLoadingProdi,       // Loading master data (dropdown prodi)
 *   errorData,            // Pesan error registrasi (string | null)
 *   errorProdi,           // Pesan error master data (string | null)
 *   refetchRegistrations, // Ambil ulang data registrasi
 * }
 */
const useRegistrasiTA = () => {
  const [registrations, setRegistrations] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [studyPrograms, setStudyPrograms] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingProdi, setIsLoadingProdi] = useState(true);
  const [errorData, setErrorData] = useState(null);
  const [errorProdi, setErrorProdi] = useState(null);

  // Mencegah update state setelah komponen di-unmount
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ----------------------------------------------------------------
  // Master data (fakultas & prodi): diambil sekali saat mount
  // ----------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    const fetchMasterData = async () => {
      setIsLoadingProdi(true);
      setErrorProdi(null);

      try {
        const [facList, prodiList] = await Promise.all([
          getFaculties(),
          getStudyPrograms(),
        ]);

        if (cancelled) return;

        setFaculties(Array.isArray(facList) ? facList : []);
        setStudyPrograms(Array.isArray(prodiList) ? prodiList : []);
      } catch {
        if (cancelled) return;
        setStudyPrograms([]);
        setErrorProdi('Gagal memuat program studi. Silakan muat ulang halaman.');
      } finally {
        if (!cancelled) setIsLoadingProdi(false);
      }
    };

    fetchMasterData();

    return () => {
      cancelled = true;
    };
  }, []);

  // ----------------------------------------------------------------
  // Registrasi sidang: ambil semua data, buang draft kosong, lalu
  // normalisasi ke bentuk yang dipakai FE.
  // ----------------------------------------------------------------
  const fetchRegistrations = useCallback(async (currentFaculties) => {
    setIsLoadingData(true);
    setErrorData(null);

    try {
      const response = await getAllSidangRegistrations({ limit: 'all', pagination: 'false' });

      if (!mountedRef.current) return;

      // Response bisa berupa array langsung atau { data, pagination }
      const rawList = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : [];

      // Draft kosong (dibuat otomatis saat form dibuka) tidak ditampilkan.
      // Draft terisi dan registrasi yang sudah dikirim tetap dipertahankan.
      const validList = rawList.filter((item) => !isEmptyDraft(item));

      const facultyMap = new Map(currentFaculties.map((f) => [f.id, f]));

      const normalized = validList
        .map((item) => normalizeRegistration(item, facultyMap))
        .filter(Boolean);

      setRegistrations(normalized);
    } catch {
      if (!mountedRef.current) return;
      setErrorData('Gagal memuat data registrasi. Silakan coba lagi.');
      setRegistrations([]);
    } finally {
      if (mountedRef.current) setIsLoadingData(false);
    }
  }, []);

  // Ambil registrasi setelah master data selesai dimuat, agar normalisasi
  // punya data fakultas. Sengaja hanya bergantung pada isLoadingProdi
  // supaya tidak terjadi pengambilan data berulang.
  useEffect(() => {
    if (isLoadingProdi) return;
    fetchRegistrations(faculties);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingProdi]);

  // Dipakai tombol "Coba Lagi"
  const refetchRegistrations = useCallback(() => {
    fetchRegistrations(faculties);
  }, [faculties, fetchRegistrations]);

  return {
    registrations,
    faculties,
    studyPrograms,
    isLoadingData,
    isLoadingProdi,
    errorData,
    errorProdi,
    refetchRegistrations,
  };
};

export default useRegistrasiTA;