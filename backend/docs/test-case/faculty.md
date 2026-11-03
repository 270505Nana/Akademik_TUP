# Matriks Kasus Uji (Test Case) — Endpoint Faculty (Fakultas)

Dokumen ini menyajikan seluruh spesifikasi kasus uji untuk endpoint data fakultas (*Faculty*) backend **Sistem Akademik TUP** dalam format tabel terstruktur.

---

## 1. Informasi Lingkungan & Konfigurasi Pengujian

| Parameter | Konfigurasi / Keterangan |
| :--- | :--- |
| **Modul** | Master Data Fakultas (*Faculty*) |
| **Base URL** | `http://localhost:3000/api/faculties` |
| **Format Data** | `application/json` |
| **Mekanisme Autentikasi** | JSON Web Token (JWT) — `Authorization: Bearer <token>` |
| **Hak Akses Baca (GET)** | Seluruh pengguna terautentikasi (`ADMIN`, `DOSEN`, `MAHASISWA`) |
| **Hak Akses Kelola (POST, PUT, PATCH, DELETE)** | Khusus Role `ADMIN` (`authorize("ADMIN")`) |
| **Penghapusan Data** | *Soft Delete* (mengisi kolom `deleted_at`) |
| **Pencarian & Filter** | `search` (nama fakultas - *case-insensitive*), `isActive` (boolean `true`/`false`) |
| **Pengurutan Standar** | `sortBy`: `name` (default), `isActive`, `createdAt` \| `sortOrder`: `asc` (default), `desc` |
| **Pagination Standar** | `page` (default: 1), `limit` (default: 10, max: 100) |

---

## 2. Tabel Kasus Uji: `GET /api/faculties` (List, Filter, Sort, Pagination)

| ID Test Case | Skenario Pengujian | Kategori | Prasyarat | Header & Query Parameter | Expected Status | Expected Response & Validasi | Status Uji |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- | :---: |
| **TC-FAC-GET-001** | Ambil Daftar Fakultas Default (*Happy Path*) | Positif | Data fakultas tersedia di database & token valid | `Authorization: Bearer <VALID_TOKEN>`<br>*Tanpa query param* | `200 OK` | <pre>{<br>  "data": [...],<br>  "pagination": {<br>    "totalItems": 7,<br>    "itemsPerPage": 10,<br>    "currentPage": 1,<br>    "totalPages": 1<br>  }<br>}</pre>Data terurut alfabetis `name: asc`, data dengan `deletedAt != null` tidak ditampilkan. | *Pending* |
| **TC-FAC-GET-002** | Pencarian Fakultas Berdasarkan Nama | Positif | Terdapat data "Fakultas Informatika" di database | `Authorization: Bearer <VALID_TOKEN>`<br>`?search=informatika` | `200 OK` | Seluruh data yang dikembalikan pada array `data` memuat kata "informatika" (*case-insensitive*). | *Pending* |
| **TC-FAC-GET-003** | Filter Fakultas Berdasarkan Status Aktif (`isActive=true`) | Positif | Terdapat data fakultas aktif dan non-aktif | `Authorization: Bearer <VALID_TOKEN>`<br>`?isActive=true` | `200 OK` | Semua item pada array `data` memiliki atribut `"isActive": true`. | *Pending* |
| **TC-FAC-GET-004** | Filter Fakultas Berdasarkan Status Non-Aktif (`isActive=false`) | Positif | Terdapat data fakultas non-aktif | `Authorization: Bearer <VALID_TOKEN>`<br>`?isActive=false` | `200 OK` | Semua item pada array `data` memiliki atribut `"isActive": false`. | *Pending* |
| **TC-FAC-GET-005** | Pengurutan Berdasarkan Tanggal Dibuat Terbaru | Positif | - | `Authorization: Bearer <VALID_TOKEN>`<br>`?sortBy=createdAt&sortOrder=desc` | `200 OK` | Data diurutkan dari `createdAt` paling baru ke terlama. | *Pending* |
| **TC-FAC-GET-006** | Pengurutan Berdasarkan Status Aktif | Positif | - | `Authorization: Bearer <VALID_TOKEN>`<br>`?sortBy=isActive&sortOrder=desc` | `200 OK` | Fakultas berstatus `isActive: true` tampil di urutan teratas. | *Pending* |
| **TC-FAC-GET-007** | Kustomisasi Halaman dan Batas Item (*Pagination*) | Positif | Jumlah data lebih dari 3 item | `Authorization: Bearer <VALID_TOKEN>`<br>`?page=2&limit=3` | `200 OK` | `pagination.currentPage = 2`, `pagination.itemsPerPage = 3`, jumlah item array `data <= 3`. | *Pending* |
| **TC-FAC-GET-008** | Gagal Karena Nilai `sortBy` Tidak Diizinkan | Negatif | - | `Authorization: Bearer <VALID_TOKEN>`<br>`?sortBy=kodeFakultas` | `400 Bad Request` | <pre>{<br>  "message": "Validation error",<br>  "errors": [{<br>    "field": "sortBy",<br>    "message": "sortBy harus salah satu dari: name, isActive, createdAt"<br>  }]<br>}</pre> | *Pending* |
| **TC-FAC-GET-009** | Gagal Karena Nilai `sortOrder` Tidak Valid | Negatif | - | `Authorization: Bearer <VALID_TOKEN>`<br>`?sortOrder=ascending` | `400 Bad Request` | <pre>{<br>  "message": "Validation error",<br>  "errors": [{<br>    "field": "sortOrder",<br>    "message": "sortOrder harus salah satu dari: asc, desc"<br>  }]<br>}</pre> | *Pending* |
| **TC-FAC-GET-010** | Gagal Karena Batas `limit` Melebihi Maksimum (> 100) | Boundary / Negatif | - | `Authorization: Bearer <VALID_TOKEN>`<br>`?limit=150` | `400 Bad Request` | Validasi Zod menolak karena batasan `.max(100)`. | *Pending* |
| **TC-FAC-GET-011** | Gagal Mengambil Data Tanpa Token Autentikasi | Negatif | - | *Tanpa Header Authorization* | `401 Unauthorized` | <pre>{"message": "Token not found"}</pre> | *Pending* |

---

## 3. Tabel Kasus Uji: `POST /api/faculties` (Create & Restore)

| ID Test Case | Skenario Pengujian | Kategori | Prasyarat | Header & Request Body (Payload) | Expected Status | Expected Response & Validasi | Status Uji |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- | :---: |
| **TC-FAC-POST-001** | Admin Berhasil Membuat Fakultas Baru (*Happy Path*) | Positif | Login sebagai ADMIN, nama fakultas belum ada di DB | `Authorization: Bearer <ADMIN_TOKEN>`<br>`Content-Type: application/json`<br><pre>{<br>  "name": "Fakultas Rekayasa Industri",<br>  "isActive": true<br>}</pre> | `201 Created` | <pre>{<br>  "message": "Faculty created successfully",<br>  "data": {<br>    "id": "&lt;UUID&gt;",<br>    "name": "Fakultas Rekayasa Industri",<br>    "isActive": true,<br>    "createdAt": "&lt;TIMESTAMP&gt;",<br>    "updatedAt": "&lt;TIMESTAMP&gt;",<br>    "deletedAt": null<br>  }<br>}</pre> | *Pending* |
| **TC-FAC-POST-002** | Admin Berhasil Membuat Fakultas dengan `isActive` Default (`true`) | Positif | Login sebagai ADMIN, nama fakultas unik | `Authorization: Bearer <ADMIN_TOKEN>`<br>`Content-Type: application/json`<br><pre>{"name": "Fakultas Komunikasi dan Bisnis"}</pre> | `201 Created` | Field `isActive` otomatis bernilai `true`. | *Pending* |
| **TC-FAC-POST-003** | Restore Otomatis Fakultas yang Pernah Di-*Soft Delete* | Positif / Edge Case | Terdapat fakultas "Fakultas Ilmu Terapan" dengan `deletedAt != null` | `Authorization: Bearer <ADMIN_TOKEN>`<br>`Content-Type: application/json`<br><pre>{<br>  "name": "Fakultas Ilmu Terapan",<br>  "isActive": true<br>}</pre> | `200 OK` | <pre>{<br>  "message": "Fakultas berhasil dipulihkan",<br>  "data": {<br>    "name": "Fakultas Ilmu Terapan",<br>    "deletedAt": null<br>  }<br>}</pre>Kolom `deletedAt` kembali `null`, tidak membuat row baru. | *Pending* |
| **TC-FAC-POST-004** | Gagal Membuat Data Karena Nama Sudah Terdaftar (Duplikat Aktif) | Negatif | Data "Fakultas Rekayasa Industri" sedang aktif di DB | `Authorization: Bearer <ADMIN_TOKEN>`<br>`Content-Type: application/json`<br><pre>{"name": "Fakultas Rekayasa Industri"}</pre> | `400 Bad Request` | <pre>{<br>  "message": "Validation error",<br>  "errors": [{<br>    "field": "name",<br>    "message": "Nama fakultas sudah terdaftar"<br>  }]<br>}</pre> | *Pending* |
| **TC-FAC-POST-005** | Gagal Karena Nama Fakultas Kurang dari 3 Karakter | Boundary / Negatif | Login sebagai ADMIN | `Authorization: Bearer <ADMIN_TOKEN>`<br>`Content-Type: application/json`<br><pre>{"name": "FI"}</pre> | `400 Bad Request` | <pre>{<br>  "message": "Validation error",<br>  "errors": [{<br>    "field": "name",<br>    "message": "Nama fakultas minimal 3 karakter"<br>  }]<br>}</pre> | *Pending* |
| **TC-FAC-POST-006** | Gagal Karena Nama Fakultas Lebih dari 100 Karakter | Boundary / Negatif | Login sebagai ADMIN | `Authorization: Bearer <ADMIN_TOKEN>`<br>`Content-Type: application/json`<br><pre>{"name": "&lt;STRING_101_KARAKTER&gt;"}</pre> | `400 Bad Request` | Pesan validasi Zod maksimal 100 karakter. | *Pending* |
| **TC-FAC-POST-007** | Gagal Karena Request Body Kosong | Negatif | Login sebagai ADMIN | `Authorization: Bearer <ADMIN_TOKEN>`<br>`Content-Type: application/json`<br><pre>{}</pre> | `400 Bad Request` | Pesan validasi Zod bahwa nama fakultas wajib diisi. | *Pending* |
| **TC-FAC-POST-008** | Gagal Ditolak Karena Pengguna Bukan Admin (Role Dosen/Mahasiswa) | RBAC / Negatif | Login sebagai MAHASISWA atau DOSEN | `Authorization: Bearer <MAHASISWA_TOKEN>`<br>`Content-Type: application/json`<br><pre>{"name": "Fakultas Kedokteran"}</pre> | `403 Forbidden` | <pre>{"message": "Akses ditolak"}</pre> | *Pending* |

---

## 4. Tabel Kasus Uji: `GET /api/faculties/:id` (Detail by ID)

| ID Test Case | Skenario Pengujian | Kategori | Prasyarat | Header & Path Parameter | Expected Status | Expected Response & Validasi | Status Uji |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- | :---: |
| **TC-FAC-BYID-001** | Ambil Detail Fakultas Berhasil (*Happy Path*) | Positif | Fakultas aktif dengan `<VALID_UUID>` ada di DB | `Authorization: Bearer <VALID_TOKEN>`<br>`GET /api/faculties/<VALID_UUID>` | `200 OK` | <pre>{<br>  "data": {<br>    "id": "&lt;VALID_UUID&gt;",<br>    "name": "Fakultas Informatika",<br>    "isActive": true,<br>    "createdAt": "&lt;TIMESTAMP&gt;",<br>    "updatedAt": "&lt;TIMESTAMP&gt;",<br>    "deletedAt": null<br>  }<br>}</pre> | *Pending* |
| **TC-FAC-BYID-002** | Gagal Karena ID Tidak Ditemukan / UUID Acak | Negatif | UUID tidak ada di database | `Authorization: Bearer <VALID_TOKEN>`<br>`GET /api/faculties/00000000-0000-0000-0000-000000000000` | `404 Not Found` | <pre>{"message": "Fakultas tidak ditemukan"}</pre> | *Pending* |
| **TC-FAC-BYID-003** | Gagal Karena Data Sudah Berstatus Di-*Soft Delete* | Edge Case / Negatif | Data fakultas dengan ID tersebut memiliki `deletedAt != null` | `Authorization: Bearer <VALID_TOKEN>`<br>`GET /api/faculties/<DELETED_UUID>` | `404 Not Found` | <pre>{"message": "Fakultas tidak ditemukan"}</pre>Data terhapus diisolasi dari query detail. | *Pending* |

---

## 5. Tabel Kasus Uji: `PUT /api/faculties/:id` (Update Data)

| ID Test Case | Skenario Pengujian | Kategori | Prasyarat | Header, Path & Request Body | Expected Status | Expected Response & Validasi | Status Uji |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- | :---: |
| **TC-FAC-PUT-001** | Admin Berhasil Memperbarui Nama dan Status Aktif | Positif | Login sebagai ADMIN, ID fakultas valid | `Authorization: Bearer <ADMIN_TOKEN>`<br>`PUT /api/faculties/<VALID_UUID>`<br><pre>{<br>  "name": "Fakultas Teknik Elektro",<br>  "isActive": false<br>}</pre> | `200 OK` | <pre>{<br>  "message": "Faculty updated successfully",<br>  "data": {<br>    "id": "&lt;VALID_UUID&gt;",<br>    "name": "Fakultas Teknik Elektro",<br>    "isActive": false<br>  }<br>}</pre> | *Pending* |
| **TC-FAC-PUT-002** | Admin Berhasil Memperbarui Hanya Status `isActive` | Positif | Login sebagai ADMIN | `Authorization: Bearer <ADMIN_TOKEN>`<br>`PUT /api/faculties/<VALID_UUID>`<br><pre>{"isActive": true}</pre> | `200 OK` | Nama tetap tidak berubah, status `isActive` berubah menjadi `true`. | *Pending* |
| **TC-FAC-PUT-003** | Gagal Karena Nama Baru Sudah Digunakan Fakultas Lain | Negatif | Fakultas lain dengan nama "Fakultas Industri Kreatif" aktif di DB | `Authorization: Bearer <ADMIN_TOKEN>`<br>`PUT /api/faculties/<VALID_UUID>`<br><pre>{"name": "Fakultas Industri Kreatif"}</pre> | `400 Bad Request` | <pre>{<br>  "message": "Validation error",<br>  "errors": [{<br>    "field": "name",<br>    "message": "Nama fakultas sudah terdaftar"<br>  }]<br>}</pre> | *Pending* |
| **TC-FAC-PUT-004** | Gagal Update Data yang Tidak Ditemukan atau Sudah Dihapus | Negatif | ID tidak ada di database | `Authorization: Bearer <ADMIN_TOKEN>`<br>`PUT /api/faculties/00000000-0000-0000-0000-000000000000`<br><pre>{"name": "Nama Baru"}</pre> | `404 Not Found` | <pre>{"message": "Fakultas tidak ditemukan"}</pre> | *Pending* |
| **TC-FAC-PUT-005** | Gagal Update Karena Pengguna Bukan Admin (Role Mahasiswa/Dosen) | RBAC / Negatif | Login sebagai MAHASISWA atau DOSEN | `Authorization: Bearer <MAHASISWA_TOKEN>`<br>`PUT /api/faculties/<VALID_UUID>`<br><pre>{"name": "Nama Baru"}</pre> | `403 Forbidden` | <pre>{"message": "Akses ditolak"}</pre> | *Pending* |

---

## 6. Tabel Kasus Uji: `PATCH /api/faculties/:id/toggle-active` (Toggle Status Aktif)

| ID Test Case | Skenario Pengujian | Kategori | Prasyarat | Header & Path Parameter | Expected Status | Expected Response & Validasi | Status Uji |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- | :---: |
| **TC-FAC-TOG-001** | Admin Berhasil Menonaktifkan Fakultas Aktif | Positif | Fakultas dengan ID tersebut saat ini `isActive: true` | `Authorization: Bearer <ADMIN_TOKEN>`<br>`PATCH /api/faculties/<VALID_UUID>/toggle-active` | `200 OK` | <pre>{<br>  "message": "Faculty deactivated successfully",<br>  "data": {<br>    "id": "&lt;VALID_UUID&gt;",<br>    "isActive": false<br>  }<br>}</pre> | *Pending* |
| **TC-FAC-TOG-002** | Admin Berhasil Mengaktifkan Fakultas Non-Aktif | Positif | Fakultas dengan ID tersebut saat ini `isActive: false` | `Authorization: Bearer <ADMIN_TOKEN>`<br>`PATCH /api/faculties/<VALID_UUID>/toggle-active` | `200 OK` | <pre>{<br>  "message": "Faculty activated successfully",<br>  "data": {<br>    "id": "&lt;VALID_UUID&gt;",<br>    "isActive": true<br>  }<br>}</pre> | *Pending* |
| **TC-FAC-TOG-003** | Gagal Toggle Pada ID yang Tidak Ada atau Sudah Dihapus | Negatif | ID tidak valid | `Authorization: Bearer <ADMIN_TOKEN>`<br>`PATCH /api/faculties/00000000-0000-0000-0000-000000000000/toggle-active` | `404 Not Found` | <pre>{"message": "Fakultas tidak ditemukan"}</pre> | *Pending* |
| **TC-FAC-TOG-004** | Gagal Toggle Status Oleh Pengguna Non-Admin | RBAC / Negatif | Login sebagai DOSEN atau MAHASISWA | `Authorization: Bearer <DOSEN_TOKEN>`<br>`PATCH /api/faculties/<VALID_UUID>/toggle-active` | `403 Forbidden` | <pre>{"message": "Akses ditolak"}</pre> | *Pending* |

---

## 7. Tabel Kasus Uji: `DELETE /api/faculties/:id` (Soft Delete)

| ID Test Case | Skenario Pengujian | Kategori | Prasyarat | Header & Path Parameter | Expected Status | Expected Response & Validasi | Status Uji |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- | :---: |
| **TC-FAC-DEL-001** | Admin Berhasil Menghapus Fakultas (*Soft Delete*) | Positif | Fakultas aktif ada di database | `Authorization: Bearer <ADMIN_TOKEN>`<br>`DELETE /api/faculties/<VALID_UUID>` | `200 OK` | <pre>{<br>  "message": "Faculty deleted successfully",<br>  "data": {<br>    "id": "&lt;VALID_UUID&gt;",<br>    "deletedAt": "&lt;TIMESTAMP&gt;"<br>  }<br>}</pre>Kolom `deleted_at` terisi timestamp tanggal saat ini. | *Pending* |
| **TC-FAC-DEL-002** | Gagal Menghapus Data yang Sudah Dihapus Sebelumnya (*Soft Deleted*) | Negatif | Data sudah berstatus `deletedAt != null` | `Authorization: Bearer <ADMIN_TOKEN>`<br>`DELETE /api/faculties/<ALREADY_DELETED_UUID>` | `404 Not Found` | <pre>{"message": "Fakultas tidak ditemukan"}</pre>Mencegah penghapusan ganda. | *Pending* |
| **TC-FAC-DEL-003** | Gagal Menghapus Data Oleh Pengguna Non-Admin | RBAC / Negatif | Login sebagai MAHASISWA atau DOSEN | `Authorization: Bearer <MAHASISWA_TOKEN>`<br>`DELETE /api/faculties/<VALID_UUID>` | `403 Forbidden` | <pre>{"message": "Akses ditolak"}</pre>Data di database tidak berubah. | *Pending* |
