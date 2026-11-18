import "dotenv/config";
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import prisma from "../src/config/prisma.js";
import * as storageService from "../src/services/storageService.js";

const JWT_SECRET = process.env.JWT_SECRET || "akademiktup";

describe("Berita Acara Endpoints", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockAdminUser = { id: "user-admin-1", role: "ADMIN" };
  const mockDosenP1User = { id: "user-dosen-p1", role: "DOSEN" };
  const mockDosenOtherUser = { id: "user-dosen-other", role: "DOSEN" };
  const mockMhsUser = { id: "user-mhs-1", role: "MAHASISWA" };
  const mockOtherMhsUser = { id: "user-mhs-other", role: "MAHASISWA" };

  const adminToken = jwt.sign(mockAdminUser, JWT_SECRET, { expiresIn: "1h" });
  const dosenP1Token = jwt.sign(mockDosenP1User, JWT_SECRET, { expiresIn: "1h" });
  const dosenOtherToken = jwt.sign(mockDosenOtherUser, JWT_SECRET, { expiresIn: "1h" });
  const mhsToken = jwt.sign(mockMhsUser, JWT_SECRET, { expiresIn: "1h" });
  const otherMhsToken = jwt.sign(mockOtherMhsUser, JWT_SECRET, { expiresIn: "1h" });

  const mockMahasiswa = {
    id: "mhs-1-id",
    userId: "user-mhs-1",
    name: "Ahmad Mahasiswa",
    nim: "1202200001",
    studyProgramId: "prodi-1-id",
    studyProgram: { id: "prodi-1-id", name: "S1 Sistem Informasi" },
    deletedAt: null,
  };

  const mockDosenP1 = {
    id: "dosen-p1-id",
    userId: "user-dosen-p1",
    name: "Dr. Pembimbing Satu, M.T.",
    nip: "197501012000121001",
    deletedAt: null,
  };

  const mockPeriod = {
    id: "period-pelaksanaan-1",
    name: "Pelaksanaan Sidang 2026/2027",
    period: "2026/2027",
    category: "pelaksanaan",
    isOpen: true,
    startDate: new Date("2026-11-01"),
    endDate: new Date("2026-11-30"),
    deletedAt: null,
  };

  const mockSidangRegistration = {
    id: "reg-sidang-1",
    mahasiswaId: "mhs-1-id",
    mahasiswa: mockMahasiswa,
    dosenPembimbing1Id: "dosen-p1-id",
    dosenPembimbing1: mockDosenP1,
    dosenPembimbing2Id: null,
    dosenPembimbing2: null,
    dosenPenguji1Id: null,
    dosenPenguji1: null,
    dosenPenguji2Id: null,
    dosenPenguji2: null,
    sidangPeriodId: "period-pelaksanaan-1",
    sidangPeriod: mockPeriod,
    ruanganSidang: { name: "Ruang 101" },
    judulTugasAkhirIndonesia: "Aplikasi Monitoring",
    judulTugasAkhirInggris: "Monitoring Application",
    tglSidang: new Date("2026-11-10"),
    deletedAt: null,
  };

  const mockBerkas = {
    id: "berkas-ba-1",
    name: "Berita_Acara_Sidang.pdf",
    category: "Berita Acara Sidang",
    filepath: "uploads/berkas-berita-acara/file.pdf",
    mahasiswaId: "mhs-1-id",
    deletedAt: null,
  };

  const mockBeritaAcara = {
    id: "ba-1-id",
    sidangRegistrationId: "reg-sidang-1",
    sidangRegistration: mockSidangRegistration,
    skemaPerhitunganNilai: [],
    nilaiAkhir: "85.5",
    keteranganLulus: "Lulus",
    nilaiHuruf: "A",
    justifikasi: null,
    isPublish: new Date("2026-11-15"),
    berkasId: "berkas-ba-1",
    berkas: mockBerkas,
    createdAt: new Date("2026-11-15"),
    updatedAt: new Date("2026-11-15"),
    deletedAt: null,
  };

  describe("GET /api/berita-acara", () => {
    it("Admin successfully gets list of berita acara", async () => {
      vi.spyOn(prisma.sidangPeriod, "findFirst").mockResolvedValue(mockPeriod);
      vi.spyOn(prisma.beritaAcaraSidangTugasAkhir, "count").mockResolvedValue(1);
      vi.spyOn(prisma.beritaAcaraSidangTugasAkhir, "findMany").mockResolvedValue([mockBeritaAcara]);

      const res = await request(app)
        .get("/api/berita-acara")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Daftar berita acara sidang berhasil diambil");
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe("ba-1-id");
      expect(res.body.data[0].nilaiHuruf).toBe("A");
      expect(res.body.data[0].isPublished).toBe(true);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.selectedPeriod).toBeDefined();
    });

    it("Non-admin receives 403 Forbidden", async () => {
      const res = await request(app)
        .get("/api/berita-acara")
        .set("Authorization", `Bearer ${mhsToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe("GET /api/berita-acara/:id", () => {
    it("Admin gets berita acara detail by id", async () => {
      vi.spyOn(prisma.beritaAcaraSidangTugasAkhir, "findFirst").mockResolvedValue(mockBeritaAcara);

      const res = await request(app)
        .get("/api/berita-acara/ba-1-id")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Data berita acara sidang berhasil diambil");
      expect(res.body.data.id).toBe("ba-1-id");
      expect(res.body.data.nilaiAkhir).toBe("85.5");
    });

    it("Returns 404 when berita acara not found", async () => {
      vi.spyOn(prisma.beritaAcaraSidangTugasAkhir, "findFirst").mockResolvedValue(null);

      const res = await request(app)
        .get("/api/berita-acara/ba-unknown")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/berita-acara/me", () => {
    it("Mahasiswa gets their latest published berita acara", async () => {
      vi.spyOn(prisma.mahasiswa, "findUnique").mockResolvedValue(mockMahasiswa);
      vi.spyOn(prisma.beritaAcaraSidangTugasAkhir, "findFirst").mockResolvedValue(mockBeritaAcara);

      const res = await request(app)
        .get("/api/berita-acara/me")
        .set("Authorization", `Bearer ${mhsToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Data berita acara sidang mahasiswa berhasil diambil");
      expect(res.body.data.id).toBe("ba-1-id");
      expect(res.body.data.isPublished).toBe(true);
    });

    it("Mahasiswa receives null data when berita acara not published or not found", async () => {
      vi.spyOn(prisma.mahasiswa, "findUnique").mockResolvedValue(mockMahasiswa);
      vi.spyOn(prisma.beritaAcaraSidangTugasAkhir, "findFirst").mockResolvedValue(null);

      const res = await request(app)
        .get("/api/berita-acara/me")
        .set("Authorization", `Bearer ${mhsToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeNull();
      expect(res.body.message).toBe("Berita acara sidang belum diterbitkan atau belum tersedia");
    });
  });

  describe("PUT /api/berita-acara/:id", () => {
    it("Admin updates berita acara details", async () => {
      vi.spyOn(prisma.beritaAcaraSidangTugasAkhir, "findFirst").mockResolvedValue(mockBeritaAcara);
      vi.spyOn(prisma.beritaAcaraSidangTugasAkhir, "update").mockResolvedValue({
        ...mockBeritaAcara,
        nilaiAkhir: "90",
        nilaiHuruf: "A",
      });

      const res = await request(app)
        .put("/api/berita-acara/ba-1-id")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          nilaiAkhir: 90,
          keteranganLulus: "Lulus",
          nilaiHuruf: "A",
          justifikasi: "Nilai revisi terbaik",
          isPublish: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Berita acara sidang berhasil diperbarui");
    });

    it("Fails validation when required fields are missing", async () => {
      const res = await request(app)
        .put("/api/berita-acara/ba-1-id")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          nilaiAkhir: 90,
          // keteranganLulus & nilaiHuruf missing
        });

      expect(res.status).toBe(400);
    });
  });

  describe("PUT /api/berita-acara/:id/berkas", () => {
    it("Admin uploads berkas file successfully", async () => {
      vi.spyOn(prisma.beritaAcaraSidangTugasAkhir, "findFirst").mockResolvedValue(mockBeritaAcara);
      vi.spyOn(prisma.berkasMahasiswa, "findUnique").mockResolvedValue(mockBerkas);
      vi.spyOn(storageService, "deleteFile").mockResolvedValue();
      vi.spyOn(prisma.berkasMahasiswa, "delete").mockResolvedValue(mockBerkas);
      vi.spyOn(storageService, "uploadFile").mockResolvedValue({
        filepath: "uploads/berkas-berita-acara/new_file.pdf",
        filename: "new_file.pdf",
      });
      vi.spyOn(prisma.berkasMahasiswa, "create").mockResolvedValue({
        ...mockBerkas,
        id: "new-berkas-id",
      });
      vi.spyOn(prisma.beritaAcaraSidangTugasAkhir, "update").mockResolvedValue(mockBeritaAcara);

      const res = await request(app)
        .put("/api/berita-acara/ba-1-id/berkas")
        .set("Authorization", `Bearer ${adminToken}`)
        .attach("file", Buffer.from("%PDF-mock-content"), "berita_acara.pdf");

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Berkas berita acara sidang berhasil diunggah");
    });
  });

  describe("DELETE /api/berita-acara/:id/berkas", () => {
    it("Admin deletes berkas file successfully", async () => {
      vi.spyOn(prisma.beritaAcaraSidangTugasAkhir, "findFirst").mockResolvedValue(mockBeritaAcara);
      vi.spyOn(prisma.berkasMahasiswa, "findUnique").mockResolvedValue(mockBerkas);
      vi.spyOn(storageService, "deleteFile").mockResolvedValue();
      vi.spyOn(prisma.beritaAcaraSidangTugasAkhir, "update").mockResolvedValue({
        ...mockBeritaAcara,
        berkasId: null,
      });
      vi.spyOn(prisma.berkasMahasiswa, "delete").mockResolvedValue(mockBerkas);

      const res = await request(app)
        .delete("/api/berita-acara/ba-1-id/berkas")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Berkas berita acara sidang berhasil dihapus");
    });
  });

  describe("GET /api/berita-acara/:id/berkas/download", () => {
    it("Admin can download berkas", async () => {
      vi.spyOn(prisma.beritaAcaraSidangTugasAkhir, "findFirst").mockResolvedValue(mockBeritaAcara);
      vi.spyOn(storageService, "serveDownload").mockImplementation((res) => {
        return res.status(200).send("PDF content");
      });

      const res = await request(app)
        .get("/api/berita-acara/ba-1-id/berkas/download")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it("Mahasiswa owner can download when published", async () => {
      vi.spyOn(prisma.beritaAcaraSidangTugasAkhir, "findFirst").mockResolvedValue(mockBeritaAcara);
      vi.spyOn(storageService, "serveDownload").mockImplementation((res) => {
        return res.status(200).send("PDF content");
      });

      const res = await request(app)
        .get("/api/berita-acara/ba-1-id/berkas/download")
        .set("Authorization", `Bearer ${mhsToken}`);

      expect(res.status).toBe(200);
    });

    it("Other mahasiswa cannot download (403)", async () => {
      vi.spyOn(prisma.beritaAcaraSidangTugasAkhir, "findFirst").mockResolvedValue(mockBeritaAcara);

      const res = await request(app)
        .get("/api/berita-acara/ba-1-id/berkas/download")
        .set("Authorization", `Bearer ${otherMhsToken}`);

      expect(res.status).toBe(403);
    });

    it("Related Dosen can download when published", async () => {
      vi.spyOn(prisma.beritaAcaraSidangTugasAkhir, "findFirst").mockResolvedValue(mockBeritaAcara);
      vi.spyOn(storageService, "serveDownload").mockImplementation((res) => {
        return res.status(200).send("PDF content");
      });

      const res = await request(app)
        .get("/api/berita-acara/ba-1-id/berkas/download")
        .set("Authorization", `Bearer ${dosenP1Token}`);

      expect(res.status).toBe(200);
    });

    it("Unrelated Dosen cannot download (403)", async () => {
      vi.spyOn(prisma.beritaAcaraSidangTugasAkhir, "findFirst").mockResolvedValue(mockBeritaAcara);

      const res = await request(app)
        .get("/api/berita-acara/ba-1-id/berkas/download")
        .set("Authorization", `Bearer ${dosenOtherToken}`);

      expect(res.status).toBe(403);
    });

    it("Mahasiswa cannot download when unpublished (403)", async () => {
      vi.spyOn(prisma.beritaAcaraSidangTugasAkhir, "findFirst").mockResolvedValue({
        ...mockBeritaAcara,
        isPublish: null,
      });

      const res = await request(app)
        .get("/api/berita-acara/ba-1-id/berkas/download")
        .set("Authorization", `Bearer ${mhsToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe("PATCH /api/berita-acara/:id/publish", () => {
    it("Admin toggles publish to true", async () => {
      vi.spyOn(prisma.beritaAcaraSidangTugasAkhir, "findFirst").mockResolvedValue({
        ...mockBeritaAcara,
        isPublish: null,
      });
      vi.spyOn(prisma.beritaAcaraSidangTugasAkhir, "update").mockResolvedValue({
        ...mockBeritaAcara,
        isPublish: new Date(),
      });

      const res = await request(app)
        .patch("/api/berita-acara/ba-1-id/publish")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ isPublished: true });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Berita acara sidang berhasil dipublikasikan");
    });

    it("Admin toggles publish to false", async () => {
      vi.spyOn(prisma.beritaAcaraSidangTugasAkhir, "findFirst").mockResolvedValue(mockBeritaAcara);
      vi.spyOn(prisma.beritaAcaraSidangTugasAkhir, "update").mockResolvedValue({
        ...mockBeritaAcara,
        isPublish: null,
      });

      const res = await request(app)
        .patch("/api/berita-acara/ba-1-id/publish")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ isPublished: false });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Publikasi berita acara sidang berhasil dibatalkan");
    });
  });
});
