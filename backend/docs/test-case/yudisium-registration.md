# Matriks Kasus Uji (Test Case) — Endpoint Pendaftaran Yudisium

Dokumen ini menyajikan spesifikasi kasus uji untuk endpoint **Pendaftaran Yudisium** backend **Sistem Akademik TUP** dalam format tabel terstruktur beserta hasil eksekusi pengujian otomatis.

---

## 1. Informasi Lingkungan & Konfigurasi Pengujian

| Parameter | Konfigurasi / Keterangan |
| :--- | :--- |
| **Modul** | Pendaftaran Yudisium (*Yudisium Registration*) |
| **Base URL** | `http://localhost:3000/api/yudisium-registrations` |
| **Format Data** | `application/json` |
| **Mekanisme Autentikasi** | JSON Web Token (JWT) — `Authorization: Bearer <token>` |
| **Hak Akses Daftar Pendaftar** | Terautentikasi seluruh role login (`ADMIN`, `DOSEN`, `MAHASISWA`) |
| **Standar Parameter Filter** | `yudisiumRegistrationPeriodId` (periode pendaftaran), `yudisiumPeriodId` (periode pelaksanaan) |

---

## 2. Tabel Kasus Uji: `GET /api/yudisium-registrations` (Daftar Pendaftaran Yudisium & Filter Periode)

| ID Test Case | Skenario Pengujian | Kategori | Prasyarat | Header & Query Parameter | Expected Status | Expected Response & Validasi | Status Uji |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- | :---: |
| **TC-YUD-LIST-001** | Default Memilih Periode Pendaftaran Yudisium Aktif (*Happy Path*) | Positif (Default) | Login dengan token valid, terdapat periode pendaftaran yudisium aktif (`isOpen: true`) | `Authorization: Bearer <TOKEN>`<br>*Tanpa query param periode* | `200 OK` | Sistem otomatis mencari periode pendaftaran yudisium aktif dan memfilter data berdasarkan `yudisiumRegistrationPeriodId = activePeriod.id`. | **PASS** |
| **TC-YUD-LIST-002** | Default Memilih Periode Pendaftaran Yudisium Kemarin Terdekat Jika Tidak Ada yang Aktif | Positif (Fallback) | Login dengan token valid, tidak ada periode aktif (`isOpen: false`) | `Authorization: Bearer <TOKEN>`<br>*Tanpa query param periode* | `200 OK` | Sistem otomatis mencari periode pendaftaran lampau yang baru saja selesai (`endDate <= now`, urut `endDate: desc`) dan memfilter data berdasarkan ID periode tersebut. | **PASS** |
| **TC-YUD-LIST-003** | Filter Berdasarkan ID Periode Pendaftaran Yudisium Eksplisit (`yudisiumRegistrationPeriodId`) | Positif (Filter) | Terdapat periode pendaftaran yudisium dengan UUID tertentu | `Authorization: Bearer <TOKEN>`<br>`?yudisiumRegistrationPeriodId=<PERIOD_UUID>` | `200 OK` | Data difilter secara tepat sesuai `yudisiumRegistrationPeriodId` tanpa memicu fallback default. | **PASS** |
| **TC-YUD-LIST-004** | Filter Berdasarkan ID Periode Pelaksanaan Yudisium Eksplisit (`yudisiumPeriodId`) | Positif (Filter) | Terdapat periode pelaksanaan yudisium dengan UUID tertentu | `Authorization: Bearer <TOKEN>`<br>`?yudisiumPeriodId=<PERIOD_UUID>` | `200 OK` | Data difilter secara tepat sesuai `yudisiumPeriodId` (yudisium yang telah disetujui). | **PASS** |
| **TC-YUD-LIST-005** | HTTP Endpoint List Pendaftaran Yudisium Terautentikasi Admin | Positif (Integration) | Login sebagai ADMIN | `Authorization: Bearer <ADMIN_TOKEN>`<br>`GET /api/yudisium-registrations` | `200 OK` | Mengembalikan struktur objek `{ data: [...], pagination: { ... } }` dengan data yang terikat pada periode default. | **PASS** |
