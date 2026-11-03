# Matriks Kasus Uji (Test Case) — Endpoint Autentikasi (Auth)

Dokumen ini menyajikan seluruh skenario pengujian untuk endpoint autentikasi backend **Sistem Akademik TUP** dalam format tabel terstruktur.

---

## 1. Informasi Lingkungan & Konfigurasi Pengujian

| Parameter | Konfigurasi / Keterangan |
| :--- | :--- |
| **Modul** | Autentikasi Pengguna (*Authentication Module*) |
| **Base URL** | `http://localhost:3000/api/auth` |
| **Format Data** | `application/json` |
| **Mekanisme Autentikasi** | JSON Web Token (JWT) — `Authorization: Bearer <token>` |
| **Masa Berlaku Token** | 1 Hari (`1d`) |
| **Enkripsi Sandi** | Bcrypt (Salt rounds = 10) |
| **Aturan Domain Email** | Mahasiswa: `@student.telkomuniversity.ac.id`<br>Dosen: `@telkomuniversity.ac.id` |
| **Rate Limit** | Maksimal 20 request per 15 menit per IP (`authRateLimiter`) |

---

## 2. Tabel Kasus Uji: `POST /api/auth/register`

| ID Test Case | Skenario Pengujian | Kategori | Prasyarat | Header & Request Body (Payload) | Expected Status | Expected Response & Validasi | Status Uji |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- | :---: |
| **TC-AUTH-REG-001** | Registrasi Akun Mahasiswa Berhasil (*Happy Path*) | Positif | Email & telepon belum terdaftar di database | `Content-Type: application/json`<br><pre>{<br>  "email": "mhs.baru@student.telkomuniversity.ac.id",<br>  "password": "Password123!",<br>  "confirmPassword": "Password123!",<br>  "phone": "081234567890"<br>}</pre> | `201 Created` | <pre>{<br>  "message": "Registration successful",<br>  "token": "&lt;JWT_TOKEN&gt;",<br>  "data": {<br>    "id": "&lt;UUID&gt;",<br>    "username": "mhs.baru",<br>    "email": "mhs.baru@student.telkomuniversity.ac.id",<br>    "phone": "081234567890",<br>    "role": "MAHASISWA"<br>  }<br>}</pre>Password ter-hash di DB, token valid. | *Pending* |
| **TC-AUTH-REG-002** | Registrasi Akun Dosen Berhasil (*Happy Path*) | Positif | Email dosen belum terdaftar | `Content-Type: application/json`<br><pre>{<br>  "email": "dosen.wali@telkomuniversity.ac.id",<br>  "password": "Password123!",<br>  "confirmPassword": "Password123!"<br>}</pre> | `201 Created` | Respons memuat `role: "DOSEN"`, `username: "dosen.wali"`, `phone: null`, dan token JWT valid. | *Pending* |
| **TC-AUTH-REG-003** | Registrasi Berhasil Tanpa Menyertakan Nomor Telepon | Positif | Email belum terdaftar | `Content-Type: application/json`<br><pre>{<br>  "email": "mhs.nophone@student.telkomuniversity.ac.id",<br>  "password": "Password123!",<br>  "confirmPassword": "Password123!"<br>}</pre> | `201 Created` | Registrasi berhasil dengan field `data.phone: null`. | *Pending* |
| **TC-AUTH-REG-004** | Registrasi Gagal Karena Domain Email Luar (Non-Kampus) | Negatif | - | `Content-Type: application/json`<br><pre>{<br>  "email": "user@gmail.com",<br>  "password": "Password123!",<br>  "confirmPassword": "Password123!"<br>}</pre> | `400 Bad Request` | <pre>{<br>  "message": "Validation error",<br>  "errors": [{<br>    "field": "email",<br>    "message": "Domain email harus student.telkomuniversity.ac.id atau telkomuniversity.ac.id"<br>  }]<br>}</pre> | *Pending* |
| **TC-AUTH-REG-005** | Registrasi Gagal Karena Email Sudah Terdaftar (Duplikat) | Negatif | Email `mhs.baru@student.telkomuniversity.ac.id` sudah ada di DB | `Content-Type: application/json`<br><pre>{<br>  "email": "mhs.baru@student.telkomuniversity.ac.id",<br>  "password": "PasswordBaru123!",<br>  "confirmPassword": "PasswordBaru123!"<br>}</pre> | `400 Bad Request` | <pre>{<br>  "message": "Email sudah digunakan"<br>}</pre> | *Pending* |
| **TC-AUTH-REG-006** | Registrasi Gagal Karena Nomor Telepon Sudah Digunakan | Negatif | Nomor `081234567890` sudah dipakai user lain | `Content-Type: application/json`<br><pre>{<br>  "email": "unik.mhs@student.telkomuniversity.ac.id",<br>  "password": "Password123!",<br>  "confirmPassword": "Password123!",<br>  "phone": "081234567890"<br>}</pre> | `400 Bad Request` | <pre>{<br>  "message": "Nomor telepon sudah digunakan"<br>}</pre> | *Pending* |
| **TC-AUTH-REG-007** | Registrasi Gagal Karena Konfirmasi Password Tidak Cocok | Negatif | - | `Content-Type: application/json`<br><pre>{<br>  "email": "mhs.test@student.telkomuniversity.ac.id",<br>  "password": "PasswordUtama123",<br>  "confirmPassword": "PasswordBeda123"<br>}</pre> | `400 Bad Request` | <pre>{<br>  "message": "Validation error",<br>  "errors": [{<br>    "field": "confirmPassword",<br>    "message": "Konfirmasi kata sandi tidak cocok"<br>  }]<br>}</pre> | *Pending* |
| **TC-AUTH-REG-008** | Registrasi Gagal Karena Password Kurang dari 8 Karakter | Boundary / Negatif | - | `Content-Type: application/json`<br><pre>{<br>  "email": "mhs.test@student.telkomuniversity.ac.id",<br>  "password": "pass",<br>  "confirmPassword": "pass"<br>}</pre> | `400 Bad Request` | <pre>{<br>  "message": "Validation error",<br>  "errors": [{<br>    "field": "password",<br>    "message": "Kata sandi minimal 8 karakter"<br>  }]<br>}</pre> | *Pending* |
| **TC-AUTH-REG-009** | Registrasi Gagal Karena Format Nomor Telepon Tidak Valid | Negatif | - | `Content-Type: application/json`<br><pre>{<br>  "email": "mhs.test@student.telkomuniversity.ac.id",<br>  "password": "Password123!",<br>  "confirmPassword": "Password123!",<br>  "phone": "invalid_phone_number"<br>}</pre> | `400 Bad Request` | <pre>{<br>  "message": "Validation error",<br>  "errors": [{<br>    "field": "phone",<br>    "message": "Nomor telepon tidak valid"<br>  }]<br>}</pre> | *Pending* |
| **TC-AUTH-REG-010** | Registrasi Gagal Karena Request Body Kosong | Negatif | - | `Content-Type: application/json`<br><pre>{}</pre> | `400 Bad Request` | Zod validation error untuk field `email`, `password`, dan `confirmPassword`. | *Pending* |

---

## 3. Tabel Kasus Uji: `POST /api/auth/login`

| ID Test Case | Skenario Pengujian | Kategori | Prasyarat | Header & Request Body (Payload) | Expected Status | Expected Response & Validasi | Status Uji |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- | :---: |
| **TC-AUTH-LOG-001** | Login Berhasil dengan Kredensial Valid (*Happy Path*) | Positif | User aktif terdaftar di database | `Content-Type: application/json`<br><pre>{<br>  "email": "mhs.baru@student.telkomuniversity.ac.id",<br>  "password": "Password123!"<br>}</pre> | `200 OK` | <pre>{<br>  "message": "Login successful",<br>  "token": "&lt;JWT_TOKEN&gt;",<br>  "data": {<br>    "id": "&lt;UUID&gt;",<br>    "username": "mhs.baru",<br>    "email": "mhs.baru@student.telkomuniversity.ac.id",<br>    "phone": "081234567890",<br>    "role": "MAHASISWA"<br>  }<br>}</pre>Token dapat didekode, payload memuat `{id, email, role}`. | *Pending* |
| **TC-AUTH-LOG-002** | Login Gagal Karena Kata Sandi Salah | Negatif | Akun terdaftar di database | `Content-Type: application/json`<br><pre>{<br>  "email": "mhs.baru@student.telkomuniversity.ac.id",<br>  "password": "PasswordSalahTotal"<br>}</pre> | `401 Unauthorized` | <pre>{<br>  "message": "Email atau kata sandi salah"<br>}</pre> | *Pending* |
| **TC-AUTH-LOG-003** | Login Gagal Karena Email Belum Terdaftar | Negatif | Email tidak ada di database | `Content-Type: application/json`<br><pre>{<br>  "email": "tidak.ada@student.telkomuniversity.ac.id",<br>  "password": "Password123!"<br>}</pre> | `401 Unauthorized` | <pre>{<br>  "message": "Email atau kata sandi salah"<br>}</pre>Pesan error umum untuk mencegah user enumeration. | *Pending* |
| **TC-AUTH-LOG-004** | Login Gagal Pada Akun yang Di-*Soft Delete* | Edge Case / Negatif | User ada di DB namun memiliki `deletedAt != null` | `Content-Type: application/json`<br><pre>{<br>  "email": "user.deleted@student.telkomuniversity.ac.id",<br>  "password": "Password123!"<br>}</pre> | `401 Unauthorized` | <pre>{<br>  "message": "Email atau kata sandi salah"<br>}</pre>User yang telah dihapus ditolak sistem. | *Pending* |
| **TC-AUTH-LOG-005** | Login Gagal Karena Format Email Tidak Valid | Negatif | - | `Content-Type: application/json`<br><pre>{<br>  "email": "format-bukan-email",<br>  "password": "Password123!"<br>}</pre> | `400 Bad Request` | <pre>{<br>  "message": "Validation error",<br>  "errors": [{<br>    "field": "email",<br>    "message": "Format email tidak valid"<br>  }]<br>}</pre> | *Pending* |
| **TC-AUTH-LOG-006** | Login Gagal Karena Password Kurang dari 8 Karakter | Boundary / Negatif | - | `Content-Type: application/json`<br><pre>{<br>  "email": "mhs.baru@student.telkomuniversity.ac.id",<br>  "password": "pendek"<br>}</pre> | `400 Bad Request` | <pre>{<br>  "message": "Validation error",<br>  "errors": [{<br>    "field": "password",<br>    "message": "Kata sandi minimal 8 karakter"<br>  }]<br>}</pre> | *Pending* |
| **TC-AUTH-LOG-007** | Login Gagal Karena Request Body Kosong | Negatif | - | `Content-Type: application/json`<br><pre>{}</pre> | `400 Bad Request` | Pesan error validasi Zod untuk field `email` dan `password`. | *Pending* |

---

## 4. Tabel Kasus Uji: `GET /api/auth/user`

| ID Test Case | Skenario Pengujian | Kategori | Prasyarat | Header & Parameter | Expected Status | Expected Response & Validasi | Status Uji |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- | :---: |
| **TC-AUTH-USR-001** | Ambil Data Pengguna Terautentikasi Berhasil (*Happy Path*) | Positif | User aktif & memiliki Bearer Token JWT valid | `Authorization: Bearer <VALID_JWT_TOKEN>` | `200 OK` | <pre>{<br>  "data": {<br>    "id": "&lt;USER_UUID&gt;",<br>    "username": "mhs.baru",<br>    "email": "mhs.baru@student.telkomuniversity.ac.id",<br>    "phone": "081234567890",<br>    "role": "MAHASISWA"<br>  }<br>}</pre>Field sensitif (`password`, `deletedAt`) tidak diekspos. | *Pending* |
| **TC-AUTH-USR-002** | Gagal Mengambil Data Tanpa Header Authorization | Negatif | - | *Tanpa Header Authorization* | `401 Unauthorized` | <pre>{<br>  "message": "Token not found"<br>}</pre> | *Pending* |
| **TC-AUTH-USR-003** | Gagal Mengambil Data Karena Token Rusak / Palsu | Keamanan / Negatif | - | `Authorization: Bearer invalid.token.signature` | `403 Forbidden` | <pre>{<br>  "message": "Invalid token"<br>}</pre> | *Pending* |
| **TC-AUTH-USR-004** | Gagal Mengambil Data Karena Token Sudah Kedaluwarsa (*Expired*) | Boundary / Negatif | Token JWT dengan masa aktif telah terlampaui (> 1 hari) | `Authorization: Bearer <EXPIRED_TOKEN>` | `403 Forbidden` | <pre>{<br>  "message": "Invalid token"<br>}</pre> | *Pending* |
| **TC-AUTH-USR-005** | Gagal Mengambil Data Karena Skema Header Bukan Bearer | Negatif | - | `Authorization: Basic dXNlcjpwYXNz` | `401 Unauthorized` | <pre>{<br>  "message": "Token not found"<br>}</pre> | *Pending* |
| **TC-AUTH-USR-006** | Gagal Mengambil Data Karena Akun Telah Dihapus (*Soft Deleted*) | Edge Case / Negatif | Token valid, namun akun user di DB telah diisi kolom `deleted_at` | `Authorization: Bearer <VALID_TOKEN_DELETED_USER>` | `404 Not Found` | <pre>{<br>  "message": "Pengguna tidak ditemukan"<br>}</pre> | *Pending* |

---

## 5. Tabel Kasus Uji: Keamanan & Rate Limiting (*Security & Resilience*)

| ID Test Case | Skenario Pengujian | Endpoint Target | Metode Pengujian | Expected Status | Expected Response & Validasi | Status Uji |
| :--- | :--- | :---: | :--- | :---: | :--- | :---: |
| **TC-AUTH-SEC-001** | Pengujian Rate Limiting Brute Force Auth (`authRateLimiter`) | `POST /api/auth/login`<br>`POST /api/auth/register` | Kirim request sebanyak 21 kali secara simultan dari IP yang sama dalam jangka waktu < 15 menit | `429 Too Many Requests` | Request ke-1 s/d ke-20 diproses normal.<br>Request ke-21 mengembalikan:<br><pre>{<br>  "success": false,<br>  "message": "Terlalu banyak percobaan autentikasi. Silakan coba lagi setelah 15 menit."<br>}</pre> | *Pending* |
| **TC-AUTH-SEC-002** | Pengujian Kebocoran Hash Kata Sandi (*Data Leakage Prevention*) | Seluruh endpoint auth | Periksa respon body pada `register`, `login`, dan `user` | - | Respon JSON **tidak boleh** mengandung key `password`, hash password, salt, atau `deletedAt`. | *Pending* |
| **TC-AUTH-SEC-003** | Pengujian Manipulasi Payload Token (*JWT Tampering / Escalation*) | `GET /api/auth/user` | Ubah claim role di dalam JWT payload (misal dari `MAHASISWA` menjadi `ADMIN`) tanpa mere-sign dengan `JWT_SECRET` | `403 Forbidden` | <pre>{<br>  "message": "Invalid token"<br>}</pre>Sistem memverifikasi signature kunci rahasia secara ketat. | *Pending* |
