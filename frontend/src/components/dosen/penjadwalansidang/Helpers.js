// Helper format inisial mahasiswa (dipakai di avatar).
export const getInitials = (name = '') => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return 'M';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

// Helper warna avatar deterministik berdasarkan nama.
export const getAvatarTheme = (name = '') => {
  const themes = [
    { bg: '#DBEAFE', color: '#1E40AF' },
    { bg: '#FEE2E2', color: '#991B1B' },
    { bg: '#D1FAE5', color: '#065F46' },
    { bg: '#FEF3C7', color: '#92400E' },
    { bg: '#E0E7FF', color: '#3730A3' },
    { bg: '#F3E8FF', color: '#6B21A8' },
    { bg: '#FFEDD5', color: '#9A3412' },
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % themes.length;
  return themes[index];
};

// Helper format tanggal ke "Senin, 24 Agu 2026" (Asia/Jakarta).
export const formatTanggal = (dateStr) => { 
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch (err) {
    console.error('Error formatTanggal:', err);
    return null;
  }
};

// Helper format waktu ke "HH:mm WIB" (Asia/Jakarta).
export const formatWaktu = (dateStr) => {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    const timeFormatted = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
    return `${timeFormatted} WIB`;
  } catch (err) {
    console.error('Error formatWaktu:', err);
    return null;
  }
};