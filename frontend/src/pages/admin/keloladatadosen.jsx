import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Search, ChevronLeft, ChevronRight, Menu,
  Users, Settings2, X, AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import SidebarAdmin from '../../components/sidebar/SidebarAdmin';
import CustomAlert from '../../components/common/CustomAlert';
import KelolaKKModal from '../../components/common/KelolaKKModal';
import { getAllDosen, getResearchGroups, toggleDosenKetuaKK, updateDosenKK, createResearchGroup, updateResearchGroup, deleteResearchGroup } from '../../service/api';
import '../../components/admin/css/keloladatadosen.css';

const PAGE_SIZE = 50;



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

// Catatan investigasi: BE sudah menangani aturan "satu ketua per KK" via Prisma transaction
const EditDosenModal = ({ dosen, researchGroups, dosenList, onClose, onSave, isSaving }) => {
  const [isKetuaKK, setIsKetuaKK] = useState(dosen.isKetuaKK);
  const [researchGroupId, setResearchGroupId] = useState(dosen.researchGroupId);
  const [warning, setWarning] = useState(null);
  const currentKetua = useMemo(() => {
    return dosenList.find(d =>
      d.id !== dosen.id &&
      d.researchGroupId === researchGroupId &&
      d.isKetuaKK
    ) || null;
  }, [dosenList, dosen.id, researchGroupId]);

  const handleToggleKetua = (nextValue) => {
    if (nextValue && currentKetua) {
      setWarning(`Tidak bisa, KK ini sudah memiliki ketua: ${currentKetua.nama}`);
      return;
    }
    setWarning(null);
    setIsKetuaKK(nextValue);
  };

  const handleKKChange = (newGroupId) => {
    setResearchGroupId(newGroupId);
    setWarning(null);
    if (isKetuaKK) setIsKetuaKK(false);
  };

  const handleSubmit = () => {
    if (isKetuaKK && currentKetua) {
      setWarning(`Tidak bisa, KK ini sudah memiliki ketua: ${currentKetua.nama}`);
      return;
    }
    onSave(dosen.id, { isKetuaKK, researchGroupId });
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
            {/* PUT /api/dosen/:id kini dilindungi isAdmin — Admin bisa mengubah researchGroupId */}
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
                <div className="dd-toggle-desc">Tandai dosen ini sebagai ketua kelompok keahlian</div>
              </div>
              <ToggleSwitch checked={isKetuaKK} onChange={handleToggleKetua} disabled={isSaving} />
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

  const fetchData = useCallback(async (prevOrderIds = null) => {
    setIsLoadingData(true);
    try {
      const [dosenRaw, kkRaw] = await Promise.all([getAllDosen(), getResearchGroups()]);
      const mapped = (Array.isArray(dosenRaw) ? dosenRaw : []).map(d => ({
        id: d.id,
        nama: d.name,
        nip: d.nip ?? d.nidn ?? '',
        kodeDosen: d.kodeDosen ?? '',
        researchGroupId: d.researchGroupId,
        isKetuaKK: d.isKetuaKK ?? false,
      }));

      if (prevOrderIds && prevOrderIds.length > 0) {
        // Pertahankan urutan sesuai posisi sebelum refresh agar baris tidak loncat,
        const orderMap = new Map(prevOrderIds.map((id, i) => [id, i]));
        mapped.sort((a, b) => {
          const ia = orderMap.has(a.id) ? orderMap.get(a.id) : Infinity;
          const ib = orderMap.has(b.id) ? orderMap.get(b.id) : Infinity;
          return ia - ib;
        });
      }

      setDosenList(mapped);
      setResearchGroups(Array.isArray(kkRaw) ? kkRaw : []);
    } catch (err) {
      showAlert('error', 'Gagal Memuat Data', 'Tidak dapat mengambil data dosen. Coba muat ulang halaman.');
    } finally {
      setIsLoadingData(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
        return d.researchGroupId === filterKK;
      });
  }, [dosenList, searchDebounced, filterKK]);

  const totalPages = Math.max(1, Math.ceil(filteredList.length / PAGE_SIZE));
  const paginated = filteredList.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSaveDosen = async (dosenId, { isKetuaKK, researchGroupId }) => {
    const original = dosenList.find(d => d.id === dosenId);
    if (!original) return;

    const kkChanged = original.researchGroupId !== researchGroupId;
    const ketuaChanged = original.isKetuaKK !== isKetuaKK;

    if (!kkChanged && !ketuaChanged) {
      setEditingDosen(null);
      return;
    }

    // Simpan urutan ID sebelum fetch agar posisi baris tabel tidak loncat setelah refresh.
    const prevOrderIds = dosenList.map(d => d.id);

    setIsSaving(true);
    try {
      if (kkChanged) {
        await updateDosenKK(dosenId, {
          nip: original.nip,
          name: original.nama,
          researchGroupId: researchGroupId,
          kodeDosen: original.kodeDosen,
        });
      }

      // Jika status Ketua KK berubah, panggil toggle endpoint terpisah.
      if (ketuaChanged) {
        await toggleDosenKetuaKK(dosenId);
      }

      // Refresh dari API agar perubahan cascade BE ikut terlihat (mis. dosen lain di KK
      // yang sama otomatis di-unset), dengan mempertahankan urutan baris sebelumnya.
      await fetchData(prevOrderIds);

      setEditingDosen(null);
      showAlert('success', 'Berhasil', 'Data dosen berhasil diperbarui.');
    } catch (err) {
      const status = err?.response?.status;
      if (status === 403) {
        showAlert('error', 'Akses Ditolak', 'Anda tidak memiliki izin untuk mengubah data dosen.');
      } else if (status === 404) {
        showAlert('error', 'Data Tidak Ditemukan', 'Data dosen tidak ditemukan di server.');
      } else if (status === 400) {
        showAlert('error', 'Data Tidak Valid', 'Periksa kembali data yang diisi dan coba lagi.');
      } else {
        showAlert('error', 'Gagal Menyimpan', 'Terjadi kesalahan saat menyimpan perubahan. Silakan coba lagi.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Ganti nama KK via API (PUT /api/research-groups/:id).
  // Sebelumnya hanya update state lokal — perubahan tidak tersimpan ke DB.
  const handleRenameKK = async (groupId, newName) => {
    try {
      const updated = await updateResearchGroup(groupId, newName);
      // Gunakan data dari response BE sebagai source of truth
      setResearchGroups(prev => prev.map(g => g.id === groupId ? { ...g, name: updated.name } : g));
      showAlert('success', 'Berhasil', 'Nama kelompok keahlian berhasil diperbarui.');
    } catch (err) {
      const msg = err?.response?.data?.errors?.[0]?.message
        ?? err?.response?.data?.message
        ?? 'Terjadi kesalahan saat memperbarui nama KK.';
      showAlert('error', 'Gagal Memperbarui', msg);
    }
  };

  // Buat KK baru via API (POST /api/research-groups).
  // Sebelumnya membuat id lokal palsu (angka increment) — menyebabkan researchGroupId yang
  // dikirim ke PUT /api/dosen/:id bukan UUID asli sehingga data hilang setelah refresh.
  // BE juga menangani restore soft-delete by name, jadi tidak perlu logika tambahan di sini.
  const handleCreateKK = async (name) => {
    try {
      const created = await createResearchGroup(name);
      // ID asli UUID dari BE — aman dipakai sebagai researchGroupId dosen
      setResearchGroups(prev => [...prev, created]);
      showAlert('success', 'Berhasil', 'Kelompok keahlian baru berhasil ditambahkan.');
    } catch (err) {
      const msg = err?.response?.data?.errors?.[0]?.message
        ?? err?.response?.data?.message
        ?? 'Terjadi kesalahan saat membuat KK baru.';
      showAlert('error', 'Gagal Membuat KK', msg);
    }
  };

  // Hapus KK via API (DELETE /api/research-groups/:id).
  // Reset filterKK jika KK yang dihapus sedang aktif di-filter agar tabel tidak stuck kosong.
  const handleDeleteKK = async (groupId) => {
    try {
      await deleteResearchGroup(groupId);
      setResearchGroups(prev => prev.filter(g => g.id !== groupId));
      if (filterKK === groupId) setFilterKK('');
      showAlert('success', 'Berhasil', 'Kelompok keahlian berhasil dihapus.');
    } catch (err) {
      const msg = err?.response?.data?.message
        ?? 'Terjadi kesalahan saat menghapus KK.';
      showAlert('error', 'Gagal Menghapus', msg);
    }
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
                    {isLoadingData ? (
                      <tr>
                        <td colSpan={6}>
                          <div className="dd-empty-state">
                            <span style={{ fontSize: 13, color: '#9CA3AF' }}>Memuat data dosen...</span>
                          </div>
                        </td>
                      </tr>
                    ) : paginated.length === 0 ? (
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