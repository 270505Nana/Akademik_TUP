import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Search,
  ChevronRight,
} from 'lucide-react';
import { getLucideIcon } from '../../utils/iconMapper';

const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
});

const InformationCard = ({ item }) => {
  const handleClick = () => {
    if (item.url && item.url !== '#') {
      window.open(item.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className="info-card"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
    >
      <div className="info-card-content">
        <div className="info-card-icon">
          {getLucideIcon(item.icon, 20)}
        </div>
        <div className="info-card-text">
          <h3 className="info-card-title">{item.name}</h3>
          <p className="info-card-desc">{item.description}</p>
        </div>
      </div>
      <div className="info-card-arrow">
        <ChevronRight size={18} />
      </div>
    </div>
  );
};

const InformationCategory = ({ category, searchQuery }) => {
  const filteredItems = useMemo(() => {
    const rawItems = Array.isArray(category.data) ? [...category.data] : [];
    const sorted = rawItems.sort((a, b) => (a.queue || 0) - (b.queue || 0));

    if (!searchQuery) return sorted;
    const q = searchQuery.toLowerCase().trim();
    return sorted.filter(
      (item) =>
        (item.name || '').toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q)
    );
  }, [category.data, searchQuery]);

  if (filteredItems.length === 0 && searchQuery) {
    return null;
  }

  return (
    <div className="info-category-column">
      <div className="info-category-header">
        <h2 className="info-category-title">{category.category}</h2>
      </div>
      <div className="info-card-list">
        {filteredItems.map((item, idx) => (
          <InformationCard key={item.id || idx} item={item} />
        ))}
      </div>
    </div>
  );
};

// Component halaman utama Pusat Informasi Tugas Akhir
const PusatInformasiTA = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    publicApi
      .get("/api/pusat-informasi/public")
      .then((response) => {
        if (isMounted) {
          const resData = response.data?.data ?? [];
          setCategories(Array.isArray(resData) ? resData : []);
        }
      })
      .catch((error) => {
        console.error("Gagal memuat pusat informasi publik:", error);
        if (isMounted) {
          setCategories([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="landing-page info-page">
      {/* Navbar Portal Informasi */}
      <header className="lp-header">
        <div className="lp-container lp-header-inner">
          <Link to="/" className="lp-logo">
            SIMTA
          </Link>

          <nav className="lp-nav" aria-label="Navigasi utama">
            <Link to="/#pusat-informasi">PUSAT INFORMASI</Link>
            <Link to="/#bantuan">BANTUAN</Link>

            {/* Pencarian informasi */}
            <div className="info-nav-search">
              <Search size={15} className="info-nav-search-icon" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="info-nav-search-input"
                aria-label="Cari informasi tugas akhir"
              />
            </div>

            <Link to="/login" className="lp-btn lp-btn-outline">
              Login SSO
            </Link>
          </nav>
        </div>
      </header>

      <main style={{ flex: 1, padding: '40px 0 64px' }}>
        <div className="lp-container">
          <div className="info-header">
            <h1 className="info-page-title">Pusat Informasi Tugas Akhir</h1>
            <p className="info-page-desc">
              Panduan lengkap, dokumen, dan template terkait pelaksanaan Tugas Akhir.
            </p>
          </div>

          {/* Loading, Empty, dan Grid Data State */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6B7280' }}>
              <p style={{ fontSize: '16px', fontWeight: 500 }}>Memuat data informasi...</p>
            </div>
          ) : categories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6B7280' }}>
              <p style={{ fontSize: '15px' }}>Belum ada informasi yang dipublikasikan saat ini.</p>
            </div>
          ) : (
            <div className="info-grid">
              {categories.map((cat, idx) => (
                <InformationCategory
                  key={cat.category || idx}
                  category={cat}
                  searchQuery={searchQuery}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PusatInformasiTA;
