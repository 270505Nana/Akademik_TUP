import React, { useState, useEffect, useMemo } from 'react';
import {
  Menu, HelpCircle, Bell, Search, Filter, Download,
  FileText, ChevronDown, ChevronLeft, ChevronRight,
  X, Clock, AlertCircle, Calendar, ShieldCheck, Loader,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SidebarDosen from '../../components/sidebar/SidebarDosen';
import FooterDosen from '../../components/common/FooterDosen';
import { STATUS_SK } from '../../components/common/Skstatushelper';
import { getStudyPrograms } from '../../service/api';
import { generateDokumenValidasiBlob } from '../../components/admin/permohonanSK/Dokumenvalidasipdf';
import logoTelkom from '../../assets/logo-telkom.png';
import '../dashboard.css';

// Konfigurasi visual untuk status registrasi SK TA (mengikuti STATUS_SK sistem SIMTA)
const STATUS_REGISTRASI_CONFIG = {
  [STATUS_SK.SUDAH_TERBIT]: {
    label: 'SK Terbit',
    bg: '#DCFCE7',
    color: '#15803D',
    border: '#BBF7D0',
  },
  [STATUS_SK.BELUM_TERBIT]: {
    label: 'SK Belum Terbit',
    bg: '#FEE2E2',
    color: '#991B1B',
    border: '#FECACA',
  },
  [STATUS_SK.DALAM_PROSES]: {
    label: 'Dalam Proses',
    bg: '#DBEAFE',
    color: '#1E40AF',
    border: '#BFDBFE',
  },
  'mengirim-revisi': {
    label: 'Mengirim Revisi',
    bg: '#FEF3C7',
    color: '#92400E',
    border: '#FDE68A',
  },
  [STATUS_SK.EXPIRED]: {
    label: 'Kadaluarsa',
    bg: '#F3F4F6',
    color: '#4B5563',
    border: '#E5E7EB',
  },
};

// Mock data mahasiswa bimbingan Dosen (Dr. Purwono).
// Disiapkan dengan data yang cukup agar fitur pagination 10 item per halaman dapat diverifikasi dengan jelas.
const MOCK_MAHASISWA_BIMBINGAN = [
  {
    id: 1,
    name: 'Ahmad Fauzi',
    nim: '1301204001',
    avatar: null,
    avatarBg: '#FEE2E2',
    avatarColor: '#991B1B',
    initials: 'AF',
    studyProgramId: 1,
    studyProgram: 'S1 Informatika',
    thesisTitle: 'Implementasi Algoritma Deep Learning untuk Deteksi Dini Penyakit Tanaman Padi',
    thesisTitleEn: 'Implementation of Deep Learning Algorithm for Early Detection of Rice Plant Diseases',
    registrationStatus: STATUS_SK.SUDAH_TERBIT,
    skNumber: '042/SK-TA/FTI-IF/2024',
    skDate: '2024-09-10',
    expDate: '2025-03-10',
    dosenPembimbing1: 'Dr. Purwono, S.Kom., M.Kom.',
    dosenPembimbing2: 'Asep Saepuloh, M.T.',
    logs: [
      { id: 1, session: 'Sesi 1', date: '02 Oktober 2024', topic: 'Pengajuan Proposal & Rumusan Masalah', notes: 'Perbaiki latar belakang dan batasan masalah pada bab 1.', status: 'Disetujui', progress: '20%' },
      { id: 2, session: 'Sesi 2', date: '15 Oktober 2024', topic: 'Tinjauan Pustaka & Metodologi', notes: 'Metode dataset perlu ditambahkan referensi 5 tahun terakhir.', status: 'Disetujui', progress: '35%' },
      { id: 3, session: 'Sesi 3', date: '28 Oktober 2024', topic: 'Pengumpulan & Preprocessing Dataset', notes: 'Dataset augmentasi sudah baik. Lanjutkan ke tahap pelatihan model CNN.', status: 'Disetujui', progress: '50%' },
      { id: 4, session: 'Sesi 4', date: '10 November 2024', topic: 'Implementasi & Evaluasi Model', notes: 'Hasil akurasi 92%. Perjelas grafik loss dan confusion matrix di Bab 4.', status: 'Disetujui', progress: '75%' },
      { id: 5, session: 'Sesi 5', date: '25 November 2024', topic: 'Penyusunan Laporan Akhir & Draft Paper', notes: 'Draft bab 1-5 siap untuk diujikan. Lengkapi lampiran source code dan dokumentasi.', status: 'Selesai', progress: '100%' },
    ],
  },
  {
    id: 2,
    name: 'Dwi Lestari',
    nim: '1301204002',
    avatar: null,
    avatarBg: '#FEE2E2',
    avatarColor: '#991B1B',
    initials: 'DL',
    studyProgramId: 1,
    studyProgram: 'S1 Informatika',
    thesisTitle: 'Implementasi Algoritma Deep Learning untuk Deteksi Dini Penyakit Tanaman Padi',
    thesisTitleEn: 'Implementation of Deep Learning Algorithm for Early Detection of Rice Plant Diseases',
    registrationStatus: STATUS_SK.SUDAH_TERBIT,
    skNumber: '043/SK-TA/FTI-IF/2024',
    skDate: '2024-09-12',
    expDate: '2025-03-12',
    dosenPembimbing1: 'Dr. Purwono, S.Kom., M.Kom.',
    dosenPembimbing2: 'Nugroho Adi, M.Kom.',
    logs: [
      { id: 1, session: 'Sesi 1', date: '05 Oktober 2024', topic: 'Perumusan Masalah & Identifikasi Arsitektur Sistem', notes: 'Ruang lingkup sistem sudah jelas. Buat diagram use case dan activity diagram.', status: 'Disetujui', progress: '25%' },
      { id: 2, session: 'Sesi 2', date: '20 Oktober 2024', topic: 'Desain Basis Data & UI/UX', notes: 'Perbaiki relasi ERD pada tabel transaksi aset.', status: 'Disetujui', progress: '45%' },
      { id: 3, session: 'Sesi 3', date: '08 November 2024', topic: 'Implementasi Backend REST API & Autentikasi', notes: 'Integrasi JWT token sudah benar. Lanjutkan pembangunan modul frontend.', status: 'Disetujui', progress: '70%' },
      { id: 4, session: 'Sesi 4', date: '22 November 2024', topic: 'Pengujian Blackbox & UAT Sistem', notes: 'Dokumentasikan hasil testing ke dalam tabel hasil pengujian Bab 4.', status: 'Disetujui', progress: '85%' },
    ],
  },
  {
    id: 3,
    name: 'Nina Kirana',
    nim: '1301204256',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    avatarBg: null,
    avatarColor: null,
    initials: 'NK',
    studyProgramId: 1,
    studyProgram: 'S1 Informatika',
    thesisTitle: 'Implementasi Algoritma Deep Learning untuk Deteksi Dini Penyakit Tanaman Padi',
    thesisTitleEn: 'Implementation of Deep Learning Algorithm for Early Detection of Rice Plant Diseases',
    registrationStatus: STATUS_SK.BELUM_TERBIT,
    skNumber: null,
    skDate: null,
    expDate: null,
    dosenPembimbing1: 'Dr. Purwono, S.Kom., M.Kom.',
    dosenPembimbing2: 'Asep Saepuloh, M.T.',
    logs: [
      { id: 1, session: 'Sesi 1', date: '12 Oktober 2024', topic: 'Pengumpulan Korpus Data Twitter & Crawling', notes: 'Jumlah korpus minimal 2.000 data tweet berlabel.', status: 'Disetujui', progress: '20%' },
      { id: 2, session: 'Sesi 2', date: '29 Oktober 2024', topic: 'Text Preprocessing & Tokenisasi IndoBERT', notes: 'Pastikan proses stemming dan stopwords tidak menghilangkan sentimen negatif.', status: 'Disetujui', progress: '40%' },
    ],
  },
  {
    id: 4,
    name: 'Rizky Pratama',
    nim: '1301204100',
    avatar: null,
    avatarBg: '#DBEAFE',
    avatarColor: '#1E40AF',
    initials: 'RP',
    studyProgramId: 2,
    studyProgram: 'S1 Sistem Informasi',
    thesisTitle: 'Perancangan Enterprise Architecture Menggunakan TOGAF ADM Pada Instansi Pemerintahan',
    thesisTitleEn: 'Enterprise Architecture Design Using TOGAF ADM in Government Agencies',
    registrationStatus: STATUS_SK.DALAM_PROSES,
    skNumber: null,
    skDate: null,
    expDate: null,
    dosenPembimbing1: 'Dr. Purwono, S.Kom., M.Kom.',
    dosenPembimbing2: 'Rina Wijaya, M.Kom.',
    logs: [
      { id: 1, session: 'Sesi 1', date: '18 Oktober 2024', topic: 'Analisis Kondisi Baseline Arsitektur Bisnis', notes: 'Lakukan wawancara tambahan dengan divisi IT dinas terkait.', status: 'Disetujui', progress: '30%' },
    ],
  },
  {
    id: 5,
    name: 'Siti Nurhaliza',
    nim: '1301204105',
    avatar: null,
    avatarBg: '#FEF3C7',
    avatarColor: '#92400E',
    initials: 'SN',
    studyProgramId: 1,
    studyProgram: 'S1 Informatika',
    thesisTitle: 'Sistem Klasifikasi Citra Rontgen Paru-Paru Menggunakan Transfer Learning ResNet-50',
    thesisTitleEn: 'Chest X-Ray Image Classification System Using ResNet-50 Transfer Learning',
    registrationStatus: STATUS_SK.SUDAH_TERBIT,
    skNumber: '045/SK-TA/FTI-IF/2024',
    skDate: '2024-09-15',
    expDate: '2025-03-15',
    dosenPembimbing1: 'Dr. Purwono, S.Kom., M.Kom.',
    dosenPembimbing2: 'Asep Saepuloh, M.T.',
    logs: [
      { id: 1, session: 'Sesi 1', date: '04 Oktober 2024', topic: 'Studi Literatur & Persiapan Dataset Kaggle', notes: 'Pastikan dataset terdistribusi seimbang antara kelas normal dan pneumonia.', status: 'Disetujui', progress: '25%' },
      { id: 2, session: 'Sesi 2', date: '19 Oktober 2024', topic: 'Fine-tuning Model & Optimasi Hyperparameter', notes: 'Gunakan learning rate scheduler untuk stabilitas konvergensi.', status: 'Disetujui', progress: '60%' },
    ],
  },
  {
    id: 6,
    name: 'Budi Santoso',
    nim: '1301204112',
    avatar: null,
    avatarBg: '#E0E7FF',
    avatarColor: '#3730A3',
    initials: 'BS',
    studyProgramId: 3,
    studyProgram: 'S1 Rekayasa Perangkat Lunak',
    thesisTitle: 'Penerapan Microservices Architecture Pada Sistem E-Commerce Berbasis Event-Driven',
    thesisTitleEn: 'Implementation of Microservices Architecture on Event-Driven E-Commerce Systems',
    registrationStatus: STATUS_SK.SUDAH_TERBIT,
    skNumber: '046/SK-TA/FTI-RPL/2024',
    skDate: '2024-09-16',
    expDate: '2025-03-16',
    dosenPembimbing1: 'Dr. Purwono, S.Kom., M.Kom.',
    dosenPembimbing2: 'Nugroho Adi, M.Kom.',
    logs: [
      { id: 1, session: 'Sesi 1', date: '08 Oktober 2024', topic: 'Perancangan Service Boundary & Message Broker', notes: 'Gunakan RabbitMQ atau Apache Kafka untuk komunikasi asynchronous.', status: 'Disetujui', progress: '30%' },
      { id: 2, session: 'Sesi 2', date: '26 Oktober 2024', topic: 'Containerization & Orchestration Docker Kubernetes', notes: 'Lakukan benchmarking throughput request per second.', status: 'Disetujui', progress: '65%' },
    ],
  },
  {
    id: 7,
    name: 'Citra Dewi',
    nim: '1301204118',
    avatar: null,
    avatarBg: '#FCE7F3',
    avatarColor: '#9D174D',
    initials: 'CD',
    studyProgramId: 2,
    studyProgram: 'S1 Sistem Informasi',
    thesisTitle: 'Evaluasi Kesuksesan Penerapan ERP Menggunakan Model DeLone and McLean',
    thesisTitleEn: 'Evaluation of ERP Implementation Success Using the DeLone and McLean Model',
    registrationStatus: STATUS_SK.BELUM_TERBIT,
    skNumber: null,
    skDate: null,
    expDate: null,
    dosenPembimbing1: 'Dr. Purwono, S.Kom., M.Kom.',
    dosenPembimbing2: 'Rina Wijaya, M.Kom.',
    logs: [
      { id: 1, session: 'Sesi 1', date: '14 Oktober 2024', topic: 'Penyusunan Kuesioner & Uji Validitas Reliabilitas', notes: 'Pastikan indikator variabel mencakup kualitas sistem dan kualitas informasi.', status: 'Disetujui', progress: '25%' },
    ],
  },
  {
    id: 8,
    name: 'Fajar Nugraha',
    nim: '1301204125',
    avatar: null,
    avatarBg: '#DCFCE7',
    avatarColor: '#166534',
    initials: 'FN',
    studyProgramId: 1,
    studyProgram: 'S1 Informatika',
    thesisTitle: 'Deteksi Intrusi Jaringan Menggunakan Algoritma Random Forest dan XGBoost',
    thesisTitleEn: 'Network Intrusion Detection Using Random Forest and XGBoost Algorithms',
    registrationStatus: STATUS_SK.SUDAH_TERBIT,
    skNumber: '048/SK-TA/FTI-IF/2024',
    skDate: '2024-09-18',
    expDate: '2025-03-18',
    dosenPembimbing1: 'Dr. Purwono, S.Kom., M.Kom.',
    dosenPembimbing2: 'Asep Saepuloh, M.T.',
    logs: [
      { id: 1, session: 'Sesi 1', date: '06 Oktober 2024', topic: 'Eksplorasi Dataset NSL-KDD & Feature Selection', notes: 'Gunakan korelasi Pearson dan Recursive Feature Elimination.', status: 'Disetujui', progress: '30%' },
      { id: 2, session: 'Sesi 2', date: '24 Oktober 2024', topic: 'Pelatihan Model & Evaluasi Recall Penetrasi', notes: 'Tingkatkan deteksi pada serangan jenis U2R dan R2L.', status: 'Disetujui', progress: '70%' },
    ],
  },
  {
    id: 9,
    name: 'Gita Permata',
    nim: '1301204130',
    avatar: null,
    avatarBg: '#F3E8FF',
    avatarColor: '#6B21A8',
    initials: 'GP',
    studyProgramId: 4,
    studyProgram: 'S1 Teknik Telekomunikasi',
    thesisTitle: 'Optimasi Jaringan 5G Menggunakan Algoritma Machine Learning K-Means Clustering',
    thesisTitleEn: '5G Network Optimization Using K-Means Clustering Machine Learning Algorithm',
    registrationStatus: STATUS_SK.DALAM_PROSES,
    skNumber: null,
    skDate: null,
    expDate: null,
    dosenPembimbing1: 'Dr. Purwono, S.Kom., M.Kom.',
    dosenPembimbing2: 'Asep Saepuloh, M.T.',
    logs: [
      { id: 1, session: 'Sesi 1', date: '11 Oktober 2024', topic: 'Pengambilan Data Coverage & Quality Area Purwokerto', notes: 'Identifikasi titik-titik blankspot dan weak coverage.', status: 'Disetujui', progress: '20%' },
    ],
  },
  {
    id: 10,
    name: 'Hadi Prasetyo',
    nim: '1301204138',
    avatar: null,
    avatarBg: '#CCFBF1',
    avatarColor: '#115E59',
    initials: 'HP',
    studyProgramId: 1,
    studyProgram: 'S1 Informatika',
    thesisTitle: 'Sistem Rekomendasi Tempat Wisata Menggunakan Collaborative Filtering',
    thesisTitleEn: 'Tourist Destination Recommendation System Using Collaborative Filtering',
    registrationStatus: STATUS_SK.SUDAH_TERBIT,
    skNumber: '050/SK-TA/FTI-IF/2024',
    skDate: '2024-09-20',
    expDate: '2025-03-20',
    dosenPembimbing1: 'Dr. Purwono, S.Kom., M.Kom.',
    dosenPembimbing2: 'Nugroho Adi, M.Kom.',
    logs: [
      { id: 1, session: 'Sesi 1', date: '07 Oktober 2024', topic: 'Matrix Factorization & Cosine Similarity', notes: 'Bandingkan kinerja model dengan SVD (Singular Value Decomposition).', status: 'Disetujui', progress: '35%' },
      { id: 2, session: 'Sesi 2', date: '21 Oktober 2024', topic: 'Evaluasi RMSE dan MAE', notes: 'Hasil evaluasi menunjukkan performa memuaskan pada dataset pariwisata.', status: 'Disetujui', progress: '80%' },
    ],
  },
  {
    id: 11,
    name: 'Indah Kusuma',
    nim: '1301204144',
    avatar: null,
    avatarBg: '#FFE4E6',
    avatarColor: '#9F1239',
    initials: 'IK',
    studyProgramId: 2,
    studyProgram: 'S1 Sistem Informasi',
    thesisTitle: 'Perancangan UI/UX Aplikasi Mobile Layanan Kesehatan Menggunakan Design Thinking',
    thesisTitleEn: 'UI/UX Design of Healthcare Mobile Application Using Design Thinking Methodology',
    registrationStatus: STATUS_SK.SUDAH_TERBIT,
    skNumber: '051/SK-TA/FTI-SI/2024',
    skDate: '2024-09-22',
    expDate: '2025-03-22',
    dosenPembimbing1: 'Dr. Purwono, S.Kom., M.Kom.',
    dosenPembimbing2: 'Rina Wijaya, M.Kom.',
    logs: [
      { id: 1, session: 'Sesi 1', date: '10 Oktober 2024', topic: 'Tahap Empathize & Define Persona Pengguna', notes: 'Lakukan user interview pada kelompok lansia dan tenaga medis.', status: 'Disetujui', progress: '30%' },
      { id: 2, session: 'Sesi 2', date: '27 Oktober 2024', topic: 'Prototyping High-Fidelity & Usability Testing System (SUS)', notes: 'Skor SUS mencapai 82.5 (Grade A).', status: 'Selesai', progress: '100%' },
    ],
  },
  {
    id: 12,
    name: 'Joko Widodo',
    nim: '1301204150',
    avatar: null,
    avatarBg: '#FEF9C3',
    avatarColor: '#854D0E',
    initials: 'JW',
    studyProgramId: 3,
    studyProgram: 'S1 Rekayasa Perangkat Lunak',
    thesisTitle: 'Implementasi CI/CD Pipeline Menggunakan GitHub Actions dan SonarQube',
    thesisTitleEn: 'Implementation of CI/CD Pipeline Using GitHub Actions and SonarQube Code Analysis',
    registrationStatus: STATUS_SK.BELUM_TERBIT,
    skNumber: null,
    skDate: null,
    expDate: null,
    dosenPembimbing1: 'Dr. Purwono, S.Kom., M.Kom.',
    dosenPembimbing2: 'Nugroho Adi, M.Kom.',
    logs: [
      { id: 1, session: 'Sesi 1', date: '16 Oktober 2024', topic: 'Konfigurasi Automated Testing & Code Coverage', notes: 'Target code coverage minimal 80% sebelum merge ke branch main.', status: 'Disetujui', progress: '25%' },
    ],
  },
];

// Modal untuk melihat detail riwayat log bimbingan mahasiswa.
// Area daftar log dibuat scrollable (max-height) agar tetap nyaman jika log banyak.
const LogModal = ({ student, onClose }) => {
  if (!student) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 10 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: '#FFFFFF',
          borderRadius: 16,
          width: '100%',
          maxWidth: 680,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.2)',
          overflow: 'hidden',
        }}
      >
        {/* Header Modal */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #E9EDF5',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            background: '#FFFFFF',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#C0182A',
                  background: '#FFF0F1',
                  padding: '3px 8px',
                  borderRadius: 6,
                }}
              >
                Log Bimbingan Mahasiswa
              </span>
              <span style={{ fontSize: 12, color: '#6B7280' }}>• Total {student.logs?.length || 0} Pertemuan</span>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: 0 }}>
              {student.name}
            </h3>
            <p style={{ fontSize: 12, color: '#6B7280', margin: '2px 0 0' }}>
              NIM: {student.nim} &bull; {student.studyProgram}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#F3F4F6',
              border: 'none',
              cursor: 'pointer',
              color: '#6B7280',
              padding: 6,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#E5E7EB'; e.currentTarget.style.color = '#111827'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.color = '#6B7280'; }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Informasi Ringkas Tugas Akhir */}
        <div
          style={{
            padding: '14px 24px',
            background: '#F8FAFC',
            borderBottom: '1px solid #E9EDF5',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Judul Tugas Akhir
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', lineHeight: 1.45 }}>
            {student.thesisTitle}
          </span>
        </div>

        {/* Area Riwayat Bimbingan (Scrollable jika log banyak) */}
        <div
          style={{
            padding: '20px 24px',
            overflowY: 'auto',
            maxHeight: '440px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          {!student.logs || student.logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9CA3AF' }}>
              <Clock size={36} color="#CBD5E1" style={{ marginBottom: 8 }} />
              <div style={{ fontWeight: 600, fontSize: 14 }}>Belum Ada Catatan Bimbingan</div>
              <div style={{ fontSize: 12 }}>Mahasiswa ini belum mengisi log bimbingan.</div>
            </div>
          ) : (
            student.logs.map((log, idx) => (
              <div
                key={log.id || idx}
                style={{
                  border: '1px solid #E9EDF5',
                  borderRadius: 12,
                  padding: '16px 18px',
                  background: '#FFFFFF',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                  transition: 'border-color 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 800,
                        color: '#C0182A',
                        background: '#FFF0F1',
                        padding: '3px 10px',
                        borderRadius: 6,
                      }}
                    >
                      {log.session}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#64748B' }}>
                      <Calendar size={13} color="#94A3B8" />
                      {log.date}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: 9999,
                      background: log.status === 'Selesai' ? '#DCFCE7' : '#DBEAFE',
                      color: log.status === 'Selesai' ? '#15803D' : '#1D4ED8',
                      border: `1px solid ${log.status === 'Selesai' ? '#BBF7D0' : '#BFDBFE'}`,
                    }}
                  >
                    {log.status} ({log.progress})
                  </span>
                </div>

                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 2 }}>
                    Aktivitas / Topik Bahasan
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', lineHeight: 1.4 }}>
                    {log.topic}
                  </div>
                </div>

                <div
                  style={{
                    background: '#F8FAFC',
                    borderLeft: '3px solid #C0182A',
                    borderRadius: '0 8px 8px 0',
                    padding: '10px 12px',
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#C0182A', marginBottom: 2 }}>
                    Catatan Pembimbing:
                  </div>
                  <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
                    {log.notes || 'Tidak ada catatan khusus.'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Modal */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid #E9EDF5',
            background: '#F8FAFC',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onClose}
            className="btn-detail"
            style={{ padding: '8px 22px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}
          >
            Tutup
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// Modal preview dan download dokumen Surat Keputusan Tugas Akhir (SK TA).
// Menggunakan PDF viewer/iframe resmi seperti pada role Admin.
const SKTAModal = ({ student, onClose }) => {
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [errorPdf, setErrorPdf] = useState(null);

  const isTerbit = student?.registrationStatus === STATUS_SK.SUDAH_TERBIT;

  // Generate Dokumen Validasi PDF blob saat modal dibuka jika SK sudah terbit
  useEffect(() => {
    if (!student || !isTerbit) {
      setPdfBlobUrl(null);
      return;
    }

    let isMounted = true;
    setLoadingPdf(true);
    setErrorPdf(null);

    const generatePdf = async () => {
      try {
        const payloadData = {
          nim: student.nim || '-',
          namaMahasiswa: student.name || '-',
          programStudi: student.studyProgram || '-',
          judulTAId: student.thesisTitle || '-',
          judulTAEn: student.thesisTitleEn || student.thesisTitle || '-',
          dosenPembimbing1: student.dosenPembimbing1 || '-',
          dosenPembimbing2: student.dosenPembimbing2 || '-',
          tanggalBerlakuSK: student.skDate || new Date().toISOString(),
          tanggalBerakhirSK: student.expDate || null,
          statusAktif: 'AKTIF',
          logoUrl: logoTelkom,
        };

        const blob = await generateDokumenValidasiBlob(payloadData);
        if (isMounted) {
          const url = URL.createObjectURL(blob);
          setPdfBlobUrl(url);
        }
      } catch (err) {
        console.error('Gagal membuat preview PDF SK TA:', err);
        if (isMounted) {
          setErrorPdf('Gagal memuat dokumen PDF SK TA.');
        }
      } finally {
        if (isMounted) setLoadingPdf(false);
      }
    };

    generatePdf();

    return () => {
      isMounted = false;
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
  }, [student, isTerbit]);

  if (!student) return null;

  // Menyiapkan nama file PDF saat download sesuai format: SK TA_NAMA_MAHASISWA_NIM.pdf
  const handleDownload = () => {
    if (!pdfBlobUrl) return;

    // Sanitasi nama mahasiswa agar aman digunakan sebagai nama file
    const cleanName = (student.name || 'Mahasiswa').replace(/[/\\?%*:|"<>]/g, '').trim();
    const cleanNim = (student.nim || '').replace(/[/\\?%*:|"<>]/g, '').trim();
    const fileName = `SK TA_${cleanName}_${cleanNim}.pdf`;

    const a = document.createElement('a');
    a.href = pdfBlobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 10 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: '#FFFFFF',
          borderRadius: 16,
          width: '100%',
          maxWidth: 860,
          height: isTerbit ? '88vh' : 'auto',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.2)',
          overflow: 'hidden',
        }}
      >
        {/* Header Modal */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #E9EDF5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#FFFFFF',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                background: '#FFF0F1',
                color: '#C0182A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileText size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: 0 }}>
                Surat Keputusan Tugas Akhir
              </h3>
              <p style={{ fontSize: 12, color: '#6B7280', margin: '2px 0 0' }}>
                {student.name} &bull; NIM: {student.nim} &bull; {student.studyProgram}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#F3F4F6',
              border: 'none',
              cursor: 'pointer',
              color: '#6B7280',
              padding: 6,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Area Dokumen PDF Viewer */}
        <div style={{ flex: 1, minHeight: 0, background: '#525659', position: 'relative' }}>
          {isTerbit ? (
            loadingPdf ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#FFFFFF', gap: 10, background: '#1E293B' }}>
                <Loader size={32} color="#FFFFFF" style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>Memuat Dokumen SK TA...</span>
              </div>
            ) : errorPdf ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#FFFFFF', padding: 20, background: '#1E293B' }}>
                <AlertCircle size={36} color="#EF4444" style={{ marginBottom: 8 }} />
                <span style={{ fontSize: 14, fontWeight: 700 }}>{errorPdf}</span>
              </div>
            ) : pdfBlobUrl ? (
              <iframe
                src={pdfBlobUrl}
                title={`SK TA - ${student.name}`}
                width="100%"
                height="100%"
                style={{ border: 'none', display: 'block' }}
              />
            ) : null
          ) : (
            <div style={{ padding: '48px 24px', background: '#FFFFFF', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#FEE2E2', color: '#991B1B', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <AlertCircle size={28} />
              </div>
              <h4 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: '0 0 6px' }}>
                Dokumen SK TA belum tersedia
              </h4>
              <p style={{ fontSize: 13, color: '#6B7280', margin: 0, maxWidth: 440, marginInline: 'auto', lineHeight: 1.5 }}>
                Mahasiswa <strong>{student.name}</strong> belum memiliki SK Tugas Akhir yang diterbitkan oleh bagian Akademik.
              </p>
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid #E9EDF5',
            background: '#FFFFFF',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            className="btn-detail"
            style={{ padding: '8px 20px', borderRadius: 8, fontSize: 13 }}
          >
            Tutup
          </button>
          {isTerbit && pdfBlobUrl && (
            <button
              onClick={handleDownload}
              className="btn-verif"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '8px 22px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Download size={14} /> Unduh
            </button>
          )}
        </div>
      </motion.div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

// Halaman utama Mahasiswa Bimbingan untuk Role Dosen.
const MahasiswaBimbingan = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProdi, setSelectedProdi] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [logModalStudent, setLogModalStudent] = useState(null);
  const [skModalStudent, setSkModalStudent] = useState(null);
  const [studyPrograms, setStudyPrograms] = useState([]);

  // Jumlah data per halaman diatur menjadi 10
  const PAGE_SIZE = 10;

  // Mengambil data Program Studi resmi dari backend API
  useEffect(() => {
    getStudyPrograms()
      .then(data => {
        if (Array.isArray(data)) {
          setStudyPrograms(data);
        }
      })
      .catch(err => {
        console.error('Gagal mengambil daftar program studi dari backend:', err);
      });
  }, []);

  // Filter status registrasi SK yang digunakan sistem
  const STATUS_OPTIONS = [
    { value: '', label: 'All Statuses' },
    { value: STATUS_SK.SUDAH_TERBIT, label: 'SK Terbit' },
    { value: STATUS_SK.BELUM_TERBIT, label: 'SK Belum Terbit' },
    { value: STATUS_SK.DALAM_PROSES, label: 'Dalam Proses' },
    { value: 'mengirim-revisi', label: 'Mengirim Revisi' },
    { value: STATUS_SK.EXPIRED, label: 'Kadaluarsa' },
  ];

  // Mengatur filter mahasiswa berdasarkan Search (Nama/NIM), Program Studi (Major), dan Status Registrasi
  const filteredStudents = useMemo(() => {
    return MOCK_MAHASISWA_BIMBINGAN.filter(student => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        student.name.toLowerCase().includes(q) ||
        student.nim.toLowerCase().includes(q);

      // Filter Major: mencocokkan ID atau nama prodi
      const matchProdi =
        !selectedProdi ||
        String(student.studyProgramId) === String(selectedProdi) ||
        student.studyProgram.toLowerCase() === String(selectedProdi).toLowerCase();

      const matchStatus = !selectedStatus || student.registrationStatus === selectedStatus;
      return matchSearch && matchProdi && matchStatus;
    });
  }, [searchQuery, selectedProdi, selectedStatus]);

  // Menangani pagination data mahasiswa (10 per page)
  const totalEntries = filteredStudents.length;
  const totalPages = Math.ceil(totalEntries / PAGE_SIZE) || 1;
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalEntries);
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  // Unduh rekap data mahasiswa bimbingan ke format CSV
  const handleExportData = () => {
    const headers = ['No', 'NIM', 'Nama Mahasiswa', 'Program Studi', 'Judul Tugas Akhir', 'Status SK', 'Jumlah Log Bimbingan'];
    const rows = filteredStudents.map((s, idx) => [
      idx + 1,
      s.nim,
      `"${s.name}"`,
      `"${s.studyProgram}"`,
      `"${s.thesisTitle}"`,
      `"${STATUS_REGISTRASI_CONFIG[s.registrationStatus]?.label || s.registrationStatus}"`,
      s.logs?.length || 0,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Mahasiswa_Bimbingan_Dr_Purwono_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <SidebarDosen isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div id="main-content">
        {/* Top bar maroon dengan judul halaman */}
        <header className="topbar topbar-dosen">
          <button className="topbar-toggle topbar-toggle-dosen" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="topbar-brand topbar-brand-dosen">Mahasiswa Bimbingan</div>
          <div className="topbar-right">
            <button className="topbar-icon-btn" title="Bantuan" aria-label="Bantuan">
              <HelpCircle size={20} />
            </button>
            <button className="topbar-icon-btn" title="Notifikasi" aria-label="Notifikasi">
              <Bell size={20} />
            </button>
          </div>
        </header>

        <main className="page-body">
          {/* Header Content */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: 0, marginBottom: 6 }}>
                Progres Mahasiswa Bimbingan
              </h1>
              <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
                Pantau log bimbingan, progress pengerjaan, dan akses Dokumen Surat Keputusan Tugas Akhir.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                className="btn-detail"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 16px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  border: '1.5px solid #E2E8F0',
                  background: '#FFFFFF',
                  color: '#374151',
                }}
                onClick={() => {
                  setSelectedProdi('');
                  setSelectedStatus('');
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                title="Reset Filter"
              >
                <Filter size={14} />
                Filter
              </button>

              <button
                onClick={handleExportData}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 18px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  background: '#7F1D1D',
                  color: '#FFFFFF',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(127, 29, 29, 0.25)',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#6B1212'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#7F1D1D'; }}
              >
                <Download size={15} />
                Unduh Data
              </button>
            </div>
          </div>

          {/* Search & Filter Row */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E9EDF5',
              borderRadius: 12,
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
            }}
          >
            {/* Search Input */}
            <div style={{ position: 'relative', flex: 1, minWidth: 240, display: 'flex', alignItems: 'center' }}>
              <Search size={16} color="#9CA3AF" style={{ position: 'absolute', left: 12, pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Search by student name or ID..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  width: '100%',
                  paddingLeft: 38,
                  paddingRight: 14,
                  paddingTop: 9,
                  paddingBottom: 9,
                  border: '1.5px solid #E2E8F0',
                  borderRadius: 8,
                  fontSize: 13,
                  outline: 'none',
                  background: '#FFFFFF',
                  color: '#111827',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => { e.target.style.borderColor = '#C0182A'; }}
                onBlur={e => { e.target.style.borderColor = '#E2E8F0'; }}
              />
            </div>

            {/* Select Major (dari data Backend Study Programs) */}
            <div style={{ minWidth: 180 }}>
              <select
                value={selectedProdi}
                onChange={e => {
                  setSelectedProdi(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#374151',
                  background: '#FFFFFF',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="">All Majors</option>
                {studyPrograms.length > 0
                  ? studyPrograms.map(prodi => (
                      <option key={prodi.id} value={prodi.id}>
                        {prodi.name}
                      </option>
                    ))
                  : [
                      <option key="1" value="1">S1 Informatika</option>,
                      <option key="2" value="2">S1 Sistem Informasi</option>,
                      <option key="3" value="3">S1 Rekayasa Perangkat Lunak</option>,
                      <option key="4" value="4">S1 Teknik Telekomunikasi</option>,
                    ]}
              </select>
            </div>

            {/* Select Status */}
            <div style={{ minWidth: 160 }}>
              <select
                value={selectedStatus}
                onChange={e => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#374151',
                  background: '#FFFFFF',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E9EDF5',
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            }}
          >
            <div className="table-scroll-wrap" style={{ maxHeight: 'none' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ padding: '14px 18px', fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', width: 48, textAlign: 'center' }}>
                      #
                    </th>
                    <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>
                      STUDENT &amp; THESIS
                    </th>
                    <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', width: 160 }}>
                      PRODI
                    </th>
                    <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', width: 140, textAlign: 'center' }}>
                      STATUS
                    </th>
                    <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', width: 160, textAlign: 'center' }}>
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                          Tidak ada mahasiswa bimbingan ditemukan
                        </div>
                        <div style={{ fontSize: 13 }}>
                          Coba sesuaikan kata kunci pencarian atau filter yang Anda gunakan.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedStudents.map((student, idx) => {
                      const statusCfg = STATUS_REGISTRASI_CONFIG[student.registrationStatus] || STATUS_REGISTRASI_CONFIG[STATUS_SK.BELUM_TERBIT];
                      const rowNum = startIndex + idx + 1;

                      return (
                        <tr
                          key={student.id}
                          style={{
                            borderBottom: idx < paginatedStudents.length - 1 ? '1px solid #F1F5F9' : 'none',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#FBFCFE'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; }}
                        >
                          {/* Nomor */}
                          <td style={{ padding: '20px 18px', textAlign: 'center', fontSize: 13, color: '#64748B', fontWeight: 600, verticalAlign: 'top' }}>
                            {rowNum}
                          </td>

                          {/* Identitas Mahasiswa & Judul TA */}
                          <td style={{ padding: '20px', verticalAlign: 'top' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                              {student.avatar ? (
                                <img
                                  src={student.avatar}
                                  alt={student.name}
                                  style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    flexShrink: 0,
                                    border: '1.5px solid #E2E8F0',
                                  }}
                                />
                              ) : (
                                <div
                                  style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: '50%',
                                    background: student.avatarBg || '#FEE2E2',
                                    color: student.avatarColor || '#991B1B',
                                    fontWeight: 700,
                                    fontSize: 14,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                  }}
                                >
                                  {student.initials}
                                </div>
                              )}

                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', marginBottom: 1 }}>
                                  {student.name}
                                </div>
                                <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>
                                  {student.nim}
                                </div>

                                <div style={{ fontSize: 10, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
                                  THESIS TITLE
                                </div>
                                <div style={{ fontSize: 13, color: '#334155', fontWeight: 500, lineHeight: 1.45 }}>
                                  {student.thesisTitle}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Program Studi */}
                          <td style={{ padding: '20px', fontSize: 13, color: '#374151', fontWeight: 500, verticalAlign: 'top' }}>
                            {student.studyProgram}
                          </td>

                          {/* Status Registrasi SK */}
                          <td style={{ padding: '20px', textAlign: 'center', verticalAlign: 'top' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                fontSize: 11,
                                fontWeight: 700,
                                padding: '4px 12px',
                                borderRadius: 9999,
                                background: statusCfg.bg,
                                color: statusCfg.color,
                                border: `1.5px solid ${statusCfg.border}`,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {statusCfg.label}
                            </span>
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '20px', textAlign: 'center', verticalAlign: 'top' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, minWidth: 120 }}>
                              <button
                                onClick={() => setSkModalStudent(student)}
                                style={{
                                  padding: '7px 12px',
                                  borderRadius: 8,
                                  border: '1.5px solid #D1D5DB',
                                  background: '#FFFFFF',
                                  color: '#374151',
                                  fontSize: 12,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  whiteSpace: 'nowrap',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = '#C0182A'; e.currentTarget.style.color = '#C0182A'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.color = '#374151'; }}
                              >
                                Lihat SK TA
                              </button>

                              <button
                                onClick={() => setLogModalStudent(student)}
                                style={{
                                  padding: '7px 12px',
                                  borderRadius: 8,
                                  border: '1.5px solid #D1D5DB',
                                  background: '#FFFFFF',
                                  color: '#374151',
                                  fontSize: 12,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 5,
                                  transition: 'all 0.2s',
                                  whiteSpace: 'nowrap',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = '#C0182A'; e.currentTarget.style.color = '#C0182A'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.color = '#374151'; }}
                              >
                                <span>Lihat Log</span>
                                <ChevronDown size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer Dinamis */}
            <div
              style={{
                padding: '16px 20px',
                borderTop: '1px solid #E9EDF5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
                background: '#FFFFFF',
              }}
            >
              <div style={{ fontSize: 13, color: '#64748B' }}>
                Showing <strong style={{ color: '#111827' }}>{totalEntries > 0 ? startIndex + 1 : 0}</strong> to{' '}
                <strong style={{ color: '#111827' }}>{endIndex}</strong> of{' '}
                <strong style={{ color: '#111827' }}>{totalEntries}</strong> entries
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    border: '1px solid #E2E8F0',
                    background: '#FFFFFF',
                    color: currentPage === 1 ? '#CBD5E1' : '#374151',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNumber => {
                  const isActive = pageNumber === currentPage;
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        border: isActive ? 'none' : '1px solid transparent',
                        background: isActive ? '#7F1D1D' : 'transparent',
                        color: isActive ? '#FFFFFF' : '#64748B',
                        fontWeight: isActive ? 700 : 600,
                        fontSize: 13,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => {
                        if (!isActive) e.currentTarget.style.background = '#F1F5F9';
                      }}
                      onMouseLeave={e => {
                        if (!isActive) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {pageNumber}
                    </button>
                  );
                })}

                <button
                  disabled={currentPage === totalPages || totalEntries === 0}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    border: '1px solid #E2E8F0',
                    background: '#FFFFFF',
                    color: currentPage === totalPages || totalEntries === 0 ? '#CBD5E1' : '#374151',
                    cursor: currentPage === totalPages || totalEntries === 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}
                  title="Halaman Berikutnya"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* Footer Dosen konsisten */}
        <FooterDosen />
      </div>

      {/* Modal Riwayat Log Bimbingan */}
      <AnimatePresence>
        {logModalStudent && (
          <LogModal
            student={logModalStudent}
            onClose={() => setLogModalStudent(null)}
          />
        )}
      </AnimatePresence>

      {/* Modal Surat Keputusan Tugas Akhir (SK TA) */}
      <AnimatePresence>
        {skModalStudent && (
          <SKTAModal
            student={skModalStudent}
            onClose={() => setSkModalStudent(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default MahasiswaBimbingan;
