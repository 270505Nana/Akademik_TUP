export interface Lecturer {
  kode: string;
  nama: string;
  nip: string;
}

export const DUMMY_LECTURERS: Lecturer[] = [
  { kode: 'ACW', nama: 'Ariq Cahya Wardana', nip: '199001012015011001' },
  { kode: 'DKN', nama: 'Diki Kurnianda', nip: '198502122010121002' },
  { kode: 'RZA', nama: 'Reza Fauzi', nip: '198803152012101003' },
  { kode: 'SML', nama: 'Siti Maryam Luthfiah', nip: '199205202018012004' },
  { kode: 'BND', nama: 'Beni Nugroho Dharma', nip: '198207102008121005' },
  { kode: 'ANI', nama: 'Anisa Nur Islami', nip: '199510122020012006' },
  { kode: 'HLM', nama: 'Hilman Lukman', nip: '198001022005121007' },
  { kode: 'MRA', nama: 'Mira Rianty', nip: '198711112014012008' },
  { kode: 'TPB', nama: 'Taufiq Prasetyo Budi', nip: '198304252009121009' },
  { kode: 'KSM', nama: 'Kusuma Wardani', nip: '199109092017012010' },
];

export const FACULTIES = {
  'Fakultas Teknik Elektro': [
    'S1 Teknik Telekomunikasi',
    'S1 Teknik Elektro',
    'S1 Teknik Biomedis',
    'S1 Teknologi Pangan',
  ],
  'Fakultas Rekayasa Industri': [
    'S1 Teknik Industri',
    'S1 Sistem Informasi',
  ],
  'Fakultas Informatika': [
    'S1 Informatika',
    'S1 Rekayasa Perangkat Lunak',
    'S1 Data Sains',
  ],
  'Fakultas Ekonomi dan Bisnis': [
    'S1 Digital Business',
  ],
  'Fakultas Industri Kreatif': [
    'S1 Desain Komunikasi Visual',
    'S1 Desain Produk',
  ],
  'Fakultas Ilmu Terapan': [
    'D3 Teknik Telekomunikasi',
  ],
};
