import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Edit,
  Trash2,
  X,
  Menu,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  BookOpen,
  Calendar,
  GitBranch,
  HelpCircle,
  FileCheck,
  Info,
  Newspaper,
  Link2,
  Download,
  AlertTriangle,
  Layers,
  Filter,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SidebarAdmin from '../../components/sidebar/SidebarAdmin';
import CustomAlert from '../../components/common/CustomAlert';
import {
  getAllPusatInformasi,
  createPusatInformasi,
  updatePusatInformasi,
  deletePusatInformasi
} from '../../service/api';
import '../../components/admin/css/pusatInformasi.css';

const PRESET_CATEGORIES = [
  "Pendaftaran Sidang",
  "Pendaftaran Yudisium",
  "Panduan Tugas Akhir",
  "Template Dokumen"
];

const AVAILABLE_ICONS = [
  { name: "FileText", label: "File Text", component: FileText },
  { name: "BookOpen", label: "Book Open", component: BookOpen },
  { name: "Calendar", label: "Calendar", component: Calendar },
  { name: "GitBranch", label: "Git Branch / Alur", component: GitBranch },
  { name: "HelpCircle", label: "Help Circle / FAQ", component: HelpCircle },
  { name: "FileCheck", label: "File Check", component: FileCheck },
  { name: "Info", label: "Info", component: Info },
  { name: "Newspaper", label: "Newspaper", component: Newspaper },
  { name: "Link2", label: "Link", component: Link2 },
  { name: "Download", label: "Download", component: Download }
];

const renderIconComponent = (iconName, size = 16, color = "#64748B") => {
  const found = AVAILABLE_ICONS.find(i => i.name === iconName);
  if (found) {
    const Comp = found.component;
    return <Comp size={size} color={color} />;
  }
  return <FileText size={size} color={color} />;
};

const PusatInformasi = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [informasiList, setInformasiList] = useState([]);
  const [loadingTable, setLoadingTable] = useState(false);
  const [allCategoriesRaw, setAllCategoriesRaw] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const [openSections, setOpenSections] = useState({
    "Pendaftaran Sidang": true,
    "Pendaftaran Yudisium": true,
    "Panduan Tugas Akhir": true,
    "Template Dokumen": true
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: PRESET_CATEGORIES[0],
    description: '',
    icon: 'FileText',
    url: '',
    isPublish: true,
    showInPreview: false,
    queue: 1
  });

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    item: null,
    loading: false
  });

  // Alert Notification
  const [alert, setAlert] = useState({ show: false, type: '', title: '', message: '' });

  const showAlert = (type, title, message) => {
    setAlert({ show: true, type, title, message });
    setTimeout(() => setAlert((prev) => ({ ...prev, show: false })), 4500);
  };

  const getErrorMessage = (error, defaultMsg = "Terjadi kesalahan pada server") => {
    if (error.response?.status === 403) {
      return "Akses ditolak: Anda tidak memiliki izin untuk melakukan aksi ini (Khusus Admin).";
    }
    if (error.response?.data?.errors && Array.isArray(error.response.data.errors) && error.response.data.errors.length > 0) {
      return error.response.data.errors.map(e => e.message).join(", ");
    }
    return error.response?.data?.message || error.message || defaultMsg;
  };

  const fetchAllCategoriesRaw = useCallback(async () => {
    try {
      const res = await getAllPusatInformasi({ limit: "all" });
      const dataList = Array.isArray(res) ? res : res?.data || [];
      const uniqueCategories = Array.from(
        new Set(dataList.map(item => item.category?.trim()).filter(Boolean))
      );
      setAllCategoriesRaw(uniqueCategories);
    } catch (err) {
      console.error("Gagal memuat master daftar kategori:", err);
    }
  }, []);

  useEffect(() => {
    fetchAllCategoriesRaw();
  }, [fetchAllCategoriesRaw]);

  const allCategories = useMemo(() => {
    const merged = Array.from(new Set([...PRESET_CATEGORIES, ...allCategoriesRaw]));
    return merged;
  }, [allCategoriesRaw]);

  const fetchInformasi = useCallback(async () => {
    setLoadingTable(true);
    try {
      const params = {
        limit: "all",
      };
      if (debouncedSearch) {
        params.search = debouncedSearch;
      }
      if (selectedCategoryFilter !== 'ALL') {
        params.category = selectedCategoryFilter;
      }

      const res = await getAllPusatInformasi(params);
      const dataList = Array.isArray(res) ? res : res?.data || [];
      setInformasiList(dataList);
    } catch (error) {
      console.error("Gagal memuat pusat informasi:", error);
      const msg = getErrorMessage(error, "Tidak dapat memuat data pusat informasi.");
      showAlert('error', 'Gagal Memuat', msg);
    } finally {
      setLoadingTable(false);
    }
  }, [debouncedSearch, selectedCategoryFilter]);

  useEffect(() => {
    fetchInformasi();
  }, [fetchInformasi]);

  const categoriesToRender = useMemo(() => {
    let baseCategories = allCategories;
    if (selectedCategoryFilter !== 'ALL') {
      baseCategories = [selectedCategoryFilter];
    }
    return baseCategories.map(category => {
      const items = informasiList
        .filter(item => item.category === category)
        .sort((a, b) => (a.queue || 0) - (b.queue || 0));
      return { category, items };
    });
  }, [allCategories, informasiList, selectedCategoryFilter]);

  const toggleSection = (category) => {
    setOpenSections(prev => ({
      ...prev,
      [category]: prev[category] !== undefined ? !prev[category] : true
    }));
  };

  // Handle Buka Modal Tambah
  const handleOpenAddModal = () => {
    setSelectedData(null);
    setFormData({
      name: '',
      category: PRESET_CATEGORIES[0],
      description: '',
      icon: 'FileText',
      url: '',
      isPublish: true,
      showInPreview: false,
      queue: 1
    });
    setIsModalOpen(true);
  };

  // Handle Buka Modal Edit
  const handleOpenEditModal = (item) => {
    setSelectedData(item);
    setFormData({
      name: item.name || '',
      category: item.category || PRESET_CATEGORIES[0],
      description: item.description || '',
      icon: item.icon || 'FileText',
      url: item.url || '',
      isPublish: item.isPublish ?? true,
      showInPreview: Boolean(item.showInPreview),
      queue: item.queue ?? 1
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmitModal = async (e) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.category || !formData.url?.trim()) {
      showAlert("error", "Validasi Gagal", "Nama dokumen, Kategori, dan Link URL wajib diisi!");
      return;
    }

    setModalLoading(true);

    try {
      if (selectedData?.id) {
        const payload = {
          name: formData.name.trim(),
          category: formData.category.trim(),
          description: formData.description?.trim() || "",
          icon: formData.icon || "FileText",
          url: formData.url.trim(),
          isPublish: Boolean(formData.isPublish),
          showInPreview: Boolean(formData.showInPreview),
          queue: Math.max(1, parseInt(formData.queue, 10) || 1)
        };

        await updatePusatInformasi(selectedData.id, payload);
        showAlert("success", "Berhasil Diperbarui", "Data pusat informasi berhasil disimpan.");
      } else {
        const payload = {
          name: formData.name.trim(),
          category: formData.category.trim(),
          description: formData.description?.trim() || "",
          icon: formData.icon || "FileText",
          url: formData.url.trim(),
          isPublish: Boolean(formData.isPublish),
          showInPreview: Boolean(formData.showInPreview)
        };

        await createPusatInformasi(payload);
        showAlert("success", "Berhasil Ditambahkan", "Pusat informasi baru berhasil dipublikasikan.");
      }

      handleCloseModal();
      fetchInformasi(); 
      fetchAllCategoriesRaw(); 
    } catch (error) {
      console.error("Error saving pusat informasi:", error);
      const msg = getErrorMessage(error, "Terjadi kesalahan saat menyimpan data ke server.");
      showAlert("error", "Gagal Menyimpan", msg);
    } finally {
      setModalLoading(false);
    }
  };

  const handleTogglePublish = async (item) => {
    const isCurrentlyPublished = item.isPublish === true;
    const nextStatus = !isCurrentlyPublished;
    setInformasiList((prev) =>
      prev.map((t) => (t.id === item.id ? { ...t, isPublish: nextStatus } : t))
    );

    try {
      await updatePusatInformasi(item.id, { isPublish: nextStatus });
      showAlert(
        "success",
        "Status Diperbarui",
        `Informasi "${item.name}" sekarang ${nextStatus ? 'Dipublikasikan' : 'Disimpan sebagai Draft'}.`
      );
    } catch (error) {
      console.error("Gagal toggle status publish:", error);
      setInformasiList((prev) =>
        prev.map((t) => (t.id === item.id ? { ...t, isPublish: isCurrentlyPublished } : t))
      );
      const msg = getErrorMessage(error, "Server menolak perubahan status Publish.");
      showAlert("error", "Gagal", msg);
    }
  };

  const handleTogglePreview = async (item) => {
    const isCurrentlyPreview = Boolean(item.showInPreview);
    const nextStatus = !isCurrentlyPreview;
    setInformasiList((prev) =>
      prev.map((t) =>
        t.id === item.id
          ? { ...t, showInPreview: nextStatus ? new Date().toISOString() : null }
          : t
      )
    );

    try {
      await updatePusatInformasi(item.id, { showInPreview: nextStatus });
      showAlert(
        "success",
        "Preview Diperbarui",
        `Informasi "${item.name}" ${nextStatus ? 'akan tampil di widget preview beranda' : 'dihapus dari preview beranda'}.`
      );
    } catch (error) {
      console.error("Gagal toggle status preview:", error);
      setInformasiList((prev) =>
        prev.map((t) =>
          t.id === item.id
            ? { ...t, showInPreview: isCurrentlyPreview ? item.showInPreview : null }
            : t
        )
      );
      const msg = getErrorMessage(error, "Server menolak perubahan status Preview.");
      showAlert("error", "Gagal", msg);
    }
  };

  const handleOpenDeleteConfirm = (item) => {
    setDeleteModal({ isOpen: true, item, loading: false });
  };

  const handleCloseDeleteConfirm = () => {
    setDeleteModal({ isOpen: false, item: null, loading: false });
  };

  const handleExecuteDelete = async () => {
    if (!deleteModal.item) return;

    setDeleteModal((prev) => ({ ...prev, loading: true }));
    try {
      await deletePusatInformasi(deleteModal.item.id);
      handleCloseDeleteConfirm();
      showAlert("success", "Berhasil Dihapus", "Data pusat informasi telah dihapus secara permanen.");
      fetchInformasi(); 
      fetchAllCategoriesRaw(); 
    } catch (error) {
      console.error("Error deleting item:", error);
      const msg = getErrorMessage(error, "Terjadi kesalahan saat menghapus data.");
      showAlert("error", "Gagal Menghapus", msg);
    } finally {
      setDeleteModal((prev) => ({ ...prev, loading: false }));
    }
  };

  // Render Bagian Tabel per Kategori 
  const renderTableSection = (category, items) => {
    const isOpen = openSections[category] ?? true;

    return (
      <div key={category} className="pi-table-card">
        <div
          onClick={() => toggleSection(category)}
          className={`pi-table-header-btn ${!isOpen ? 'closed' : ''}`}
        >
          <div className="pi-table-header-title-wrapper">
            <Layers size={18} color="#C0182A" />
            <h3 className="pi-table-header-title">
              {category}{' '}
              <span className="pi-table-header-count">
                ({items.length} Informasi)
              </span>
            </h3>
          </div>
          {isOpen ? <ChevronUp size={20} color="#64748B" /> : <ChevronDown size={20} color="#64748B" />}
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <div className="pi-table-scroll-wrapper">
                <table className="pi-table">
                  <thead>
                    <tr className="pi-thead-row">
                      <th className="pi-th" style={{ width: '5%' }}>No / Urut</th>
                      <th className="pi-th" style={{ width: '28%' }}>Nama / Judul Informasi</th>
                      <th className="pi-th" style={{ width: '22%' }}>Deskripsi</th>
                      <th className="pi-th" style={{ width: '10%' }}>Icon</th>
                      <th className="pi-th" style={{ width: '10%' }}>Tautan Link</th>
                      <th className="pi-th" style={{ width: '15%' }}>Pengaturan Status</th>
                      <th className="pi-th pi-th-center" style={{ width: '10%' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingTable ? (
                      <tr>
                        <td colSpan={7} className="pi-table-loading">
                          <div className="pi-table-loading-inner">
                            <RefreshCw size={16} className="pi-spin" />
                            <span>Memuat data informasi dari server...</span>
                          </div>
                        </td>
                      </tr>
                    ) : items.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="pi-table-empty">
                          Belum ada data informasi di kategori ini.
                        </td>
                      </tr>
                    ) : (
                      items.map((item) => {
                        const isPub = item.isPublish === true || item.isPublish === 'true';
                        const isPrev = Boolean(item.showInPreview);

                        return (
                          <tr key={item.id} className="pi-tbody-row">
                            {/* Urutan Queue */}
                            <td className="pi-td pi-td-center">
                              <span className="pi-queue-badge">
                                {item.queue || 1}
                              </span>
                            </td>

                            {/* Nama Informasi */}
                            <td className="pi-td">
                              <div className="pi-item-name">
                                {item.name}
                              </div>
                              <div className="pi-item-date">
                                Diperbarui: {item.updatedAt || item.createdAt ? new Date(item.updatedAt || item.createdAt).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                }) : '-'}
                              </div>
                            </td>

                            {/* Deskripsi */}
                            <td className="pi-td">
                              <div className="pi-item-desc" title={item.description}>
                                {item.description || '-'}
                              </div>
                            </td>

                            {/* Icon Visual */}
                            <td className="pi-td">
                              <div className="pi-item-icon-tag">
                                {renderIconComponent(item.icon, 16, '#C0182A')}
                                <span>
                                  {item.icon || 'FileText'}
                                </span>
                              </div>
                            </td>

                            {/* Link Eksternal */}
                            <td className="pi-td">
                              {item.url ? (
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="pi-item-link-btn"
                                  title={item.url}
                                >
                                  <ExternalLink size={14} /> Buka Link
                                </a>
                              ) : (
                                <span style={{ color: '#94A3B8', fontSize: '13px' }}>-</span>
                              )}
                            </td>

                            {/* Status Publish & Preview Toggles */}
                            <td className="pi-td">
                              <div className="pi-status-toggles-col">
                                {/* Toggle Publish */}
                                <label className="pi-toggle-label">
                                  <input
                                    type="checkbox"
                                    checked={isPub}
                                    onChange={() => handleTogglePublish(item)}
                                    style={{ display: 'none' }}
                                  />
                                  <div className={`pi-toggle-track ${isPub ? 'publish-active' : ''}`}>
                                    <div className={`pi-toggle-knob ${isPub ? 'active' : ''}`} />
                                  </div>
                                  <span className={`pi-toggle-text ${isPub ? 'publish-active' : ''}`}>
                                    {isPub ? 'Published' : 'Draft'}
                                  </span>
                                </label>

                                {/* Toggle Preview Landing */}
                                <label className="pi-toggle-label">
                                  <input
                                    type="checkbox"
                                    checked={isPrev}
                                    onChange={() => handleTogglePreview(item)}
                                    style={{ display: 'none' }}
                                  />
                                  <div className={`pi-toggle-track ${isPrev ? 'preview-active' : ''}`}>
                                    <div className={`pi-toggle-knob ${isPrev ? 'active' : ''}`} />
                                  </div>
                                  <span className={`pi-toggle-text ${isPrev ? 'preview-active' : ''}`}>
                                    {isPrev ? 'Di Preview' : 'Off Preview'}
                                  </span>
                                </label>
                              </div>
                            </td>

                            {/* Tombol Aksi */}
                            <td className="pi-td pi-td-center">
                              <div className="pi-action-group">
                                <button
                                  onClick={() => handleOpenEditModal(item)}
                                  className="pi-btn-edit"
                                  title="Edit Informasi"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => handleOpenDeleteConfirm(item)}
                                  className="pi-btn-delete"
                                  title="Hapus Informasi"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="pi-page-root">      {/* Sidebar Admin Component */}
      <SidebarAdmin isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="pi-main-content">       
        <div className="pi-mobile-menu-bar">          <button onClick={() => setSidebarOpen(true)} className="mobile-menu-btn">
          <Menu size={20} />
        </button>
          <span className="mobile-menu-title">SIMTA</span>
        </div>

        <div className="pi-page-wrapper">          
          <div className="pi-top-bar-red">
            <h1 className="pi-top-bar-title">Pusat Informasi & Dokumen Panduan</h1>
          </div>

          <div className="pi-content-container">            
            <div className="pi-header-row">
              <div>
                <p className="pi-breadcrumb">
                  Beranda / Manajemen Data / Pusat Informasi
                </p>
                <h2 className="pi-page-heading">
                  Kelola Konten & Dokumen Pusat Informasi
                </h2>
              </div>
              <div className="pi-action-buttons">
                <button
                  onClick={handleOpenAddModal}
                  className="pi-btn-add"
                >
                  + Tambah Informasi Baru
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="pi-filter-bar">
              <div className="pi-search-box">
                <Search size={18} color="#94A3B8" className="pi-search-icon" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan nama atau deskripsi informasi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pi-search-input"
                />
              </div>

              <div className="pi-category-filter">
                <Filter size={16} color="#64748B" />
                <span className="pi-category-filter-label">Kategori:</span>
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="pi-category-filter-select"
                >
                  <option value="ALL">Semua Kategori</option>
                  {allCategories.map((cat, idx) => (
                    <option key={idx} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reset Filter Button */}
              {(searchTerm || selectedCategoryFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategoryFilter('ALL');
                  }}
                  className="pi-btn-reset-filter"
                >
                  Reset Filter
                </button>
              )}
            </div>

            {/* Render Collapsible Table per Kategori */}
            {categoriesToRender.map(({ category, items }) =>
              renderTableSection(category, items)
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="pi-modal-overlay modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="pi-modal-content modal-content"
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -30, opacity: 0 }}
            >
              {/* Modal Header */}
              <div className="pi-modal-scroll">
              <div className="pi-modal-header">
                <h3 className="pi-modal-title">
                  {selectedData ? 'Edit Pusat Informasi' : 'Tambah Informasi Baru'}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="pi-modal-close-btn"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body Form */}
              <form onSubmit={handleSubmitModal}>
                <div className="pi-form-group">
                  <label className="pi-form-label">
                    Nama / Judul Informasi <span className="pi-required-mark">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Contoh: Panduan Pendaftaran Sidang Tugas Akhir"
                    className="pi-form-input"
                    required
                  />
                </div>

                {/* Field: Kategori (menggunakan master allCategories) */}
                <div className="pi-form-group">
                  <label className="pi-form-label">
                    Kategori <span className="pi-required-mark">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="pi-form-select"
                    required
                  >
                    <option value="" disabled>Pilih Kategori Informasi...</option>
                    {allCategories.map((cat, idx) => (
                      <option key={idx} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pi-form-group">
                  <label className="pi-form-label">
                    Tautan Link / URL Dokumen <span className="pi-required-mark">*</span>
                  </label>
                  <input
                    type="url"
                    name="url"
                    value={formData.url}
                    onChange={handleInputChange}
                    placeholder="https://drive.google.com/... atau https://onedrive.live.com/..."
                    className="pi-form-input"
                    required
                  />
                  <span className="pi-form-hint">
                    Masukkan link Google Drive, OneDrive, atau website tujuan file/panduan.
                  </span>
                </div>

                <div className="pi-form-group">
                  <label className="pi-form-label">
                    Deskripsi Ringkas (Opsional)
                  </label>
                  <textarea
                    name="description"
                    rows="3"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Jelaskan secara ringkas isi panduan atau informasi ini..."
                    className="pi-form-textarea"
                  />
                </div>

                <div className="pi-form-group">
                  <label className="pi-form-label">
                    Ikon Tampilan (Opsional)
                  </label>
                  <div className="pi-icon-select-row">
                    <div className="pi-icon-preview-box">
                      {renderIconComponent(formData.icon, 20, '#C0182A')}
                    </div>
                    <select
                      name="icon"
                      value={formData.icon}
                      onChange={handleInputChange}
                      className="pi-form-select"
                    >
                      {AVAILABLE_ICONS.map((ic) => (
                        <option key={ic.name} value={ic.name}>
                          {ic.label} ({ic.name})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Field: Urutan Queue (Hanya tampil saat EDIT) */}
                {selectedData && (
                  <div className="pi-queue-edit-box">
                    <label className="pi-form-label">
                      Urutan Tampil (Queue)
                    </label>
                    <input
                      type="number"
                      name="queue"
                      min="1"
                      value={formData.queue}
                      onChange={handleInputChange}
                      className="pi-queue-input"
                    />
                    <span className="pi-queue-hint">
                      Nomor urut posisi informasi dalam kategori yang sama (minimal 1).
                    </span>
                  </div>
                )}


                {/* Tombol Submit Modal */}
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="pi-modal-submit-btn"
                >
                  {modalLoading
                    ? 'Memproses...'
                    : selectedData
                      ? 'Simpan Perubahan'
                      : 'Publish Informasi'}
                </button>
              </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Dialog Konfirmasi Hapus Permanen */}
      <AnimatePresence>
        {deleteModal.isOpen && (
          <div className="pi-delete-overlay">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="pi-delete-card"
            >
              <div className="pi-delete-icon-circle">
                <AlertTriangle size={26} color="#DC2626" />
              </div>
              <h3 className="pi-delete-title">
                Hapus Data Informasi?
              </h3>
              <p className="pi-delete-text">
                Apakah Anda yakin ingin menghapus <strong>"{deleteModal.item?.name}"</strong>? Tindakan ini bersifat permanen dan tidak dapat dibatalkan.
              </p>
              <div className="pi-delete-btn-group">
                <button
                  type="button"
                  disabled={deleteModal.loading}
                  onClick={handleCloseDeleteConfirm}
                  className="pi-delete-btn-cancel"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={deleteModal.loading}
                  onClick={handleExecuteDelete}
                  className="pi-delete-btn-confirm"
                >
                  {deleteModal.loading ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {alert.show && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="pi-alert-container"
          >
            <CustomAlert type={alert.type} title={alert.title} message={alert.message} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PusatInformasi;
