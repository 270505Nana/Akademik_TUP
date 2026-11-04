# Matriks Kasus Uji (Test Case) — Endpoint Template Upload (Dokumen Persyaratan Berkas)

Dokumen ini menyajikan seluruh spesifikasi kasus uji untuk endpoint pengelolaan dokumen dan berkas persyaratan (*Template Upload*) backend **Sistem Akademik TUP** dalam format tabel terstruktur.

---

## 1. Informasi Lingkungan & Konfigurasi Pengujian

| Parameter | Konfigurasi / Keterangan |
| :--- | :--- |
| **Modul** | Template Dokumen Persyaratan Berkas (*Template Upload*) |
| **Base URL** | `http://localhost:3000/api/templates` |
| **Format Data Input** | JSON untuk query/param, `multipart/form-data` untuk upload berkas (`POST` & `PATCH`) |
| **Mekanisme Autentikasi** | JSON Web Token (JWT) — `Authorization: Bearer <token>` |
| **Hak Akses Publik (Tanpa Auth)** | Unduh template (`/download/:code`) & Pratinjau berkas (`/preview/:code`) |
| **Hak Akses Baca (GET)** | Seluruh pengguna terautentikasi (`ADMIN`, `DOSEN`, `MAHASISWA`) |
| **Hak Akses Kelola (POST, PATCH, DELETE, Toggle)** | Khusus Role `ADMIN` (`authorize("ADMIN")`) |
| **Tipe File yang Diizinkan** | PDF (`application/pdf`), Word (`.doc`, `.docx`), ZIP (`application/zip`) |
| **Mekanisme Penghapusan** | *Hard Delete* pada basis data dan penghapusan fisik berkas dari penyimpanan |
| **Pencarian & Filter** | `category` (kategori berkas), `search` (nama dokumen atau kode template) |
| **Pengurutan Standar** | `sortBy`: `category` (default), `queue`, `name`, `createdAt`, `newest`, `oldest` \| `sortOrder`: `asc` (default), `desc` |
| **Pagination Standar** | `page` (default: 1), `limit` (angka 1 s/d 100, atau `"all"` / `"-1"`) |

---

## 2. Tabel Kasus Uji: `GET /api/templates` (List, Filter, Sort, Pagination)

| ID Test Case | Skenario Pengujian | Kategori | Prasyarat | Header & Query Parameter | Expected Status | Expected Response & Validasi | Status Uji |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- | :---: |
| **TC-TPL-GET-001** | Ambil Daftar Template Upload Default (*Happy Path*) | Positif | Data template tersedia di database & token valid | `Authorization: Bearer <VALID_TOKEN>`<br>*Tanpa query param* | `200 OK` | <pre>{<br>  "data": [<br>    {<br>      "id": "&lt;UUID&gt;",<br>      "name": "Formulir Pendaftaran Sidang",<br>      "code": "sidang_berkas_wajib_formulir_pendaftaran_sidang",<br>      "category": "Sidang - Berkas Wajib",<br>      "queue": 1,<br>      "isPublish": true,<br>      "isRequired": true,<br>      "downloadUrl": "http://.../api/templates/download/...",<br>      "previewUrl": "http://.../api/templates/preview/..."<br>    }<br>  ],<br>  "pagination": { "totalItems": 10, "itemsPerPage": 10, "currentPage": 1, "totalPages": 1 }<br>}</pre>Data terurut default `category: asc, queue: asc`. | *Pending* |
| **TC-TPL-GET-002** | Filter Berdasarkan Kategori Dokumen (`category`) | Positif | Terdapat template dengan kategori "Permohonan SKTA" | `Authorization: Bearer <VALID_TOKEN>`<br>`?category=Permohonan SKTA` | `200 OK` | Seluruh item pada array `data` memiliki atribut `"category": "Permohonan SKTA"`. | *Pending* |
| **TC-TPL-GET-003** | Pencarian Berdasarkan Nama atau Kode Template (`search`) | Positif | Terdapat template dengan kata "proposal" | `Authorization: Bearer <VALID_TOKEN>`<br>`?search=proposal` | `200 OK` | Mengembalikan dokumen yang field `name` atau `code`-nya memuat keyword pencarian. | *Pending* |
| **TC-TPL-GET-004** | Pengurutan Berdasarkan Antrean Dokumen (`sortBy=queue`) | Positif | - | `Authorization: Bearer <VALID_TOKEN>`<br>`?sortBy=queue&sortOrder=asc` | `200 OK` | Data diurutkan berdasarkan nomor urut antrean (`queue`) terkecil ke terbesar. | *Pending* |
| **TC-TPL-GET-005** | Pengurutan Berdasarkan Waktu Dibuat Terbaru (`sortBy=newest`) | Positif | - | `Authorization: Bearer <VALID_TOKEN>`<br>`?sortBy=newest` | `200 OK` | Data diurutkan dari `createdAt` paling baru. | *Pending* |
| **TC-TPL-GET-006** | Pengambilan Seluruh Data Tanpa Batas Halaman (`limit=all`) | Positif | - | `Authorization: Bearer <VALID_TOKEN>`<br>`?limit=all` | `200 OK` | Seluruh data dikembalikan dalam satu halaman respons. | *Pending* |
| **TC-TPL-GET-007** | Gagal Karena Nilai `sortBy` Tidak Diizinkan | Negatif | - | `Authorization: Bearer <VALID_TOKEN>`<br>`?sortBy=size` | `400 Bad Request` | <pre>{<br>  "message": "Validation error",<br>  "errors": [{<br>    "field": "sortBy",<br>    "message": "sortBy harus salah satu dari: category, queue, name, createdAt, newest, oldest"<br>  }]<br>}</pre> | *Pending* |
| **TC-TPL-GET-008** | Gagal Karena Batas `limit` Numerik Melebihi 100 | Boundary / Negatif | - | `Authorization: Bearer <VALID_TOKEN>`<br>`?limit=150` | `400 Bad Request` | Validasi Zod menolak karena batasan maksimum numerik adalah 100. | *Pending* |
| **TC-TPL-GET-009** | Gagal Mengambil Data Tanpa Token Autentikasi | Negatif | - | *Tanpa Header Authorization* | `401 Unauthorized` | <pre>{"message": "Token not found"}</pre> | *Pending* |

---

## 3. Tabel Kasus Uji: `POST /api/templates` (Create Template Upload)

| ID Test Case | Skenario Pengujian | Kategori | Prasyarat | Header & Form-Data Payload | Expected Status | Expected Response & Validasi | Status Uji |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- | :---: |
| **TC-TPL-POST-001** | Admin Berhasil Membuat Template Baru Disertai Berkas Valid (*Happy Path*) | Positif | Login sebagai ADMIN, kombinasi kategori & nama belum ada | `Authorization: Bearer <ADMIN_TOKEN>`<br>`Content-Type: multipart/form-data`<br>- `name`: `Template Proposal Skripsi`<br>- `category`: `Permohonan SKTA`<br>- `isPublish`: `true`<br>- `isRequired`: `true`<br>- `templateFile`: `proposal_template.pdf` (PDF valid) | `200 OK` | <pre>{<br>  "message": "Template upload created successfully",<br>  "data": {<br>    "id": "&lt;UUID&gt;",<br>    "name": "Template Proposal Skripsi",<br>    "code": "permohonan_skta_template_proposal_skripsi",<br>    "category": "Permohonan SKTA",<br>    "queue": 1,<br>    "isPublish": true,<br>    "isRequired": true,<br>    "downloadUrl": "http://.../download/...",<br>    "previewUrl": "http://.../preview/..."<br>  }<br>}</pre>Berkas fisik tersimpan di direktori storage backend. | *Pending* |
| **TC-TPL-POST-002** | Admin Berhasil Membuat Template Tanpa Unggah Berkas (*Metadata Only*) | Positif | Login sebagai ADMIN, kombinasi kategori & nama unik | `Authorization: Bearer <ADMIN_TOKEN>`<br>`Content-Type: multipart/form-data`<br>- `name`: `Surat Bebas Lab`<br>- `category`: `Sidang - Berkas Wajib`<br>- `isPublish`: `false`<br>- `isRequired`: `true` | `200 OK` | Template terbuat dengan `filepath: null`, `downloadUrl: null`, dan `previewUrl: null`. | *Pending* |
| **TC-TPL-POST-003** | Gagal Karena Tipe File Berkas Tidak Didukung (MIME Tidak Valid) | Negatif | Login sebagai ADMIN | `Authorization: Bearer <ADMIN_TOKEN>`<br>`Content-Type: multipart/form-data`<br>- `name`: `Foto Formal`<br>- `category`: `Yudisium - Berkas Wajib`<br>- `templateFile`: `foto.jpg` (`image/jpeg`) | `400 Bad Request` | <pre>{<br>  "message": "Validation error",<br>  "errors": [{<br>    "field": "templateFile",<br>    "message": "Tipe file tidak valid"<br>  }]<br>}</pre> | *Pending* |
| **TC-TPL-POST-004** | Gagal Karena Nama dan Kategori Sudah Digunakan (Duplikat Kode) | Negatif | Template dengan nama dan kategori sama telah ada di database | `Authorization: Bearer <ADMIN_TOKEN>`<br>`Content-Type: multipart/form-data`<br>- `name`: `Template Proposal Skripsi`<br>- `category`: `Permohonan SKTA` | `400 Bad Request` | <pre>{<br>  "message": "Validation error",<br>  "errors": [{<br>    "field": "name",<br>    "message": "Nama dan kategori dokumen sudah digunakan di dokumen lain"<br>  }]<br>}</pre> | *Pending* |
| **TC-TPL-POST-005** | Gagal Karena Field Wajib (`name` atau `category`) Kosong | Negatif | Login sebagai ADMIN | `Authorization: Bearer <ADMIN_TOKEN>`<br>`Content-Type: multipart/form-data`<br>- `isPublish`: `true` | `400 Bad Request` | Pesan validasi Zod bahwa `name` dan `category` wajib diisi. | *Pending* |
| **TC-TPL-POST-006** | Gagal Ditolak Karena Pengguna Bukan Admin (Role Dosen/Mahasiswa) | RBAC / Negatif | Login sebagai MAHASISWA atau DOSEN | `Authorization: Bearer <MAHASISWA_TOKEN>`<br>`Content-Type: multipart/form-data`<br>- `name`: `Template X`<br>- `category`: `Permohonan SKTA` | `403 Forbidden` | <pre>{"message": "Akses ditolak"}</pre> | *Pending* |

---

## 4. Tabel Kasus Uji: `GET /api/templates/download/:code` & `/preview/:code` (Unduh & Pratinjau Publik)

| ID Test Case | Skenario Pengujian | Kategori | Prasyarat | Header & Path Parameter | Expected Status | Expected Response & Validasi | Status Uji |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- | :---: |
| **TC-TPL-DL-001** | Unduh Berkas Template Berhasil (*Happy Path*) | Positif | Template dengan `<VALID_CODE>` memiliki berkas fisik di storage | *Tanpa Auth Header (Akses Publik)*<br>`GET /api/templates/download/<VALID_CODE>` | `200 OK` | Header `Content-Disposition: attachment; filename="<NAME>.<EXT>"`, body berisi stream biner file. | *Pending* |
| **TC-TPL-DL-002** | Gagal Unduh Karena Kode Template Tidak Ditemukan | Negatif | Kode acak tidak ada di database | *Tanpa Auth Header*<br>`GET /api/templates/download/kode_tidak_ada` | `404 Not Found` | <pre>{"message": "Template tidak ditemukan"}</pre> | *Pending* |
| **TC-TPL-DL-003** | Gagal Unduh Karena Template Belum Memiliki Berkas Fisik | Edge Case / Negatif | Template ada di database namun kolom `filepath` bernilai `null` | *Tanpa Auth Header*<br>`GET /api/templates/download/<CODE_WITHOUT_FILE>` | `404 Not Found` | <pre>{"message": "File template belum diunggah atau tidak ada"}</pre> | *Pending* |
| **TC-TPL-PRV-001** | Pratinjau (*Preview*) Berkas PDF Berhasil (*Happy Path*) | Positif | Template memiliki berkas format `.pdf` | *Tanpa Auth Header*<br>`GET /api/templates/preview/<VALID_PDF_CODE>` | `200 OK` | Header `Content-Type: application/pdf`, berkas disajikan secara *inline* untuk pratinjau browser. | *Pending* |
| **TC-TPL-PRV-002** | Gagal Pratinjau Karena Kode Tidak Ditemukan | Negatif | Kode tidak ada di database | *Tanpa Auth Header*<br>`GET /api/templates/preview/kode_palsu` | `404 Not Found` | <pre>{"message": "Template tidak ditemukan"}</pre> | *Pending* |

---

## 5. Tabel Kasus Uji: `GET /api/templates/:code` (Detail Template by Code)

| ID Test Case | Skenario Pengujian | Kategori | Prasyarat | Header & Path Parameter | Expected Status | Expected Response & Validasi | Status Uji |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- | :---: |
| **TC-TPL-BYCODE-001** | Ambil Metadata Template Berdasarkan Kode Berhasil (*Happy Path*) | Positif | Template aktif dengan `<VALID_CODE>` ada di DB | `Authorization: Bearer <VALID_TOKEN>`<br>`GET /api/templates/<VALID_CODE>` | `200 OK` | <pre>{<br>  "data": {<br>    "id": "&lt;UUID&gt;",<br>    "name": "Template Proposal Skripsi",<br>    "code": "<VALID_CODE>",<br>    "category": "Permohonan SKTA",<br>    "queue": 1,<br>    "isPublish": true,<br>    "isRequired": true,<br>    "downloadUrl": "...",<br>    "previewUrl": "..."<br>  }<br>}</pre> | *Pending* |
| **TC-TPL-BYCODE-002** | Gagal Karena Kode Tidak Ditemukan | Negatif | Kode tidak terdaftar di database | `Authorization: Bearer <VALID_TOKEN>`<br>`GET /api/templates/kode_tidak_terdaftar` | `404 Not Found` | <pre>{"message": "Unggahan template tidak ditemukan"}</pre> | *Pending* |

---

## 6. Tabel Kasus Uji: `PATCH /api/templates/:id` (Update Template)

| ID Test Case | Skenario Pengujian | Kategori | Prasyarat | Header, Path & Form-Data Payload | Expected Status | Expected Response & Validasi | Status Uji |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- | :---: |
| **TC-TPL-PATCH-001** | Admin Berhasil Memperbarui Nama, Antrean, dan Mengganti Berkas | Positif | Login sebagai ADMIN, template valid | `Authorization: Bearer <ADMIN_TOKEN>`<br>`PATCH /api/templates/<VALID_UUID>`<br>- `name`: `Template Proposal Skripsi Revisi`<br>- `queue`: `2`<br>- `templateFile`: `berkas_baru.docx` | `200 OK` | <pre>{<br>  "message": "Template upload updated successfully",<br>  "data": {<br>    "id": "&lt;VALID_UUID&gt;",<br>    "name": "Template Proposal Skripsi Revisi",<br>    "queue": 2<br>  }<br>}</pre>Kode diperbarui otomatis, berkas lama dihapus dari storage. | *Pending* |
| **TC-TPL-PATCH-002** | Admin Memperbarui Hanya Status Publikasi / Wajib | Positif | Login sebagai ADMIN | `Authorization: Bearer <ADMIN_TOKEN>`<br>`PATCH /api/templates/<VALID_UUID>`<br>- `isPublish`: `false`<br>- `isRequired`: `false` | `200 OK` | Nilai `isPublish` dan `isRequired` berhasil diubah menjadi `false`. | *Pending* |
| **TC-TPL-PATCH-003** | Gagal Update Jika Perubahan Nama Menghasilkan Kode Duplikat | Negatif | Kombinasi nama & kategori baru sama dengan template lain | `Authorization: Bearer <ADMIN_TOKEN>`<br>`PATCH /api/templates/<VALID_UUID>`<br>- `name`: `Nama Template Yang Sudah Ada` | `400 Bad Request` | <pre>{<br>  "message": "Validation error",<br>  "errors": [{<br>    "field": "name",<br>    "message": "Nama dan kategori dokumen baru sudah digunakan di dokumen lain"<br>  }]<br>}</pre> | *Pending* |
| **TC-TPL-PATCH-004** | Gagal Update Karena File Pengganti Memiliki Ekstensi Terlarang | Negatif | Login sebagai ADMIN | `Authorization: Bearer <ADMIN_TOKEN>`<br>`PATCH /api/templates/<VALID_UUID>`<br>- `templateFile`: `skrip.exe` | `400 Bad Request` | Pesan validasi bahwa tipe file tidak valid. | *Pending* |
| **TC-TPL-PATCH-005** | Gagal Update Data yang Tidak Ditemukan | Negatif | ID tidak ada di database | `Authorization: Bearer <ADMIN_TOKEN>`<br>`PATCH /api/templates/00000000-0000-0000-0000-000000000000`<br>- `name`: `Nama Baru` | `404 Not Found` | <pre>{"message": "Unggahan template tidak ditemukan"}</pre> | *Pending* |
| **TC-TPL-PATCH-006** | Gagal Update Karena Pengguna Bukan Admin (Role Mahasiswa/Dosen) | RBAC / Negatif | Login sebagai MAHASISWA atau DOSEN | `Authorization: Bearer <DOSEN_TOKEN>`<br>`PATCH /api/templates/<VALID_UUID>`<br>- `name`: `Nama Baru` | `403 Forbidden` | <pre>{"message": "Akses ditolak"}</pre> | *Pending* |

---

## 7. Tabel Kasus Uji: Toggle Status (`/toggle-publish` & `/toggle-required`)

| ID Test Case | Skenario Pengujian | Kategori | Prasyarat | Header & Path Parameter | Expected Status | Expected Response & Validasi | Status Uji |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- | :---: |
| **TC-TPL-TOG-001** | Admin Toggle Status Publikasi Template (`isPublish`) | Positif | Login sebagai ADMIN, saat ini `isPublish: true` | `Authorization: Bearer <ADMIN_TOKEN>`<br>`PATCH /api/templates/<VALID_UUID>/toggle-publish` | `200 OK` | <pre>{<br>  "message": "template status changed to unpublished",<br>  "data": { "isPublish": false }<br>}</pre> | *Pending* |
| **TC-TPL-TOG-002** | Admin Toggle Status Wajib Dokumen (`isRequired`) | Positif | Login sebagai ADMIN, saat ini `isRequired: true` | `Authorization: Bearer <ADMIN_TOKEN>`<br>`PATCH /api/templates/<VALID_UUID>/toggle-required` | `200 OK` | <pre>{<br>  "message": "template requirement status changed to optional",<br>  "data": { "isRequired": false }<br>}</pre> | *Pending* |
| **TC-TPL-TOG-003** | Gagal Toggle Pada Template yang Tidak Ditemukan | Negatif | ID tidak valid | `Authorization: Bearer <ADMIN_TOKEN>`<br>`PATCH /api/templates/00000000-0000-0000-0000-000000000000/toggle-publish` | `404 Not Found` | <pre>{"message": "Unggahan template tidak ditemukan"}</pre> | *Pending* |
| **TC-TPL-TOG-004** | Gagal Toggle Status Oleh Pengguna Non-Admin | RBAC / Negatif | Login sebagai MAHASISWA atau DOSEN | `Authorization: Bearer <MAHASISWA_TOKEN>`<br>`PATCH /api/templates/<VALID_UUID>/toggle-publish` | `403 Forbidden` | <pre>{"message": "Akses ditolak"}</pre> | *Pending* |

---

## 8. Tabel Kasus Uji: `DELETE /api/templates/:id` (Hard Delete & File Cleanup)

| ID Test Case | Skenario Pengujian | Kategori | Prasyarat | Header & Path Parameter | Expected Status | Expected Response & Validasi | Status Uji |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- | :---: |
| **TC-TPL-DEL-001** | Admin Berhasil Menghapus Template dan Berkas Fisiknya | Positif | Template aktif ada di DB beserta file fisik di storage | `Authorization: Bearer <ADMIN_TOKEN>`<br>`DELETE /api/templates/<VALID_UUID>` | `200 OK` | <pre>{"message": "Template upload deleted successfully"}</pre>Record terhapus permanen dari basis data, berkas fisik di storage terhapus. | *Pending* |
| **TC-TPL-DEL-002** | Gagal Menghapus Template yang Tidak Ditemukan | Negatif | ID tidak ada di database | `Authorization: Bearer <ADMIN_TOKEN>`<br>`DELETE /api/templates/00000000-0000-0000-0000-000000000000` | `404 Not Found` | <pre>{"message": "Unggahan template tidak ditemukan"}</pre> | *Pending* |
| **TC-TPL-DEL-003** | Gagal Menghapus Template Oleh Pengguna Non-Admin | RBAC / Negatif | Login sebagai DOSEN atau MAHASISWA | `Authorization: Bearer <DOSEN_TOKEN>`<br>`DELETE /api/templates/<VALID_UUID>` | `403 Forbidden` | <pre>{"message": "Akses ditolak"}</pre>Data dan berkas fisik tetap aman. | *Pending* |
