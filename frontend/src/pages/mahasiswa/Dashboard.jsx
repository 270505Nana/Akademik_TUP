import React, { useState } from 'react';
import { 
  Menu, Bell, User, Calendar, FileText, CheckCircle, 
  ChevronRight, ChevronLeft, Clock, GraduationCap,
  SquarePen, CalendarCheck, Users, Printer
} from 'lucide-react';
import SidebarMahasiswa from '../../components/sidebar/SidebarMahasiswa';
import '../dashboard.css';
import illustration from "../../assets/karakter-dashboard.png";

const CardAtas4 = ({ icon, label, value, sub, badge }) => (
  <div className="CardAtas4">
    <div className="CardAtas4-header">
      <div className="CardAtas4-icon">{icon}</div>
      {badge && <span className="CardAtas4-badge">{badge}</span>}
    </div>
    <div className="CardAtas4-label">{label}</div>
    <div className="CardAtas4-value" dangerouslySetInnerHTML={{ __html: value }} />
    <div className="CardAtas4-divider"></div>
    <div className="CardAtas4-sub" dangerouslySetInnerHTML={{ __html: sub }} />
  </div>
);

const DashboardMahasiswa = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <SidebarMahasiswa isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div id="main-content" className="flex-1 min-w-0">
        <header className="topbar">
          <button className="topbar-toggle" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="topbar-brand">Beranda</div>
        </header>

        <main className="page-body overflow-x-hidden">

          {/* Banner Welcome - Responsive Fix */}
          <div className="section-card" style={{ padding: 0 }}>
            <div className="flex flex-col xl:flex-row items-center xl:items-start">
              <div className="w-full xl:w-[240px] flex items-center justify-center p-6 bg-[#FAFBFD] border-b xl:border-b-0 xl:border-r border-gray-100 shrink-0">
                <div style={{ width: '120px', height: '120px' }} className="flex items-center justify-center">
                   <img 
                    src={illustration} 
                    alt="Char" 
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                    referrerPolicy="no-referrer" 
                    onError={(e) => { e.target.src = "https://picsum.photos/seed/simta/200/200"; }}
                   />
                </div>
              </div>

              <div className="p-6 md:p-8 flex-1">
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary)', margin: '0 0 12px' }}>Selamat Datang di SIMTA</h2>
                <div style={{ width: '40px', height: '4px', background: 'var(--primary)', marginBottom: '16px', borderRadius: '10px' }}></div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '12px' }}>
                  SIMTA (Sistem Informasi Manajemen Tugas Akhir) adalah platform utama bagi mahasiswa untuk mengelola seluruh rangkaian tugas akhir secara digital dan terintegrasi.
                </p>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                  Pantau progres akademik kamu secara real-time dan ikuti urutan alur administrasi menuju sidang akhir Universitas Telkom Purwokerto.
                </p>
              </div>
            </div>
          </div>

          {/* Greeting Card - RATA KIRI FIX */}
          <div className="welcome-card" style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <h5 className="flex items-center gap-2" style={{ width: '100%' }}>
              Halo Prajna Paramitha! 👋
            </h5>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5', maxWidth: '800px', width: '100%' }}>
              Semangat pengerjaan Tugas Akhirnya! Pastikan semua berkas persyaratanmu sudah lengkap dan tervalidasi sebelum 
              <span style={{ fontWeight: 800, color: 'var(--primary)', margin: '0 4px' }}>20 Mei 2026</span> agar kamu bisa mengikuti jadwal sidang gelombang pertama.
            </p>
            <button className="btn-verif" style={{ padding: '8px 24px', width: 'auto', alignSelf: 'flex-start' }}>
              Cek Persyaratan Sidang
            </button>
          </div>

          {/* Jadwal Periode */}
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '20px', borderLeft: '4px solid var(--primary)', paddingLeft: '12px' }}>
              Jadwal Periode Sidang Terkini
            </h4>
            
            <div className="stat-grid">
              <CardAtas4 
                icon={<Calendar size={24} />} 
                label="Periode Genap-Ganjil" 
                badge="Aktif"
                value="Pendaftaran Sidang<br/><span style='font-size: 13px; font-weight: 500; color: var(--text-muted)'>16 April - 20 Mei 2026</span>" 
                sub="Masa revisi 20 mei - 25 mei 2026" 
              />
              <CardAtas4 
                icon={<SquarePen size={24} />} 
                label="Periode Genap-Ganjil" 
                value="Pendaftaran Yudisium<br/><span style='font-size: 13px; font-weight: 500; color: var(--text-muted)'>16 April - 20 Mei 2026</span>" 
                sub="Masa revisi 20 mei - 25 mei 2026" 
              />
              <CardAtas4 
                icon={
                  <div style={{
                    width: 28, height: 28, background: 'var(--primary)', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 900, fontSize: 16
                  }}>L</div>
                } 
                label="Periode Genap-Ganjil" 
                value="Pelaksanaan Sidang<br/><span style='font-size: 13px; font-weight: 500; color: var(--text-muted)'>26 mei - 20 juni 2026</span>" 
                sub="Jadwal dapat berubah sewaktu-waktu"             
              />
            </div>
          </div>

          {/* Table Progres - SCROLL FIX */}
          <div className="section-card" style={{ padding: 0 }}>
            <div className="card-header-custom">
               <div className="title-block">
                  <h6>Progres Registrasi Kamu</h6>
                  <p>Lacak setiap tahapan administrasi tugas akhirmu secara real-time.</p>
               </div>
            </div>

            <div className="table-scroll-wrap" style={{ width: '100%', overflowX: 'auto' }}>
              <table className="simta-table" style={{ minWidth: '800px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '60px', textAlign: 'center' }}>No</th>
                    <th style={{ textAlign: 'left' }}>Tahap Pendaftaran</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th style={{ textAlign: 'center' }}>Keterangan</th>
                    <th style={{ textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ textAlign: 'center' }}>1</td>
                    <td style={{ textAlign: 'left' }}>
                      <div className="flex flex-col">
                        <span className="fw-semibold">Pengajuan SK</span>
                        <span className="text-xs text-muted">10 April 2026</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}><span className="badge-status selesai">Selesai</span></td>
                    <td style={{ textAlign: 'center' }}><span className="badge-status terverifikasi">Terverifikasi</span></td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="flex items-center justify-center gap-2">
                        <button className="btn-detail" style={{ fontSize: '11px', padding: '6px 12px' }}>Detail</button>
                        <button className="btn-verif" style={{ fontSize: '11px', padding: '6px 12px' }}>Unduh SK</button>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: 'center' }}>2</td>
                    <td style={{ textAlign: 'left' }}>
                      <div className="flex flex-col">
                        <span className="fw-semibold">Pendaftaran Sidang</span>
                        <span className="text-xs text-muted">10 Sep 2025</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}><span className="badge-status proses-verifikasi">Proses Verifikasi</span></td>
                    <td style={{ textAlign: 'center' }}><span className="badge-status lengkap">Lengkap</span></td>
                    <td style={{ textAlign: 'center' }}><button className="btn-detail" style={{ fontSize: '11px', padding: '6px 12px' }}>Respon</button></td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: 'center' }}>3</td>
                    <td style={{ textAlign: 'left' }}>
                      <div className="flex flex-col">
                        <span className="fw-semibold">Pendaftaran Yudisium</span>
                        <span className="text-xs text-muted">Belum diajukan</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}><span className="badge-status on-progress">On Progress</span></td>
                    <td style={{ textAlign: 'center' }}><span className="badge-status on-progress">On Progress</span></td>
                    <td style={{ textAlign: 'center' }}>
                       <button className="btn-verif flex items-center gap-1" style={{ fontSize: '11px', padding: '6px 12px', margin: '0 auto' }}>
                         Lanjut <ChevronRight size={14} />
                       </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </main>
        
        <footer className="page-footer">
           Telkom University Purwokerto — Divisi Akademik dan Sistem Informasi
        </footer>
      </div>
    </div>
  );
};

export default DashboardMahasiswa;
