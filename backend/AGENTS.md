# Workspace Guidelines & Rules

## API Design & Query Parameters Standard

### 1. No Parameter Aliases

- **Do NOT use parameter aliases or fallback variants** (e.g., do NOT support q alongside search, sort alongside sortBy and sortOrder, or study_program_id / prodi alongside studyProgramId).
- Supporting multiple aliases leads to inconsistent declarations, confusing API contracts, and clutter in the codebase.
- Always declare and use only the **single, canonical, explicit parameter name**.

### 2. Standard Query Parameter Conventions

- **Search**: Use search for global/keyword search.
- **Pagination**: Use page and limit (processed via getPaginationParams(req.query)).
- **Sorting**:
  - sort: newest or oldest (default: newest).
- **Filters & Identifiers**: Use explicit **camelCase** matching the data model / relation (e.g., studyProgramId, acultyId, ahunAngkatan, isDraft, status, yudisiumPeriodId, yudisiumRegistrationPeriodId).
- **Boolean Filters**: Use explicit boolean parsing via parseBoolean(param) for fields like isDraft, erminatWirausaha, isActive.

### 3. API Documentation (Swagger / OpenAPI)

- Every query parameter supported in the controller must be documented in Swagger.
- Document only the canonical parameter name and its valid schema/enum values.

## Aturan Baru November 2026

- Kalau bisa tidak perlu membuat mapper, jika sumber data hanya dari 1 model maka response bisa langsung dibentuk di controller atau service.
- Gunakan Zod sebagai input validator.
- Helper jangan ditumpuk di Service. Helper bisa disimpan di `src/utils/` dengan nama file mengikuti nama route atau nama khusus jika helper tidak berkaitan dengan flow bisnis (seperti pagination).
- Dokumentasi swagger sekarang ada di `src/docs/`.
- Hindari kode yang redundant.
- Pastikan contoh response yang ada di dokumentasi swagger sama dengan response yang dikembalikan.
- Gunakan `prisma db push` untuk sinkronisasi schema ke database. **Hati-hati**: selalu review perubahan sebelum konfirmasi jika ada peringatan truncate/drop table.
