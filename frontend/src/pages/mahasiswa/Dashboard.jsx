import React, { useState } from 'react';
import { 
  Menu, Bell, User, Calendar, FileText, CheckCircle, 
  ChevronRight, ChevronLeft, Clock, GraduationCap,
  SquarePen, CalendarCheck, Users, Printer
} from 'lucide-react';
import SidebarMahasiswa from '../../components/sidebar/SidebarMahasiswa';
import '../dashboard.css';
import illustration from "../../assets/karakter-dashboard.png";

const CardAtas4 = ({ icon, label, value, sub, badge, badgeColor }) => (
  <div className="CardAtas4">
    <div className="CardAtas4-header">
      <div className="CardAtas4-icon">{icon}</div>
      {badge && (
        <span className="CardAtas4-badge" style={badgeColor ? { background: badgeColor.bg, color: badgeColor.text } : {}}>
          {badge}
        </span>
      )}
    </div>
    <div className="CardAtas4-body">
      <div className="CardAtas4-label">{label}</div>
      <div className="CardAtas4-value" dangerouslySetInnerHTML={{ __html: value }} />
    </div>
    <div className="CardAtas4-footer">
      <div className="CardAtas4-divider"></div>
      <div className="CardAtas4-sub" dangerouslySetInnerHTML={{ __html: sub }} />
    </div>
  </div>
);

const DashboardMahasiswa = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const progressData = [
    {
      no: 1,
      tahap: 'Pengajuan SK',
      date: '10 Sep 2025',
      aksi: 'Tahap 1',
      keterangan: 'Dokumen Lengkap',
      status: 'Sudah Lengkap'
    },
    {
      no: 2,
      tahap: 'Pendaftaran Sidang',
      date: '10 Sep 2025',
      aksiRows: [
        { label: 'Tahap 1', keterangan: 'Dosen Pembimbing Belum di Approve oleh KK' },
        { label: 'Tahap 1', keterangan: 'Dosen Pembimbing Belum di Approve oleh KK', hasSK: true }
      ],
      status: 'Sudah Lengkap'
    }
  ];

  return (
    <div className="flex bg-[#F4F6FB] min-h-screen">
      <SidebarMahasiswa isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div id="main-content" className="flex-1">
        <header className="topbar">
          <button className="topbar-toggle" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>

          <div className="topbar-brand">Beranda</div>
        </header>

        <main className="page-body">

          <div className="section-card p-0 shadow-sm border-none overflow-hidden mb-6 bg-white">
            <div className="grid xl:grid-cols-12 gap-0">
            <div className="xl:col-span-4 bg-[#FAFBFD] p-4 flex items-center justify-center border-r border-gray-100" style={{ maxHeight: '280px', overflow: 'hidden' }}>

              {/* <div className="xl:col-span-4 bg-[#FAFBFD] p-8 flex items-center justify-center border-r border-gray-100"> */}
                
                <div className="relative w-full max-w-[240px]">
                   <DashboardIllustration />
                </div>
              </div>

              <div className="xl:col-span-8 p-8 md:p-10">
                <h2 className="text-2xl font-extrabold text-[#C0182A] mb-4">Selamat Datang di SIMTA</h2>
                <div className="w-16 h-1 bg-primary mb-6 rounded-full"></div>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  SIMTA (Sistem Informasi Manajemen Tugas Akhir) adalah platform utama bagi mahasiswa untuk mengelola seluruh rangkaian tugas akhir secara digital dan terintegrasi. Menu Status TA/PA Mahasiswa merupakan sub-menu dari kategori Daftar TA/PA yang berfungsi sebagai dasbor interaktif untuk memantau progres akademik kamu secara real-time.
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Melalui menu ini, kamu dapat melihat dan menyelesaikan tahapan pengambilan TA/PA secara sistematis, mulai dari pengajuan proposal dokumen, pemilihan dosen pembimbing, hingga memantau validasi Surat Keputusan (SK). Selain itu, SIMTA memfasilitasi proses pendaftaran sidang tahap 2, penjadwalan, hingga pemantauan nilai akhir berdasarkan bobot CLO program studi. Pastikan kamu mengikuti setiap urutan alur yang tersedia agar proses administrasi menuju sidang akhir dan pendaftaran yudisium berjalan lancar serta sesuai dengan standar akademik Universitas Telkom Purwokerto.
                </p>

              </div>
            </div>
          </div>

          <div className="section-card p-8 bg-white border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center mb-6">
            <div className="flex flex-col gap-2 max-w-2xl text-right ml-auto">
              <h3 className="text-xl font-bold text-gray-900 flex items-center justify-end gap-2">
                Halo Prajna Paramitha! <span className="animate-bounce">👋</span>
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-6">
                Semangat pengerjaan Tugas Akhirnya! Pastikan semua berkas persyaratanmu sudah lengkap dan tervalidasi sebelum 
                <span className="font-bold text-primary underline decoration-2 underline-offset-4"> 20 Mei 2026</span> agar kamu bisa mengikuti jadwal sidang gelombang pertama.
              </p>
              <div className="flex justify-end">
                <button className="btn-verif w-full md:w-fit bg-primary px-8 py-3 rounded-full text-white font-bold text-xs shadow-md">
                  Cek Persyaratan Sidang
                </button>
              </div>

            </div>
            <div className="hidden lg:block text-[#D66E79]/10 ml-8">
              <GraduationCap size={140} strokeWidth={1} />
            </div>
          </div>

          {/* Timeline pendaftaran */}
          {/* dummy data */}
          <div className="mb-6">
            <h4 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-6 border-l-4 border-primary pl-3">
              Jadwal Periode Sidang Terkini
            </h4>
            
            <div className="stat-grid">
              <CardAtas4 
                icon={<Calendar size={28} color="#C0182A" />} 
                label="Periode Genap-Ganjil" 
                badge="Aktif"
                badgeColor={{ bg: '#22C55E', text: '#fff' }}
                value="Pendaftaran Sidang<br/><span class='text-sm font-normal text-gray-500'>16 April - 20 Mei 2026</span>" 
                sub="Masa revisi 20 mei - 25 mei 2026" 
              />

              <CardAtas4 
                icon={<SquarePen size={28} color="#C0182A" />} 
                label="Periode Genap-Ganjil" 
                value="Pendaftaran Yudisium<br/><span class='text-sm font-normal text-gray-500'>16 April - 20 Mei 2026</span>" 
                sub="Masa revisi 20 mei - 25 mei 2026" 
              />

              <CardAtas4 
                icon={
                  <div style={{
                    width: 28, height: 28,
                    background: '#C0182A',
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 900, fontStyle: 'italic', fontSize: 16
                  }}>L</div>
                } 
                label="Periode Genap-Ganjil" 
                value="Pelaksanaan Sidang<br/><span class='text-sm font-normal text-gray-500'>26 mei - 20 juni 2026</span>" 
                sub="Jadwal dapat berubah sewaktu-waktu"             
              />
            </div>
          </div>

          {/* table progress*/}
          <div className="mb-6">
            <h4 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-2 border-l-4 border-primary pl-3">
              Progres Registrasi Kamu
            </h4>
            <p className="text-xs text-muted mb-6 pl-3">Lacak setiap tahapan administrasi tugas akhirmu secara real-time.</p>

            {/* <div className="section-card border border-gray-100 shadow-sm overflow-hidden"> */}
            <div className="section-card border border-gray-100 shadow-sm" style={{ overflow: 'visible' }}>
              <div className="table-scroll-wrap">
                <table className="simta-table">

                  <thead>
                    <tr>
                      <th className="w-16">No</th>
                      <th className="min-w-[200px]">Tahap Pendaftaran</th>
                      <th className="w-48">Status</th>
                      <th className="min-w-[240px]">Keterangan</th>
                      <th className="min-w-[220px]">Aksi</th>
                    </tr>
                  </thead>

                  <tbody>

                    {/* Row 1 - Pengajuan SK */}
                    <tr style={{ background: '#fff' }}>
                      <td className="py-5 px-4 text-center font-bold text-gray-500 border border-gray-200">1</td>
                      <td className="py-5 px-6 border border-gray-200">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-black text-gray-900">Pengajuan SK</span>
                          <span className="text-[10px] text-gray-400">Diajukan pada: 10 April 2026</span>
                        </div>
                      </td>
                      <td className="py-5 px-6 border border-gray-200">
                        <div className="flex justify-center">
                          <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 14px', borderRadius: '9999px', background: '#D1FAE5', border: '1.5px solid #10B981', color: '#059669' }}>
                            Sudah Terisi
                          </span>
                        </div>
                      </td>
                      <td className="py-5 px-6 border border-gray-200">
                        <div className="flex justify-center">
                          <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 14px', borderRadius: '9999px', background: '#D1FAE5', border: '1.5px solid #10B981', color: '#059669' }}>
                            Dokumen Sudah Lengkap
                          </span>
                        </div>
                      </td>
                      <td className="py-5 px-6 border border-gray-200">
                        <div className="flex justify-center items-center gap-2 flex-wrap">
                          <button style={{ fontSize: '10px', fontWeight: 700, padding: '4px 14px', borderRadius: '9999px', background: '#fff', border: '1.5px solid #9CA3AF', color: '#374151', cursor: 'pointer' }}>
                            Lihat Respon
                          </button>
                          <button style={{ fontSize: '10px', fontWeight: 700, padding: '4px 14px', borderRadius: '9999px', background: '#C0182A', border: '1.5px solid #C0182A', color: '#fff', cursor: 'pointer' }}>
                            Unduh SK
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Row 2 - Pendaftaran Sidang */}
                    <tr style={{ background: '#fff' }}>
                      <td className="py-5 px-4 text-center font-bold text-gray-500 border border-gray-200">2</td>
                      <td className="py-5 px-6 border border-gray-200">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-black text-gray-900">Pendaftaran Sidang</span>
                          <span className="text-[10px] text-gray-400">Diajukan pada: 10 Sep 2025</span>
                        </div>
                      </td>
                      <td className="py-5 px-6 border border-gray-200">
                        <div className="flex justify-center">
                          <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 14px', borderRadius: '9999px', background: '#DBEAFE', border: '1.5px solid #3B82F6', color: '#2563EB' }}>
                            Terverifikasi
                          </span>
                        </div>
                      </td>
                      <td className="py-5 px-6 border border-gray-200">
                        <div className="flex justify-center">
                          <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 14px', borderRadius: '9999px', background: '#D1FAE5', border: '1.5px solid #10B981', color: '#059669' }}>
                            Dokumen Sudah Lengkap
                          </span>
                        </div>
                      </td>
                      <td className="py-5 px-6 border border-gray-200">
                        <div className="flex justify-center">
                          <button style={{ fontSize: '10px', fontWeight: 700, padding: '4px 14px', borderRadius: '9999px', background: '#fff', border: '1.5px solid #9CA3AF', color: '#374151', cursor: 'pointer' }}>
                            Lihat Respon
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Row 3 - Pendaftaran Yudisium */}
                    <tr style={{ background: '#fff' }}>
                      <td className="py-5 px-4 text-center font-bold text-gray-500 border border-gray-200">3</td>
                      <td className="py-5 px-6 border border-gray-200">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-black text-gray-900">Pendaftaran Yudisium</span>
                          <span className="text-[10px] text-gray-400">Diajukan pada: 10 Sep 2025</span>
                        </div>
                      </td>
                      <td className="py-5 px-6 border border-gray-200">
                        <div className="flex justify-center">
                          <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 14px', borderRadius: '9999px', background: '#F3F4F6', border: '1.5px solid #9CA3AF', color: '#6B7280' }}>
                            On Progress
                          </span>
                        </div>
                      </td>
                      <td className="py-5 px-6 border border-gray-200">
                        <div className="flex justify-center">
                          <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 14px', borderRadius: '9999px', background: '#F3F4F6', border: '1.5px solid #9CA3AF', color: '#6B7280' }}>
                            On Progress
                          </span>
                        </div>
                      </td>
                      <td className="py-5 px-6 border border-gray-200">
                        <div className="flex justify-center">
                          <button style={{ fontSize: '10px', fontWeight: 700, padding: '4px 18px', borderRadius: '9999px', background: '#C0182A', border: '1.5px solid #C0182A', color: '#fff', cursor: 'pointer' }}>
                            &gt; Lanjutkan Pendaftaran
                          </button>
                        </div>
                      </td>
                    </tr>

                  </tbody>
                </table>
              </div>
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

const DashboardIllustration = () => (
  <img 
    src={illustration} 
    alt="Dashboard Illustration" 
    style={{ width: '100%', height: 'auto', maxHeight: '220px', objectFit: 'contain' }} // responsive styling
    referrerPolicy="no-referrer"
  />
);

export default DashboardMahasiswa;
