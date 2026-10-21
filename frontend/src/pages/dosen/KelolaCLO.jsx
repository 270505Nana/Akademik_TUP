import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, ChevronLeft, ChevronRight, Menu, ClipboardList, Trash2, Filter, Check, X as CloseIcon, XCircle, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { useAuth } from '../../context/AuthContext';
import SidebarDosen from '../../components/sidebar/SidebarDosen';
import KelolaCLOModal from '../../components/dosen/KelolaClo/Kelolaclomodal';
import CustomAlert from '../../components/common/CustomAlert';
import { getCLOs, deleteCLO, getStudyPrograms, getApprovalRequests, approveRequest, rejectRequest, cancelRequest } from '../../service/api';
import '../../style/css/dosen/kelolaclo.css';

const PAGE_SIZE = 10;

const pickList = (item, keys) => {
  for (const k of keys) {
    if (Array.isArray(item?.[k]) && item[k].length) return item[k];
  }
  return [];
};
const getSubList = (item) => pickList(item, ['subcloProdi', 'subClo', 'subclo_prodi', 'subClos']);
const getAsmList = (item) => pickList(item, ['jenisAsesmen', 'jenisAsesmenClo', 'jenisAsesmenProdi', 'asesmen']);
const toList = (res) => (Array.isArray(res) ? res : res?.data || []);
const toPercent = (b) => `${Math.round((Number(b) || 0) * 1000) / 10}%`;

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText, isDestructive, isSubmitting }) => {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <motion.div 
        style={{ backgroundColor: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()} 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }}
      >
        <div style={{ borderBottom: '1px solid #e5e7eb', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
            {isDestructive && <AlertTriangle size={18} color="#dc2626" />}
            {title}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><CloseIcon size={18} /></button>
        </div>
        <div style={{ padding: '20px', fontSize: '13.5px', color: '#374151', lineHeight: 1.5 }}>
          {message}
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
          <button onClick={onClose} disabled={isSubmitting} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #d1d5db', background: '#ffffff', color: '#374151', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>Batal</button>
          <button 
            onClick={onConfirm} 
            disabled={isSubmitting} 
            style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: isDestructive ? '#dc2626' : '#16a34a', color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
            {isSubmitting ? 'Memproses...' : confirmText}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const RejectModal = ({ isOpen, onClose, onConfirm, isSubmitting }) => {
  const [note, setNote] = useState('');
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <motion.div 
        style={{ backgroundColor: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '450px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()} 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }}
      >
        <div style={{ borderBottom: '1px solid #e5e7eb', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>Tolak Pengajuan CLO</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><CloseIcon size={18} /></button>
        </div>
        <div style={{ padding: 20 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#374151' }}>Alasan Penolakan <span style={{ color: 'red' }}>*</span></label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Misal: Deskripsi CLO belum selaras dengan standar CPL program studi..."
            style={{ width: '100%', minHeight: 100, padding: 12, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
          />
          <p style={{ fontSize: 11, color: '#64748b', marginTop: 8, margin: 0 }}>* Catatan ini akan dikirimkan ke Kaprodi terkait.</p>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
          <button onClick={onClose} disabled={isSubmitting} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #d1d5db', background: '#ffffff', color: '#374151', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>Batal</button>
          <button 
            onClick={() => note.trim() ? onConfirm(note) : alert('Alasan penolakan wajib diisi!')} 
            disabled={isSubmitting} 
            style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#dc2626', color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
            {isSubmitting ? 'Memproses...' : 'Tolak CLO'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};


const KelolaCLO = () => {
  const { profile } = useAuth();
  const isKetuaKK = profile?.isKetuaKK ?? false;
  const isKaprodi = profile?.isKetuaProdi ?? false;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('approved'); 

  const [search, setSearch] = useState('');
  const [selectedProdi, setSelectedProdi] = useState('ALL');
  const [prodiOptions, setProdiOptions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [cloList, setCloList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCLO, setSelectedCLO] = useState(null);
  const [rejectModalData, setRejectModalData] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: '', id: null, title: '', message: '', confirmText: '', isDestructive: false });
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [alertNotif, setAlertNotif] = useState({ show: false, type: '', title: '', message: '' });

  const handleToggleSidebar = () => {
    if (window.innerWidth < 992) setSidebarOpen((v) => !v);
    else setIsDesktopCollapsed((v) => !v);
  };

  const triggerAlert = useCallback((type, title, message) => {
    setAlertNotif({ show: true, type, title, message });
    setTimeout(() => setAlertNotif({ show: false, type: '', title: '', message: '' }), 4000);
  }, []);

  useEffect(() => {
    getStudyPrograms({ limit: 100 })
      .then((res) => setProdiOptions(toList(res)))
      .catch((err) => console.error('Gagal mengambil data prodi:', err));
  }, []);

  const fetchCLOData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'approved') {
        const res = await getCLOs({ limit: 100 }).catch(() => getCLOs({ limit: 50 }));
        setCloList(toList(res));
      } else {
        const res = await getApprovalRequests({ entityType: 'CLO', status: 'PENDING', limit: 100 });
        setCloList(toList(res));
      }
    } catch (err) {
      console.error('Gagal mengambil data CLO:', err);
      setCloList([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { setCurrentPage(1); fetchCLOData(); }, [fetchCLOData, activeTab]);

  const q = search.trim().toLowerCase();
  const filteredList = cloList.filter((item) => {
    const title = activeTab === 'pending' ? (item.title || item.payload?.name) : item.name;
    const desc = activeTab === 'pending' ? item.payload?.description : item.description;
    
    const matchesSearch = !q || title?.toLowerCase().includes(q) || desc?.toLowerCase().includes(q);
    const matchesProdi = selectedProdi === 'ALL' || String(item.studyProgramId) === String(selectedProdi);
    return matchesSearch && matchesProdi;
  });

  const totalItems = filteredList.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedList = filteredList.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  //  ACTION HANDLERS 
  const handleAddCLO = () => { setSelectedCLO(null); setIsModalOpen(true); };
  const handleEditCLO = (item) => { setSelectedCLO(item); setIsModalOpen(true); };

  const requestDelete = (id) => {
    setConfirmDialog({ isOpen: true, type: 'delete', id, title: 'Hapus Data CLO', message: 'Apakah Anda yakin ingin menghapus data CLO ini? Data yang terhubung akan ikut terhapus.', confirmText: 'Ya, Hapus', isDestructive: true });
  };
  const requestApprove = (id) => {
    setConfirmDialog({ isOpen: true, type: 'approve', id, title: 'Setujui Pengajuan CLO', message: 'Apakah Anda yakin ingin menyetujui pengajuan pembuatan CLO ini?', confirmText: 'Terima', isDestructive: false });
  };
  const requestCancel = (id) => {
    setConfirmDialog({ isOpen: true, type: 'cancel', id, title: 'Batalkan Pengajuan', message: 'Apakah Anda yakin ingin membatalkan pengajuan CLO ini?', confirmText: 'Batalkan', isDestructive: true });
  };

  const executeConfirmAction = async () => {
    setIsActionLoading(true);
    const { type, id } = confirmDialog;
    
    try {
      if (type === 'delete') {
        await deleteCLO(id);
        triggerAlert('success', 'Berhasil', 'Data CLO telah dihapus dari sistem.');
      } else if (type === 'approve') {
        await approveRequest(id);
        triggerAlert('success', 'Disetujui', 'Pengajuan CLO berhasil disetujui.');
      } else if (type === 'cancel') {
        await cancelRequest(id);
        triggerAlert('success', 'Dibatalkan', 'Pengajuan CLO berhasil dibatalkan.');
      }
      fetchCLOData();
    } catch (err) {
      triggerAlert('error', 'Gagal Memproses', err.response?.data?.message || 'Terjadi kesalahan saat memproses permintaan.');
    } finally {
      setIsActionLoading(false);
      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
    }
  };

  const handleConfirmReject = async (note) => {
    try {
      setIsActionLoading(true);
      await rejectRequest(rejectModalData, note);
      setRejectModalData(null);
      triggerAlert('success', 'Berhasil Ditolak', 'Penolakan CLO beserta catatannya telah dikirim ke Kaprodi.');
      fetchCLOData();
    } catch (err) { 
      triggerAlert('error', 'Gagal Menolak', err.response?.data?.message || 'Terjadi kesalahan saat menolak CLO.');
    } finally { 
      setIsActionLoading(false); 
    }
  };

  return (
    <div className={`clo-root ${isDesktopCollapsed ? 'desktop-collapsed' : ''}`}>
      <SidebarDosen isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="clo-main">
        <div className="clo-mobile-bar">
          <button className="clo-mobile-btn" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
          <span className="clo-mobile-title">SIMTA</span>
        </div>

        <div className="clo-page-wrapper">
          <header className="clo-topbar">
            <button className="clo-topbar-toggle" onClick={handleToggleSidebar}><Menu size={20} /></button>
            <h1>Kelola CLO & Asesmen</h1>
          </header>

          <main className="clo-content">
            <div className="clo-page-title-row">
              <h2 className="clo-page-title">Daftar CLO Program Studi</h2>
              {isKaprodi && <button className="clo-btn-add" onClick={handleAddCLO}><Plus size={16} /> Tambah CLO Baru</button>}
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 20, borderBottom: '2px solid #e5e7eb', paddingBottom: 12 }}>
              <button
                onClick={() => setActiveTab('approved')}
                style={{ padding: '8px 16px', background: activeTab === 'approved' ? '#C0182A' : '#f1f5f9', color: activeTab === 'approved' ? '#fff' : '#64748b', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', transition: '0.2s' }}
              >
                Sudah Disetujui (Aktif)
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                style={{ padding: '8px 16px', background: activeTab === 'pending' ? '#C0182A' : '#f1f5f9', color: activeTab === 'pending' ? '#fff' : '#64748b', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', transition: '0.2s' }}
              >
                Menunggu Persetujuan
              </button>
            </div>

            <section className="clo-card">
              <div className="clo-filter-bar">
                <div className="clo-search-wrap">
                  <Search size={16} className="clo-search-icon" />
                  <input type="text" className="clo-search-input" placeholder="Cari nama CLO atau deskripsi..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
                </div>
                <div className="clo-prodi-filter">
                  <Filter size={16} color="#64748b" />
                  <select className="clo-select" value={selectedProdi} onChange={(e) => { setSelectedProdi(e.target.value); setCurrentPage(1); }}>
                    <option value="ALL">Semua Program Studi</option>
                    {prodiOptions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="clo-table-wrap">
                <table className="clo-table">
                  <thead>
                    {activeTab === 'approved' ? (
                      <tr>
                        <th className="col-no" style={{ width: '60px' }}>NO</th>
                        <th className="col-clo" style={{ width: '25%' }}>NAMA CLO</th>
                        <th style={{ width: '22%' }}>PROGRAM STUDI</th>
                        <th className="col-sub" style={{ width: '23%' }}>SUB CLO</th>
                        <th className="col-asesmen" style={{ width: '20%' }}>JENIS ASESMEN & BOBOT</th>
                        {isKaprodi && <th className="col-aksi" style={{ width: '10%' }}>AKSI</th>}
                      </tr>
                    ) : (
                      <tr>
                        <th className="col-no" style={{ width: '60px' }}>NO</th>
                        <th className="col-clo" style={{ width: '40%' }}>NAMA & DESKRIPSI CLO</th>
                        <th style={{ width: '25%' }}>PROGRAM STUDI</th>
                        <th style={{ width: '15%' }}>STATUS</th>
                        <th className="col-aksi" style={{ width: '20%' }}>AKSI</th>
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr><td colSpan={6}><div className="clo-empty-state"><span className="clo-empty-text">Memuat data CLO...</span></div></td></tr>
                    ) : paginatedList.length === 0 ? (
                      <tr>
                        <td colSpan={6}>
                          <div className="clo-empty-state">
                            <ClipboardList size={36} color="#D1D5DB" />
                            <span className="clo-empty-text">{search ? 'Tidak ada CLO yang sesuai pencarian.' : 'Belum ada data CLO di tab ini.'}</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedList.map((item, idx) => {
                        const targetProdiId = activeTab === 'pending' ? (item.studyProgramId || item.payload?.studyProgramId) : item.studyProgramId;
                        const foundProdi = prodiOptions.find(p => String(p.id) === String(targetProdiId));
                        const namaProdiDisplay = foundProdi?.name || item.studyProgram?.name || '-';

                        if (activeTab === 'pending') {
                          return (
                            <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}>
                              <td className="col-no clo-no">{(safePage - 1) * PAGE_SIZE + idx + 1}</td>
                              <td className="clo-clo">
                                <div className="clo-text-bold">{item.title || item.payload?.name || 'Pengajuan CLO Baru'}</div>
                                <div className="clo-text-muted">{item.payload?.description || '-'}</div>
                              </td>
                              <td>
                                <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#1e293b', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '6px 10px', borderRadius: '6px', display: 'inline-block', lineHeight: 1.4 }}>
                                  {namaProdiDisplay}
                                </div>
                              </td>
                              <td><span style={{ fontSize: 11, background: '#fef3c7', color: '#b45309', padding: '4px 8px', borderRadius: 9999, fontWeight: 700 }}>Menunggu</span></td>
                              <td className="col-aksi">
                                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                  {isKetuaKK && (
                                    <>
                                      <button onClick={() => requestApprove(item.id)} disabled={isActionLoading} style={{ padding: '6px 12px', borderRadius: 6, background: '#16a34a', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 12 }}>
                                        <Check size={14} /> Terima
                                      </button>
                                      <button onClick={() => setRejectModalData(item.id)} disabled={isActionLoading} style={{ padding: '6px 12px', borderRadius: 6, background: '#dc2626', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 12 }}>
                                        <XCircle size={14} /> Tolak
                                      </button>
                                    </>
                                  )}
                                  {isKaprodi && !isKetuaKK && (
                                    <button onClick={() => requestCancel(item.id)} disabled={isActionLoading} style={{ padding: '6px 12px', borderRadius: 6, background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', cursor: 'pointer', fontSize: 12 }}>
                                      Batalkan
                                    </button>
                                  )}
                                </div>
                              </td>
                            </motion.tr>
                          );
                        }

                        const subs = getSubList(item);
                        const asms = getAsmList(item);
                        const totalBobot = asms.reduce((s, a) => s + (Number(a.bobot) || 0), 0);
                        return (
                          <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}>
                            <td className="col-no clo-no">{(safePage - 1) * PAGE_SIZE + idx + 1}</td>
                            <td className="clo-clo">
                              <div className="clo-text-bold">{item.name}</div>
                              <div className="clo-text-muted">{item.description}</div>
                            </td>
                            <td>
                              <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#1e293b', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '6px 10px', borderRadius: '6px', display: 'inline-block', lineHeight: 1.4 }}>
                                {namaProdiDisplay}
                              </div>
                            </td>
                            <td className="col-sub">
                              {subs.length === 0 ? <span className="clo-dash">Belum ada Sub CLO</span> : subs.map((s, i) => (
                                <div key={s.id ?? i} className="clo-list-item">
                                  <span className="clo-sub-title">{s.name}</span>
                                  {s.description && <div className="clo-sub-desc">{s.description}</div>}
                                </div>
                              ))}
                            </td>
                            <td className="col-asesmen">
                              {asms.length === 0 ? <span className="clo-dash">Belum ada asesmen</span> : (
                                <>
                                  {asms.map((a, i) => (
                                    <div key={a.id ?? i} className="clo-asm-item"><span>{a.content}</span><span className="clo-asm-bobot">{toPercent(a.bobot)}</span></div>
                                  ))}
                                  <div className="clo-asm-total">Total <strong>{toPercent(totalBobot)}</strong></div>
                                </>
                              )}
                            </td>
                            {isKaprodi && (
                              <td className="col-aksi">
                                <div className="clo-aksi-wrap">
                                  <button className="clo-btn-edit-text" onClick={() => handleEditCLO(item)}>Edit</button>
                                  <button className="clo-btn-delete" onClick={() => requestDelete(item.id)}><Trash2 size={16} /></button>
                                </div>
                              </td>
                            )}
                          </motion.tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {totalItems > 0 && (
                <div className="clo-footer">
                  <span className="clo-page-info">Menampilkan {(safePage - 1) * PAGE_SIZE + 1} - {Math.min(safePage * PAGE_SIZE, totalItems)} dari {totalItems} data</span>
                  <div className="clo-pagination-wrap">
                    <button className="clo-btn-page" disabled={safePage === 1 || isLoading} onClick={() => setCurrentPage(safePage - 1)}><ChevronLeft size={14} /></button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button key={p} className={`clo-btn-page ${p === safePage ? 'active' : ''}`} onClick={() => setCurrentPage(p)} disabled={isLoading}>{p}</button>
                    ))}
                    <button className="clo-btn-page" disabled={safePage === totalPages || isLoading} onClick={() => setCurrentPage(safePage + 1)}><ChevronRight size={14} /></button>
                  </div>
                </div>
              )}
            </section>
          </main>
        </div>
      </div>

      <AnimatePresence>
        {alertNotif.show && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            style={{ position: 'fixed', top: 24, right: 24, zIndex: 99999, width: '300px' }}
          >
            <CustomAlert type={alertNotif.type} title={alertNotif.title} message={alertNotif.message} style={{ margin: 0, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={executeConfirmAction}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        isDestructive={confirmDialog.isDestructive}
        isSubmitting={isActionLoading}
      />

      <RejectModal
        isOpen={!!rejectModalData}
        onClose={() => setRejectModalData(null)}
        onConfirm={handleConfirmReject}
        isSubmitting={isActionLoading}
      />

      <KelolaCLOModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        existingData={selectedCLO}
        onSuccess={() => { fetchCLOData(); triggerAlert('success', 'Berhasil', 'Data CLO berhasil disimpan.'); }}
      />
    </div>
  );
};

export default KelolaCLO;