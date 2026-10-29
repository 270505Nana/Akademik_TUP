import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

const translateAction = (action) => {
  switch (action?.toUpperCase()) {
    case 'CREATE': return 'Pengajuan Baru';
    case 'UPDATE':
    case 'PUT': return 'Pembaruan Data';
    case 'DELETE': return 'Penghapusan';
    default: return 'Pengajuan Baru';
  }
};

// ================= MODAL COMPONENTS =================

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText, isDestructive, isSubmitting }) => {
  if (!isOpen) return null;
  return (
    <div className="clo-modal-backdrop">
      <motion.div 
        className="clo-modal-box"
        onClick={e => e.stopPropagation()} 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="clo-modal-header">
          <h3 className="clo-modal-title">
            {isDestructive && <AlertTriangle size={16} color="#dc2626" />}
            {title}
          </h3>
          <button onClick={onClose} className="clo-modal-close-btn"><CloseIcon size={16} /></button>
        </div>
        <div className="clo-modal-body">
          {message}
        </div>
        <div className="clo-modal-footer">
          <button onClick={onClose} disabled={isSubmitting} className="clo-btn-modal-cancel">Batal</button>
          <button 
            onClick={onConfirm} 
            disabled={isSubmitting} 
            className={`clo-btn-modal-confirm ${isDestructive ? 'clo-btn-modal-danger' : ''}`}>
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
    <div className="clo-modal-backdrop">
      <motion.div 
        className="clo-modal-box large"
        onClick={e => e.stopPropagation()} 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="clo-modal-header">
          <h3 className="clo-modal-title">Tolak Pengajuan</h3>
          <button onClick={onClose} className="clo-modal-close-btn"><CloseIcon size={16} /></button>
        </div>
        <div className="clo-modal-body">
          <label className="clo-form-label">Alasan Penolakan <span className="clo-form-req">*</span></label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Berikan alasan detail..."
            className="clo-textarea"
          />
        </div>
        <div className="clo-modal-footer">
          <button onClick={onClose} disabled={isSubmitting} className="clo-btn-modal-cancel">Batal</button>
          <button 
            onClick={() => note.trim() ? onConfirm(note) : alert('Alasan wajib diisi!')} 
            disabled={isSubmitting} 
            className="clo-btn-modal-confirm clo-btn-modal-danger">
            {isSubmitting ? 'Memproses...' : 'Tolak Pengajuan'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ================= MAIN COMPONENT =================

const KelolaCLO = () => {
  const { profile } = useAuth();
  const isKetuaKK = profile?.isKetuaKK ?? false;
  const isKaprodi = profile?.isKetuaProdi ?? false;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  
  const [activeTab, setActiveTab] = useState('approved'); 
  const [search, setSearch] = useState('');
  const [selectedProdi, setSelectedProdi] = useState('ALL');
  const [entityFilter, setEntityFilter] = useState('ALL'); 
  
  const [prodiOptions, setProdiOptions] = useState([]);
  const [approvedCLOs, setApprovedCLOs] = useState([]); 
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
    getStudyPrograms({ limit: 100 }).then((res) => setProdiOptions(toList(res))).catch(console.error);
  }, []);

  const fetchCLOData = useCallback(async () => {
    setIsLoading(true);
    try {
      let approvedRes = await getCLOs({ limit: 100 }).catch(() => getCLOs({ limit: 50 }));
      const approvedData = toList(approvedRes);
      setApprovedCLOs(approvedData);

      if (activeTab === 'approved') setCloList(approvedData);
      else {
        const params = { status: 'PENDING', limit: 100 };
        if (entityFilter !== 'ALL') params.entityType = entityFilter;
        const res = await getApprovalRequests(params);
        setCloList(toList(res));
      }
    } catch (err) {
      console.error(err);
      setCloList([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, entityFilter]);

  useEffect(() => { setCurrentPage(1); fetchCLOData(); }, [fetchCLOData, activeTab, entityFilter]);

  const q = search.trim().toLowerCase();
  const filteredList = cloList.filter((item) => {
    const title = activeTab === 'pending' ? (item.title || item.payload?.name || item.payload?.content) : item.name;
    const desc = activeTab === 'pending' ? item.payload?.description : item.description;
    const matchesSearch = !q || title?.toLowerCase().includes(q) || desc?.toLowerCase().includes(q);
    const matchesProdi = selectedProdi === 'ALL' || String(item.studyProgramId || item.payload?.studyProgramId) === String(selectedProdi);
    return matchesSearch && matchesProdi;
  });

  const groupedPendingList = useMemo(() => {
    if (activeTab !== 'pending') return [];
    const groups = {}; 
    filteredList.forEach(item => {
      if (item.entityType === 'CLO') {
        const key = item.entityId || item.id;
        if (!groups[key]) groups[key] = { parentReq: item, children: [], parentName: item.payload?.name || item.title, prodiId: item.studyProgramId || item.payload?.studyProgramId };
        else { groups[key].parentReq = item; groups[key].parentName = item.payload?.name || item.title; groups[key].prodiId = item.studyProgramId || item.payload?.studyProgramId; }
      } else {
        const parentId = item.payload?.cloProdiId;
        if (parentId) {
          if (!groups[parentId]) {
            const approvedParent = approvedCLOs.find(c => String(c.id) === String(parentId));
            groups[parentId] = { parentReq: null, children: [], parentName: approvedParent?.name || `CLO (ID: ${parentId})`, prodiId: approvedParent?.studyProgramId || item.studyProgramId || item.payload?.studyProgramId };
          }
          groups[parentId].children.push(item);
        } else {
          groups[`orphan-${item.id}`] = { parentReq: null, children: [item], parentName: 'Pengajuan Tanpa Induk', prodiId: item.studyProgramId };
        }
      }
    });
    return Object.values(groups);
  }, [filteredList, activeTab, approvedCLOs]);

  const totalItems = activeTab === 'approved' ? filteredList.length : groupedPendingList.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  
  const paginatedApproved = activeTab === 'approved' ? filteredList.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE) : [];
  const paginatedPendingGroups = activeTab === 'pending' ? groupedPendingList.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE) : [];

  const handleAddCLO = () => { setSelectedCLO(null); setIsModalOpen(true); };
  const handleEditCLO = (item) => { setSelectedCLO(item); setIsModalOpen(true); };

  const requestDelete = (id) => setConfirmDialog({ isOpen: true, type: 'delete', id, title: 'Hapus Data', message: 'Yakin hapus data ini?', confirmText: 'Hapus', isDestructive: true });
  const requestApprove = (id) => setConfirmDialog({ isOpen: true, type: 'approve', id, title: 'Setujui Pengajuan', message: 'Yakin setujui pengajuan ini?', confirmText: 'Terima', isDestructive: false });
  const requestCancel = (id) => setConfirmDialog({ isOpen: true, type: 'cancel', id, title: 'Batalkan', message: 'Yakin batalkan pengajuan ini?', confirmText: 'Batalkan', isDestructive: true });

  const executeConfirmAction = async () => {
    setIsActionLoading(true);
    const { type, id } = confirmDialog;
    try {
      if (type === 'delete') { await deleteCLO(id); triggerAlert('success', 'Berhasil', 'Data dihapus.'); }
      else if (type === 'approve') { await approveRequest(id); triggerAlert('success', 'Disetujui', 'Pengajuan disetujui.'); }
      else if (type === 'cancel') { await cancelRequest(id); triggerAlert('success', 'Dibatalkan', 'Pengajuan dibatalkan.'); }
      fetchCLOData();
    } catch (err) { triggerAlert('error', 'Gagal', err.response?.data?.message || 'Terjadi kesalahan.'); } 
    finally { setIsActionLoading(false); setConfirmDialog(prev => ({ ...prev, isOpen: false })); }
  };

  const handleConfirmReject = async (note) => {
    try {
      setIsActionLoading(true); await rejectRequest(rejectModalData, note);
      setRejectModalData(null); triggerAlert('success', 'Ditolak', 'Penolakan terkirim.'); fetchCLOData();
    } catch (err) { triggerAlert('error', 'Gagal', err.response?.data?.message || 'Terjadi kesalahan.'); } 
    finally { setIsActionLoading(false); }
  };

  const ActionButtons = ({ item, isCompact = false }) => {
    return (
      <div className={`clo-action-btn-group ${isCompact ? 'compact' : 'normal'}`}>
        {isKetuaKK && (
          <>
            <button onClick={() => requestApprove(item.id)} disabled={isActionLoading} className={`clo-btn-action accept ${isCompact ? 'compact' : 'normal'}`} title="Terima">
              <Check size={12} /> {!isCompact && 'Terima'}
            </button>
            <button onClick={() => setRejectModalData(item.id)} disabled={isActionLoading} className={`clo-btn-action reject ${isCompact ? 'compact' : 'normal'}`} title="Tolak">
              <XCircle size={12} /> {!isCompact && 'Tolak'}
            </button>
          </>
        )}
        {isKaprodi && !isKetuaKK && (
          <button onClick={() => requestCancel(item.id)} disabled={isActionLoading} className={`clo-btn-action cancel ${isCompact ? 'compact' : 'normal'}`} title="Batalkan">
            {isCompact ? <CloseIcon size={12} /> : 'Batalkan'}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className={`clo-root ${isDesktopCollapsed ? 'desktop-collapsed' : ''}`}>
      <SidebarDosen isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="clo-main">
        <div className="clo-mobile-bar">
          <button className="clo-mobile-btn" onClick={() => setSidebarOpen(true)}><Menu size={18} /></button>
          <span className="clo-mobile-title">SIMTA</span>
        </div>

        <div className="clo-page-wrapper">
          <header className="clo-topbar">
            <button className="clo-topbar-toggle" onClick={handleToggleSidebar}><Menu size={18} /></button>
            <h1>Kelola CLO & Asesmen</h1>
          </header>

          <main className="clo-content">
            <div className="clo-page-title-row">
              <h2 className="clo-page-title">Daftar CLO Program Studi</h2>
              {isKaprodi && <button className="clo-btn-add" onClick={handleAddCLO}><Plus size={14} /> Tambah CLO</button>}
            </div>

            <div className="clo-tab-wrap">
              <button onClick={() => { setActiveTab('approved'); setEntityFilter('ALL'); }} className={`clo-tab-btn ${activeTab === 'approved' ? 'active' : ''}`}>Sudah Disetujui</button>
              <button onClick={() => setActiveTab('pending')} className={`clo-tab-btn ${activeTab === 'pending' ? 'active' : ''}`}>Menunggu Persetujuan</button>
            </div>

            <section className="clo-card">
              <div className="clo-filter-bar">
                <div className="clo-search-wrap">
                  <Search className="clo-search-icon" />
                  <input type="text" className="clo-search-input" placeholder="Cari nama atau deskripsi..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
                </div>
                <div className="clo-prodi-filter">
                  {activeTab === 'pending' && (
                    <>
                      <Filter size={14} color="#64748b" />
                      <select className="clo-select" value={entityFilter} onChange={(e) => { setEntityFilter(e.target.value); setCurrentPage(1); }}>
                        <option value="ALL">Semua Jenis</option>
                        <option value="CLO">Hanya CLO</option>
                        <option value="SUB_CLO">Hanya Sub</option>
                        <option value="JENIS_ASESMEN">Hanya Asesmen</option>
                      </select>
                    </>
                  )}
                  <Filter size={14} color="#64748b" />
                  <select className="clo-select" value={selectedProdi} onChange={(e) => { setSelectedProdi(e.target.value); setCurrentPage(1); }}>
                    <option value="ALL">Semua Prodi</option>
                    {prodiOptions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="clo-table-wrap">
                <table className="clo-table">
                  <thead>
                    <tr>
                      <th className="col-no">NO</th>
                      <th className="col-clo">NAMA CLO</th>
                      <th style={{ width: '16%' }}>PRODI</th>
                      <th className="col-sub">SUB CLO</th>
                      <th className="col-asesmen">ASESMEN & BOBOT</th>
                      <th className="col-aksi">AKSI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? <tr><td colSpan={6}><div className="clo-empty-state"><span className="clo-empty-text">Memuat...</span></div></td></tr>
                    : totalItems === 0 ? <tr><td colSpan={6}><div className="clo-empty-state"><span className="clo-empty-text">Tidak ada data.</span></div></td></tr>
                    : activeTab === 'approved' ? paginatedApproved.map((item, idx) => {
                      const foundProdi = prodiOptions.find(p => String(p.id) === String(item.studyProgramId));
                      const asms = getAsmList(item);
                      const totalBobot = asms.reduce((s, a) => s + (Number(a.bobot) || 0), 0);
                      return (
                        <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <td className="col-no clo-no">{(safePage - 1) * PAGE_SIZE + idx + 1}</td>
                          <td className="clo-clo">
                            <div className="clo-text-bold">{item.name}</div>
                            <div className="clo-text-muted">{item.description}</div>
                          </td>
                          <td>
                            <div className="clo-prodi-tag">
                              {foundProdi?.name || item.studyProgram?.name || '-'}
                            </div>
                          </td>
                          <td className="col-sub">
                            {getSubList(item).length === 0 ? <span className="clo-dash">-</span> : getSubList(item).map((s, i) => (
                              <div key={s.id ?? i} className="clo-list-item">
                                <span className="clo-sub-title">{s.name}</span>
                                {s.description && <div className="clo-sub-desc">{s.description}</div>}
                              </div>
                            ))}
                          </td>
                          <td className="col-asesmen">
                            {asms.length === 0 ? <span className="clo-dash">-</span> : (
                              <>{asms.map((a, i) => (
                                <div key={a.id ?? i} className="clo-asm-item"><span>{a.content}</span><span className="clo-asm-bobot">{toPercent(a.bobot)}</span></div>
                              ))}<div className="clo-asm-total">Total <strong>{toPercent(totalBobot)}</strong></div></>
                            )}
                          </td>
                          {isKaprodi ? (
                            <td className="col-aksi"><div className="clo-aksi-wrap"><button className="clo-btn-edit-text" onClick={() => handleEditCLO(item)}>Edit</button><button className="clo-btn-delete" onClick={() => requestDelete(item.id)}><Trash2 size={14} /></button></div></td>
                          ) : <td><span className="clo-dash">-</span></td>}
                        </motion.tr>
                      );
                    }) : paginatedPendingGroups.map((group, gIdx) => {
                      const groupNo = (safePage - 1) * PAGE_SIZE + gIdx + 1;
                      const parentReq = group.parentReq;
                      const subs = group.children.filter(c => c.entityType === 'SUB_CLO');
                      const asms = group.children.filter(c => c.entityType === 'JENIS_ASESMEN');
                      const foundProdi = prodiOptions.find(p => String(p.id) === String(group.prodiId));

                      return (
                        <motion.tr key={`group-${gIdx}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <td className="col-no clo-no">{groupNo}</td>
                          <td className="clo-clo">
                            <div className="clo-text-bold">{group.parentName}</div>
                            {parentReq ? (
                              <><div className="clo-text-muted">{parentReq.payload?.description || '-'}</div>
                                <span className="clo-badge-pending">Menunggu</span>
                                <div className="clo-action-wrap"><span className="clo-badge-action">Jenis: {translateAction(parentReq.action)}</span></div>
                              </>
                            ) : <span className="clo-parent-hint">*Induk Aktif</span>}
                          </td>
                          <td>
                            <div className="clo-prodi-tag">
                              {foundProdi?.name || '-'}
                            </div>
                          </td>
                          <td className="col-sub">
                            {subs.length === 0 ? <span className="clo-dash">-</span> : subs.map(sub => (
                              <div key={sub.id} className="clo-child-card">
                                <div className="clo-child-flex">
                                  <div className="clo-child-content">
                                    <div className="clo-sub-title">{sub.payload?.name || sub.title}</div>
                                    <div className="clo-sub-desc">{sub.payload?.description || '-'}</div>
                                    <div className="clo-action-wrap"><span className="clo-badge-action">Jenis: {translateAction(sub.action)}</span></div>
                                  </div>
                                  <div className="clo-child-actions"><ActionButtons item={sub} isCompact={true} /></div>
                                </div>
                              </div>
                            ))}
                          </td>
                          <td className="col-asesmen">
                            {asms.length === 0 ? <span className="clo-dash">-</span> : asms.map(asm => (
                              <div key={asm.id} className="clo-child-card">
                                <div className="clo-child-flex">
                                  <div className="clo-child-content">
                                    <div className="clo-child-asm-title">{asm.payload?.content || asm.title}</div>
                                    <div className="clo-asm-bobot clo-child-asm-bobot">Bobot: {toPercent(asm.payload?.bobot)}</div>
                                    <div className="clo-action-wrap"><span className="clo-badge-action">Jenis: {translateAction(asm.action)}</span></div>
                                  </div>
                                  <div className="clo-child-actions"><ActionButtons item={asm} isCompact={true} /></div>
                                </div>
                              </div>
                            ))}
                          </td>
                          <td className="col-aksi">{parentReq ? <ActionButtons item={parentReq} /> : <span className="clo-dash">-</span>}</td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {totalItems > 0 && (
                <div className="clo-footer">
                  <span className="clo-page-info">Tampil {(safePage - 1) * PAGE_SIZE + 1} - {Math.min(safePage * PAGE_SIZE, totalItems)} dari {totalItems}</span>
                  <div className="clo-pagination-wrap">
                    <button className="clo-btn-page" disabled={safePage === 1 || isLoading} onClick={() => setCurrentPage(safePage - 1)}><ChevronLeft size={12} /></button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button key={p} className={`clo-btn-page ${p === safePage ? 'active' : ''}`} onClick={() => setCurrentPage(p)} disabled={isLoading}>{p}</button>
                    ))}
                    <button className="clo-btn-page" disabled={safePage === totalPages || isLoading} onClick={() => setCurrentPage(safePage + 1)}><ChevronRight size={12} /></button>
                  </div>
                </div>
              )}
            </section>
          </main>
        </div>
      </div>
      
      {/* MODALS */}
      <AnimatePresence>
        {alertNotif.show && (
          <motion.div initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 300, opacity: 0 }} className="clo-alert-wrapper">
            <CustomAlert type={alertNotif.type} title={alertNotif.title} message={alertNotif.message} />
          </motion.div>
        )}
      </AnimatePresence>
      <ConfirmModal isOpen={confirmDialog.isOpen} onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))} onConfirm={executeConfirmAction} title={confirmDialog.title} message={confirmDialog.message} confirmText={confirmDialog.confirmText} isDestructive={confirmDialog.isDestructive} isSubmitting={isActionLoading} />
      <RejectModal isOpen={!!rejectModalData} onClose={() => setRejectModalData(null)} onConfirm={handleConfirmReject} isSubmitting={isActionLoading} />
      <KelolaCLOModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} existingData={selectedCLO} onSuccess={() => { fetchCLOData(); triggerAlert('success', 'Berhasil', 'Data disimpan.'); }} />
    </div>
  );
};

export default KelolaCLO;