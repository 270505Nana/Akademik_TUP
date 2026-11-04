# Matriks Kasus Uji (Test Case) — Endpoint Permohonan SKTA

Dokumen ini menyajikan seluruh spesifikasi kasus uji untuk modul endpoint **Permohonan SKTA** backend **Sistem Akademik TUP** dalam format tabel terstruktur beserta hasil eksekusi pengujian otomatis berbasis Vitest + Supertest.

---

## 1. Informasi Lingkungan & Konfigurasi Pengujian

| Parameter | Konfigurasi / Keterangan |
| :--- | :--- |
| **Modul** | Permohonan Surat Keputusan Tugas Akhir (*Permohonan SKTA*) |
| **Base URL** | `http://localhost:3000/api/permohonan-skta` |
| **Format Data** | `application/json` dan `multipart/form-data` (untuk unggah evidence / file SKTA) |
| **Mekanisme Autentikasi** | JSON Web Token (JWT) — `Authorization: Bearer <token>` |
| **Hak Akses Baca (GET /)** | Terautentikasi (`ADMIN`, `DOSEN`, `MAHASISWA`) |
| **Hak Akses Mahasiswa (POST, PUT Draft)** | Khusus Role `MAHASISWA` (`authorize("MAHASISWA")`) |
| **Hak Akses Admin (Approve, Reject, Export ZIP, Template)** | Khusus Role `ADMIN` (`authorize("ADMIN")`) |
| **Soft Delete** | Kolom `deleted_at` (`deletedAt: null`) |
| **Filter Standar** | `mahasiswaId` (UUID), `studyProgramId` (string), `category` (enum), `search` (keyword) |
| **Filter Rentang Tanggal** | `startDate`, `endDate` (format ISO/date, rentang `createdAt` maksimal 6 bulan; jika tidak diisi, default memfilter 6 bulan terakhir) |
| **Pengurutan Standar** | `sortBy`: `newest` (default, `createdAt` desc), `oldest` (`createdAt` asc) — sesuai konvensi `GET /api/sidang-registrations` tanpa parameter `sortOrder` |
| **Pagination Standar** | `page` (default: 1), `limit` (default: 10, max: 100, supports `all` / `-1`) |

---

## 2. Tabel Kasus Uji: `GET /api/permohonan-skta` (List, Filter, Sort, Pagination)

| ID Test Case | Skenario Pengujian | Kategori | Prasyarat | Header & Query Parameter | Expected Status | Expected Response & Validasi | Status Uji |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- | :---: |
| **TC-SKTA-GET-001** | Ambil Daftar Permohonan SKTA Default (*Happy Path*) | Positif | Token valid & data permohonan tersedia | `Authorization: Bearer <VALID_TOKEN>`<br>*Tanpa query param* | `200 OK` | Mengembalikan array `data` dan objek `pagination` (`page`, `limit`, `total`, `totalPages`). Secara default memfilter data 6 bulan terakhir dengan sorting `newest`. Unsubmitted initial drafts tidak ditampilkan. | **PASS** |
| **TC-SKTA-GET-002** | Filter Berdasarkan Kategori Permohonan | Positif | Data permohonan dengan kategori terkait tersedia | `Authorization: Bearer <VALID_TOKEN>`<br>`?category=Permohonan Baru` | `200 OK` | Seluruh item pada array `data` memiliki `category: "Permohonan Baru"`. | **PASS** |
| **TC-SKTA-GET-003** | Pencarian Berdasarkan Kata Kunci (*Search*) | Positif | Data mahasiswa/proposal cocok ada di DB | `Authorization: Bearer <VALID_TOKEN>`<br>`?search=izardaffa` | `200 OK` | Data yang dikembalikan memuat keyword pencarian pada nama, NIM, atau judul proposal. | **PASS** |
| **TC-SKTA-GET-004** | Pengurutan Berdasarkan Tanggal Pembuatan Terlama (*Oldest*) | Positif | - | `Authorization: Bearer <VALID_TOKEN>`<br>`?sortBy=oldest` | `200 OK` | Data terurut dari `createdAt` paling awal ke paling baru (`createdAt: "asc"`). | **PASS** |
| **TC-SKTA-GET-005** | Pengurutan Berdasarkan Tanggal Pembuatan Terbaru (*Newest*) | Positif | - | `Authorization: Bearer <VALID_TOKEN>`<br>`?sortBy=newest` | `200 OK` | Data terurut dari `createdAt` paling baru ke paling awal (`createdAt: "desc"`). | **PASS** |
| **TC-SKTA-GET-006** | Kustomisasi Halaman dan Batas Data (*Pagination*) | Positif | Jumlah data >= 2 | `Authorization: Bearer <VALID_TOKEN>`<br>`?page=1&limit=2` | `200 OK` | `data.length <= 2`, `pagination.limit = 2`, `pagination.page = 1`. | **PASS** |
| **TC-SKTA-GET-007** | Gagal Karena Nilai `sortBy` Tidak Diizinkan | Negatif | - | `Authorization: Bearer <VALID_TOKEN>`<br>`?sortBy=invalidSortField` | `400 Bad Request` | Pesan validasi Zod: `sortBy harus salah satu dari: newest, oldest`. | **PASS** |
| **TC-SKTA-GET-008** | Filter Berdasarkan Rentang `createdAt` Valid (<= 6 Bulan) | Positif | - | `Authorization: Bearer <VALID_TOKEN>`<br>`?startDate=2026-01-01&endDate=2026-04-01` | `200 OK` | Mengembalikan permohonan yang dibuat antara rentang tanggal yang diminta. | **PASS** |
| **TC-SKTA-GET-009** | Gagal Filter Rentang `createdAt` Melebihi 6 Bulan | Boundary / Negatif | - | `Authorization: Bearer <VALID_TOKEN>`<br>`?startDate=2025-01-01&endDate=2025-09-01` | `400 Bad Request` | Pesan validasi Zod: `Rentang tanggal createdAt maksimal 6 bulan`. | **PASS** |
| **TC-SKTA-GET-010** | Gagal Karena `endDate` Lebih Awal dari `startDate` | Negatif | - | `Authorization: Bearer <VALID_TOKEN>`<br>`?startDate=2026-06-01&endDate=2026-01-01` | `400 Bad Request` | Pesan validasi Zod: `endDate tidak boleh lebih awal dari startDate`. | **PASS** |
| **TC-SKTA-GET-011** | Gagal Karena Nilai `limit` Melebihi Maksimum (> 100) | Boundary / Negatif | - | `Authorization: Bearer <VALID_TOKEN>`<br>`?limit=150` | `400 Bad Request` | Validasi Zod menolak nilai limit lebih dari 100. | **PASS** |
| **TC-SKTA-GET-012** | Gagal Karena Nilai `page` Kurang Dari 1 | Boundary / Negatif | - | `Authorization: Bearer <VALID_TOKEN>`<br>`?page=0` | `400 Bad Request` | Validasi Zod menolak halaman 0. | **PASS** |
| **TC-SKTA-GET-013** | Gagal Tanpa Token Autentikasi | Negatif | - | *Tanpa Header Authorization* | `401 Unauthorized` | `{"message": "Token not found"}` | **PASS** |
| **TC-SKTA-GET-014** | Gagal Dengan Token Tidak Valid / Kadaluwarsa | Negatif | - | `Authorization: Bearer invalid_token` | `403 Forbidden` | `{"message": "Invalid token"}` | **PASS** |

---

## 3. Tabel Kasus Uji: `GET /api/permohonan-skta/:id` & `/mahasiswa` (Detail & Latest)

| ID Test Case | Skenario Pengujian | Kategori | Prasyarat | Header & Path Parameter | Expected Status | Expected Response & Validasi | Status Uji |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- | :---: |
| **TC-SKTA-BYID-001** | Ambil Detail Permohonan SKTA Berhasil (*Happy Path*) | Positif | Data permohonan SKTA dengan `<VALID_UUID>` ada di DB | `Authorization: Bearer <VALID_TOKEN>`<br>`GET /api/permohonan-skta/<VALID_UUID>` | `200 OK` | Mengembalikan objek lengkap data permohonan SKTA beserta relasi `mahasiswa`, `dosenPembimbing1`, `dosenPembimbing2`, dan status verifikasi. | **PASS** |
| **TC-SKTA-BYID-002** | Gagal Mengambil Detail ID Tidak Ditemukan | Negatif | UUID acak tidak ada di database | `Authorization: Bearer <VALID_TOKEN>`<br>`GET /api/permohonan-skta/00000000-0000-0000-0000-000000000000` | `404 Not Found` | `{"message": "Permohonan SKTA tidak ditemukan"}` | **PASS** |
| **TC-SKTA-MHS-001** | Mahasiswa Mengambil Permohonan SKTA Miliknya Sendiri via `/mahasiswa` | Positif | Mahasiswa login & riwayat pengajuan ada | `Authorization: Bearer <MAHASISWA_TOKEN>`<br>`GET /api/permohonan-skta/mahasiswa` | `200 OK` | Mengembalikan permohonan SKTA terbaru milik mahasiswa login. | **PASS** |
| **TC-SKTA-MHS-002** | Mahasiswa Mengambil Permohonan SKTA Menggunakan ID Milik Sendiri | Positif | Mahasiswa login & menggunakan `mahasiswaId` miliknya sendiri | `Authorization: Bearer <MAHASISWA_TOKEN>`<br>`GET /api/permohonan-skta/mahasiswa/<OWN_ID>` | `200 OK` | Mengembalikan permohonan SKTA milik mahasiswa yang bersangkutan. | **PASS** |
| **TC-SKTA-MHS-003** | Mahasiswa Ditolak Mengakses Permohonan SKTA Milik Mahasiswa Lain | Akses Kontrol / Negatif | Mahasiswa login mencoba mengakses ID mahasiswa lain | `Authorization: Bearer <MAHASISWA_TOKEN>`<br>`GET /api/permohonan-skta/mahasiswa/<OTHER_MAHASISWA_ID>` | `403 Forbidden` | `{"message": "Akses ditolak: Mahasiswa hanya dapat melihat permohonan SKTA milik sendiri"}` | **PASS** |
| **TC-SKTA-MHS-004** | Admin/Dosen Mengakses Permohonan SKTA Mahasiswa Manapun | Positif | Admin / Dosen login | `Authorization: Bearer <ADMIN_TOKEN>`<br>`GET /api/permohonan-skta/mahasiswa/<MAHASISWA_ID>` | `200 OK` | Mengembalikan permohonan SKTA mahasiswa yang dicari. | **PASS** |
| **TC-SKTA-MHS-005** | Mengambil Permohonan Berdasarkan Mahasiswa ID Fiktif oleh Admin | Negatif | Admin login & ID Mahasiswa fiktif | `Authorization: Bearer <ADMIN_TOKEN>`<br>`GET /api/permohonan-skta/mahasiswa/00000000-0000-0000-0000-000000000000` | `404 Not Found` | `{"message": "Data permohonan SKTA untuk mahasiswa ini tidak ditemukan"}` | **PASS** |

---

## 4. Tabel Kasus Uji: `POST /api/permohonan-skta` (Save Draft) & `/submit`

| ID Test Case | Skenario Pengujian | Kategori | Prasyarat | Header & Payload | Expected Status | Expected Response & Validasi | Status Uji |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- | :---: |
| **TC-SKTA-POST-001** | Akses Ditolak untuk Role Non-Mahasiswa (Admin / Dosen) | RBAC / Negatif | Login sebagai ADMIN | `Authorization: Bearer <ADMIN_TOKEN>`<br>`POST /api/permohonan-skta` | `403 Forbidden` | `{"message": "Akses ditolak"}` | **PASS** |
| **TC-SKTA-POST-002** | Gagal Save Draft Tanpa `id` Maupun `mahasiswaId` | Negatif | Login sebagai MAHASISWA | `Authorization: Bearer <MAHASISWA_TOKEN>`<br>`{"judulProposalIndonesia": "Uji Judul"}` | `400 Bad Request` | Validasi schema Zod menolak karena minimal salah satu dari `id` atau `mahasiswaId` wajib disertakan. | **PASS** |
| **TC-SKTA-POST-003** | Gagal Save Draft dengan Kategori Tidak Valid | Negatif | Login sebagai MAHASISWA | `Authorization: Bearer <MAHASISWA_TOKEN>`<br>`{"mahasiswaId": "<UUID>", "category": "Kategori Tidak Valid"}` | `400 Bad Request` | Pesan validasi Zod: `Kategori permohonan SKTA tidak valid`. | **PASS** |
| **TC-SKTA-POST-004** | Gagal Submit Permohonan Tanpa Field Wajib Lengkap | Negatif | Login sebagai MAHASISWA | `Authorization: Bearer <MAHASISWA_TOKEN>`<br>`POST /api/permohonan-skta/submit`<br>`{"id": "<UUID>", "mahasiswaId": "<UUID>"}` | `400 Bad Request` | Validasi menolak submit dengan rincian field wajib yang belum terisi (judul Indonesia, judul Inggris, dosen pembimbing). | **PASS** |

---

## 5. Tabel Kasus Uji: `PUT /api/permohonan-skta/:id` (Update Data / Revisi)

| ID Test Case | Skenario Pengujian | Kategori | Prasyarat | Header & Payload | Expected Status | Expected Response & Validasi | Status Uji |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- | :---: |
| **TC-SKTA-PUT-001** | Gagal Update Pada ID Permohonan Tidak Ditemukan | Negatif | Login sebagai MAHASISWA | `Authorization: Bearer <MAHASISWA_TOKEN>`<br>`PUT /api/permohonan-skta/00000000-0000-0000-0000-000000000000` | `404 Not Found` | `{"message": "Permohonan SKTA tidak ditemukan"}` | **PASS** |
| **TC-SKTA-PUT-002** | Gagal Mengubah Permohonan yang Sudah Disubmit Tanpa Izin Edit | Bisnis / Negatif | Permohonan SKTA sudah submit (`isDraft: false`) dan tidak memiliki `isEdit` aktif | `Authorization: Bearer <MAHASISWA_TOKEN>`<br>`PUT /api/permohonan-skta/<SUBMITTED_ID>` | `403 Forbidden` | Pesan error: `Permohonan SKTA sudah dikirim dan tidak memiliki izin edit yang aktif`. | **PASS** |

---

## 6. Tabel Kasus Uji: `PUT /api/permohonan-skta/:id/approve` (Penerbitan SKTA)

| ID Test Case | Skenario Pengujian | Kategori | Prasyarat | Header & Payload | Expected Status | Expected Response & Validasi | Status Uji |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- | :---: |
| **TC-SKTA-APP-001** | Akses Ditolak untuk Pengguna Non-Admin (Mahasiswa / Dosen) | RBAC / Negatif | Login sebagai MAHASISWA | `Authorization: Bearer <MAHASISWA_TOKEN>`<br>`PUT /:id/approve` | `403 Forbidden` | `{"message": "Akses ditolak"}` | **PASS** |
| **TC-SKTA-APP-002** | Gagal Approve Tanpa Menyertakan `adminId` | Negatif | Login sebagai ADMIN | `Authorization: Bearer <ADMIN_TOKEN>`<br>`PUT /:id/approve`<br>`{}` | `400 Bad Request` | Validasi Zod menolak karena `adminId` wajib diisi. | **PASS** |
| **TC-SKTA-APP-003** | Gagal Approve ID Permohonan yang Tidak Ditemukan | Negatif | Login sebagai ADMIN | `Authorization: Bearer <ADMIN_TOKEN>`<br>`PUT /00000000-0000-0000-0000-000000000000/approve`<br>`{"adminId": "<ADMIN_UUID>"}` | `404 Not Found` | `{"message": "Permohonan SKTA tidak ditemukan"}` | **PASS** |

---

## 7. Tabel Kasus Uji: `PUT /api/permohonan-skta/:id/reject` (Tolak / Permintaan Revisi)

| ID Test Case | Skenario Pengujian | Kategori | Prasyarat | Header & Payload | Expected Status | Expected Response & Validasi | Status Uji |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- | :---: |
| **TC-SKTA-REJ-001** | Akses Ditolak untuk Pengguna Non-Admin (Dosen / Mahasiswa) | RBAC / Negatif | Login sebagai DOSEN | `Authorization: Bearer <DOSEN_TOKEN>`<br>`PUT /:id/reject` | `403 Forbidden` | `{"message": "Akses ditolak"}` | **PASS** |
| **TC-SKTA-REJ-002** | Gagal Reject Tanpa Menyertakan Alasan Penolakan (`message`) | Negatif | Login sebagai ADMIN | `Authorization: Bearer <ADMIN_TOKEN>`<br>`PUT /:id/reject`<br>`{"adminId": "<ADMIN_UUID>"}` | `400 Bad Request` | Validasi Zod: `Pesan penolakan wajib diisi`. | **PASS** |
| **TC-SKTA-REJ-003** | Gagal Reject ID Permohonan yang Tidak Ditemukan | Negatif | Login sebagai ADMIN | `Authorization: Bearer <ADMIN_TOKEN>`<br>`PUT /00000000-0000-0000-0000-000000000000/reject`<br>`{"adminId": "<ADMIN_UUID>", "message": "Proposal belum lengkap"}` | `404 Not Found` | `{"message": "Permohonan SKTA tidak ditemukan"}` | **PASS** |

---

## 8. Tabel Kasus Uji: Berkas, Generator & Export ZIP

| ID Test Case | Skenario Pengujian | Kategori | Prasyarat | Header & Endpoint | Expected Status | Expected Response & Validasi | Status Uji |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- | :---: |
| **TC-SKTA-EXP-001** | Akses Export ZIP Ditolak untuk Role Non-Admin | RBAC / Negatif | Login sebagai MAHASISWA | `Authorization: Bearer <MAHASISWA_TOKEN>`<br>`GET /export-skta` | `403 Forbidden` | `{"message": "Akses ditolak"}` | **PASS** |
| **TC-SKTA-EXP-002** | Gagal Export ZIP Karena Format Tanggal Salah | Negatif | Login sebagai ADMIN | `Authorization: Bearer <ADMIN_TOKEN>`<br>`GET /export-skta?startDate=invalid-date` | `400 Bad Request` | Validasi Zod: `Format startDate tidak valid`. | **PASS** |
| **TC-SKTA-EXP-003** | Admin Berhasil Mengunduh Berkas SKTA Sebagai ZIP | Positif | Login sebagai ADMIN | `Authorization: Bearer <ADMIN_TOKEN>`<br>`GET /export-skta` | `200 OK` | Header `Content-Type: application/zip`, `Content-Disposition: attachment; filename="Export_SKTA_...zip"`. | **PASS** |
| **TC-SKTA-GEN-001** | Mengambil Dokumen Validasi SKTA yang Belum Digenerate | Negatif | Login sebagai ADMIN | `Authorization: Bearer <ADMIN_TOKEN>`<br>`GET /:id/generate/dokumen-validasi-skta` | `404 Not Found` | Pesan: berkas validasi SKTA belum ditemukan di database. | **PASS** |
| **TC-SKTA-GEN-002** | Mengambil Formulir SKTA yang Belum Digenerate | Negatif | Login sebagai ADMIN | `Authorization: Bearer <ADMIN_TOKEN>`<br>`GET /:id/generate/formulir-skta` | `404 Not Found` | Pesan: berkas formulir SKTA belum ditemukan di database. | **PASS** |
| **TC-SKTA-DWN-001** | Unduh Berkas Validasi ID Tidak Ditemukan | Negatif | - | `GET /download/validasi/00000000-0000-0000-0000-000000000000` | `404 Not Found` | Berkas tidak ditemukan. | **PASS** |
| **TC-SKTA-DWN-002** | Unduh Berkas SKTA Terbitan Tidak Ditemukan | Negatif | Token valid | `GET /:id/download/skta` (ID fiktif) | `404 Not Found` | Berkas SKTA tidak ditemukan. | **PASS** |
| **TC-SKTA-DWN-003** | Unduh Berkas Evidence Tidak Ditemukan | Negatif | Token valid | `GET /:id/download/evidence` (ID fiktif) | `404 Not Found` | Berkas evidence tidak ditemukan. | **PASS** |

---

## 9. Rekapitulasi Eksekusi Pengujian Otomatis

Pengujian otomatis dijalankan menggunakan framework **Vitest + Supertest** pada file pengujian [`permohonan-skta.test.js`](file:///c:/Users/Modern14/Projects/Akademik_TUP/backend/tests/permohonan-skta.test.js).

```text
========================================
RINGKASAN HASIL PENGUJIAN (permohonan-skta.test.js):
Total Skenario Diuji : 27 Skenario
- Schema Zod Validation        : 7 Skenario
- Service Layer List & Sort    : 4 Skenario
- Service Access Control (Mhs) : 4 Skenario
- HTTP Integration (API)       : 12 Skenario

Status: ALL PASS (27/27)
========================================
```
