# Skenario Test Modul Auth

Dokumen ini berisi skenario pengujian untuk modul autentikasi backend SIMTA. Pengujian ditujukan untuk API yang berjalan pada base URL `/api`.

## Cakupan

Endpoint yang diuji:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/user`

Prasyarat umum:

1. Backend berjalan dan terhubung ke database test.
2. `JWT_SECRET` tersedia pada environment.
3. Setiap test yang membutuhkan data baru menggunakan email dan nomor telepon unik.
4. Token dari proses login/register disimpan sebagai `Bearer <token>`.
5. Data pengguna yang digunakan untuk test negatif (misalnya pengguna terhapus) disiapkan langsung pada database test sesuai aturan akses database proyek.

> Catatan: Middleware `validate` mengembalikan HTTP `400` untuk kegagalan validasi Zod. Nilai ini menjadi expected result pada skenario di bawah, walaupun anotasi Swagger route masih mencantumkan `422`.

## Data Uji

| Nama | Nilai/karakteristik |
|---|---|
| Mahasiswa valid | `mahasiswa.<timestamp>@student.telkomuniversity.ac.id`, password minimal 8 karakter |
| Dosen valid | `dosen.<timestamp>@telkomuniversity.ac.id`, password minimal 8 karakter |
| Domain tidak diizinkan | `user@example.com` |
| Nomor telepon valid | Nilai 8-15 karakter yang hanya berisi angka, spasi, tanda `+`, atau `-` |
| Nomor telepon tidak valid | Nilai yang mengandung huruf atau panjang di luar aturan |

## Skenario Registrasi

| ID | Skenario | Kondisi/Input | Expected result |
|---|---|---|---|
| AUTH-REG-001 | Registrasi mahasiswa berhasil | Body berisi email domain `student.telkomuniversity.ac.id`, password valid, `confirmPassword` sama, dan phone valid | HTTP `201`; `message` bernilai `Registration successful`; response memiliki `token` dan `data`; role user `MAHASISWA` |
| AUTH-REG-002 | Registrasi dosen berhasil | Body berisi email domain `telkomuniversity.ac.id` dan data password valid | HTTP `201`; role user `DOSEN` |
| AUTH-REG-003 | Registrasi tanpa phone | Field `phone` tidak dikirim | HTTP `201`; user tersimpan dengan phone `null` |
| AUTH-REG-004 | Registrasi dengan phone null | `phone: null` | HTTP `201` selama field lain valid |
| AUTH-REG-005 | Registrasi dengan whitespace pada email/phone | Email dan phone memiliki whitespace di awal/akhir | HTTP `201` bila nilai setelah trim valid; nilai tervalidasi digunakan oleh service |
| AUTH-REG-006 | Email tidak dikirim | Field `email` tidak ada | HTTP `400`; `message` `Validation error`; error menunjuk field `email` |
| AUTH-REG-007 | Email kosong | `email: ""` | HTTP `400`; validasi email gagal |
| AUTH-REG-008 | Format email tidak valid | `email: "bukan-email"` | HTTP `400`; validasi email gagal |
| AUTH-REG-009 | Domain email tidak diizinkan | Email menggunakan `example.com` atau domain lain | HTTP `400`; error menyatakan domain harus student Telkom University atau Telkom University |
| AUTH-REG-010 | Domain email berbeda kapitalisasi | Domain valid dikirim dengan huruf kapital | HTTP `201`; domain dikenali secara case-insensitive dan role tetap sesuai |
| AUTH-REG-011 | Password tidak dikirim | Field `password` tidak ada | HTTP `400`; error menunjuk field `password` |
| AUTH-REG-012 | Password kurang dari 8 karakter | Password terdiri dari 7 karakter | HTTP `400`; error menyatakan password minimal 8 karakter |
| AUTH-REG-013 | Confirm password tidak dikirim | Field `confirmPassword` tidak ada | HTTP `400`; error menunjuk field `confirmPassword` |
| AUTH-REG-014 | Confirm password berbeda | `password` dan `confirmPassword` memiliki nilai berbeda | HTTP `400`; error menunjuk `confirmPassword` |
| AUTH-REG-015 | Phone tidak valid | Phone mengandung huruf, simbol yang tidak diizinkan, atau panjang di luar 8-15 karakter | HTTP `400`; error menunjuk field `phone` |
| AUTH-REG-016 | Email sudah terdaftar | Email sama dengan user aktif yang sudah ada | HTTP `400`; message `Email sudah digunakan` |
| AUTH-REG-017 | Phone sudah terdaftar | Phone sama dengan user aktif yang sudah ada | HTTP `400`; message `Nomor telepon sudah digunakan` |
| AUTH-REG-018 | Password tidak dikirim ke response | Registrasi berhasil lalu periksa `data` | HTTP `201`; `data` tidak mengandung `password`, `createdAt`, `updatedAt`, atau `deletedAt` |
| AUTH-REG-019 | Isi JWT hasil registrasi | Decode token tanpa mengubah signature | Token memiliki claim `id`, `email`, dan `role`; masa berlaku sekitar 1 hari |
| AUTH-REG-020 | Rate limit registrasi | Kirim lebih dari 20 request auth dari IP yang sama dalam 15 menit | Request yang melampaui batas mendapat HTTP `429`, body `success: false`, dan pesan percobaan autentikasi terlalu banyak |

## Skenario Login

| ID | Skenario | Kondisi/Input | Expected result |
|---|---|---|---|
| AUTH-LOGIN-001 | Login mahasiswa berhasil | Email dan password yang benar | HTTP `200`; `message` `Login successful`; response memiliki `token` dan data user |
| AUTH-LOGIN-002 | Login dosen berhasil | Email dosen dan password yang benar | HTTP `200`; token claim `role` bernilai `DOSEN` |
| AUTH-LOGIN-003 | Email tidak terdaftar | Email valid tetapi tidak ditemukan | HTTP `401`; message `Email atau kata sandi salah` |
| AUTH-LOGIN-004 | Password salah | Email terdaftar dengan password yang salah | HTTP `401`; message tetap generik `Email atau kata sandi salah` |
| AUTH-LOGIN-005 | Email tidak dikirim | Field `email` tidak ada | HTTP `400`; `message` `Validation error` |
| AUTH-LOGIN-006 | Format email tidak valid | Email bukan format email | HTTP `400`; validasi email gagal |
| AUTH-LOGIN-007 | Password tidak dikirim | Field `password` tidak ada | HTTP `400`; `message` `Validation error` |
| AUTH-LOGIN-008 | Password kurang dari 8 karakter | Password terdiri dari 7 karakter | HTTP `400`; validasi panjang password gagal sebelum akses database |
| AUTH-LOGIN-009 | Email dengan whitespace | Email memiliki whitespace di awal/akhir | HTTP `200` bila kredensial setelah trim cocok |
| AUTH-LOGIN-010 | User soft-deleted mencoba login | User ditemukan tetapi `deletedAt` tidak null | HTTP `401`; message generik `Email atau kata sandi salah` |
| AUTH-LOGIN-011 | Password tidak dikirim ke response | Login berhasil lalu periksa `data` | HTTP `200`; response tidak mengekspos password maupun metadata audit yang dihapus mapper |
| AUTH-LOGIN-012 | Isi JWT hasil login | Decode token tanpa mengubah signature | Token memiliki claim `id`, `email`, `role`, dan masa berlaku sekitar 1 hari |
| AUTH-LOGIN-013 | Rate limit login | Kirim lebih dari 20 request auth dari IP yang sama dalam 15 menit | Request yang melampaui batas mendapat HTTP `429` dan response rate-limit sesuai konfigurasi |

## Skenario Token dan Profil Pengguna

| ID | Skenario | Kondisi/Input | Expected result |
|---|---|---|---|
| AUTH-USER-001 | Mengambil profil dengan token valid | `Authorization: Bearer <token valid>` | HTTP `200`; response berbentuk `{ data: ... }` dan data sesuai user pada token |
| AUTH-USER-002 | Tanpa header Authorization | Request tidak memiliki header `Authorization` | HTTP `401`; message `Token not found` |
| AUTH-USER-003 | Header Authorization tanpa token | `Authorization: Bearer` atau nilainya kosong | HTTP `401`; message `Token not found` |
| AUTH-USER-004 | Skema authorization bukan Bearer | Mengirim token tanpa prefix `Bearer` | HTTP `401`; token tidak dikenali |
| AUTH-USER-005 | Token malformed | Mengirim string yang bukan JWT | HTTP `403`; message `Invalid token` |
| AUTH-USER-006 | Token ditandatangani dengan secret salah | JWT valid secara format tetapi signature berbeda | HTTP `403`; message `Invalid token` |
| AUTH-USER-007 | Token kedaluwarsa | Menggunakan JWT yang sudah melewati expiry | HTTP `403`; message `Invalid token` |
| AUTH-USER-008 | Token dengan payload yang dimanipulasi | Mengubah claim `id`, `email`, atau `role` tanpa menandatangani ulang | HTTP `403`; message `Invalid token` |
| AUTH-USER-009 | User pada token tidak ditemukan | Token valid tetapi user sudah dihapus dari database | HTTP `404`; message `Pengguna tidak ditemukan` |
| AUTH-USER-010 | User pada token sudah soft-deleted | Token valid tetapi `deletedAt` user tidak null | HTTP `404`; message `Pengguna tidak ditemukan` |
| AUTH-USER-011 | Profil tidak mengekspos data sensitif | Profil berhasil diambil | HTTP `200`; payload tidak mengandung `password`, `createdAt`, `updatedAt`, atau `deletedAt` |
| AUTH-USER-012 | Token dari user lain digunakan | Token valid milik user A digunakan untuk request | HTTP `200`; hanya profil user A yang dikembalikan, bukan user dari parameter/body lain |

## Skenario Integrasi dan Keamanan Umum

| ID | Skenario | Kondisi/Input | Expected result |
|---|---|---|---|
| AUTH-INT-001 | Method endpoint tidak sesuai | Mengirim `GET` ke `/api/auth/login` atau `POST` ke `/api/auth/user` | Route tidak cocok dan mendapat HTTP `404` melalui handler resource tidak ditemukan |
| AUTH-INT-002 | Content-Type JSON | Mengirim body JSON dengan `Content-Type: application/json` | Body diparse dan diproses sesuai validasi endpoint |
| AUTH-INT-003 | Field tambahan pada register | Menambahkan field yang tidak didefinisikan schema | Request tetap mengikuti schema Zod dan field tambahan tidak digunakan dalam pembuatan user |
| AUTH-INT-004 | Username diturunkan dari email | Register dengan email valid | Username tersimpan sebagai bagian sebelum `@` dalam lowercase |
| AUTH-INT-005 | Password tersimpan ter-hash | Register lalu inspeksi record database test | Password tidak sama dengan plaintext dan dapat diverifikasi menggunakan bcrypt |
| AUTH-INT-006 | Counter rate limit lintas endpoint auth | Dari IP yang sama gabungkan request register dan login hingga melewati 20 request dalam window | Rate limiter menolak request berikutnya karena kedua route memakai `authRateLimiter` yang sama |
| AUTH-INT-007 | Error internal tidak membocorkan secret | Picu error database pada environment non-production dan periksa response | Tidak ada `JWT_SECRET`, password plaintext, atau credential database pada message/error response; untuk environment production `stack` bernilai `null` |

## Kriteria Kelulusan

- Semua expected HTTP status dan bentuk response sesuai tabel.
- Tidak ada response sukses yang mengandung password atau metadata soft-delete.
- Token hanya dapat digunakan jika signature, expiry, dan secret valid.
- User yang soft-deleted tidak dapat login dan tidak dapat mengambil profil.
- Validasi berlangsung sebelum operasi database pada input yang tidak valid.
- Rate limit mengembalikan HTTP `429` setelah batas 20 request per IP dalam window 15 menit.
- Test dijalankan pada database khusus test dan data hasil pengujian dibersihkan setelah suite selesai.
