# Workspace Guidelines & Rules

## API Design & Query Parameters Standard

### 1. No Parameter Aliases
- **Do NOT use parameter aliases or fallback variants** (e.g., do NOT support q alongside search, sort alongside sortBy, order alongside sortOrder, or study_program_id / prodi alongside studyProgramId).
- Supporting multiple aliases leads to inconsistent declarations, confusing API contracts, and clutter in the codebase.
- Always declare and use only the **single, canonical, explicit parameter name**.

### 2. Standard Query Parameter Conventions
- **Search**: Use search for global/keyword search.
- **Pagination**: Use page and limit (processed via getPaginationParams(req.query)).
- **Sorting**:
  - sortBy: Specify the target field name (e.g., createdAt, 
ame, 
im, ipk, 	glSidang, submittedAt).
  - sortOrder: sc or desc (default: desc for timestamps/dates, sc for alphabetical names).
- **Filters & Identifiers**: Use explicit **camelCase** matching the data model / relation (e.g., studyProgramId, acultyId, 	ahunAngkatan, isDraft, status, yudisiumPeriodId, yudisiumRegistrationPeriodId).
- **Boolean Filters**: Use explicit boolean parsing via parseBoolean(param) for fields like isDraft, erminatWirausaha, isActive.

### 3. API Documentation (Swagger / OpenAPI)
- Every query parameter supported in the controller must be documented in Swagger.
- Document only the canonical parameter name and its valid schema/enum values.
