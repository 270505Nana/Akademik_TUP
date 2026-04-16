import React from 'react';
import SidebarMahasiswa from '../../components/sidebar/SidebarMahasiswa';
import '../mahasiswa/dashboard.css';
import heroImg from '../../assets/karakter-dashboard.png';

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      <SidebarMahasiswa />
      
      <main className="main-content">
        <header className="top-bar">
          <h1>Beranda</h1>
        </header>

        <section className="content-wrapper">
          <div className="card hero-card">
            <div className="hero-flex">
              <div className="hero-image">
                <img src={heroImg} alt="Illustration" />
              </div>
              <div className="hero-text">
                <h2 className="text-maroon">Selamat Datang di SIMTA</h2>
                <p>SIMTA (Sistem Informasi Manajemen Tugas Akhir) adalah platform utama bagi mahasiswa untuk mengelola seluruh rangkaian tugas akhir secara digital dan terintegrasi. Menu Status TA/PA Mahasiswa merupakan sub-menu dari kategori Daftar TA/PA yang berfungsi sebagai dasbor interaktif untuk memantau progres akademik kamu secara real-time</p>
                <p>Melalui menu ini, kamu dapat melihat dan menyelesaikan tahapan pengambilan TA/PA secara sistematis, mulai dari pengajuan proposal dokumen, pemilihan dosen pembimbing, hingga memantau validasi Surat Keputusan (SK). Selain itu, SIMTA memfasilitasi proses pendaftaran sidang tahap 2, penjadwalan, hingga pemantauan nilai akhir berdasarkan bobot CLO program studi. Pastikan kamu mengikuti setiap urutan alur yang tersedia agar proses administrasi menuju sidang akhir dan pendaftaran yudisium berjalan lancar serta sesuai dengan standar akademik Universitas Telkom Purwokerto.</p>
              </div>
            </div>
          </div>

          <div className="card greeting-card">
            <div className="greeting-content">
              <h3>Halo Meisari! 👋</h3>
              <p>Semangat pengerjaan Tugas Akhirnya! Pastikan semua berkas persyaratanmu sudah lengkap dan tervalidasi sebelum <span className="text-red">20 Januari 2026</span> agar kamu bisa mengikuti jadwal sidang gelombang pertama.</p>
              <button className="btn-primary">Cek Persyaratan Sidang</button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid">
            <StatCard icon="bi-calendar-event" label="PENDAFTARAN SIDANG DITUTUP" value="124 Hari Lagi" sub="Berakhir pada 20 Januari 2026" />
            <StatCard icon="bi-trophy-fill" label="STATUS POIN TAK" value="65 Poin" />
            <StatCard icon="bi-file-earmark-check" label="SKS LULUS" value="144 Lulus" sub="Skor Minimum 144" />
          </div>

          <div className="table-section">
            <h3>Progres Registrasi Kamu</h3>
            <p className="sub-h3">Lacak setiap tahapan administrasi tugas akhirmu secara real-time.</p>
            
            <div className="card-table">
              <table>
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Tahap Pendaftaran</th>
                    <th>Aksi</th>
                    <th>Keterangan</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>1</td>
                    <td>
                      <strong>Registrasi Yudisium</strong><br/>
                      <small>Diajukan pada: 10 Sep 2025</small>
                    </td>
                    <td><span className="badge-tahap">Tahap 1 <i className="bi bi-check-circle-fill"></i></span></td>
                    <td><span className="badge-info-green">Dokumen Lengkap</span></td>
                    <td><span className="badge-status-green">Sudah Lengkap</span></td>
                  </tr>
                  <tr>
                    <td>2</td>
                    <td>
                      <strong>Pengajuan SK</strong><br/>
                      <small>Diajukan pada: 10 Sep 2025</small>
                    </td>
                    <td><span className="badge-tahap">Tahap 1 <i className="bi bi-check-circle-fill"></i></span></td>
                    <td><span className="badge-info-red">Dosen Pembimbing Belum di Approve oleh KK</span></td>
                    <td>
                      <span className="badge-status-green">Sudah Lengkap</span>
                      <button className="btn-outline-red"><i className="bi bi-file-earmark-text"></i> Lihat SK</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <footer className="main-footer">
          Telkom University Purwokerto — Divisi Akademik dan Sistem Informasi
        </footer>
      </main>
    </div>
  );
};

const StatCard = ({ icon, label, value, sub }) => (
  <div className="card stat-item">
    <div className="stat-header">
      <i className={`bi ${icon} text-red`}></i>
      <span className="badge-update">Terakhir Diperbarui</span>
    </div>
    <p className="stat-label">{label}</p>
    <h4 className="stat-value">{value}</h4>
    {sub && <p className="stat-sub">{sub}</p>}
  </div>
);

export default Dashboard;