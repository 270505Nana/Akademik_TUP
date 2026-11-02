# SIMTA API Service — Sistem Informasi Manajemen Tugas Akhir

> [!WARNING]
> **Status Proyek: Sedang Dalam Pengembangan (Under Active Development)**  
> Fitur, skema basis data, dan kontrak API dapat mengalami perubahan sewaktu-waktu sesuai kebutuhan pengembangan sistem.

Backend REST API untuk **Sistem Informasi Manajemen Tugas Akhir (SIMTA)** Akademik Telkom University Purwokerto (TUP). Service ini dirancang untuk mendigitalisasi dan memusatkan pengelolaan alur tugas akhir mahasiswa, mulai dari pengajuan SK TA, pendaftaran dan penjadwalan sidang, penilaian berbasis *Outcome-Based Education* (OBE/CLO), hingga proses pendaftaran yudisium dan penerbitan berkas kelulusan.

---

## 📌 Ringkasan Isi

- [Tentang Aplikasi](#-tentang-aplikasi)
- [Fitur Utama](#-fitur-utama)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
- [Struktur Direktori](#-struktur-direktori)
- [Standar Pengembangan & Konvensi Kode](#-standar-pengembangan--konvensi-kode)

---

## 📖 Tentang Aplikasi

SIMTA API Service menyediakan backend terpusat yang melayani kebutuhan operasional akademik tugas akhir bagi tiga peran utama:

1. **Mahasiswa**: Mengajukan SK TA, mendaftar sidang (reguler maupun jalur non-sidang seperti publikasi jurnal/prosiding/HKI), melihat jadwal sidang, mendaftar yudisium, dan mengunduh berkas kelulusan (SKL dan Transkrip).
2. **Dosen**: Memantau jadwal pengujian sidang, menginput nilai evaluasi sidang berbasis rubrik capaian pembelajaran (CLO/Sub-CLO), memberikan catatan revisi, serta mengelola dan mengajukan usulan pembaruan rubrik asesmen.
3. **Admin Akademik**: Mengelola master data akademik (fakultas, program studi, kelompok keahlian, dosen, mahasiswa, ruangan), membuka/menutup periode sidang dan yudisium, memvalidasi berkas persyaratan, mengelola penjadwalan sidang, serta mengunggah dokumen kelulusan mahasiswa.

---

## ✨ Fitur Utama

Sistem dikelompokkan ke dalam beberapa modul fungsional tingkat tinggi:

- **Autentikasi & RBAC (Role-Based Access Control)**: Otentikasi berbasis JWT dengan otorisasi peran pengguna (`MAHASISWA`, `DOSEN`, `ADMIN`) dan validasi domain email institusi.
- **Pengelolaan SK Tugas Akhir (SKTA)**: Siklus pengajuan SKTA baru, perpanjangan, dan perubahan judul/pembimbing, disertai verifikasi kelayakan dokumen oleh admin.
- **Pendaftaran & Penjadwalan Sidang**: Pengaturan periode sidang, pendaftaran multi-skema (reguler, non-sidang, capstone), alokasi ruangan, penugasan dosen penguji/pembimbing, serta penguncian jadwal sidang.
- **Penilaian Berbasis OBE & Berita Acara**: Evaluasi sidang berjenjang (*CLO* $\rightarrow$ *Sub-CLO* $\rightarrow$ *Jenis Asesmen*), pencatatan revisi tugas akhir, dan kalkulasi otomatis Berita Acara Sidang beserta nilai akhir.
- **Pendaftaran Yudisium & Verifikasi Kelulusan**: Pendaftaran yudisium berkala, verifikasi dokumen kelulusan, pengajuan predikat kelulusan (*Cumlaude*), dan pencatatan data lulusan.
- **Pusat Berkas & Dokumen Akademik**: Manajemen unggah dan unduh SKL, transkrip nilai, panduan tugas akhir, serta template berkas dengan dukungan multi-driver storage (lokal atau cloud object storage).
- **Master Data & Antrean Persetujuan (Approval Queue)**: Manajemen data referensi institusi serta antrean permohonan persetujuan perubahan rubrik CLO/asesmen oleh Ketua Program Studi.

---

## 💻 Tech Stack

Stack teknologi utama yang digunakan pada backend:

- **Runtime & Framework**: Node.js (ESModules) & Express.js.
- **Database & ORM**: PostgreSQL & Prisma ORM.
- **Autentikasi & Keamanan**: JSON Web Token (JWT), Bcrypt, Helmet, CORS, dan Express Rate Limit.
- **Validasi Data**: Zod untuk validasi request payload dan query parameters.
- **Dokumentasi API**: Swagger UI & OpenAPI 3.0 (anotasi JSDoc terintegrasi).
- **Storage Service**: Multer dengan driver penyimpanan fleksibel (Local Disk Storage & Cloudflare R2 / AWS S3).

---

## ⚙️ Prerequisites

Pastikan perangkat pengembangan telah terpasang kebutuhan dasar berikut:

- **Node.js**: Versi LTS `18.x` atau `20.x` ke atas.
- **NPM**: Package manager bawaan Node.js.
- **PostgreSQL**: Versi `14.x` ke atas (lokal atau cloud database service).
- **Git**: Untuk manajemen branch dan kode sumber.

---

## 🚀 Getting Started

Panduan singkat untuk menjalankan backend di lingkungan lokal:

### 1. Instalasi Dependensi
```bash
cd backend
npm install
```

### 2. Konfigurasi Environment File
Salin file template `.env.example` menjadi `.env`, lalu lengkapi nilainya:
```bash
cp .env.example .env
```
Variabel penting yang perlu disesuaikan:
- `PORT`: Port server (default: `3000`).
- `DATABASE_URL`: URL koneksi database PostgreSQL.
- `JWT_SECRET`: Kunci rahasia untuk enkripsi token JWT.
- `SWAGGER_USER` & `SWAGGER_PASSWORD`: Kredensial Basic Auth untuk mengakses Swagger UI.
- `STORAGE_DRIVER`: Pilihan media simpan (`local` atau `r2`).

### 3. Sinkronisasi Database (Prisma)
Terapkan skema basis data dan generate client Prisma:
```bash
npm run prisma:db-push
npm run prisma:generate
```

### 4. Menjalankan Server
- **Development (Auto-reload)**:
  ```bash
  npm run dev
  ```
- **Production**:
  ```bash
  npm start
  ```

### 5. Mengakses Dokumentasi API
Buka peramban ke alamat:
- **Swagger UI**: `http://localhost:3000/api-docs` (masukkan kredensial dari `.env`).
- **OpenAPI JSON Spec**: `http://localhost:3000/api-docs.json`.

---

## 📂 Struktur Direktori

Struktur direktori backend diorganisasikan berdasarkan pemisahan tanggung jawab (*Separation of Concerns*):

```text
backend/
├── prisma/               # Definisi schema data Prisma dan konfigurasi database
├── src/
│   ├── config/           # Konfigurasi instance singleton (Prisma Client, Swagger spec)
│   ├── constants/        # Nilai konstanta aplikasi (peran user, status, kategori berkas)
│   ├── controllers/      # Handler HTTP request/response dan pemanggilan service
│   ├── mappers/          # Transformasi objek data entitas menjadi format DTO response
│   ├── middlewares/      # Middleware Express (auth JWT, role guard, validator, error handler)
│   ├── routes/           # Definisi endpoint rute Express dan anotasi Swagger JSDoc
│   │   └── api/          # Sub-router per modul fitur (/api/*)
│   ├── schemas/          # Aturan validasi skema input (Zod) untuk body, params, & query
│   ├── services/         # Logika bisnis utama, query Prisma, dan interaksi storage
│   ├── utils/            # Helper utilitas bersama (pagination, response formatter, validation helper)
│   ├── app.js            # Inisialisasi Express app, middleware global, CORS, dan rute
│   └── server.js         # Entry point aplikasi dan inisialisasi koneksi database
├── .env.example          # Template variabel environment
├── Dockerfile            # Konfigurasi containerization Docker
└── package.json          # Manajemen dependensi dan script npm
```

---

## 📐 Standar Pengembangan & Konvensi Kode

Seluruh pengembang (manusia maupun asisten AI) wajib mematuhi panduan arsitektur berikut guna menjaga konsistensi codebase:

### 1. Konsistensi Penamaan (Strict Naming Consistency)
Selalu gunakan konvensi penamaan yang seragam di seluruh layer kode:
- **URL Route**: Wajib menggunakan format **lowercase kebab-case** atau plural (contoh: `/api/permohonan-skta`, `/api/study-programs`, `/api/sidang-registrations`).
- **Variabel, Fungsi, & Properti JSON**: Wajib menggunakan format **camelCase** (contoh: `studyProgramId`, `isDraft`, `submittedAt`, `getPaginationParams`).
- **Database (Tabel & Kolom)**: Wajib menggunakan format **snake_case** pada mapping database via Prisma `@map` / `@@map` (contoh: `@map("created_at")`, `@@map("permohonan_skta")`).
- **Konstanta Global & Enum**: Wajib menggunakan format **UPPER_SNAKE_CASE** (contoh: `REGISTRATION_STATUS`, `ROLES`).
- **Penamaan File**:
  - Controller: `<namaModul>Controller.js`
  - Service: `<namaModul>Service.js`
  - Schema: `<namaModul>Schema.js`
  - Mapper: `<namaModul>Mapper.js`

### 2. Aturan Query Parameter (Tanpa Parameter Alias)
- **Dilarang keras menggunakan alias atau varian fallback** untuk query parameter (misal: dilarang mendukung `q` berdampingan dengan `search`, atau `sort` berdampingan dengan `sortBy`). Selalu gunakan satu nama kanonik eksplisit.
- **Pencarian Kata Kunci**: Gunakan `search`.
- **Pagination**: Gunakan `page` dan `limit` (selalu proses melalui helper `getPaginationParams(req.query)`).
- **Pengurutan Data**:
  - `sortBy`: Field yang diurutkan (contoh: `createdAt`, `name`, `nim`, `tglSidang`).
  - `sortOrder`: `asc` atau `desc` (default: `desc` untuk waktu/tanggal, `asc` untuk alfabet/nama).
- **Filter Relasi & Identifier**: Gunakan **camelCase** sesuai model (contoh: `studyProgramId`, `facultyId`, `status`, `isDraft`).

### 3. Standardisasi Pagination & Response
Semua endpoint `GET` daftar data (*list*) wajib mengembalikan struktur pagination yang konsisten melalui helper `formatPaginationResponse`:
```json
{
  "data": [ ... ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

### 4. Validasi Input & Penanganan Error
- Validasi request body, query, dan params dilakukan pada layer schema (Zod) sebelum logika database dijalankan.
- Jika validasi gagal, kembalikan respon `422 Unprocessable Entity` secara seragam menggunakan helper `sendValidationError(res, errors, req)`.
- Seluruh endpoint controller harus dibungkus dengan `express-async-handler` agar runtime exception ditangkap oleh global `errorHandler`.

### 5. Perubahan Skema Basis Data (Prisma)
Setiap penambahan atau modifikasi tabel/kolom:
1. Cantumkan mapping `snake_case` untuk nama tabel dan kolom di `prisma/schema.prisma`.
2. Jalankan `npm run prisma:db-push` dan `npm run prisma:generate`.
3. Perbarui anotasi Swagger JSDoc, skema Zod, dan mapper terkait secara konsisten.
