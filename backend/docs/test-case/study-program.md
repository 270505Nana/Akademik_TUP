# Matriks Kasus Uji (Test Case) — Endpoint Study Program (Program Studi)

Dokumen ini menyajikan seluruh spesifikasi kasus uji untuk endpoint data program studi (*Study Program*) backend **Sistem Akademik TUP** dalam format tabel terstruktur.

---

## 1. Informasi Lingkungan & Konfigurasi Pengujian

| Parameter | Konfigurasi / Keterangan |
| :--- | :--- |
| **Modul** | Master Data Program Studi (*Study Program*) |
| **Base URL** | `http://localhost:3000/api/study-programs` |
| **Format Data** | `application/json` |
| **Mekanisme Autentikasi** | JSON Web Token (JWT) — `Authorization: Bearer <token>` |
| **Hak Akses Baca (GET)** | Seluruh pengguna terautentikasi (`ADMIN`, `DOSEN`, `MAHASISWA`) |
| **Hak Akses Kelola (POST, PUT, PATCH, DELETE)** | Khusus Role `ADMIN` (`authorize("ADMIN")`) |
| **Penghapusan Data** | *Soft Delete* (mengisi kolom `deleted_at`) |
| **Relasi Entitas** | Berelasi (*Many-to-One*) dengan Fakultas melalui field `facultyId` |
| **Pencarian & Filter** | `search` (nama prodi - *case-insensitive*), `isActive` (boolean `true`/`false`), `facultyId` (UUID fakultas) |
| **Pengurutan Standar** | `sortBy`: `name` (default), `faculty`, `isActive`, `createdAt` \| `sortOrder`: `asc` (default), `desc` |
| **Pagination Standar** | `page` (default: 1), `limit` (default: 10, max: 100) |

---

## 2. Tabel Kasus Uji: `GET /api/study-programs` (List, Filter, Sort, Pagination)

| ID Test Case | Skenario Pengujian | Kategori | Prasyarat | Header & Query Parameter | Expected Status | Expected Response & Validasi | Status Uji |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- | :---: |
| **TC-SP-GET-001** | Ambil Daftar Program Studi Default (*Happy Path*) | Positif | Data prodi tersedia di DB & token valid | `Authorization: Bearer <VALID_TOKEN>`<br>*Tanpa query param* | `200 OK` | <pre>{<br>  "data": [...],<br>  "pagination": {<br>    "totalItems": 12,<br>    "itemsPerPage": 10,<br>    "currentPage": 1,<br>    "totalPages": 2<br>  }<br>}</pre>Setiap item menyertakan objek relasi `faculty`, data terhapus (`deletedAt != null`) tidak ditampilkan. | *Pending* |
| **TC-SP-GET-002** | Pencarian Program Studi Berdasarkan Nama | Positif | Terdapat data "S1 Informatika" di database | `Authorization: Bearer <VALID_TOKEN>`<br>`?search=informatika` | `200 OK` | Seluruh data yang dikembalikan pada array `data` memuat kata "informatika" (*case-insensitive*). | *Pending* |
| **TC-SP-GET-003** | Filter Berdasarkan Fakultas Induk (`facultyId`) | Positif | Terdapat prodi yang terdaftar pada Fakultas Informatika (`<FACULTY_UUID>`) | `Authorization: Bearer <VALID_TOKEN>`<br>`?facultyId=<FACULTY_UUID>` | `200 OK` | Seluruh data yang dikembalikan memiliki atribut `facultyId` yang sesuai. | *Pending* |
| **TC-SP-GET-004** | Filter Program Studi Berdasarkan Status Aktif (`isActive=true`) | Positif | Terdapat data prodi aktif dan non-aktif | `Authorization: Bearer <VALID_TOKEN>`<br>`?isActive=true` | `200 OK` | Seluruh item pada array `data` memiliki atribut `"isActive": true`. | *Pending* |
| **TC-SP-GET-005** | Filter Program Studi Berdasarkan Status Non-Aktif (`isActive=false`) | Positif | Terdapat data prodi non-aktif | `Authorization: Bearer <VALID_TOKEN>`<br>`?isActive=false` | `200 OK` | Seluruh item pada array `data` memiliki atribut `"isActive": false`. | *Pending* |
| **TC-SP-GET-006** | Pengurutan Berdasarkan Nama Fakultas (`sortBy=faculty`) | Positif | - | `Authorization: Bearer <VALID_TOKEN>`<br>`?sortBy=faculty&sortOrder=asc` | `200 OK` | Data diurutkan secara alfabetis berdasarkan nama fakultas (`faculty.name`). | *Pending* |
| **TC-SP-GET-007** | Pengurutan Berdasarkan Tanggal Dibuat Terbaru | Positif | - | `Authorization: Bearer <VALID_TOKEN>`<br>`?sortBy=createdAt&sortOrder=desc` | `200 OK` | Data diurutkan dari `createdAt` paling baru ke terlama. | *Pending* |
| **TC-SP-GET-008** | Kustomisasi Halaman dan Batas Item (*Pagination*) | Positif | Jumlah data lebih dari 5 item | `Authorization: Bearer <VALID_TOKEN>`<br>`?page=2&limit=5` | `200 OK` | `pagination.currentPage = 2`, `pagination.itemsPerPage = 5`, jumlah item `data <= 5`. | *Pending* |
| **TC-SP-GET-009** | Gagal Karena Nilai `sortBy` Tidak Diizinkan | Negatif | - | `Authorization: Bearer <VALID_TOKEN>`<br>`?sortBy=jenjang` | `400 Bad Request` | <pre>{<br>  "message": "Validation error",<br>  "errors": [{<br>    "field": "sortBy",<br>    "message": "sortBy harus salah satu dari: name, faculty, isActive, createdAt"<br>  }]<br>}</pre> | *Pending* |
| **TC-SP-GET-010** | Gagal Karena Nilai `sortOrder` Tidak Valid | Negatif | - | `Authorization: Bearer <VALID_TOKEN>`<br>`?sortOrder=descending` | `400 Bad Request` | <pre>{<br>  "message": "Validation error",<br>  "errors": [{<br>    "field": "sortOrder",<br>    "message": "sortOrder harus salah satu dari: asc, desc"<br>  }]<br>}</pre> | *Pending* |
| **TC-SP-GET-011** | Gagal Karena Batas `limit` Melebihi Maksimum (> 100) | Boundary / Negatif | - | `Authorization: Bearer <VALID_TOKEN>`<br>`?limit=105` | `400 Bad Request` | Validasi Zod menolak karena batasan `.max(100)`. | *Pending* |
| **TC-SP-GET-012** | Gagal Mengambil Data Tanpa Token Autentikasi | Negatif | - | *Tanpa Header Authorization* | `401 Unauthorized` | <pre>{"message": "Token not found"}</pre> | *Pending* |

---

## 3. Tabel Kasus Uji: `POST /api/study-programs` (Create & Restore)

| ID Test Case | Skenario Pengujian | Kategori | Prasyarat | Header & Request Body (Payload) | Expected Status | Expected Response & Validasi | Status Uji |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- | :---: |
| **TC-SP-POST-001** | Admin Berhasil Membuat Program Studi Baru (*Happy Path*) | Positif | Login sebagai ADMIN, fakultas `<FACULTY_UUID>` aktif di DB, nama prodi unik | `Authorization: Bearer <ADMIN_TOKEN>`<br>`Content-Type: application/json`<br><pre>{<br>  "name": "S1 Sistem Informasi",<br>  "facultyId": "<FACULTY_UUID>",<br>  "isActive": true<br>}</pre> | `201 Created` | <pre>{<br>  "message": "Study program created successfully",<br>  "data": {<br>    "id": "&lt;UUID&gt;",<br>    "name": "S1 Sistem Informasi",<br>    "facultyId": "<FACULTY_UUID>",<br>    "isActive": true,<br>    "faculty": {<br>      "id": "<FACULTY_UUID>",<br>      "name": "..."<br>    }<br>  }<br>}</pre> | *Pending* |
| **TC-SP-POST-002** | Admin Berhasil Membuat Program Studi dengan `isActive` Default (`true`) | Positif | Login sebagai ADMIN, `facultyId` valid | `Authorization: Bearer <ADMIN_TOKEN>`<br>`Content-Type: application/json`<br><pre>{<br>  "name": "S1 Sains Data",<br>  "facultyId": "<FACULTY_UUID>"<br>}</pre> | `201 Created` | Atribut `isActive` otomatis terisi bernilai `true`. | *Pending* |
| **TC-SP-POST-003** | Restore Otomatis Program Studi yang Pernah Di-*Soft Delete* | Positif / Edge Case | Terdapat prodi "S1 Teknik Komputer" dengan status `deletedAt != null` | `Authorization: Bearer <ADMIN_TOKEN>`<br>`Content-Type: application/json`<br><pre>{<br>  "name": "S1 Teknik Komputer",<br>  "facultyId": "<FACULTY_UUID>",<br>  "isActive": true<br>}</pre> | `200 OK` | <pre>{<br>  "message": "Program studi berhasil dipulihkan",<br>  "data": {<br>    "name": "S1 Teknik Komputer",<br>    "deletedAt": null<br>  }<br>}</pre>Kolom `deletedAt` kembali `null`, tidak membuat baris data baru. | *Pending* |
| **TC-SP-POST-004** | Gagal Membuat Data Karena Fakultas Tidak Ditemukan | Negatif | UUID fakultas tidak ada atau sudah di-soft delete | `Authorization: Bearer <ADMIN_TOKEN>`<br>`Content-Type: application/json`<br><pre>{<br>  "name": "S1 Bisnis Digital",<br>  "facultyId": "00000000-0000-0000-0000-000000000000"<br>}</pre> | `404 Not Found` | <pre>{"message": "Fakultas tidak ditemukan"}</pre> | *Pending* |
| **TC-SP-POST-005** | Gagal Membuat Data Karena Nama Sudah Terdaftar (Duplikat Aktif) | Negatif | Prodi "S1 Sistem Informasi" sedang aktif di DB | `Authorization: Bearer <ADMIN_TOKEN>`<br>`Content-Type: application/json`<br><pre>{<br>  "name": "S1 Sistem Informasi",<br>  "facultyId": "<FACULTY_UUID>"<br>}</pre> | `400 Bad Request` | <pre>{<br>  "message": "Validation error",<br>  "errors": [{<br>    "field": "name",<br>    "message": "Nama program studi sudah terdaftar"<br>  }]<br>}</pre> | *Pending* |
| **TC-SP-POST-006** | Gagal Karena Nama Program Studi Kurang dari 3 Karakter | Boundary / Negatif | Login sebagai ADMIN | `Authorization: Bearer <ADMIN_TOKEN>`<br>`Content-Type: application/json`<br><pre>{<br>  "name": "SI",<br>  "facultyId": "<FACULTY_UUID>"<br>}</pre> | `400 Bad Request` | <pre>{<br>  "message": "Validation error",<br>  "errors": [{<br>    "field": "name",<br>    "message": "Nama program studi minimal 3 karakter"<br>  }]<br>}</pre> | *Pending* |
| **TC-SP-POST-007** | Gagal Karena Field Wajib (`name` atau `facultyId`) Tidak Diisi | Negatif | Login sebagai ADMIN | `Authorization: Bearer <ADMIN_TOKEN>`<br>`Content-Type: application/json`<br><pre>{}</pre> | `400 Bad Request` | Pesan validasi Zod bahwa `name` dan `facultyId` wajib diisi. | *Pending* |
| **TC-SP-POST-008** | Gagal Ditolak Karena Pengguna Bukan Admin (Role Dosen/Mahasiswa) | RBAC / Negatif | Login sebagai DOSEN atau MAHASISWA | `Authorization: Bearer <DOSEN_TOKEN>`<br>`Content-Type: application/json`<br><pre>{<br>  "name": "S1 Teknik Elektro",<br>  "facultyId": "<FACULTY_UUID>"<br>}</pre> | `403 Forbidden` | <pre>{"message": "Akses ditolak"}</pre> | *Pending* |

---

## 4. Tabel Kasus Uji: `GET /api/study-programs/:id` (Detail by ID)

| ID Test Case | Skenario Pengujian | Kategori | Prasyarat | Header & Path Parameter | Expected Status | Expected Response & Validasi | Status Uji |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- | :---: |
| **TC-SP-BYID-001** | Ambil Detail Program Studi Berhasil (*Happy Path*) | Positif | Program studi aktif dengan `<VALID_UUID>` ada di DB | `Authorization: Bearer <VALID_TOKEN>`<br>`GET /api/study-programs/<VALID_UUID>` | `200 OK` | <pre>{<br>  "data": {<br>    "id": "&lt;VALID_UUID&gt;",<br>    "name": "S1 Informatika",<br>    "isActive": true,<br>    "facultyId": "<FACULTY_UUID>",<br>    "faculty": {<br>      "id": "<FACULTY_UUID>",<br>      "name": "Fakultas Informatika"<br>    }<br>  }<br>}</pre> | *Pending* |
| **TC-SP-BYID-002** | Gagal Karena ID Tidak Ditemukan / UUID Acak | Negatif | UUID tidak ada di database | `Authorization: Bearer <VALID_TOKEN>`<br>`GET /api/study-programs/00000000-0000-0000-0000-000000000000` | `404 Not Found` | <pre>{"message": "Program studi tidak ditemukan"}</pre> | *Pending* |
| **TC-SP-BYID-003** | Gagal Karena Data Sudah Berstatus Di-*Soft Delete* | Edge Case / Negatif | Data prodi dengan ID tersebut memiliki `deletedAt != null` | `Authorization: Bearer <VALID_TOKEN>`<br>`GET /api/study-programs/<DELETED_UUID>` | `404 Not Found` | <pre>{"message": "Program studi tidak ditemukan"}</pre>Data terhapus diisolasi dari query detail. | *Pending* |

---

## 5. Tabel Kasus Uji: `PUT /api/study-programs/:id` (Update Data)

| ID Test Case | Skenario Pengujian | Kategori | Prasyarat | Header, Path & Request Body | Expected Status | Expected Response & Validasi | Status Uji |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- | :---: |
| **TC-SP-PUT-001** | Admin Berhasil Memperbarui Nama, Fakultas, dan Status Aktif | Positif | Login sebagai ADMIN, ID prodi & `facultyId` baru valid | `Authorization: Bearer <ADMIN_TOKEN>`<br>`PUT /api/study-programs/<VALID_UUID>`<br><pre>{<br>  "name": "S1 Teknik Telekomunikasi",<br>  "facultyId": "<NEW_FACULTY_UUID>",<br>  "isActive": false<br>}</pre> | `200 OK` | <pre>{<br>  "message": "Study program updated successfully",<br>  "data": {<br>    "id": "&lt;VALID_UUID&gt;",<br>    "name": "S1 Teknik Telekomunikasi",<br>    "facultyId": "<NEW_FACULTY_UUID>",<br>    "isActive": false<br>  }<br>}</pre> | *Pending* |
| **TC-SP-PUT-002** | Admin Berhasil Memperbarui Hanya Status `isActive` | Positif | Login sebagai ADMIN | `Authorization: Bearer <ADMIN_TOKEN>`<br>`PUT /api/study-programs/<VALID_UUID>`<br><pre>{"isActive": true}</pre> | `200 OK` | Nilai `name` dan `facultyId` tetap, status `isActive` diperbarui menjadi `true`. | *Pending* |
| **TC-SP-PUT-003** | Gagal Update Karena Fakultas Baru Tidak Ditemukan | Negatif | `facultyId` baru tidak ada di database | `Authorization: Bearer <ADMIN_TOKEN>`<br>`PUT /api/study-programs/<VALID_UUID>`<br><pre>{"facultyId": "00000000-0000-0000-0000-000000000000"}</pre> | `404 Not Found` | <pre>{"message": "Fakultas tidak ditemukan"}</pre> | *Pending* |
| **TC-SP-PUT-004** | Gagal Karena Nama Baru Sudah Digunakan Prodi Lain | Negatif | Terdapat prodi lain dengan nama "S1 Desain Komunikasi Visual" aktif | `Authorization: Bearer <ADMIN_TOKEN>`<br>`PUT /api/study-programs/<VALID_UUID>`<br><pre>{"name": "S1 Desain Komunikasi Visual"}</pre> | `400 Bad Request` | <pre>{<br>  "message": "Validation error",<br>  "errors": [{<br>    "field": "name",<br>    "message": "Nama program studi sudah terdaftar"<br>  }]<br>}</pre> | *Pending* |
| **TC-SP-PUT-005** | Gagal Update Data yang Tidak Ditemukan atau Sudah Dihapus | Negatif | ID prodi tidak ada di database | `Authorization: Bearer <ADMIN_TOKEN>`<br>`PUT /api/study-programs/00000000-0000-0000-0000-000000000000`<br><pre>{"name": "Nama Baru"}</pre> | `404 Not Found` | <pre>{"message": "Program studi tidak ditemukan"}</pre> | *Pending* |
| **TC-SP-PUT-006** | Gagal Update Karena Pengguna Bukan Admin (Role Mahasiswa/Dosen) | RBAC / Negatif | Login sebagai MAHASISWA atau DOSEN | `Authorization: Bearer <MAHASISWA_TOKEN>`<br>`PUT /api/study-programs/<VALID_UUID>`<br><pre>{"name": "Nama Baru"}</pre> | `403 Forbidden` | <pre>{"message": "Akses ditolak"}</pre> | *Pending* |

---

## 6. Tabel Kasus Uji: `PATCH /api/study-programs/:id/toggle-active` (Toggle Status Aktif)

| ID Test Case | Skenario Pengujian | Kategori | Prasyarat | Header & Path Parameter | Expected Status | Expected Response & Validasi | Status Uji |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- | :---: |
| **TC-SP-TOG-001** | Admin Berhasil Menonaktifkan Program Studi Aktif | Positif | Prodi dengan ID tersebut saat ini `isActive: true` | `Authorization: Bearer <ADMIN_TOKEN>`<br>`PATCH /api/study-programs/<VALID_UUID>/toggle-active` | `200 OK` | <pre>{<br>  "message": "Study program deactivated successfully",<br>  "data": {<br>    "id": "&lt;VALID_UUID&gt;",<br>    "isActive": false<br>  }<br>}</pre> | *Pending* |
| **TC-SP-TOG-002** | Admin Berhasil Mengaktifkan Program Studi Non-Aktif | Positif | Prodi dengan ID tersebut saat ini `isActive: false` | `Authorization: Bearer <ADMIN_TOKEN>`<br>`PATCH /api/study-programs/<VALID_UUID>/toggle-active` | `200 OK` | <pre>{<br>  "message": "Study program activated successfully",<br>  "data": {<br>    "id": "&lt;VALID_UUID&gt;",<br>    "isActive": true<br>  }<br>}</pre> | *Pending* |
| **TC-SP-TOG-003** | Gagal Toggle Pada ID yang Tidak Ada atau Sudah Dihapus | Negatif | ID tidak valid | `Authorization: Bearer <ADMIN_TOKEN>`<br>`PATCH /api/study-programs/00000000-0000-0000-0000-000000000000/toggle-active` | `404 Not Found` | <pre>{"message": "Program studi tidak ditemukan"}</pre> | *Pending* |
| **TC-SP-TOG-004** | Gagal Toggle Status Oleh Pengguna Non-Admin | RBAC / Negatif | Login sebagai DOSEN atau MAHASISWA | `Authorization: Bearer <DOSEN_TOKEN>`<br>`PATCH /api/study-programs/<VALID_UUID>/toggle-active` | `403 Forbidden` | <pre>{"message": "Akses ditolak"}</pre> | *Pending* |

---

## 7. Tabel Kasus Uji: `DELETE /api/study-programs/:id` (Soft Delete)

| ID Test Case | Skenario Pengujian | Kategori | Prasyarat | Header & Path Parameter | Expected Status | Expected Response & Validasi | Status Uji |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- | :---: |
| **TC-SP-DEL-001** | Admin Berhasil Menghapus Program Studi (*Soft Delete*) | Positif | Program studi aktif ada di database | `Authorization: Bearer <ADMIN_TOKEN>`<br>`DELETE /api/study-programs/<VALID_UUID>` | `200 OK` | <pre>{<br>  "message": "Study program deleted successfully",<br>  "data": {<br>    "id": "&lt;VALID_UUID&gt;",<br>    "deletedAt": "&lt;TIMESTAMP&gt;"<br>  }<br>}</pre>Kolom `deleted_at` terisi timestamp tanggal saat ini. | *Pending* |
| **TC-SP-DEL-002** | Gagal Menghapus Data yang Sudah Pernah Dihapus (*Soft Deleted*) | Negatif | Data sudah berstatus `deletedAt != null` | `Authorization: Bearer <ADMIN_TOKEN>`<br>`DELETE /api/study-programs/<ALREADY_DELETED_UUID>` | `404 Not Found` | <pre>{"message": "Program studi tidak ditemukan"}</pre>Mencegah penghapusan ganda. | *Pending* |
| **TC-SP-DEL-003** | Gagal Menghapus Data Oleh Pengguna Non-Admin | RBAC / Negatif | Login sebagai MAHASISWA atau DOSEN | `Authorization: Bearer <MAHASISWA_TOKEN>`<br>`DELETE /api/study-programs/<VALID_UUID>` | `403 Forbidden` | <pre>{"message": "Akses ditolak"}</pre>Data di database tidak berubah. | *Pending* |
