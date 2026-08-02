import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Search, ChevronLeft, ChevronRight, Menu,
  Users, Settings2, X, AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import SidebarAdmin  from '../../components/sidebar/SidebarAdmin';
import CustomAlert   from '../../components/common/CustomAlert';
import KelolaKKModal from '../../components/common/KelolaKKModal';
import '../../components/admin/css/keloladatadosen.css';

const PAGE_SIZE = 50;

const INITIAL_RESEARCH_GROUPS = [
  { id: 1, name: 'Applied Artificial Intelligence' },
  { id: 2, name: 'Bioengineering, Food Technology and Advance Material' },
  { id: 3, name: 'Cyber Security, IOT, and Cloud System' },
  { id: 4, name: 'Data Science and Optimization' },
  { id: 5, name: 'Electronics and Telecommunications Science' },
  { id: 6, name: 'Industrial Systems Engineering' },
  { id: 7, name: 'Information System, Digital Business & Data Driven Solution' },
  { id: 8, name: 'Media, Design and Creative Innovation' },
  { id: 9, name: 'Software Engineering and Multimedia' },
];

const INITIAL_DOSEN = [
  { id: 1, nama: 'Dr. Budi Santoso',                       nip: '198706152019031001', researchGroupId: 5, isKetuaKK: true  },
  { id: 2, nama: 'Dr. Siti Rahmawati',                      nip: '197912042018022002', researchGroupId: 8, isKetuaKK: false },
  { id: 6, nama: 'A. Magfirah Nugraheni, S.Ds., M.Ds.',     nip: '25000021',           researchGroupId: 8, isKetuaKK: false },
  { id: 7, nama: 'Abednego Dwi Septiadi, S.Kom., M.Kom.',   nip: '22890018',           researchGroupId: 9, isKetuaKK: true  },
  { id: 8, nama: 'Achmad Rizal Danisya, S.T., M.T.',        nip: '14830059',           researchGroupId: 6, isKetuaKK: false },
  { id: 11, nama: 'Adanti Wido Paramadini, S.T., M.Eng',    nip: '22930002',           researchGroupId: 4, isKetuaKK: false },
  { id: 12, nama: 'Ade Yanyan Ramdhani, S.T., M.T.',        nip: '23960028',           researchGroupId: 6, isKetuaKK: false },
  { id: 13, nama: 'Aditya Dwi Putro W., S.Kom., M.Kom.',    nip: '17930052',           researchGroupId: 9, isKetuaKK: false },
  { id: 15, nama: 'Aditya Wijayanto, S.Kom., M.Sc.',        nip: '20890004',           researchGroupId: 1, isKetuaKK: false },
];

const ToggleSwitch = ({ checked, onChange }) => (
  <button
    type="button"
    className={`dd-switch ${checked ? 'on' : 'off'}`}
    onClick={() => onChange(!checked)}
  >
    <span className="dd-switch-knob" />
  </button>
);

const EditDosenModal = ({ dosen, researchGroups, dosenList, onClose, onSave }) => {
  const [researchGroupId, setResearchGroupId] = useState(dosen.researchGroupId);
  const [isKetuaKK,       setIsKetuaKK]       = useState(dosen.isKetuaKK);
  const [warning,         setWarning]         = useState(null);

  const currentKetua = useMemo(() => {
    return dosenList.find(d =>
      d.id !== dosen.id &&
      d.researchGroupId === researchGroupId &&
      d.isKetuaKK
    ) || null;
  }, [dosenList, researchGroupId, dosen.id]);

  useEffect(() => {
    setWarning(null);
  }, [researchGroupId]);

  const handleToggleKetua = (nextValue) => {
    if (nextValue && currentKetua) {
      setWarning(`Tidak bisa, KK ini sudah memiliki ketua: ${currentKetua.nama}`);
      return;
    }
    setWarning(null);
    setIsKetuaKK(nextValue);
  };

  const handleSubmit = () => {
    if (isKetuaKK && currentKetua) {
      setWarning(`Tidak bisa, KK ini sudah memiliki ketua: ${currentKetua.nama}`);
      return;
    }
    onSave(dosen.id, { researchGroupId, isKetuaKK });
  };

  return (
    <div className="dd-modal-overlay" onClick={onClose}>
      <motion.div
        className="dd-modal-box dd-modal-edit"
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
      >
        <div className="dd-modal-header">
          <h3 className="dd-modal-title">Edit Data Dosen</h3>
          <button className="dd-modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="dd-modal-body">
          <div className="dd-form-group">
            <label className="dd-form-label">Nama Dosen</label>
            <div className="dd-form-static">
              {dosen.nama}
              <div className="dd-form-sub">NIDN/NIP: {dosen.nip}</div>
            </div>
          </div>

          <div className="dd-form-group">
            <label className="dd-form-label">Kelompok Keahlian</label>
            <select
              className="dd-form-select"
              value={researchGroupId}
              onChange={(e) => setResearchGroupId(Number(e.target.value))}
            >
              {researchGroups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          <div className="dd-form-group" style={{ marginBottom: 0 }}>
            <div className="dd-toggle-row">
              <div>
                <div className="dd-toggle-label">Ketua KK</div>
                <div className="dd-toggle-desc">Tandai dosen ini sebagai ketua kelompok keahlian</div>
              </div>
              <ToggleSwitch checked={isKetuaKK} onChange={handleToggleKetua} />
            </div>
            {warning && (
              <div className="dd-toggle-warning">
                <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                {warning}
              </div>
            )}
          </div>
        </div>

        <div className="dd-modal-footer">
          <button className="dd-btn-cancel" onClick={onClose}>Batal</button>
          <button className="dd-btn-save" onClick={handleSubmit}>Simpan Perubahan</button>
        </div>
      </motion.div>
    </div>
  );
};

const KelolaDataDosen = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [dosenList,      setDosenList]      = useState(INITIAL_DOSEN);
  const [researchGroups, setResearchGroups] = useState(INITIAL_RESEARCH_GROUPS);

  const [search,          setSearch]          = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [filterKK,        setFilterKK]        = useState('');
  const [currentPage,     setCurrentPage]     = useState(1);

  const [editingDosen, setEditingDosen] = useState(null);
  const [showKelolaKK, setShowKelolaKK] = useState(false);
  const [alert,        setAlert]        = useState({ show: false, type: '', title: '', message: '' });

  const showAlert = useCallback((type, title, message) => {
    setAlert({ show: true, type, title, message });
    setTimeout(() => setAlert(p => ({ ...p, show: false })), 3500);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => setCurrentPage(1), [searchDebounced, filterKK]);

  const kkNameById = useCallback((id) => {
    return researchGroups.find(g => g.id === id)?.name ?? '—';
  }, [researchGroups]);

  const filteredList = useMemo(() => {
    return dosenList
      .filter(d => {
        if (!searchDebounced) return true;
        return d.nama.toLowerCase().includes(searchDebounced) || d.nip.toLowerCase().includes(searchDebounced);
      })
      .filter(d => {
        if (!filterKK) return true;
        return d.researchGroupId === Number(filterKK);
      });
  }, [dosenList, searchDebounced, filterKK]);

  const totalPages = Math.max(1, Math.ceil(filteredList.length / PAGE_SIZE));
  const paginated  = filteredList.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSaveDosen = (dosenId, { researchGroupId, isKetuaKK }) => {
    setDosenList(prev => prev.map(d =>
      d.id === dosenId ? { ...d, researchGroupId, isKetuaKK } : d
    ));
    setEditingDosen(null);
    showAlert('success', 'Berhasil', 'Data dosen berhasil diperbarui.');
  };

  const handleRenameKK = (groupId, newName) => {
    setResearchGroups(prev => prev.map(g => g.id === groupId ? { ...g, name: newName } : g));
    showAlert('success', 'Berhasil', 'Nama kelompok keahlian berhasil diperbarui.');
  };

  const handleCreateKK = (name) => {
    setResearchGroups(prev => {
      const nextId = prev.length ? Math.max(...prev.map(g => g.id)) + 1 : 1;
      return [...prev, { id: nextId, name }];
    });
    showAlert('success', 'Berhasil', 'Kelompok keahlian baru berhasil ditambahkan.');
  };

  return (
    <div className="dd-root">
      <SidebarAdmin isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="dd-main">
        <div className="dd-mobile-bar">
          <button className="dd-mobile-btn" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <span className="dd-mobile-title">SIMTA</span>
        </div>

        <div className="dd-page-wrapper">
          <div className="dd-topbar"><h1>Manajemen Data Dosen</h1></div>

          <div className="dd-content">
            <div className="dd-page-title-row">
              <h2 className="dd-page-title">Daftar Dosen</h2>
              <button className="dd-btn-kelola-kk" onClick={() => setShowKelolaKK(true)}>
                <Settings2 size={15} />
                Kelola Kelompok Keahlian
              </button>
            </div>

            <section className="dd-card">
              <div className="dd-filter-bar">
                <div className="dd-search-wrap">
                  <Search size={15} className="dd-search-icon" />
                  <input
                    type="text"
                    className="dd-search-input"
                    placeholder="Cari nama atau NIDN/NIP..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <select
                  className="dd-select"
                  value={filterKK}
                  onChange={(e) => setFilterKK(e.target.value)}
                >
                  <option value="">Semua Kelompok Keahlian</option>
                  {researchGroups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div className="dd-table-divider" />

              <div className="dd-table-wrap">
                <table className="dd-table">
                  <thead>
                    <tr>
                      <th style={{ width: 44 }}>NO</th>
                      <th>NAMA DOSEN</th>
                      <th>NIDN/NIP</th>
                      {/* <th>PRODI</th> */}
                      <th>KELOMPOK KEAHLIAN</th>
                      <th style={{ textAlign: 'center' }}>AKSI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 ? (
                      <tr>
                        <td colSpan={6}>
                          <div className="dd-empty-state">
                            <Users size={36} color="#D1D5DB" />
                            <span style={{ fontSize: 13, color: '#9CA3AF' }}>
                              {search ? 'Tidak ada hasil pencarian.' : 'Belum ada data dosen.'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginated.map((d, idx) => (
                        <motion.tr
                          key={d.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.03 }}
                        >
                          <td className="dd-td-center dd-td-num">
                            {(currentPage - 1) * PAGE_SIZE + idx + 1}
                          </td>
                          <td>
                            <div className="dd-dosen-nama">{d.nama}</div>
                          </td>
                          <td>{d.nip}</td>
                          {/* <td><span className="dd-prodi-empty">-</span></td> */}
                          <td>
                            <span className="dd-kk-badge">{kkNameById(d.researchGroupId)}</span>
                            {d.isKetuaKK && <div className="dd-ketua-badge">Ketua KK</div>}
                          </td>
                          <td className="dd-td-center">
                            <button className="dd-btn-edit" onClick={() => setEditingDosen(d)}>
                              Edit
                            </button>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {filteredList.length > 0 && (
                <div className="dd-footer">
                  <span className="dd-page-info">
                    Menampilkan {Math.min((currentPage - 1) * PAGE_SIZE + 1, filteredList.length)}–{Math.min(currentPage * PAGE_SIZE, filteredList.length)} dari {filteredList.length} data
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button className="dd-btn-page" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                      <ChevronLeft size={14} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button
                        key={p}
                        className={`dd-btn-page ${p === currentPage ? 'active' : ''}`}
                        onClick={() => setCurrentPage(p)}
                      >
                        {p}
                      </button>
                    ))}
                    <button className="dd-btn-page" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {alert.show && (
          <motion.div
            style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, maxWidth: 380 }}
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0,   opacity: 1 }}
            exit={{    x: 300, opacity: 0 }}
          >
            <CustomAlert type={alert.type} title={alert.title} message={alert.message} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingDosen && (
          <EditDosenModal
            dosen={editingDosen}
            researchGroups={researchGroups}
            dosenList={dosenList}
            onClose={() => setEditingDosen(null)}
            onSave={handleSaveDosen}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showKelolaKK && (
          <KelolaKKModal
            researchGroups={researchGroups}
            onClose={() => setShowKelolaKK(false)}
            onRename={handleRenameKK}
            onCreate={handleCreateKK}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default KelolaDataDosen;