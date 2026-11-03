# Matriks Kasus Uji (Test Case) — Endpoint Research Group (Kelompok Keahlian)

Dokumen ini menyajikan seluruh spesifikasi pengujian untuk endpoint kelompok keahlian (*Research Group*) backend **Sistem Akademik TUP** dalam format tabel terstruktur.

---

## 1. Informasi Lingkungan & Konfigurasi Pengujian

| Parameter | Konfigurasi / Keterangan |
| :--- | :--- |
| **Modul** | Master Data Kelompok Keahlian (*Research Group*) |
| **Base URL** | `http://localhost:3000/api/research-groups` |
| **Format Data** | `application/json` |
| **Mekanisme Autentikasi** | JSON Web Token (JWT) — `Authorization: Bearer <token>` |
| **Hak Akses Baca (GET)** | Seluruh role terautentikasi (`ADMIN`, `DOSEN`, `MAHASISWA`) |
| **Hak Akses Kelola (POST, PUT, PATCH, DELETE)** | Khusus Role `ADMIN` (`authorize("ADMIN")`) |
| **Penghapusan Data** | *Soft Delete* (mengisi kolom `deleted_at`, menyertakan cascade ke tabel perantara relasi prodi) |
| **Pencarian & Filter** | `search` (nama kelompok keahlian), `isActive` (boolean), `studyProgramId` (UUID prodi terkait) |
| **Pengurutan Standar** | `sortBy`: `name` (default), `isActive`, `createdAt` \| `sortOrder`: `asc` (default), `desc` |
| **Pagination Standar** | `page` (default: 1), `limit` (default: 10, max: 100) |

---

## 2. Tabel Kasus Uji: `GET /api/research-groups` (List, Filter, Sort, Pagination)

| ID Test Case | Skenario Pengujian | Kategori | Prasyarat | Header & Query Parameter | Expected Status | Expected Response & Validasi | Status Uji |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- | :---: |
| **TC-RG-GET-001** | Ambil Daftar Research Group Default (*Happy Path*) | Positif | Data research group tersedia di DB & token valid | `Authorization: Bearer <VALID_TOKEN>`<br>*Tanpa query param* | `200 OK` | <pre>{<br>  "data": [...],<br>  "pagination": {<br>    "totalItems": 15,<br>    "itemsPerPage": 10,<br>    "currentPage": 1,<br>    "totalPages": 2<br>  }<br>}</pre>Data diurutkan berdasarkan `name: asc`, data terhapus (`deletedAt != null`) tidak ditampilkan. | *Pending* |
| **TC-RG-GET-002** | Pencarian Berdasarkan Nama Kelompok Keahlian | Positif | Terdapat data dengan nama "Rekayasa Komputasi Terdistribusi" | `Authorization: Bearer <VALID_TOKEN>`<br>`?search=komputasi` | `200 OK` | Hanya menampilkan data research group yang namanya memuat kata "komputasi" (*case-insensitive*). | *Pending* |
| **TC-RG-GET-003** | Filter Berdasarkan Status Aktif (`isActive=true`) | Positif | Terdapat data berstatus aktif dan non-aktif | `Authorization: Bearer <VALID_TOKEN>`<br>`?isActive=true` | `200 OK` | Seluruh item pada array `data` memiliki atribut `"isActive": true`. | *Pending* |
| **TC-RG-GET-004** | Filter Berdasarkan Status Non-Aktif (`isActive=false`) | Positif | Terdapat data berstatus non-aktif | `Authorization: Bearer <VALID_TOKEN>`<br>`?isActive=false` | `200 OK` | Seluruh item pada array `data` memiliki atribut `"isActive": false`. | *Pending* |
| **TC-RG-GET-005** | Filter Berdasarkan Program Studi Terhubung | Positif | Terdapat research group yang dipetakan ke prodi tertentu | `Authorization: Bearer <VALID_TOKEN>`<br>`?studyProgramId=<VALID_PRODI_UUID>` | `200 OK` | Hanya menampilkan research group yang terhubung dengan prodi ID tersebut melalui tabel perantara. | *Pending* |
| **TC-RG-GET-006** | Pengurutan Berdasarkan Waktu Dibuat Terbaru | Positif | - | `Authorization: Bearer <VALID_TOKEN>`<br>`?sortBy=createdAt&sortOrder=desc` | `200 OK` | Data diurutkan dari `createdAt` paling baru ke yang paling lama. | *Pending* |
| **TC-RG-GET-007** | Pengurutan Berdasarkan Status Aktif | Positif | - | `Authorization: Bearer <VALID_TOKEN>`<br>`?sortBy=isActive&sortOrder=desc` | `200 OK` | Data berstatus `isActive: true` tampil di urutan teratas. | *Pending* |
| **TC-RG-GET-008** | Kustomisasi Halaman dan Batas Item (*Pagination*) | Positif | Data lebih dari 5 item | `Authorization: Bearer <VALID_TOKEN>`<br>`?page=2&limit=5` | `200 OK` | `pagination.currentPage = 2`, `pagination.itemsPerPage = 5`, jumlah array `data <= 5`. | *Pending* |
| **TC-RG-GET-009** | Gagal Karena Nilai `sortBy` Tidak Diizinkan | Negatif | - | `Authorization: Bearer <VALID_TOKEN>`<br>`?sortBy=invalidColumn` | `400 Bad Request` | <pre>{<br>  "message": "Validation error",<br>  "errors": [{<br>    "field": "sortBy",<br>    "message": "sortBy harus salah satu dari: name, isActive, createdAt"<br>  }]<br>}</pre> | *Pending* |
| **TC-RG-GET-010** | Gagal Karena Nilai `sortOrder` Tidak Valid | Negatif | - | `Authorization: Bearer <VALID_TOKEN>`<br>`?sortOrder=ascending` | `400 Bad Request` | <pre>{<br>  "message": "Validation error",<br>  "errors": [{<br>    "field": "sortOrder",<br>    "message": "sortOrder harus salah satu dari: asc, desc"<br>  }]<br>}</pre> | *Pending* |
| **TC-RG-GET-011** | Gagal Karena `limit` Melebihi Batas Maksimum (> 100) | Boundary / Negatif | - | `Authorization: Bearer <VALID_TOKEN>`<br>`?limit=150` | `400 Bad Request` | Validasi Zod menolak karena batasan `.max(100)`. | *Pending* |
| **TC-RG-GET-012** | Gagal Mengambil Data Tanpa Token Autentikasi | Negatif | - | *Tanpa Header Authorization* | `401 Unauthorized` | <pre>{"message": "Token not found"}</pre> | *Pending* |

---

## 3. Tabel Kasus Uji: `POST /api/research-groups` (Create & Restore)

| ID Test Case | Skenario Pengujian | Kategori | Prasyarat | Header & Request Body (Payload) | Expected Status | Expected Response & Validasi | Status Uji |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- | :---: |
| **TC-RG-POST-001** | Admin Berhasil Membuat Research Group Baru Lengkap (*Happy Path*) | Positif | Login sebagai ADMIN, nama belum pernah dibuat | `Authorization: Bearer <ADMIN_TOKEN>`<br>`Content-Type: application/json`<br><pre>{<br>  "name": "Cyber Security and Forensics",<br>  "isActive": true,<br>  "studyProgramIds": ["<PRODI_UUID_1>", "<PRODI_UUID_2>"]<br>}</pre> | `201 Created` | <pre>{<br>  "message": "Research group created successfully",<br>  "data": {<br>    "id": "&lt;UUID&gt;",<br>    "name": "Cyber Security and Forensics",<br>    "isActive": true,<br>    "researchGroupStudyPrograms": [...]<br>  }<br>}</pre>Data dan relasi prodi tersimpan di database. | *Pending* |
| **TC-RG-POST-002** | Admin Berhasil Membuat Research Group Minimal (Tanpa Prodi & `isActive` Default) | Positif | Login sebagai ADMIN, nama unik | `Authorization: Bearer <ADMIN_TOKEN>`<br>`Content-Type: application/json`<br><pre>{<br>  "name": "Data Science & Intelligence"<br>}</pre> | `201 Created` | Field `isActive` otomatis bernilai `true`, relasi prodi berupa array kosong `[]`. | *Pending* |
| **TC-RG-POST-003** | Restore Otomatis Research Group yang Pernah Di-*Soft Delete* | Positif / Edge Case | Terdapat data "Data Science & Intelligence" dengan `deletedAt != null` | `Authorization: Bearer <ADMIN_TOKEN>`<br>`Content-Type: application/json`<br><pre>{<br>  "name": "Data Science & Intelligence",<br>  "isActive": true<br>}</pre> | `200 OK` | <pre>{<br>  "message": "Kelompok keahlian berhasil dipulihkan",<br>  "data": {<br>    "name": "Data Science & Intelligence",<br>    "deletedAt": null<br>  }<br>}</pre>Kolom `deletedAt` kembali bernilai `null` tanpa membuat UUID baru. | *Pending* |
| **TC-RG-POST-004** | Gagal Membuat Data Karena Nama Sudah Terdaftar (Duplikat Aktif) | Negatif | Data dengan nama "Cyber Security and Forensics" sedang aktif | `Authorization: Bearer <ADMIN_TOKEN>`<br>`Content-Type: application/json`<br><pre>{<br>  "name": "Cyber Security and Forensics"<br>}</pre> | `400 Bad Request` | <pre>{<br>  "message": "Validation error",<br>  "errors": [{<br>    "field": "name",<br>    "message": "Nama kelompok keahlian sudah terdaftar"<br>  }]<br>}</pre> | *Pending* |
| **TC-RG-POST-005** | Gagal Karena Nama Kurang dari 3 Karakter | Boundary / Negatif | Login sebagai ADMIN | `Authorization: Bearer <ADMIN_TOKEN>`<br>`Content-Type: application/json`<br><pre>{"name": "CS"}</pre> | `400 Bad Request` | <pre>{<br>  "message": "Validation error",<br>  "errors": [{<br>    "field": "name",<br>    "message": "Nama kelompok keahlian minimal 3 karakter"<br>  }]<br>}</pre> | *Pending* |
| **TC-RG-POST-006** | Gagal Karena Nama Lebih dari 100 Karakter | Boundary / Negatif | Login sebagai ADMIN | `Authorization: Bearer <ADMIN_TOKEN>`<br>`Content-Type: application/json`<br><pre>{"name": "&lt;STRING_101_KARAKTER&gt;"}</pre> | `400 Bad Request` | Pesan validasi Zod maksimal 100 karakter. | *Pending* |
| **TC-RG-POST-007** | Gagal Karena Request Body Kosong | Negatif | Login sebagai ADMIN | `Authorization: Bearer <ADMIN_TOKEN>`<br>`Content-Type: application/json`<br><pre>{}</pre> | `400 Bad Request` | Pesan validasi bahwa `name` wajib diisi. | *Pending* |
| **TC-RG-POST-008** | Gagal Ditolak Karena Pengguna Bukan Admin (Role Dosen/Mahasiswa) | RBAC / Negatif | Login sebagai DOSEN atau MAHASISWA | `Authorization: Bearer <MAHASISWA_OR_DOSEN_TOKEN>`<br>`Content-Type: application/json`<br><pre>{"name": "Artificial Intelligence"}</pre> | `403 Forbidden` | <pre>{"message": "Akses ditolak"}</pre> | *Pending* |

---

## 4. Tabel Kasus Uji: `GET /api/research-groups/:id` (Detail by ID)

| ID Test Case | Skenario Pengujian | Kategori | Prasyarat | Header & Path Parameter | Expected Status | Expected Response & Validasi | Status Uji |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- | :---: |
| **TC-RG-BYID-001** | Ambil Detail Research Group Berhasil (*Happy Path*) | Positif | Research group aktif dengan `<VALID_UUID>` ada di database | `Authorization: Bearer <VALID_TOKEN>`<br>`GET /api/research-groups/<VALID_UUID>` | `200 OK` | <pre>{<br>  "data": {<br>    "id": "&lt;VALID_UUID&gt;",<br>    "name": "Cyber Security and Forensics",<br>    "isActive": true,<br>    "researchGroupStudyPrograms": [...]<br>  }<br>}</pre> | *Pending* |
| **TC-RG-BYID-002** | Gagal Karena ID Tidak Ditemukan / UUID Acak | Negatif | ID belum pernah dibuat | `Authorization: Bearer <VALID_TOKEN>`<br>`GET /api/research-groups/00000000-0000-0000-0000-000000000000` | `404 Not Found` | <pre>{"message": "Kelompok keahlian tidak ditemukan"}</pre> | *Pending* |
| **TC-RG-BYID-003** | Gagal Karena Data Sudah Berstatus Di-*Soft Delete* | Edge Case / Negatif | Data dengan ID tersebut memiliki `deletedAt != null` | `Authorization: Bearer <VALID_TOKEN>`<br>`GET /api/research-groups/<DELETED_UUID>` | `404 Not Found` | <pre>{"message": "Kelompok keahlian tidak ditemukan"}</pre>Data terhapus diisolasi dari query detail. | *Pending* |

---

## 5. Tabel Kasus Uji: `PUT /api/research-groups/:id` (Update Data & Relasi Prodi)

| ID Test Case | Skenario Pengujian | Kategori | Prasyarat | Header, Path & Request Body | Expected Status | Expected Response & Validasi | Status Uji |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- | :---: |
| **TC-RG-PUT-001** | Admin Berhasil Memperbarui Nama dan Status Aktif | Positif | Login sebagai ADMIN, ID research group valid | `Authorization: Bearer <ADMIN_TOKEN>`<br>`PUT /api/research-groups/<VALID_UUID>`<br><pre>{<br>  "name": "Intelligent Systems and Robotics",<br>  "isActive": false<br>}</pre> | `200 OK` | <pre>{<br>  "message": "Research group updated successfully",<br>  "data": {<br>    "id": "&lt;VALID_UUID&gt;",<br>    "name": "Intelligent Systems and Robotics",<br>    "isActive": false<br>  }<br>}</pre> | *Pending* |
| **TC-RG-PUT-002** | Admin Berhasil Sinkronisasi Relasi Program Studi | Positif | Login sebagai ADMIN | `Authorization: Bearer <ADMIN_TOKEN>`<br>`PUT /api/research-groups/<VALID_UUID>`<br><pre>{<br>  "studyProgramIds": ["<PRODI_UUID_NEW>"]<br>}</pre> | `200 OK` | Relasi lama yang tidak disertakan di-*soft delete*, relasi baru ditambahkan di tabel perantara. | *Pending* |
| **TC-RG-PUT-003** | Gagal Karena Nama Baru Sudah Digunakan Research Group Lain | Negatif | Research group lain bernama "Rekayasa Perangkat Lunak" aktif | `Authorization: Bearer <ADMIN_TOKEN>`<br>`PUT /api/research-groups/<VALID_UUID>`<br><pre>{<br>  "name": "Rekayasa Perangkat Lunak"<br>}</pre> | `400 Bad Request` | <pre>{<br>  "message": "Validation error",<br>  "errors": [{<br>    "field": "name",<br>    "message": "Nama kelompok keahlian sudah terdaftar"<br>  }]<br>}</pre> | *Pending* |
| **TC-RG-PUT-004** | Gagal Update Data yang Tidak Ditemukan atau Sudah Dihapus | Negatif | ID tidak ada di database | `Authorization: Bearer <ADMIN_TOKEN>`<br>`PUT /api/research-groups/00000000-0000-0000-0000-000000000000`<br><pre>{"name": "Nama Baru"}</pre> | `404 Not Found` | <pre>{"message": "Kelompok keahlian tidak ditemukan"}</pre> | *Pending* |
| **TC-RG-PUT-005** | Gagal Karena Pengguna Bukan Admin (Role Mahasiswa/Dosen) | RBAC / Negatif | Login sebagai MAHASISWA atau DOSEN | `Authorization: Bearer <MAHASISWA_TOKEN>`<br>`PUT /api/research-groups/<VALID_UUID>`<br><pre>{"name": "Nama Ubahan"}</pre> | `403 Forbidden` | <pre>{"message": "Akses ditolak"}</pre> | *Pending* |

---

## 6. Tabel Kasus Uji: `PATCH /api/research-groups/:id/toggle-active` (Toggle Status Aktif)

| ID Test Case | Skenario Pengujian | Kategori | Prasyarat | Header & Path Parameter | Expected Status | Expected Response & Validasi | Status Uji |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- | :---: |
| **TC-RG-TOG-001** | Admin Berhasil Menonaktifkan Research Group Aktif | Positif | Data dengan ID tersebut saat ini `isActive: true` | `Authorization: Bearer <ADMIN_TOKEN>`<br>`PATCH /api/research-groups/<VALID_UUID>/toggle-active` | `200 OK` | <pre>{<br>  "message": "Research group deactivated successfully",<br>  "data": {<br>    "id": "&lt;VALID_UUID&gt;",<br>    "isActive": false<br>  }<br>}</pre> | *Pending* |
| **TC-RG-TOG-002** | Admin Berhasil Mengaktifkan Research Group Non-Aktif | Positif | Data dengan ID tersebut saat ini `isActive: false` | `Authorization: Bearer <ADMIN_TOKEN>`<br>`PATCH /api/research-groups/<VALID_UUID>/toggle-active` | `200 OK` | <pre>{<br>  "message": "Research group activated successfully",<br>  "data": {<br>    "id": "&lt;VALID_UUID&gt;",<br>    "isActive": true<br>  }<br>}</pre> | *Pending* |
| **TC-RG-TOG-003** | Gagal Toggle Pada ID yang Tidak Ada atau Sudah Dihapus | Negatif | ID tidak valid | `Authorization: Bearer <ADMIN_TOKEN>`<br>`PATCH /api/research-groups/00000000-0000-0000-0000-000000000000/toggle-active` | `404 Not Found` | <pre>{"message": "Kelompok keahlian tidak ditemukan"}</pre> | *Pending* |
| **TC-RG-TOG-004** | Gagal Toggle Status Oleh Pengguna Non-Admin | RBAC / Negatif | Login sebagai DOSEN atau MAHASISWA | `Authorization: Bearer <DOSEN_TOKEN>`<br>`PATCH /api/research-groups/<VALID_UUID>/toggle-active` | `403 Forbidden` | <pre>{"message": "Akses ditolak"}</pre> | *Pending* |

---

## 7. Tabel Kasus Uji: `DELETE /api/research-groups/:id` (Soft Delete)

| ID Test Case | Skenario Pengujian | Kategori | Prasyarat | Header & Path Parameter | Expected Status | Expected Response & Validasi | Status Uji |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- | :---: |
| **TC-RG-DEL-001** | Admin Berhasil Menghapus Research Group (*Soft Delete*) | Positif | Research group aktif ada di database | `Authorization: Bearer <ADMIN_TOKEN>`<br>`DELETE /api/research-groups/<VALID_UUID>` | `200 OK` | <pre>{<br>  "message": "Research group deleted successfully",<br>  "data": {<br>    "id": "&lt;VALID_UUID&gt;"<br>  }<br>}</pre>Kolom `deleted_at` terisi tanggal saat ini, relasi di `research_group_study_program` ikut ter-soft delete. | *Pending* |
| **TC-RG-DEL-002** | Gagal Menghapus Data yang Sudah Pernah Dihapus (*Soft Deleted*) | Negatif | Data sudah berstatus `deletedAt != null` | `Authorization: Bearer <ADMIN_TOKEN>`<br>`DELETE /api/research-groups/<ALREADY_DELETED_UUID>` | `404 Not Found` | <pre>{"message": "Kelompok keahlian tidak ditemukan"}</pre>Mencegah penghapusan ganda. | *Pending* |
| **TC-RG-DEL-003** | Gagal Menghapus Data Oleh Pengguna Non-Admin | RBAC / Negatif | Login sebagai MAHASISWA atau DOSEN | `Authorization: Bearer <MAHASISWA_TOKEN>`<br>`DELETE /api/research-groups/<VALID_UUID>` | `403 Forbidden` | <pre>{"message": "Akses ditolak"}</pre>Data di DB tetap utuh. | *Pending* |
