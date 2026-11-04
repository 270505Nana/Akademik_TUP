# Matriks Kasus Uji (Test Case) — Endpoint Ruangan (Ruangan Sidang)

Dokumen ini menyajikan seluruh spesifikasi kasus uji untuk endpoint data ruangan (*Ruangan Sidang*) backend **Sistem Akademik TUP** dalam format tabel terstruktur.

---

## 1. Informasi Lingkungan & Konfigurasi Pengujian

| Parameter | Konfigurasi / Keterangan |
| :--- | :--- |
| **Modul** | Master Data Ruangan Sidang (*Ruangan*) |
| **Base URL** | `http://localhost:3000/api/ruangan` |
| **Format Data** | `application/json` |
| **Mekanisme Autentikasi** | JSON Web Token (JWT) — `Authorization: Bearer <token>` |
| **Hak Akses Baca (GET)** | Seluruh pengguna terautentikasi (`ADMIN`, `DOSEN`, `MAHASISWA`) |
| **Hak Akses Kelola (POST, PUT, DELETE)** | Khusus Role `ADMIN` (`authorize("ADMIN")`) |
| **Penghapusan Data** | *Soft Delete* (mengisi kolom `deleted_at`) |
| **Karakteristik Endpoint GET** | Mengembalikan seluruh daftar data ruangan tanpa paginasi (*non-paginated array*) |
| **Pencarian & Filter** | `search` (nama ruangan atau gedung - *case-insensitive*), `gedung` (nama gedung), `isActive` (boolean `true`/`false`) |
| **Pengurutan Standar** | `sortBy`: `gedung` (default), `name`, `isActive`, `createdAt` \| `sortOrder`: `asc` (default), `desc` |

---

## 2. Tabel Kasus Uji: `GET /api/ruangan` (List, Search, Filter, Sort)

| ID Test Case | Skenario Pengujian | Kategori | Prasyarat | Header & Query Parameter | Expected Status | Expected Response & Validasi | Status Uji |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- | :---: |
| **TC-RNG-GET-001** | Ambil Semua Daftar Ruangan Default (*Happy Path*) | Positif | Data ruangan tersedia di database & token valid | `Authorization: Bearer <VALID_TOKEN>`<br>*Tanpa query param* | `200 OK` | <pre>{<br>  "message": "Data ruangan berhasil diambil",<br>  "data": [<br>    {<br>      "id": "&lt;UUID&gt;",<br>      "name": "Ruang A302",<br>      "gedung": "Gedung IoT",<br>      "isActive": true,<br>      "createdAt": "&lt;TIMESTAMP&gt;",<br>      "updatedAt": "&lt;TIMESTAMP&gt;",<br>      "deletedAt": null<br>    }<br>  ]<br>}</pre>Data terurut default `gedung: asc`, data terhapus (`deletedAt != null`) tidak ditampilkan. | *Pending* |
| **TC-RNG-GET-002** | Pencarian Berdasarkan Nama Ruangan atau Gedung (`search`) | Positif | Terdapat ruangan "Ruang Multimedia" di "Gedung Rektorat" | `Authorization: Bearer <VALID_TOKEN>`<br>`?search=multimedia` | `200 OK` | Mengembalikan ruangan yang nama ruangan atau nama gedungnya memuat keyword pencarian (*case-insensitive*). | *Pending* |
| **TC-RNG-GET-003** | Filter Khusus Berdasarkan Nama Gedung (`gedung`) | Positif | Terdapat beberapa ruangan di "Gedung Tokong Nanas" | `Authorization: Bearer <VALID_TOKEN>`<br>`?gedung=Tokong Nanas` | `200 OK` | Seluruh data yang dikembalikan hanya berasal dari gedung "Tokong Nanas". | *Pending* |
| **TC-RNG-GET-004** | Filter Ruangan Berdasarkan Status Aktif (`isActive=true`) | Positif | Terdapat ruangan aktif dan non-aktif di DB | `Authorization: Bearer <VALID_TOKEN>`<br>`?isActive=true` | `200 OK` | Seluruh item pada array `data` memiliki atribut `"isActive": true`. | *Pending* |
| **TC-RNG-GET-005** | Filter Ruangan Berdasarkan Status Non-Aktif (`isActive=false`) | Positif | Terdapat ruangan berstatus non-aktif | `Authorization: Bearer <VALID_TOKEN>`<br>`?isActive=false` | `200 OK` | Seluruh item pada array `data` memiliki atribut `"isActive": false`. | *Pending* |
| **TC-RNG-GET-006** | Pengurutan Berdasarkan Nama Ruangan (`sortBy=name`) | Positif | - | `Authorization: Bearer <VALID_TOKEN>`<br>`?sortBy=name&sortOrder=asc` | `200 OK` | Data diurutkan secara alfabetis berdasarkan nama ruangan (`name`). | *Pending* |
| **TC-RNG-GET-007** | Pengurutan Berdasarkan Tanggal Dibuat Terbaru (`sortBy=createdAt`) | Positif | - | `Authorization: Bearer <VALID_TOKEN>`<br>`?sortBy=createdAt&sortOrder=desc` | `200 OK` | Data diurutkan dari `createdAt` paling baru ke yang terlama. | *Pending* |
| **TC-RNG-GET-008** | Gagal Karena Nilai `sortBy` Tidak Diizinkan | Negatif | - | `Authorization: Bearer <VALID_TOKEN>`<br>`?sortBy=kapasitas` | `400 Bad Request` | <pre>{<br>  "message": "Validation error",<br>  "errors": [{<br>    "field": "sortBy",<br>    "message": "sortBy harus salah satu dari: name, gedung, isActive, createdAt"<br>  }]<br>}</pre> | *Pending* |
| **TC-RNG-GET-009** | Gagal Karena Nilai `sortOrder` Tidak Valid | Negatif | - | `Authorization: Bearer <VALID_TOKEN>`<br>`?sortOrder=ascending` | `400 Bad Request` | <pre>{<br>  "message": "Validation error",<br>  "errors": [{<br>    "field": "sortOrder",<br>    "message": "sortOrder harus salah satu dari: asc, desc"<br>  }]<br>}</pre> | *Pending* |
| **TC-RNG-GET-010** | Gagal Mengambil Data Tanpa Token Autentikasi | Negatif | - | *Tanpa Header Authorization* | `401 Unauthorized` | <pre>{"message": "Token not found"}</pre> | *Pending* |

---

## 3. Tabel Kasus Uji: `POST /api/ruangan` (Create Ruangan)

| ID Test Case | Skenario Pengujian | Kategori | Prasyarat | Header & Request Body (Payload) | Expected Status | Expected Response & Validasi | Status Uji |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- | :---: |
| **TC-RNG-POST-001** | Admin Berhasil Menambahkan Ruangan Baru (*Happy Path*) | Positif | Login sebagai ADMIN | `Authorization: Bearer <ADMIN_TOKEN>`<br>`Content-Type: application/json`<br><pre>{<br>  "name": "Ruang Sidang 1",<br>  "gedung": "Gedung Cacuk B",<br>  "isActive": true<br>}</pre> | `201 Created` | <pre>{<br>  "message": "Data ruangan berhasil ditambahkan",<br>  "data": {<br>    "id": "&lt;UUID&gt;",<br>    "name": "Ruang Sidang 1",<br>    "gedung": "Gedung Cacuk B",<br>    "isActive": true,<br>    "createdAt": "&lt;TIMESTAMP&gt;",<br>    "updatedAt": "&lt;TIMESTAMP&gt;",<br>    "deletedAt": null<br>  }<br>}</pre>Data tersimpan di database. | *Pending* |
| **TC-RNG-POST-002** | Admin Menambahkan Ruangan dengan Nilai Default `isActive` (`true`) | Positif | Login sebagai ADMIN | `Authorization: Bearer <ADMIN_TOKEN>`<br>`Content-Type: application/json`<br><pre>{<br>  "name": "Ruang Sidang 2",<br>  "gedung": "Gedung Cacuk B"<br>}</pre> | `201 Created` | Atribut `isActive` otomatis terisi `true`. | *Pending* |
| **TC-RNG-POST-003** | Gagal Menambahkan Ruangan Karena Nama Kosong | Negatif | Login sebagai ADMIN | `Authorization: Bearer <ADMIN_TOKEN>`<br>`Content-Type: application/json`<br><pre>{<br>  "name": "",<br>  "gedung": "Gedung Cacuk B"<br>}</pre> | `400 Bad Request` | <pre>{<br>  "message": "Validation error",<br>  "errors": [{<br>    "field": "name",<br>    "message": "Nama ruangan wajib diisi"<br>  }]<br>}</pre> | *Pending* |
| **TC-RNG-POST-004** | Gagal Menambahkan Ruangan Karena Gedung Kosong | Negatif | Login sebagai ADMIN | `Authorization: Bearer <ADMIN_TOKEN>`<br>`Content-Type: application/json`<br><pre>{<br>  "name": "Ruang Sidang 3",<br>  "gedung": ""<br>}</pre> | `400 Bad Request` | <pre>{<br>  "message": "Validation error",<br>  "errors": [{<br>    "field": "gedung",<br>    "message": "Gedung wajib diisi"<br>  }]<br>}</pre> | *Pending* |
| **TC-RNG-POST-005** | Gagal Menambahkan Ruangan Karena Karakter Melebihi Batas (> 100) | Boundary / Negatif | Login sebagai ADMIN | `Authorization: Bearer <ADMIN_TOKEN>`<br>`Content-Type: application/json`<br><pre>{<br>  "name": "&lt;STRING_101_KARAKTER&gt;",<br>  "gedung": "Gedung A"<br>}</pre> | `400 Bad Request` | Pesan validasi Zod maksimal 100 karakter. | *Pending* |
| **TC-RNG-POST-006** | Gagal Karena Request Body Kosong | Negatif | Login sebagai ADMIN | `Authorization: Bearer <ADMIN_TOKEN>`<br>`Content-Type: application/json`<br><pre>{}</pre> | `400 Bad Request` | Pesan validasi bahwa `name` dan `gedung` wajib diisi. | *Pending* |
| **TC-RNG-POST-007** | Gagal Ditolak Karena Pengguna Bukan Admin (Role Mahasiswa/Dosen) | RBAC / Negatif | Login sebagai MAHASISWA atau DOSEN | `Authorization: Bearer <MAHASISWA_TOKEN>`<br>`Content-Type: application/json`<br><pre>{<br>  "name": "Ruang A1",<br>  "gedung": "Gedung A"<br>}</pre> | `403 Forbidden` | <pre>{"message": "Akses ditolak"}</pre> | *Pending* |

---

## 4. Tabel Kasus Uji: `GET /api/ruangan/:id` (Detail Ruangan by ID)

| ID Test Case | Skenario Pengujian | Kategori | Prasyarat | Header & Path Parameter | Expected Status | Expected Response & Validasi | Status Uji |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- | :---: |
| **TC-RNG-BYID-001** | Ambil Detail Ruangan Berhasil (*Happy Path*) | Positif | Data ruangan aktif dengan `<VALID_UUID>` ada di database | `Authorization: Bearer <VALID_TOKEN>`<br>`GET /api/ruangan/<VALID_UUID>` | `200 OK` | <pre>{<br>  "message": "Data ruangan ditemukan",<br>  "data": {<br>    "id": "&lt;VALID_UUID&gt;",<br>    "name": "Ruang A302",<br>    "gedung": "Gedung IoT",<br>    "isActive": true,<br>    "createdAt": "&lt;TIMESTAMP&gt;",<br>    "updatedAt": "&lt;TIMESTAMP&gt;",<br>    "deletedAt": null<br>  }<br>}</pre> | *Pending* |
| **TC-RNG-BYID-002** | Gagal Karena ID Tidak Ditemukan / UUID Acak | Negatif | UUID tidak ada di database | `Authorization: Bearer <VALID_TOKEN>`<br>`GET /api/ruangan/00000000-0000-0000-0000-000000000000` | `404 Not Found` | <pre>{"message": "Data ruangan tidak ditemukan"}</pre> | *Pending* |
| **TC-RNG-BYID-003** | Gagal Karena Ruangan Sudah Di-*Soft Delete* | Edge Case / Negatif | Data ruangan dengan ID tersebut memiliki `deletedAt != null` | `Authorization: Bearer <VALID_TOKEN>`<br>`GET /api/ruangan/<DELETED_UUID>` | `404 Not Found` | <pre>{"message": "Data ruangan tidak ditemukan"}</pre>Data yang telah dihapus diisolasi dari query detail. | *Pending* |

---

## 5. Tabel Kasus Uji: `PUT /api/ruangan/:id` (Update Data & Status Ruangan)

| ID Test Case | Skenario Pengujian | Kategori | Prasyarat | Header, Path & Request Body | Expected Status | Expected Response & Validasi | Status Uji |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- | :---: |
| **TC-RNG-PUT-001** | Admin Berhasil Memperbarui Nama, Gedung, dan Status Aktif | Positif | Login sebagai ADMIN, ID ruangan valid | `Authorization: Bearer <ADMIN_TOKEN>`<br>`PUT /api/ruangan/<VALID_UUID>`<br><pre>{<br>  "name": "Lab Komputer 301",<br>  "gedung": "Gedung Cacuk A",<br>  "isActive": false<br>}</pre> | `200 OK` | <pre>{<br>  "message": "Data ruangan berhasil diperbarui",<br>  "data": {<br>    "id": "&lt;VALID_UUID&gt;",<br>    "name": "Lab Komputer 301",<br>    "gedung": "Gedung Cacuk A",<br>    "isActive": false<br>  }<br>}</pre> | *Pending* |
| **TC-RNG-PUT-002** | Admin Memperbarui Hanya Status Keaktifan Ruangan (`isActive`) | Positif | Login sebagai ADMIN | `Authorization: Bearer <ADMIN_TOKEN>`<br>`PUT /api/ruangan/<VALID_UUID>`<br><pre>{"isActive": true}</pre> | `200 OK` | Nilai `name` dan `gedung` tidak berubah, status `isActive` diperbarui menjadi `true`. | *Pending* |
| **TC-RNG-PUT-003** | Gagal Update Jika Field String Diisi String Kosong | Negatif | Login sebagai ADMIN | `Authorization: Bearer <ADMIN_TOKEN>`<br>`PUT /api/ruangan/<VALID_UUID>`<br><pre>{"name": ""}</pre> | `400 Bad Request` | <pre>{<br>  "message": "Validation error",<br>  "errors": [{<br>    "field": "name",<br>    "message": "Nama ruangan tidak boleh kosong"<br>  }]<br>}</pre> | *Pending* |
| **TC-RNG-PUT-004** | Gagal Update Data yang Tidak Ditemukan atau Sudah Dihapus | Negatif | ID tidak ada di database | `Authorization: Bearer <ADMIN_TOKEN>`<br>`PUT /api/ruangan/00000000-0000-0000-0000-000000000000`<br><pre>{"name": "Ruang Baru"}</pre> | `404 Not Found` | <pre>{"message": "Data ruangan tidak ditemukan"}</pre> | *Pending* |
| **TC-RNG-PUT-005** | Gagal Update Karena Pengguna Bukan Admin (Role Mahasiswa/Dosen) | RBAC / Negatif | Login sebagai MAHASISWA atau DOSEN | `Authorization: Bearer <MAHASISWA_TOKEN>`<br>`PUT /api/ruangan/<VALID_UUID>`<br><pre>{"name": "Ruang Baru"}</pre> | `403 Forbidden` | <pre>{"message": "Akses ditolak"}</pre> | *Pending* |

---

## 6. Tabel Kasus Uji: `DELETE /api/ruangan/:id` (Soft Delete Ruangan)

| ID Test Case | Skenario Pengujian | Kategori | Prasyarat | Header & Path Parameter | Expected Status | Expected Response & Validasi | Status Uji |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- | :---: |
| **TC-RNG-DEL-001** | Admin Berhasil Menghapus Ruangan (*Soft Delete*) | Positif | Ruangan aktif ada di database | `Authorization: Bearer <ADMIN_TOKEN>`<br>`DELETE /api/ruangan/<VALID_UUID>` | `200 OK` | <pre>{<br>  "message": "Data ruangan berhasil dihapus"<br>}</pre>Kolom `deleted_at` di database terisi timestamp tanggal saat ini. | *Pending* |
| **TC-RNG-DEL-002** | Gagal Menghapus Data yang Sudah Dihapus Sebelumnya (*Soft Deleted*) | Negatif | Data sudah berstatus `deletedAt != null` | `Authorization: Bearer <ADMIN_TOKEN>`<br>`DELETE /api/ruangan/<ALREADY_DELETED_UUID>` | `404 Not Found` | <pre>{"message": "Data ruangan tidak ditemukan"}</pre>Mencegah penghapusan berulang. | *Pending* |
| **TC-RNG-DEL-003** | Gagal Menghapus Data Oleh Pengguna Non-Admin | RBAC / Negatif | Login sebagai DOSEN atau MAHASISWA | `Authorization: Bearer <DOSEN_TOKEN>`<br>`DELETE /api/ruangan/<VALID_UUID>` | `403 Forbidden` | <pre>{"message": "Akses ditolak"}</pre>Data di database tetap utuh. | *Pending* |
