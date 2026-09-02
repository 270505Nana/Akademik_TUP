# SIMTA API Service

Backend REST API untuk Sistem Informasi Manajemen Tugas Akhir (SIMTA) dibangun menggunakan **Express.js (ESModules)**, **Prisma ORM**, dan database **PostgreSQL**.

---

## 🛠️ How To: Setup & Menjalankan Service

### 1. Instalasi & Setup Environment

```sh
# 1. Install dependencies
npm install

# 2. Buat file environment dari template
cp .env.example .env
```

Pastikan variabel environment di file `.env` telah disesuaikan:
```env
PORT=3000
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
JWT_SECRET="your-jwt-secret"
STORAGE_DRIVER="local" # atau "s3"
```

### 2. Sinkronisasi Database & Generate Prisma Client

```sh
# Push schema ke database PostgreSQL
npm run prisma:db-push

# Generate client Prisma terbaru
npm run prisma:generate
```

### 3. Menjalankan Server

```sh
# Mode Development (auto-reload via nodemon)
npm run dev

# Mode Production
npm start
```

### 4. Akses Dokumentasi Swagger
Buka browser dan akses:
`http://localhost:3000/api-docs`

---

## 📐 Developer Rules & Coding Standards

Semua pengembang backend wajib mengikuti standar arsitektur dan penamaan berikut:

### 1. Struktur Folder & Tanggung Jawab (Separation of Concerns)
- `src/config/`: Konfigurasi singleton (koneksi Prisma, S3 client, swagger options).
- `src/controllers/`: Handler logika bisnis endpoint (dibungkus dengan `express-async-handler`).
- `src/middlewares/`: Otentikasi (`verifyToken`), otorisasi (`isAdmin`, `authorize`), penanganan error, dan middleware upload `multer`.
- `src/routes/api/`: Definisi endpoint express dan dokumentasi OpenAPI / Swagger via JSDoc.
- `src/services/`: Service eksternal atau helper bisnis (contoh: `storageService.js` untuk manajemen berkas lokal/S3).
- `src/utils/`: Helper utilitas (pagination, validation helper, formatting response).

### 2. Standar Penamaan & Format Parameter
- **Route Path**: Lowercase kebab-case atau plural (contoh: `/api/permohonan-skta`, `/api/study-programs`, `/api/templates`).
- **Request Body & Response Keys**: Wajib format **camelCase** (contoh: `isPublish`, `isRequired`, `queue`, `studyProgramId`).
- **Query Parameter Sorting (`sortBy`)**:
  - Wajib format **camelCase** dengan format `<field><Direction>` atau keyword waktu standar:
    - Pengurutan nama: `nameAsc`, `nameDesc`
    - Pengurutan relasi: `researchGroupAsc`, `researchGroupDesc`, `facultyAsc`, `facultyDesc`
    - Pengurutan status: `activeInactive`, `inactiveActive`
    - Pengurutan waktu: `newest`, `oldest`
  - *Catatan Template Berkas*: Default sort adalah `category` & `queue` ascending (`[{ category: "asc" }, { queue: "asc" }]`).

### 3. Standar Pagination & Response
Semua endpoint `GET` (list data) harus menggunakan helper `getPaginationParams(req.query)` dan `formatPaginationResponse(data, total, paginationParams)`.

Format response standar:
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

### 4. Standar Validasi & Penanganan Error
- Validasi input dilakukan sebelum pemanggilan database.
- Jika ada kesalahan input, gunakan helper `sendValidationError(res, errors, req)` (HTTP 422).
```javascript
const errors = [];
if (isNil(name)) errors.push({ field: "name", message: "name wajib diisi" });
if (errors.length > 0) return sendValidationError(res, errors, req);
```

### 5. Aturan Perubahan Schema Prisma
Setiap kali menambahkan atau mengubah tabel/kolom pada `prisma/schema.prisma`:
1. Definisikan mapping nama tabel dan kolom snake_case ke database:
   ```prisma
   model ExampleModel {
     id        String   @id @default(uuid())
     createdAt DateTime @default(now()) @map("created_at")
     isPublish Boolean  @default(false) @map("is_publish")

     @@map("example_model")
   }
   ```
2. Jalankan:
   ```sh
   npm run prisma:db-push
   npm run prisma:generate
   ```
3. Update Swagger documentation dan serializer controller yang relevan.

### 6. Dokumentasi API (Swagger JSDoc)
Setiap route wajib memiliki anotasi Swagger `@swagger` yang mencakup:
- Tag kelompok API
- Security requirement (`bearerAuth: []` jika butuh token)
- Parameter query (`page`, `limit`, `search`, `sortBy`, filter spesifik)
- Request body schema (multipart/form-data atau application/json)
- Response codes (200, 401, 403, 404, 422, 500)

---

## 📚 Referensi & Bantuan

- [Prisma ORM Docs](https://www.prisma.io/docs)
- [Express JS Guide](https://expressjs.com/)
- [Swagger OpenAPI Specification](https://swagger.io/specification/)

