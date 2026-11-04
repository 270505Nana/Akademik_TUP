import "dotenv/config";
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import prisma from "../src/config/prisma.js";
import { listPermohonanSktaQuerySchema } from "../src/schemas/permohonanSktaSchema.js";
import * as permohonanSktaService from "../src/services/permohonanSktaService.js";

const JWT_SECRET = process.env.JWT_SECRET || "akademiktup";

const adminToken = jwt.sign(
  { id: "admin-test-uuid", email: "admin@telkomuniversity.ac.id", role: "ADMIN" },
  JWT_SECRET,
  { expiresIn: "1h" }
);

describe("Permohonan SKTA - Query Parameters, Filtering, Sorting & Test Cases", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ===============================================================
  // SEKSI 1: Unit Testing Validasi Schema Query (Zod)
  // ===============================================================
  describe("Schema: listPermohonanSktaQuerySchema", () => {
    it("memiliki default sortBy: 'newest' jika query kosong", () => {
      const parsed = listPermohonanSktaQuerySchema.parse({});
      expect(parsed.sortBy).toBe("newest");
    });

    it("menerima sortBy: 'oldest' dan melakukan trim serta lowercase", () => {
      const parsed = listPermohonanSktaQuerySchema.parse({ sortBy: "  OLDEST  " });
      expect(parsed.sortBy).toBe("oldest");
    });

    it("menolak sortBy di luar 'newest' dan 'oldest'", () => {
      expect(() =>
        listPermohonanSktaQuerySchema.parse({ sortBy: "createdAt" })
      ).toThrowError(/sortBy harus salah satu dari: newest, oldest/);

      expect(() =>
        listPermohonanSktaQuerySchema.parse({ sortBy: "desc" })
      ).toThrowError(/sortBy harus salah satu dari: newest, oldest/);
    });

    it("menerima filter rentang startDate dan endDate yang valid (<= 6 bulan)", () => {
      const parsed = listPermohonanSktaQuerySchema.parse({
        startDate: "2026-01-01",
        endDate: "2026-06-01",
      });
      expect(parsed.startDate).toBe("2026-01-01");
      expect(parsed.endDate).toBe("2026-06-01");
    });

    it("menolak jika endDate lebih awal dari startDate", () => {
      expect(() =>
        listPermohonanSktaQuerySchema.parse({
          startDate: "2026-06-01",
          endDate: "2026-01-01",
        })
      ).toThrowError("endDate tidak boleh lebih awal dari startDate");
    });

    it("menolak jika rentang tanggal melebihi 6 bulan", () => {
      expect(() =>
        listPermohonanSktaQuerySchema.parse({
          startDate: "2026-01-01",
          endDate: "2026-08-01",
        })
      ).toThrowError("Rentang tanggal createdAt maksimal 6 bulan");
    });

    it("menolak startDate yang melebihi 6 bulan ke belakang jika tanpa endDate", () => {
      expect(() =>
        listPermohonanSktaQuerySchema.parse({
          startDate: "2020-01-01",
        })
      ).toThrowError("Rentang tanggal createdAt maksimal 6 bulan");
    });
  });

  // ===============================================================
  // SEKSI 2: Unit Testing Service getPermohonanSktas
  // ===============================================================
  describe("Service: getPermohonanSktas", () => {
    it("secara default memfilter rentang createdAt 6 bulan terakhir jika filter tanggal kosong", async () => {
      let capturedArgs = null;
      vi.spyOn(prisma.permohonanSkta, "count").mockResolvedValue(0);
      vi.spyOn(prisma.permohonanSkta, "findMany").mockImplementation((args) => {
        capturedArgs = args;
        return Promise.resolve([]);
      });

      const beforeExecution = new Date();
      beforeExecution.setMonth(beforeExecution.getMonth() - 6);

      await permohonanSktaService.getPermohonanSktas({});

      expect(capturedArgs).toBeDefined();
      expect(capturedArgs.where.createdAt).toBeDefined();
      expect(capturedArgs.where.createdAt.gte).toBeInstanceOf(Date);

      // Selisih antara gte dan kalkulasi sixMonthsAgo harus sangat kecil (< 5000 ms)
      const diffMs = Math.abs(
        capturedArgs.where.createdAt.gte.getTime() - beforeExecution.getTime()
      );
      expect(diffMs).toBeLessThan(5000);
    });

    it("menerapkan custom startDate dan endDate pada where.createdAt", async () => {
      let capturedArgs = null;
      vi.spyOn(prisma.permohonanSkta, "count").mockResolvedValue(0);
      vi.spyOn(prisma.permohonanSkta, "findMany").mockImplementation((args) => {
        capturedArgs = args;
        return Promise.resolve([]);
      });

      await permohonanSktaService.getPermohonanSktas({
        startDate: "2026-02-01",
        endDate: "2026-05-01",
      });

      const expectedEnd = new Date("2026-05-01");
      expectedEnd.setHours(23, 59, 59, 999);

      expect(capturedArgs).toBeDefined();
      expect(capturedArgs.where.createdAt.gte).toEqual(new Date("2026-02-01"));
      expect(capturedArgs.where.createdAt.lte).toEqual(expectedEnd);
    });

    it("mengurutkan createdAt: 'desc' saat sortBy 'newest' (atau default)", async () => {
      let capturedArgs = null;
      vi.spyOn(prisma.permohonanSkta, "count").mockResolvedValue(0);
      vi.spyOn(prisma.permohonanSkta, "findMany").mockImplementation((args) => {
        capturedArgs = args;
        return Promise.resolve([]);
      });

      await permohonanSktaService.getPermohonanSktas({ sortBy: "newest" });
      expect(capturedArgs.orderBy).toEqual({ createdAt: "desc" });

      await permohonanSktaService.getPermohonanSktas({});
      expect(capturedArgs.orderBy).toEqual({ createdAt: "desc" });
    });

    it("mengurutkan createdAt: 'asc' saat sortBy 'oldest'", async () => {
      let capturedArgs = null;
      vi.spyOn(prisma.permohonanSkta, "count").mockResolvedValue(0);
      vi.spyOn(prisma.permohonanSkta, "findMany").mockImplementation((args) => {
        capturedArgs = args;
        return Promise.resolve([]);
      });

      await permohonanSktaService.getPermohonanSktas({ sortBy: "oldest" });
      expect(capturedArgs.orderBy).toEqual({ createdAt: "asc" });
    });
  });

  // ===============================================================
  // SEKSI 3: Unit Testing Service getLatestPermohonanByMahasiswaId (Access Control)
  // ===============================================================
  describe("Service: getLatestPermohonanByMahasiswaId - Access Control", () => {
    const studentUser = { id: "user-mhs-1", role: "MAHASISWA" };
    const adminUser = { id: "user-admin-1", role: "ADMIN" };

    it("mengizinkan mahasiswa melihat permohonan dengan userId miliknya sendiri", async () => {
      vi.spyOn(prisma.mahasiswa, "findFirst").mockResolvedValue({ id: "mhs-1", userId: "user-mhs-1" });
      vi.spyOn(prisma.permohonanSkta, "findFirst").mockResolvedValue({ id: "skta-1", mahasiswaId: "mhs-1" });

      const result = await permohonanSktaService.getLatestPermohonanByMahasiswaId(
        "user-mhs-1",
        studentUser
      );
      expect(result).toBeDefined();
      expect(result.id).toBe("skta-1");
    });

    it("mengizinkan mahasiswa melihat permohonan dengan mahasiswaId (tabel Mahasiswa) miliknya sendiri", async () => {
      vi.spyOn(prisma.mahasiswa, "findFirst").mockResolvedValue({ id: "mhs-1", userId: "user-mhs-1" });
      vi.spyOn(prisma.permohonanSkta, "findFirst").mockResolvedValue({ id: "skta-1", mahasiswaId: "mhs-1" });

      const result = await permohonanSktaService.getLatestPermohonanByMahasiswaId(
        "mhs-1",
        studentUser
      );
      expect(result).toBeDefined();
      expect(result.id).toBe("skta-1");
    });

    it("menolak mahasiswa (403) jika mencoba melihat permohonan SKTA milik mahasiswa lain", async () => {
      vi.spyOn(prisma.mahasiswa, "findFirst").mockResolvedValue({ id: "mhs-1", userId: "user-mhs-1" });

      await expect(
        permohonanSktaService.getLatestPermohonanByMahasiswaId("other-mhs-uuid", studentUser)
      ).rejects.toThrowError(
        "Akses ditolak: Mahasiswa hanya dapat melihat permohonan SKTA milik sendiri"
      );
    });

    it("mengizinkan admin mengakses permohonan SKTA mahasiswa siapapun", async () => {
      vi.spyOn(prisma.mahasiswa, "findFirst").mockResolvedValue({ id: "other-mhs-uuid", userId: "other-user-uuid" });
      vi.spyOn(prisma.permohonanSkta, "findFirst").mockResolvedValue({ id: "skta-other", mahasiswaId: "other-mhs-uuid" });

      const result = await permohonanSktaService.getLatestPermohonanByMahasiswaId(
        "other-mhs-uuid",
        adminUser
      );
      expect(result).toBeDefined();
      expect(result.id).toBe("skta-other");
    });

  // ===============================================================
  // SEKSI 3: Integration Testing HTTP Endpoint (GET /api/permohonan-skta)
  // ===============================================================
  describe("HTTP Integration: GET /api/permohonan-skta", () => {
    it("menolak request tanpa token dengan status 401", async () => {
      const res = await request(app).get("/api/permohonan-skta");
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Token not found/i);
    });

    it("menolak request dengan token invalid dengan status 403", async () => {
      const res = await request(app)
        .get("/api/permohonan-skta")
        .set("Authorization", "Bearer invalid-token");
      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Invalid token/i);
    });

    it("mengembalikan status 200 dan data berpaginasi dengan default sortBy: newest dan filter 6 bulan", async () => {
      vi.spyOn(prisma.permohonanSkta, "count").mockResolvedValue(1);
      vi.spyOn(prisma.permohonanSkta, "findMany").mockResolvedValue([
        {
          id: "skta-1",
          isDraft: false,
          judulProposalIndonesia: "Sistem Informasi Akademik",
          judulProposalInggris: "Academic Information System",
          category: "Permohonan Baru",
          createdAt: new Date(),
          updatedAt: new Date(),
          mahasiswa: null,
          dosenPembimbing1: null,
          dosenPembimbing2: null,
          researchGroup: null,
          admin: null,
        },
      ]);

      const res = await request(app)
        .get("/api/permohonan-skta")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
    });

    it("mengembalikan status 200 ketika request dengan sortBy=oldest", async () => {
      vi.spyOn(prisma.permohonanSkta, "count").mockResolvedValue(0);
      vi.spyOn(prisma.permohonanSkta, "findMany").mockResolvedValue([]);

      const res = await request(app)
        .get("/api/permohonan-skta?sortBy=oldest")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it("mengembalikan status 400 Bad Request jika sortBy tidak valid", async () => {
      const res = await request(app)
        .get("/api/permohonan-skta?sortBy=invalidField")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toMatch(/sortBy harus salah satu dari: newest, oldest/i);
    });

    it("mengembalikan status 400 Bad Request jika endDate lebih awal dari startDate", async () => {
      const res = await request(app)
        .get("/api/permohonan-skta?startDate=2026-06-01&endDate=2026-01-01")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toMatch(/endDate tidak boleh lebih awal dari startDate/i);
    });

    it("mengembalikan status 400 Bad Request jika rentang tanggal melebihi 6 bulan", async () => {
      const res = await request(app)
        .get("/api/permohonan-skta?startDate=2025-01-01&endDate=2025-09-01")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toMatch(/Rentang tanggal createdAt maksimal 6 bulan/i);
    });

    it("mengembalikan status 200 OK jika rentang tanggal valid (<= 6 bulan)", async () => {
      vi.spyOn(prisma.permohonanSkta, "count").mockResolvedValue(0);
      vi.spyOn(prisma.permohonanSkta, "findMany").mockResolvedValue([]);

      const res = await request(app)
        .get("/api/permohonan-skta?startDate=2026-01-01&endDate=2026-04-01")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it("TC-SKTA-MHS-001: Mahasiswa berhasil mengakses permohonan SKTA miliknya sendiri via /mahasiswa", async () => {
      const mhsToken = jwt.sign(
        { id: "mhs-own-user-id", role: "MAHASISWA", email: "mhs@student.ac.id" },
        JWT_SECRET,
        { expiresIn: "1h" }
      );

      vi.spyOn(prisma.mahasiswa, "findFirst").mockResolvedValue({
        id: "mhs-own-id",
        userId: "mhs-own-user-id",
      });
      vi.spyOn(prisma.permohonanSkta, "findFirst").mockResolvedValue({
        id: "skta-own",
        mahasiswaId: "mhs-own-id",
        isDraft: false,
        judulProposalIndonesia: "Judul Skripsi Saya",
        judulProposalInggris: "My Thesis Title",
        createdAt: new Date(),
        updatedAt: new Date(),
        mahasiswa: null,
        dosenPembimbing1: null,
        dosenPembimbing2: null,
        researchGroup: null,
        admin: null,
      });

      const res = await request(app)
        .get("/api/permohonan-skta/mahasiswa")
        .set("Authorization", `Bearer ${mhsToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe("skta-own");
    });

    it("TC-SKTA-MHS-002: Mahasiswa berhasil mengakses permohonan SKTA dengan parameter ID miliknya sendiri", async () => {
      const mhsToken = jwt.sign(
        { id: "mhs-own-user-id", role: "MAHASISWA", email: "mhs@student.ac.id" },
        JWT_SECRET,
        { expiresIn: "1h" }
      );

      vi.spyOn(prisma.mahasiswa, "findFirst").mockResolvedValue({
        id: "mhs-own-id",
        userId: "mhs-own-user-id",
      });
      vi.spyOn(prisma.permohonanSkta, "findFirst").mockResolvedValue({
        id: "skta-own",
        mahasiswaId: "mhs-own-id",
        isDraft: false,
        judulProposalIndonesia: "Judul Skripsi Saya",
        judulProposalInggris: "My Thesis Title",
        createdAt: new Date(),
        updatedAt: new Date(),
        mahasiswa: null,
        dosenPembimbing1: null,
        dosenPembimbing2: null,
        researchGroup: null,
        admin: null,
      });

      const res = await request(app)
        .get("/api/permohonan-skta/mahasiswa/mhs-own-id")
        .set("Authorization", `Bearer ${mhsToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe("skta-own");
    });

    it("TC-SKTA-MHS-003: Mahasiswa ditolak (403 Forbidden) saat mengakses /mahasiswa/:mahasiswaId milik orang lain", async () => {
      const mhsToken = jwt.sign(
        { id: "mhs-own-user-id", role: "MAHASISWA", email: "mhs@student.ac.id" },
        JWT_SECRET,
        { expiresIn: "1h" }
      );

      vi.spyOn(prisma.mahasiswa, "findFirst").mockResolvedValue({
        id: "mhs-own-id",
        userId: "mhs-own-user-id",
      });

      const res = await request(app)
        .get("/api/permohonan-skta/mahasiswa/other-student-id")
        .set("Authorization", `Bearer ${mhsToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(
        /Akses ditolak: Mahasiswa hanya dapat melihat permohonan SKTA milik sendiri/i
      );
    });

    it("TC-SKTA-MHS-004: Admin dapat mengakses /mahasiswa/:mahasiswaId milik mahasiswa manapun", async () => {
      vi.spyOn(prisma.mahasiswa, "findFirst").mockResolvedValue({
        id: "any-student-id",
        userId: "any-user-id",
      });
      vi.spyOn(prisma.permohonanSkta, "findFirst").mockResolvedValue({
        id: "skta-any",
        mahasiswaId: "any-student-id",
        isDraft: false,
        judulProposalIndonesia: "Judul Skripsi",
        judulProposalInggris: "Thesis Title",
        createdAt: new Date(),
        updatedAt: new Date(),
        mahasiswa: null,
        dosenPembimbing1: null,
        dosenPembimbing2: null,
        researchGroup: null,
        admin: null,
      });

      const res = await request(app)
        .get("/api/permohonan-skta/mahasiswa/any-student-id")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe("skta-any");
    });
    });
  });
});
