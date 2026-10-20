import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, ChevronLeft, ChevronRight, Menu, 
  ClipboardList 
} from 'lucide-react';
import { motion } from 'motion/react';

import SidebarAdmin from '../../components/sidebar/SidebarDosen'; 
import KelolaCLOModal from '../../components/dosen/KelolaClo/Kelolaclomodal'; 
import '../../style/css/dosen/kelolaclo.css';

const PAGE_SIZE = 10;

const dummyCloData = [
  {
    id: 'clo-1',
    name: 'CLO 5.1',
    description: 'Mampu menerapkan komunikasi secara efektif.',
    status: 'active',
    subClo: [
      { id: 'sub-1', name: 'Sub CLO 5.1.1', description: 'Mahasiswa mampu mempresentasikan laporan secara lisan.' },
      { id: 'sub-2', name: 'Sub CLO 5.1.2', description: 'Mahasiswa mampu menulis laporan resmi dengan format standar.' }
    ],
    asesmen: [
      { id: 'asm-1', content: 'Presentasi Hasil Penelitian secara Individu/Tim', bobot: 0.1 },
      { id: 'asm-2', content: 'Laporan Buku / Dokumen Skripsi', bobot: 0.15 }
    ]
  },
  {
    id: 'clo-2',
    name: 'CLO 5.2',
    description: 'Mampu menganalisis masalah teknis secara kritis.',
    status: 'review',
    subClo: [
      { id: 'sub-3', name: 'Sub CLO 5.2.1', description: 'Mahasiswa dapat mengidentifikasi akar permasalahan.' }
    ],
    asesmen: [
      { id: 'asm-3', content: 'Ujian Tulis Analisis Kasus', bobot: 0.25 }
    ]
  }
];

const KelolaCLO = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [cloList, setCloList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- STATE MODAL ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCLO, setSelectedCLO] = useState(null);

  const handleToggleSidebar = () => {
    if (window.innerWidth < 992) setSidebarOpen(!sidebarOpen);
    else setIsDesktopCollapsed(!isDesktopCollapsed);
  };

  useEffect(() => {
    const fetchCLO = async () => {
      setIsLoading(true);
      try {
        setTimeout(() => {
          setCloList(dummyCloData);
          setIsLoading(false);
        }, 800);
      } catch (err) {
        console.error('Gagal mengambil data CLO', err);
        setIsLoading(false);
      }
    };
    fetchCLO();
  }, []);

  const totalItems = cloList.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const paginatedList = cloList.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Trigger Buka Modal Tambah Baru
  const handleAddCLO = () => {
    setSelectedCLO(null);
    setIsModalOpen(true);
  };

  // Trigger Buka Modal Mode Edit (Kita parkir alur edit di backend-nya)
  const handleEditCLO = (item) => {
    setSelectedCLO(item);
    setIsModalOpen(true);
  };

  // Callback ketika Modal berhasil submit
  const handleModalSuccess = () => {
    // Nanti ganti dengan pemanggilan fetchCLO() ke backend
    console.log("Submit sukses! Saatnya refresh tabel...");
  };

  return (
    <div className={`clo-root ${isDesktopCollapsed ? 'desktop-collapsed' : ''}`}>
      
      <SidebarAdmin isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="clo-main">
        {/* MOBILE TOPBAR */}
        <div className="clo-mobile-bar">
          <button className="clo-mobile-btn" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <span className="clo-mobile-title">SIMTA</span>
        </div>

        <div className="clo-page-wrapper">
          {/* TOPBAR DESKTOP */}
          <header className="clo-topbar">
            <button className="clo-topbar-toggle" onClick={handleToggleSidebar}>
              <Menu size={20} />
            </button>
            <h1>Kelola CLO & Asesmen</h1>
          </header>

          <main className="clo-content">
            
            <div className="clo-page-title-row">
              <h2 className="clo-page-title">Daftar CLO Program Studi</h2>
              <button className="clo-btn-add" onClick={handleAddCLO}>
                <Plus size={16} />
                Tambah CLO Baru
              </button>
            </div>

            <section className="clo-card">
              
              {/* FILTER BAR */}
              <div className="clo-filter-bar">
                <div className="clo-search-wrap">
                  <Search size={16} className="clo-search-icon" />
                  <input
                    type="text"
                    className="clo-search-input"
                    placeholder="Cari nama CLO atau deskripsi..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* TABEL */}
              <div className="clo-table-wrap">
                <table className="clo-table">
                  <thead>
                    <tr>
                      <th className="col-no">NO</th>
                      <th className="col-clo">NAMA CLO</th>
                      <th className="col-sub">SUB CLO</th>
                      <th className="col-asesmen">JENIS ASESMEN</th>
                      <th className="col-bobot">BOBOT</th>
                      <th className="col-status">STATUS</th>
                      <th className="col-aksi">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={7}>
                          <div className="clo-empty-state">
                            <span className="clo-empty-text">Memuat data CLO...</span>
                          </div>
                        </td>
                      </tr>
                    ) : paginatedList.length === 0 ? (
                      <tr>
                        <td colSpan={7}>
                          <div className="clo-empty-state">
                            <ClipboardList size={36} color="#D1D5DB" />
                            <span className="clo-empty-text">
                              {search ? 'Tidak ada hasil pencarian.' : 'Belum ada data CLO.'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedList.map((item, idx) => {
                        const subList = item.subClo || [];
                        const asmList = item.asesmen || [];
                        const maxLen = Math.max(subList.length, asmList.length);

                        return (
                          <motion.tr
                            key={item.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.03 }}
                          >
                            <td className="col-no" style={{ fontWeight: 600, color: '#64748b' }}>
                              {(currentPage - 1) * PAGE_SIZE + idx + 1}
                            </td>

                            <td className="col-clo">
                              <div className="clo-text-bold">{item.name}</div>
                              <div className="clo-text-muted">{item.description}</div>
                            </td>

                            <td colSpan={3} className="col-sub-group">
                              {maxLen === 0 ? (
                                <div className="clo-sub-row-item empty">
                                  <span style={{ color: '#9CA3AF', fontStyle: 'italic', padding: '14px 16px' }}>
                                    Tidak ada Sub CLO / Asesmen
                                  </span>
                                </div>
                              ) : (
                                Array.from({ length: maxLen }).map((_, i) => {
                                  const sub = subList[i];
                                  const asm = asmList[i];
                                  return (
                                    <div key={i} className="clo-sub-row-item">
                                      <div className="col-sub-cell">
                                        {sub ? (
                                          <>
                                            <span className="clo-sub-title">{sub.name}</span>
                                            <div className="clo-sub-desc">{sub.description}</div>
                                          </>
                                        ) : (
                                          <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>-</span>
                                        )}
                                      </div>
                                      <div className="col-asesmen-cell">
                                        {asm ? (
                                          <span className="clo-sub-desc" style={{ color: '#1e293b' }}>{asm.content}</span>
                                        ) : (
                                          <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>-</span>
                                        )}
                                      </div>
                                      <div className="col-bobot-cell">
                                        {asm ? (
                                          <span className="clo-sub-title" style={{ color: '#C0182A' }}>{asm.bobot}</span>
                                        ) : (
                                          <span style={{ color: '#9CA3AF' }}>-</span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </td>

                            <td className="col-status">
                              <span className={`clo-status-badge ${item.status}`}>
                                {item.status === 'active' ? 'Disetujui' : 'Direview'}
                              </span>
                            </td>

                            <td className="col-aksi">
                              <button 
                                className="clo-btn-edit-text" 
                                title="Edit CLO"
                                onClick={() => handleEditCLO(item)}
                              >
                                Edit
                              </button>
                            </td>

                          </motion.tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION */}
              {totalItems > 0 && (
                <div className="clo-footer">
                  <span className="clo-page-info">
                    Menampilkan {Math.min((currentPage - 1) * PAGE_SIZE + 1, totalItems)} - {Math.min(currentPage * PAGE_SIZE, totalItems)} dari {totalItems} data
                  </span>
                  <div className="clo-pagination-wrap">
                    <button 
                      className="clo-btn-page" 
                      disabled={currentPage === 1 || isLoading} 
                      onClick={() => setCurrentPage(p => p - 1)}
                    >
                      <ChevronLeft size={14} />
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button 
                        key={p} 
                        className={`clo-btn-page ${p === currentPage ? 'active' : ''}`} 
                        onClick={() => setCurrentPage(p)} 
                        disabled={isLoading}
                      >
                        {p}
                      </button>
                    ))}
                    
                    <button 
                      className="clo-btn-page" 
                      disabled={currentPage === totalPages || isLoading} 
                      onClick={() => setCurrentPage(p => p + 1)}
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </section>
          </main>
        </div>
      </div>

      {/* RENDER MODAL TAMBAH/EDIT */}
      <KelolaCLOModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        existingData={selectedCLO}
        onSuccess={handleModalSuccess}
      />

    </div>
  );
};

export default KelolaCLO;