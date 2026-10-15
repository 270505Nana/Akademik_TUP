import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search, ChevronLeft, ChevronRight, Menu,
  Users, Settings2, X, AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import api, { getAllDosen, getResearchGroups, getStudyPrograms, createResearchGroup, updateResearchGroup, deleteResearchGroup } from '../../service/api';
import SidebarAdmin from '../../components/sidebar/SidebarAdmin';
import CustomAlert from '../../components/common/CustomAlert';
import KelolaKKModal from '../../components/common/KelolaKKModal';
import '../../style/css/admin/keloladatadosen.css';

const PAGE_SIZE = 10;

// Daftar statis pilihan Kepala Urusan Akademik (KAUR) untuk menjaga konsistensi format
const KAUR_OPTIONS = [
  { value: 'Kepala Urusan Akademik Fakultas Informatika', label: 'Kepala Urusan Akademik Fakultas Informatika' },
  // Kamu bisa menambahkan opsi fakultas lain di sini jika diperlukan ke depannya
];

const ToggleSwitch = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    className={`dd-switch ${checked ? 'on' : 'off'}`}
    onClick={() => onChange(!checked)}
    disabled={disabled}
  >
    <span className="dd-switch-knob" />
  </button>
);

const EditDosenModal = ({ dosen, researchGroups, studyPrograms, dosenList, onClose, onSave, isSaving }) => {
  // State KK
  const [isKetuaKK, setIsKetuaKK] = useState(dosen.isKetuaKK);
  const [researchGroupId, setResearchGroupId] = useState(dosen.researchGroupId);
  const [warningKK, setWarningKK] = useState(null);

  // State Prodi & Kaprodi
  const [isKetuaProdi, setIsKetuaProdi] = useState(dosen.isKetuaProdi);
  const [studyProgramId, setStudyProgramId] = useState(dosen.studyProgramId);
  const [warningProdi, setWarningProdi] = useState(null);

  // State KAUR (Kepala Urusan Akademik) - Menggunakan Dropdown Statis
  const [isKepalaUrusanAkademik, setIsKepalaUrusanAkademik] = useState(dosen.isKepalaUrusanAkademik ?? '');

  // Validasi 1 KK = 1 Ketua
  const currentKetuaKK = useMemo(() => {
    return dosenList.find(d =>
      d.id !== dosen.id &&
      d.researchGroupId === researchGroupId &&
      d.isKetuaKK
    ) || null;
  }, [dosenList, dosen.id, researchGroupId]);

  // Validasi 1 Prodi = 1 Kaprodi
  const currentKaprodi = useMemo(() => {
    return dosenList.find(d =>
      d.id !== dosen.id &&
      d.studyProgramId === studyProgramId &&
      d.isKetuaProdi
    ) || null;
  }, [dosenList, dosen.id, studyProgramId]);

  const handleToggleKetuaKK = (nextValue) => {
    if (nextValue && currentKetuaKK) {
      setWarningKK(`Tidak bisa, KK ini sudah memiliki ketua: ${currentKetuaKK.nama}`);
      return;
    }
    setWarningKK(null);
    setIsKetuaKK(nextValue);
  };

  const handleKKChange = (newGroupId) => {
    setResearchGroupId(newGroupId);
    setWarningKK(null);
    if (isKetuaKK) setIsKetuaKK(false);
  };

  const handleToggleKaprodi = (nextValue) => {
    if (!studyProgramId) {
      setWarningProdi('Pilih Program Studi terlebih dahulu.');
      return;
    }
    if (nextValue && currentKaprodi) {
      setWarningProdi(`Tidak bisa, Prodi ini sudah memiliki Kaprodi: ${currentKaprodi.nama}`);
      return;
    }
    setWarningProdi(null);
    setIsKetuaProdi(nextValue);
  };

  const handleProdiChange = (newProdiId) => {
    setStudyProgramId(newProdiId);
    setWarningProdi(null);
    if (isKetuaProdi) setIsKetuaProdi(false);
  };

  const handleSubmit = () => {
    if (isKetuaKK && currentKetuaKK) {
      setWarningKK(`Tidak bisa, KK ini sudah memiliki ketua: ${currentKetuaKK.nama}`);
      return;
    }
    if (isKetuaProdi && currentKaprodi) {
      setWarningProdi(`Tidak bisa, Prodi ini sudah memiliki Kaprodi: ${currentKaprodi.nama}`);
      return;
    }

    onSave(dosen.id, { 
      isKetuaKK, 
      researchGroupId, 
      isKetuaProdi, 
      studyProgramId, 
      isKepalaUrusanAkademik 
    });
  };

  return (
    <div className="dd-modal-overlay" onClick={onClose}>
      <motion.div
        className="dd-modal-box dd-modal-edit"
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
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
              <div className="dd-form-sub">NIDN/NIP: {dosen.nip || dosen.nidn || '-'}</div>
            </div>
          </div>

          <hr style={{ margin: '16px 0', borderColor: '#E5E7EB' }} />

          {/* Section Prodi & Jabatan KAUR/Kaprodi */}
          <div className="dd-form-group">
            <label className="dd-form-label">Program Studi</label>
            <select
              className="dd-select"
              value={studyProgramId ?? ''}
              onChange={e => handleProdiChange(e.target.value)}
              disabled={isSaving}
            >
              <option value="">— Pilih Program Studi —</option>
              {studyPrograms.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="dd-form-group">
            <div className="dd-toggle-row">
              <div>
                <div className="dd-toggle-label">Ketua Prodi (Kaprodi)</div>
                <div className="dd-toggle-desc">Tandai dosen ini sebagai Kaprodi</div>
              </div>
              <ToggleSwitch checked={isKetuaProdi} onChange={handleToggleKaprodi} disabled={isSaving} />
            </div>
            {warningProdi && (
              <div className="dd-toggle-warning">
                <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                {warningProdi}
              </div>
            )}
          </div>

          <div className="dd-form-group">
            <label className="dd-form-label">Kepala Urusan Akademik (KAUR)</label>
            <select
              className="dd-select"
              value={isKepalaUrusanAkademik}
              onChange={e => setIsKepalaUrusanAkademik(e.target.value)}
              disabled={isSaving}
            >
              <option value="">— Bukan Kepala Urusan Akademik —</option>
              {KAUR_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <hr style={{ margin: '16px 0', borderColor: '#E5E7EB' }} />

          {/* Section Kelompok Keahlian */}
          <div className="dd-form-group">
            <label className="dd-form-label">Kelompok Keahlian</label>
            <select
              className="dd-select"
              value={researchGroupId ?? ''}
              onChange={e => handleKKChange(e.target.value)}
              disabled={isSaving}
            >
              <option value="">— Pilih Kelompok Keahlian —</option>
              {researchGroups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          <div className="dd-form-group" style={{ marginBottom: 0 }}>
            <div className="dd-toggle-row">
              <div>
                <div className="dd-toggle-label">Ketua KK</div>
                <div className="dd-toggle-desc">Tandai dosen ini sebagai ketua KK</div>
              </div>
              <ToggleSwitch checked={isKetuaKK} onChange={handleToggleKetuaKK} disabled={isSaving} />
            </div>
            {warningKK && (
              <div className="dd-toggle-warning">
                <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                {warningKK}
              </div>
            )}
          </div>

        </div>

        <div className="dd-modal-footer">
          <button className="dd-btn-cancel" onClick={onClose} disabled={isSaving}>Batal</button>
          <button className="dd-btn-save" onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const KelolaDataDosen = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [dosenList, setDosenList] = useState([]);
  const [researchGroups, setResearchGroups] = useState([]);
  const [studyPrograms, setStudyPrograms] = useState([]);
  const [totalItems, setTotalItems] = useState(0);

  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [filterKK, setFilterKK] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [editingDosen, setEditingDosen] = useState(null);
  const [showKelolaKK, setShowKelolaKK] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: '', title: '', message: '' });
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const showAlert = useCallback((type, title, message) => {
    setAlert({ show: true, type, title, message });
    setTimeout(() => setAlert(p => ({ ...p, show: false })), 3500);
  }, []);

  const fetchData = useCallback(async ({ page = 1, search: q = '', researchGroupId = '' } = {}) => {
    setIsLoadingData(true);
    try {
      const params = {
        page,
        limit: PAGE_SIZE,
        ...(q && { search: q }),
        ...(researchGroupId && { researchGroupId }),
      };
      const [dosenRes, kkRaw, prodiRaw] = await Promise.all([
        getAllDosen(params),
        getResearchGroups(),
        getStudyPrograms().catch(() => [])
      ]);

      const rawList = Array.isArray(dosenRes?.data) ? dosenRes.data : [];
      const pagination = dosenRes?.pagination ?? {};

      const mapped = rawList.map(d => ({
        id: d.id,
        nama: d.name,
        nip: d.nip ?? '',
        nidn: d.nidn ?? '',
        kodeDosen: d.kodeDosen ?? '',
        researchGroupId: d.researchGroupId,
        studyProgramId: d.studyProgramId,
        isKetuaKK: d.isKetuaKK ?? false,
        isKetuaProdi: d.isKetuaProdi ?? false,
        isKepalaUrusanAkademik: d.isKepalaUrusanAkademik ?? '',
      }));

      setDosenList(mapped);
      setTotalItems(pagination.total ?? rawList.length);
      setResearchGroups(Array.isArray(kkRaw) ? kkRaw : []);
      setStudyPrograms(Array.isArray(prodiRaw) ? prodiRaw : []);
    } catch (err) {
      showAlert('error', 'Gagal Memuat Data', 'Tidak dapat mengambil data dosen. Coba muat ulang halaman.');
    } finally {
      setIsLoadingData(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchData({ page: 1 });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setCurrentPage(1);
    fetchData({ page: 1, search: searchDebounced, researchGroupId: filterKK });
  }, [searchDebounced, filterKK]);

  useEffect(() => {
    fetchData({ page: currentPage, search: searchDebounced, researchGroupId: filterKK });
  }, [currentPage]);

  const kkNameById = useCallback((id) => {
    return researchGroups.find(g => g.id === id)?.name ?? '—';
  }, [researchGroups]);

  const prodiNameById = useCallback((id) => {
    return studyPrograms.find(p => p.id === id)?.name ?? '—';
  }, [studyPrograms]);

  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const paginated = dosenList;

  const handleSaveDosen = async (dosenId, payload) => {
    const original = dosenList.find(d => d.id === dosenId);
    if (!original) return;

    const changed = 
      original.researchGroupId !== payload.researchGroupId ||
      original.isKetuaKK !== payload.isKetuaKK ||
      original.studyProgramId !== payload.studyProgramId ||
      original.isKetuaProdi !== payload.isKetuaProdi ||
      original.isKepalaUrusanAkademik !== payload.isKepalaUrusanAkademik;

    if (!changed) {
      setEditingDosen(null);
      return;
    }

    setIsSaving(true);
    try {
      await api.put(`/api/dosen/${dosenId}`, {
        nip: original.nip,
        nidn: original.nidn,
        kodeDosen: original.kodeDosen,
        name: original.nama,
        researchGroupId: payload.researchGroupId || null,
        studyProgramId: payload.studyProgramId || null,
        isKetuaKK: payload.isKetuaKK,
        isKetuaProdi: payload.isKetuaProdi,
        isKepalaUrusanAkademik: payload.isKepalaUrusanAkademik || null
      });

      await fetchData({ page: currentPage, search: searchDebounced, researchGroupId: filterKK });
      setEditingDosen(null);
      showAlert('success', 'Berhasil', 'Data dosen berhasil diperbarui.');
    } catch (err) {
      const status = err?.response?.status;
      if (status === 403) showAlert('error', 'Akses Ditolak', 'Anda tidak memiliki izin untuk mengubah data dosen.');
      else if (status === 400) showAlert('error', 'Data Tidak Valid', 'Periksa kembali data yang diisi dan coba lagi.');
      else showAlert('error', 'Gagal Menyimpan', 'Terjadi kesalahan saat menyimpan perubahan. Silakan coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRenameKK = async (groupId, newName) => {
    try {
      const updated = await updateResearchGroup(groupId, newName);
      setResearchGroups(prev => prev.map(g => g.id === groupId ? { ...g, name: updated.name } : g));
      showAlert('success', 'Berhasil', 'Nama kelompok keahlian berhasil diperbarui.');
    } catch (err) {
      showAlert('error', 'Gagal Memperbarui', 'Terjadi kesalahan saat memperbarui nama KK.');
    }
  };

  const handleCreateKK = async (name) => {
    try {
      const created = await createResearchGroup(name);
      setResearchGroups(prev => [...prev, created]);
      showAlert('success', 'Berhasil', 'Kelompok keahlian baru berhasil ditambahkan.');
    } catch (err) {
      showAlert('error', 'Gagal Membuat KK', 'Terjadi kesalahan saat membuat KK baru.');
    }
  };

  const handleDeleteKK = async (groupId) => {
    try {
      await deleteResearchGroup(groupId);
      setResearchGroups(prev => prev.filter(g => g.id !== groupId));
      if (filterKK === groupId) setFilterKK('');
      showAlert('success', 'Berhasil', 'Kelompok keahlian berhasil dihapus.');
    } catch (err) {
      showAlert('error', 'Gagal Menghapus', 'Terjadi kesalahan saat menghapus KK.');
    }
  };

  return (
    <div className="dd-root">
      <SidebarAdmin isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="dd-main">
        <div className="dd-mobile-bar">
          <button className="dd-mobile-btn" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
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
                <select className="dd-select" value={filterKK} onChange={(e) => setFilterKK(e.target.value)}>
                  <option value="">Semua Kelompok Keahlian</option>
                  {researchGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
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
                      <th>PRODI</th>
                      <th>KELOMPOK KEAHLIAN</th>
                      <th>JABATAN</th>
                      <th style={{ textAlign: 'center' }}>AKSI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingData ? (
                      <tr>
                        <td colSpan={7}>
                          <div className="dd-empty-state"><span style={{ fontSize: 13, color: '#9CA3AF' }}>Memuat data dosen...</span></div>
                        </td>
                      </tr>
                    ) : paginated.length === 0 ? (
                      <tr>
                        <td colSpan={7}>
                          <div className="dd-empty-state">
                            <Users size={36} color="#D1D5DB" />
                            <span style={{ fontSize: 13, color: '#9CA3AF' }}>{search ? 'Tidak ada hasil pencarian.' : 'Belum ada data dosen.'}</span>
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
                          <td className="dd-td-center dd-td-num">{(currentPage - 1) * PAGE_SIZE + idx + 1}</td>
                          <td><div className="dd-dosen-nama">{d.nama}</div></td>
                          <td>{d.nip || d.nidn || '-'}</td>
                          <td>{prodiNameById(d.studyProgramId)}</td>
                          <td>
                            <span className="dd-kk-badge">{kkNameById(d.researchGroupId)}</span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                              {d.isKetuaKK && <span className="dd-ketua-badge">Ketua KK</span>}
                              {d.isKetuaProdi && <span className="dd-ketua-badge" style={{ background: '#047857' }}>Kaprodi</span>}
                              {d.isKepalaUrusanAkademik && <span className="dd-ketua-badge" style={{ background: '#4F46E5', fontSize: '10px' }} title={d.isKepalaUrusanAkademik}>KAUR</span>}
                              {!d.isKetuaKK && !d.isKetuaProdi && !d.isKepalaUrusanAkademik && <span style={{ color: '#9ca3af', fontSize: '12px' }}>-</span>}
                            </div>
                          </td>
                          <td className="dd-td-center">
                            <button className="dd-btn-edit" onClick={() => setEditingDosen(d)}>Edit</button>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {totalItems > 0 && (
                <div className="dd-footer">
                  <span className="dd-page-info">
                    Menampilkan {Math.min((currentPage - 1) * PAGE_SIZE + 1, totalItems)}–{Math.min(currentPage * PAGE_SIZE, totalItems)} dari {totalItems} data
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button className="dd-btn-page" disabled={currentPage === 1 || isLoadingData} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft size={14} /></button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button key={p} className={`dd-btn-page ${p === currentPage ? 'active' : ''}`} onClick={() => setCurrentPage(p)} disabled={isLoadingData}>{p}</button>
                    ))}
                    <button className="dd-btn-page" disabled={currentPage === totalPages || isLoadingData} onClick={() => setCurrentPage(p => p + 1)}><ChevronRight size={14} /></button>
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
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
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
            studyPrograms={studyPrograms}
            dosenList={dosenList}
            onClose={() => !isSaving && setEditingDosen(null)}
            onSave={handleSaveDosen}
            isSaving={isSaving}
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
            onDelete={handleDeleteKK}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default KelolaDataDosen;