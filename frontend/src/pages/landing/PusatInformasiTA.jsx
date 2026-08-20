import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  HelpCircle,
  Calendar,
  GitBranch,
  FileText,
  BookOpen,
  Settings,
  FileCheck,
  RefreshCw,
  Search,
  ChevronRight,
} from 'lucide-react';
import './landing.css';

// Data informasi sementara sebelum nantinya diambil dari Spreadsheet (data-driven)
const INFORMATION_CATEGORIES = [
  {
    id: 'pendaftaran-sidang',
    title: 'Pendaftaran Sidang',
    items: [
      {
        id: 'faq-sidang',
        title: 'Cek FAQ Sidang',
        description: 'Pertanyaan yang sering muncul',
        icon: HelpCircle,
        link: '#',
      },
      {
        id: 'timeline-sidang',
        title: 'Timeline Sidang Tugas Akhir',
        description: 'Surat Edaran Timeline Sidang Tugas Akhir',
        icon: Calendar,
        link: '#',
      },
      {
        id: 'alur-sidang',
        title: 'Alur Pelaksanaan Sidang TA',
        description: 'Prosedur pendaftaran sidang',
        icon: GitBranch,
        link: '#',
      },
      {
        id: 'syarat-sidang-reguler',
        title: 'Syarat Berkas Sidang Reguler',
        description: 'Syarat Sidang Reguler',
        icon: FileText,
        link: '#',
      },
      {
        id: 'syarat-non-sidang',
        title: 'Syarat Berkas Non-Sidang',
        description: 'Syarat Non-Sidang',
        icon: FileText,
        link: '#',
      },
    ],
  },
  {
    id: 'panduan-aturan-ta',
    title: 'Panduan & Aturan TA',
    items: [
      {
        id: 'template-buku-ta',
        title: 'Template Buku TA',
        description: 'Format penulisan resmi UPPS',
        icon: FileText,
        link: '#',
      },
      {
        id: 'panduan-umum-ta',
        title: 'Panduan Umum Tugas Akhir TUP',
        description: 'Baca dulu panduan umum Tugas Akhir TUP',
        icon: BookOpen,
        link: '#',
      },
      {
        id: 'panduan-teknis-ta',
        title: 'Panduan Teknis Tugas Akhir TUP',
        description: 'Panduan Teknis Mengisi Menu TA/PA di iGracias',
        icon: Settings,
        link: '#',
      },
    ],
  },
  {
    id: 'sk-tugas-akhir',
    title: 'SK Tugas Akhir',
    items: [
      {
        id: 'pembaruan-sk-ta',
        title: 'Pembaruan SK TA',
        description: 'Syarat perpanjangan masa berlaku',
        icon: FileCheck,
        link: '#',
      },
      {
        id: 'alur-pembaharuan-sk-ta',
        title: 'Alur Pembaharuan SK TA',
        description: 'Panduan proses pembaharuan SK TA',
        icon: RefreshCw,
        link: '#',
      },
    ],
  },
];

// Component card untuk setiap dokumen/informasi
const InformationCard = ({ item }) => {
  const IconComponent = item.icon;

  const handleClick = () => {
    if (item.link && item.link !== '#') {
      window.open(item.link, '_blank', 'noopener,noreferrer');
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
          {IconComponent && <IconComponent size={20} />}
        </div>
        <div className="info-card-text">
          <h3 className="info-card-title">{item.title}</h3>
          <p className="info-card-desc">{item.description}</p>
        </div>
      </div>
      <div className="info-card-arrow">
        <ChevronRight size={18} />
      </div>
    </div>
  );
};

// Component kolom kategori yang menampilkan daftar card informasi dan mendukung fitur filter pencarian
const InformationCategory = ({ category, searchQuery }) => {
  const filteredItems = useMemo(() => {
    if (!searchQuery) return category.items;
    const q = searchQuery.toLowerCase().trim();
    return category.items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
    );
  }, [category.items, searchQuery]);

  if (filteredItems.length === 0 && searchQuery) {
    return null;
  }

  return (
    <div className="info-category-column">
      <div className="info-category-header">
        <h2 className="info-category-title">{category.title}</h2>
      </div>
      <div className="info-card-list">
        {filteredItems.map((item) => (
          <InformationCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};

// Component halaman utama Pusat Informasi Tugas Akhir
const PusatInformasiTA = () => {
  const [searchQuery, setSearchQuery] = useState('');

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

            <Link to="/login" className="lp-btn lp-btn-primary">
              Login SSO
            </Link>
          </nav>
        </div>
      </header>

      {/* Konten Utama */}
      <main style={{ flex: 1, padding: '40px 0 64px' }}>
        <div className="lp-container">
          <div className="info-header">
            <h1 className="info-page-title">Pusat Informasi Tugas Akhir</h1>
            <p className="info-page-desc">
              Panduan lengkap, dokumen, dan template terkait pelaksanaan Tugas Akhir.
            </p>
          </div>

          {/* Mapping data berdasarkan kategori untuk ditampilkan pada layout tiga kolom */}
          <div className="info-grid">
            {INFORMATION_CATEGORIES.map((cat) => (
              <InformationCategory
                key={cat.id}
                category={cat}
                searchQuery={searchQuery}
              />
            ))}
          </div>
        </div>
      </main>

    </div>
  );
};

export default PusatInformasiTA;

