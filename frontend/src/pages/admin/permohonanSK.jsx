import React, { useState, useMemo, useRef } from 'react';
import { Search, Download, FileText, X, Eye, ChevronLeft, ChevronRight, Menu, Upload, CheckCircle2, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SidebarAdmin from '../../components/sidebar/SidebarAdmin';
import CustomAlert from '../../components/common/CustomAlert';
import '../../components/admin/css/permohonanSK.css';

// ─── Dummy Data ──────────────────────────────────────────────────────────────
const DUMMY_DATA = [
  { id: 1,  nama: 'Andhika Pramata',    nim: '2311104001', prodi: 'S1 RPL',    status: 'sudah-terbit',  tanggal: '12/04/2026' },
  { id: 2,  nama: 'Jeremy Cristo',      nim: '2311104098', prodi: 'S1 IF',     status: 'belum-terbit', tanggal: '12/04/2026' },
  { id: 3,  nama: 'Naufal Ari',         nim: '2311104045', prodi: 'S1 DKV',    status: 'dalam-proses', tanggal: '13/04/2026' },
  { id: 4,  nama: 'Saufiq Iqro',        nim: '2311104088', prodi: 'S1 BiOMED', status: 'sudah-terbit',  tanggal: '13/04/2026' },
  { id: 5,  nama: 'Rizky Firmansyah',   nim: '2311104022', prodi: 'S1 TEKDUS', status: 'dalam-proses', tanggal: '14/04/2026' },
  { id: 6,  nama: 'Dita Permatasari',   nim: '2311104033', prodi: 'S1 IF',     status: 'sudah-terbit',  tanggal: '14/04/2026' },
  { id: 7,  nama: 'Meisari Widayanti',  nim: '2311104055', prodi: 'S1 RPL',    status: 'belum-terbit', tanggal: '15/04/2026' },
  { id: 8,  nama: 'Prajna Paramitha',   nim: '2311104077', prodi: 'S1 DKV',    status: 'sudah-terbit',  tanggal: '15/04/2026' },
  { id: 9,  nama: 'Dika Hutagaol',      nim: '2311104011', prodi: 'S1 TEKDUS', status: 'dalam-proses', tanggal: '16/04/2026' },
  { id: 10, nama: 'Stella Margaretha',  nim: '2311104066', prodi: 'S1 IF',     status: 'sudah-terbit',  tanggal: '16/04/2026' },
  { id: 11, nama: 'Budi Santoso',       nim: '2311104044', prodi: 'S1 BiOMED', status: 'belum-terbit', tanggal: '17/04/2026' },
  { id: 12, nama: 'Siti Aminah',        nim: '2311104099', prodi: 'S1 RPL',    status: 'dalam-proses', tanggal: '17/04/2026' },
];

const PRODI_LIST = ['Semua Prodi', 'S1 IF', 'S1 RPL', 'S1 DKV', 'S1 BiOMED', 'S1 TEKDUS'];
const PAGE_SIZE = 5;

const StatusBadge = ({ status }) => {
  const config = {
    'sudah-terbit':  { label: 'Sudah Terbit',  cls: 'sudah-terbit'  },
    'belum-terbit':  { label: 'Belum Terbit',  cls: 'belum-terbit'  },
    'dalam-proses':  { label: 'Dalam Proses',  cls: 'dalam-proses'  },
  };
  const { label, cls } = config[status] || { label: status, cls: '' };
  return (
    <span className={`sk-badge ${cls}`}>{label}</span>
  );
};

const EvidenceModal = ({ item, onClose }) => {
  if (!item) return null;
  return (
    <div className="ev-modal-overlay" onClick={onClose}>
      <motion.div
        className="ev-modal-box"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="ev-modal-header">
          <h3>Evidence Permohonan SK</h3>
          <button className="ev-modal-close" onClick={onClose} title="Tutup">
            <X size={18} />
          </button>
        </div>
        <div className="ev-modal-body">
          <div className="ev-info-row">
            <span className="ev-info-label">Nama</span>
            <span className="ev-info-value">{item.nama}</span>
          </div>
          <div className="ev-info-row">
            <span className="ev-info-label">NIM</span>
            <span className="ev-info-value">{item.nim}</span>
          </div>
          <div className="ev-info-row">
            <span className="ev-info-label">Program Studi</span>
            <span className="ev-info-value">{item.prodi}</span>
          </div>
          <div className="ev-info-row">
            <span className="ev-info-label">Status Berkas</span>
            <span className="ev-info-value"><StatusBadge status={item.status} /></span>
          </div>
          <div className="ev-info-row">
            <span className="ev-info-label">Tanggal</span>
            <span className="ev-info-value">{item.tanggal}</span>
          </div>
          <div className="ev-dummy-file">
            <div className="ev-file-icon">
              <FileText size={22} />
            </div>
            <strong style={{ fontSize: 13, color: '#1E293B' }}>
              Evidence_{item.nim}.pdf
            </strong>
            <p>Pratinjau tidak tersedia. Klik tombol unduh untuk membuka berkas.</p>
          </div>
        </div>
        <div className="ev-modal-footer">
          <button className="btn-close-modal" onClick={onClose}>Tutup</button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Verifikasi Modal ───────────────────────────────────────────────────────
const ALUR_STEPS = [
  'Data diproses di I-Gracias untuk pengecekan nomor SK',
  'Unduh SK dari I-Gracias',
  'Berikan kop surat resmi',
  'Unggah ulang SK final ke SIMTA',
];

const VerifikasiModal = ({ selectedPermohonan, onClose, onSave }) => {
  const [checks, setChecks] = useState({ proposal: false, toefl: false });
  const [catatan, setCatatan] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef();

  if (!selectedPermohonan) return null;

  const toggleCheck = (key) => setChecks(prev => ({ ...prev, [key]: !prev[key] }));

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) setUploadedFile(file);
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) setUploadedFile(e.target.files[0]);
  };

  return (
    <div className="dm-overlay" onClick={onClose}>
      <motion.div
        className="dm-box"
        initial={{ scale: 0.93, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.93, opacity: 0, y: 16 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="dm-header">
          <div>
            <h3 className="dm-header-title">Proses Penerbitan SK — {selectedPermohonan.nama}</h3>
          </div>
          <button className="dm-close-btn" onClick={onClose} title="Tutup"><X size={18} /></button>
        </div>

        {/* Scrollable body */}
        <div className="dm-body">

          {/* Section 1 — Checklist */}
          <div className="dm-section">
            <div className="dm-section-label">Checklist Kelengkapan Dokumen</div>
            <div className="dm-checklist">
              {[
                { key: 'proposal', label: 'Upload Proposal TA' },
                { key: 'toefl',    label: 'Sertifikat TOEFL'  },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  className={`dm-check-item ${checks[key] ? 'checked' : ''}`}
                  onClick={() => toggleCheck(key)}
                  type="button"
                >
                  <span className="dm-check-icon">
                    {checks[key]
                      ? <CheckCircle2 size={17} />
                      : <Circle size={17} />}
                  </span>
                  <span className="dm-check-label">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 2 — Alur */}
          <div className="dm-section">
            <div className="dm-section-label">Alur Penerbitan SK</div>
            <ol className="dm-alur-list">
              {ALUR_STEPS.map((step, i) => (
                <li key={i} className="dm-alur-item">
                  <span className="dm-alur-num">{i + 1}</span>
                  <span className="dm-alur-text">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Section 3 — Catatan Admin */}
          <div className="dm-section">
            <div className="dm-section-label">Catatan Admin</div>
            <textarea
              className="dm-textarea"
              placeholder="Silahkan Tulis Disini"
              value={catatan}
              onChange={e => setCatatan(e.target.value)}
              rows={3}
            />
          </div>

          {/* Section 4 — Upload */}
          <div className="dm-section">
            <div className="dm-section-label">Upload File SK</div>
            <div
              className={`dm-upload-area ${isDragging ? 'dragging' : ''} ${uploadedFile ? 'has-file' : ''}`}
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              {uploadedFile ? (
                <>
                  <div className="dm-upload-icon uploaded">
                    <FileText size={22} />
                  </div>
                  <p className="dm-upload-filename">{uploadedFile.name}</p>
                  <p className="dm-upload-sub">{(uploadedFile.size / 1024).toFixed(1)} KB — Klik untuk ganti file</p>
                </>
              ) : (
                <>
                  <div className="dm-upload-icon">
                    <Upload size={22} />
                  </div>
                  <p className="dm-upload-main">Drag and Drop or choose File to upload</p>
                  <p className="dm-upload-sub">PDF, DOC, DOCX — maks. 10 MB</p>
                </>
              )}
            </div>
          </div>

        </div>

        <div className="dm-footer">
          <button className="dm-btn-batal" onClick={onClose}>Batal</button>
          <button className="dm-btn-simpan" onClick={() => { onSave(selectedPermohonan); onClose(); }}>
            Simpan &amp; Kirim
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const PermohonanSK = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch]           = useState('');
  const [filterProdi, setFilterProdi] = useState('Semua Prodi');
  const [currentPage, setCurrentPage] = useState(1);
  const [evidenceItem, setEvidenceItem] = useState(null);
  const [selectedVerifikasi, setSelectedVerifikasi] = useState(null);
  const [alert, setAlert]             = useState({ show: false, type: 'success', title: '', message: '' });

  const showAlert = (type, title, message) => {
    setAlert({ show: true, type, title, message });
    setTimeout(() => setAlert(prev => ({ ...prev, show: false })), 4000);
  };

  // Filter + search
  const filtered = useMemo(() => {
    return DUMMY_DATA.filter(item => {
      const matchSearch = search.trim() === '' ||
        item.nama.toLowerCase().includes(search.toLowerCase()) ||
        item.nim.includes(search);
      const matchProdi = filterProdi === 'Semua Prodi' || item.prodi === filterProdi;
      return matchSearch && matchProdi;
    });
  }, [search, filterProdi]);

  // Reset page on filter change
  const handleSearch = (val) => { setSearch(val); setCurrentPage(1); };
  const handleProdi  = (val) => { setFilterProdi(val); setCurrentPage(1); };

  // Pagination
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleExport = () => {
    showAlert('success', 'Export Berhasil', 'Data evidence akreditasi sedang disiapkan untuk diunduh.');
  };

  const handleSaveVerifikasi = (item) => {
    showAlert('success', 'Berhasil Disimpan', `Data penerbitan SK <strong>${item.nama}</strong> telah disimpan dan dikirim.`);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <SidebarAdmin
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onShowToast={(msg, icon, type) =>
          showAlert(type === 'warning' ? 'warning' : 'success', 'Info', msg)
        }
      />

      {/* Main content area */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Mobile top bar */}
        <div className="mobile-menu-bar">
          <button onClick={() => setSidebarOpen(true)} className="mobile-menu-btn">
            <Menu size={20} />
          </button>
          <span className="mobile-menu-title">SIMTA</span>
        </div>

        <div className="page-wrapper">
          <div className="top-bar-red">
            <h1>Layanan SK TA</h1>
          </div>

          <div className="content-container">
            <div className="breadcrumb">
              Beranda / Layanan SK TA / Permohonan SK
            </div>
            <h2 className="page-title">Permohonan SK TA</h2>

            {/* Main card */}
            <section className="card-main">
              {/* Card header: filter bar */}
              <div className="card-body" style={{ paddingBottom: 0 }}>
                <div className="sk-filter-bar">
                  <div className="sk-search-wrap">
                    <span className="sk-search-icon">
                      <Search size={15} />
                    </span>
                    <input
                      id="sk-search-input"
                      type="text"
                      className="sk-search-input"
                      placeholder="Cari Nama atau NIM..."
                      value={search}
                      onChange={e => handleSearch(e.target.value)}
                    />
                  </div>

                  {/* Prodi filter */}
                  <select
                    id="sk-filter-prodi"
                    className="sk-filter-select"
                    value={filterProdi}
                    onChange={e => handleProdi(e.target.value)}
                  >
                    {PRODI_LIST.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>

                  {/* Export button */}
                  <button
                    id="sk-export-btn"
                    className="btn-export-sk"
                    onClick={handleExport}
                  >
                    <Download size={15} />
                    Expor Evidence Akreditasi
                  </button>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #E2E8F0', margin: '16px 0 0' }} />

              {/* Table */}
              <div className="sk-table-wrap">
                <table className="sk-table">
                  <thead>
                    <tr>
                      <th style={{ width: 48, textAlign: 'center' }}>No</th>
                      <th>Mahasiswa</th>
                      <th>Prodi</th>
                      <th style={{ textAlign: 'center' }}>Evidence</th>
                      <th style={{ textAlign: 'center' }}>Status Berkas</th>
                      <th>Tanggal</th>
                      <th style={{ textAlign: 'center' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 ? (
                      <tr>
                        <td colSpan={7}>
                          <div className="sk-empty-state">
                            <div className="sk-empty-icon">
                              <FileText size={24} />
                            </div>
                            <p>Tidak ada data yang cocok dengan filter saat ini.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginated.map((item, idx) => (
                        <tr key={item.id}>
                          <td className="text-center" style={{ color: '#94A3B8', fontWeight: 600 }}>
                            {(currentPage - 1) * PAGE_SIZE + idx + 1}
                          </td>

                          <td>
                            <div className="sk-mhs-name">{item.nama}</div>
                            <div className="sk-mhs-nim">{item.nim}</div>
                          </td>

                          <td>
                            <span className="sk-prodi-text">{item.prodi}</span>
                          </td>

                          <td className="text-center">
                            <button
                              className="btn-evidence"
                              onClick={() => setEvidenceItem(item)}
                            >
                              <Eye size={13} />
                              Lihat Evidence
                            </button>
                          </td>

                          <td>
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                              <StatusBadge status={item.status} />
                            </div>
                          </td>

                          <td>
                            <span className="sk-date-text">{item.tanggal}</span>
                          </td>

                          <td className="text-center">
                            <button
                              className="btn-verifikasi-sk"
                              onClick={() => setSelectedVerifikasi(item)}
                            >
                              Verifikasi
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="sk-table-footer">
                <span className="sk-page-info">
                  Menampilkan{' '}
                  <strong>
                    {filtered.length === 0
                      ? 0
                      : `${(currentPage - 1) * PAGE_SIZE + 1} - ${Math.min(currentPage * PAGE_SIZE, filtered.length)}`}
                  </strong>{' '}
                  dari <strong>{filtered.length}</strong> Pendaftar
                </span>

                <div className="sk-pagination">
                  <button
                    className="btn-page"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    title="Sebelumnya"
                  >
                    <ChevronLeft size={14} />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      className={`btn-page ${page === currentPage ? 'active' : ''}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    className="btn-page"
                    disabled={currentPage === totalPages || totalPages === 0}
                    onClick={() => setCurrentPage(p => p + 1)}
                    title="Selanjutnya"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Evidence Modal */}
      <AnimatePresence>
        {evidenceItem && (
          <EvidenceModal
            item={evidenceItem}
            onClose={() => setEvidenceItem(null)}
          />
        )}
      </AnimatePresence>

      {/* Verifikasi Modal */}
      <AnimatePresence>
        {selectedVerifikasi && (
          <VerifikasiModal
            selectedPermohonan={selectedVerifikasi}
            onClose={() => setSelectedVerifikasi(null)}
            onSave={handleSaveVerifikasi}
          />
        )}
      </AnimatePresence>

      {/* Alert / Toast */}
      <AnimatePresence>
        {alert.show && (
          <motion.div
            className="alert-overlay"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
          >
            <CustomAlert
              type={alert.type}
              title={alert.title}
              message={alert.message}
              style={{ margin: 0, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PermohonanSK;
