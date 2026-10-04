

export const STATUS_CONFIG = {
  'Draft': { label: 'Draft', bg: '#F3F4F6', color: '#374151', border: '#E5E7EB' },
  'Menunggu Verifikasi': { label: 'Menunggu Verifikasi', bg: '#FEF9C3', color: '#854D0E', border: '#FEF08A' },

  'Dalam Proses': { label: 'Dalam Proses', bg: '#DBEAFE', color: '#1E40AF', border: '#BFDBFE' },
  'Perlu Revisi': { label: 'Perlu Revisi', bg: '#FEE2E2', color: '#991B1B', border: '#FECACA' },
  'Revisi Diajukan': { label: 'Revisi Diajukan', bg: '#EDE9FE', color: '#5B21B6', border: '#DDD6FE' },
  'Pendaftaran Diterima': { label: 'Pendaftaran Diterima', bg: '#DCFCE7', color: '#15803D', border: '#BBF7D0' },
  'Siap Sidang': { label: 'Siap Sidang', bg: '#DCFCE7', color: '#15803D', border: '#BBF7D0' },

};
const FALLBACK_STATUS_STYLE = {
  bg: '#F1F5F9',
  color: '#475569',
  border: '#E2E8F0',
};

const normalizeStatusKey = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[_\-\s]+/g, ' ');
const STATUS_LOOKUP = Object.fromEntries(
  Object.entries(STATUS_CONFIG).map(([key, cfg]) => [normalizeStatusKey(key), cfg]),
);

export const getStatusStyle = (status) => ({
  ...FALLBACK_STATUS_STYLE,
  ...(STATUS_LOOKUP[normalizeStatusKey(status)] || {}),
  label: String(status ?? '').trim(),
});

export const isEmptyDraft = (item) => {
  if (!item || item.isDraft !== true) return false;
  const isJudulEmpty = !String(item.judulTugasAkhirIndonesia ?? '').trim();
  const isPeriodEmpty = !item.sidangPeriodId;
  return isJudulEmpty && isPeriodEmpty;
};


export const getStatusLabel = (item) => {
  if (item?.isDraft) return 'Draft';
  const beStatus = String(item?.status ?? '').trim();
  return beStatus || 'Menunggu Verifikasi';
};


export const buildStatusOptions = (registrations = []) => {
  const leading = ['Draft', 'Menunggu Verifikasi'];

  const others = new Set();
  for (const reg of registrations) {
    const status = String(reg?.status ?? '').trim();
    if (status && !leading.includes(status)) others.add(status);
  }

  const sortedOthers = Array.from(others).sort((a, b) => a.localeCompare(b));

  return [
    { value: '', label: 'All Statuses' },
    ...[...leading, ...sortedOthers].map((status) => ({ value: status, label: status })),
  ];
};


const NICE_STEPS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000];

export const buildNiceScale = (maxValue) => {
  const effectiveMax = Math.max(Number(maxValue) || 0, 4);

  const step = NICE_STEPS.find((s) => Math.ceil(effectiveMax / s) <= 5) || 100000;
  const niceMax = Math.max(Math.ceil(effectiveMax / step) * step, 4);

  const ticks = [];
  for (let val = 0; val <= niceMax; val += step) ticks.push(val);

  return { niceMax, ticks };
};


export const buildPageNumbers = (currentPage, totalPages) => {
  const total = Math.max(1, Number(totalPages) || 1);
  const current = Math.min(Math.max(1, Number(currentPage) || 1), total);

  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = Array.from(
    new Set([1, Math.max(1, current - 1), current, Math.min(total, current + 1), total]),
  ).sort((a, b) => a - b);

  const result = [];
  pages.forEach((page, i) => {
    if (i > 0 && page - pages[i - 1] > 1) result.push('...');
    result.push(page);
  });
  return result;
};


export const deriveAngkatan = (mahasiswa, createdAt) => {
  if (mahasiswa?.tahunAngkatan) return String(mahasiswa.tahunAngkatan);

  const nim = String(mahasiswa?.nim ?? '');
  if (nim.length >= 6) {
    const twoDigitYear = nim.substring(4, 6);
    if (!Number.isNaN(parseInt(twoDigitYear, 10))) return `20${twoDigitYear}`;
  }

  if (createdAt) return String(new Date(createdAt).getFullYear());
  return '-';
};


export const normalizeRegistration = (item, facultyMap = new Map()) => {
  if (!item) return null;

  const mhs = item.mahasiswa || {};
  const prodi = mhs.studyProgram || null;
  const faculty = prodi?.facultyId ? facultyMap.get(prodi.facultyId) : null;

  return {
    id: item.id,
    name: mhs.name || '-',
    nim: mhs.nim || '-',
    facultyId: prodi?.facultyId || '',
    facultyCode: faculty?.code || '',
    facultyName: faculty?.name || '',
    studyProgram: prodi?.name || '-',
    studyProgramId: mhs.studyProgramId || prodi?.id || '',
    angkatan: deriveAngkatan(mhs, item.createdAt),
    status: getStatusLabel(item),
    originalStatus: item.status ?? null,
    isDraft: Boolean(item.isDraft),
    judulTugasAkhirIndonesia: item.judulTugasAkhirIndonesia || null,
    sidangPeriodId: item.sidangPeriodId || null,
    submittedAt: item.submittedAt || null,
    createdAt: item.createdAt || null,
  };
};


export const buildFacultyChartData = (registrations, faculties) => {
  if (!faculties || faculties.length === 0) return [];

  const countByFaculty = {};
  for (const reg of registrations) {
    if (reg.facultyId) {
      countByFaculty[reg.facultyId] = (countByFaculty[reg.facultyId] || 0) + 1;
    }
  }

  return faculties.map((fac) => ({
    label: fac.name || '',
    shortLabel: fac.code || fac.name || '',
    count: countByFaculty[fac.id] || 0,
  }));
};


const escapeCsvValue = (val) => {
  if (val === null || val === undefined) return '';
  const str = String(val);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

export const exportToCsv = (students, filename) => {
  const headers = ['No', 'NIM', 'Nama Mahasiswa', 'Kode Fakultas', 'Program Studi', 'Status Registrasi', 'Angkatan'];

  const rows = students.map((s, idx) =>
    [idx + 1, s.nim, s.name, s.facultyCode, s.studyProgram, s.status, s.angkatan]
      .map(escapeCsvValue)
      .join(','),
  );

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `Rekapitulasi_Registrasi_Sidang_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};