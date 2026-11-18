import "dotenv/config";
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import prisma from "../src/config/prisma.js";
import * as storageService from "../src/services/storageService.js";

const JWT_SECRET = process.env.JWT_SECRET || "akademiktup";

describe("Revisi Sidang Endpoints", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockAdminUser = { id: "user-admin-1", role: "ADMIN" };
  const mockDosenP1User = { id: "user-dosen-p1", role: "DOSEN" };
  const mockDosenP2User = { id: "user-dosen-p2", role: "DOSEN" };
  const mockMhsUser = { id: "user-mhs-1", role: "MAHASISWA" };
  const mockOtherMhsUser = { id: "user-mhs-other", role: "MAHASISWA" };

  const adminToken = jwt.sign(mockAdminUser, JWT_SECRET, { expiresIn: "1h" });
  const dosenP1Token = jwt.sign(mockDosenP1User, JWT_SECRET, { expiresIn: "1h" });
  const dosenP2Token = jwt.sign(mockDosenP2User, JWT_SECRET, { expiresIn: "1h" });
  const mhsToken = jwt.sign(mockMhsUser, JWT_SECRET, { expiresIn: "1h" });
  const otherMhsToken = jwt.sign(mockOtherMhsUser, JWT_SECRET, { expiresIn: "1h" });

  const mockDosenP1 = {
    id: "dosen-p1-id",
    userId: "user-dosen-p1",
    name: "Dr. Pembimbing Satu, M.T.",
    kodeDosen: "DPS",
    deletedAt: null,
  };

  const mockDosenP2 = {
    id: "dosen-p2-id",
    userId: "user-dosen-p2",
    name: "Dr. Pembimbing Dua, M.Kom.",
    kodeDosen: "DPD",
    deletedAt: null,
  };

  const mockMahasiswa = {
    id: "mhs-1-id",
    userId: "user-mhs-1",
    name: "Ahmad Mahasiswa",
    nim: "1202200001",
    studyProgramId: "prodi-1-id",
    studyProgram: { id: "prodi-1-id", name: "S1 Sistem Informasi" },
    deletedAt: null,
  };

  const mockOtherMahasiswa = {
    id: "mhs-other-id",
    userId: "user-mhs-other",
    name: "Other Mahasiswa",
    nim: "1202209999",
    studyProgramId: "prodi-1-id",
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
    dosenPembimbing2Id: "dosen-p2-id",
    dosenPembimbing2: mockDosenP2,
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
    beritaAcaraSidangTugasAkhirs: [],
    penilaianTugasAkhir: [
      {
        id: "pen-1",
        dosenPenilaiId: "dosen-p1-id",
        bobotPenilai: 0.5,
        nilai: [
          {
            cloProdiId: "clo-1",
            cloName: "CLO 1",
            asesmen: [{ jenisAsesmenId: "ja-1", bobot: 1.0, nilai: 85 }],
          },
        ],
      },
    ],
  };

  const mockRevisi = {
    id: "revisi-1",
    sidangRegistrationId: "reg-sidang-1",
    sidangRegistration: mockSidangRegistration,
    deadlineRevisi: new Date("2026-11-30"),
    tglSetujuiUntukRevisi: new Date("2026-11-10"),
    setujuiUntukRevisiId: "dosen-p1-id",
    setujuiUntukRevisi: mockDosenP1,
    tglSubmitRevisi: null,
    berkasRevisiId: null,
    berkasRevisi: null,
    tglSetujuiHasilRevisi: null,
    setujuiHasilRevisiId: null,
    setujuiHasilRevisi: null,
    createdAt: new Date("2026-11-10"),
    updatedAt: new Date("2026-11-10"),
    deletedAt: null,
  };

  describe("GET /api/revisi-sidang", () => {
    it("Admin berhasil mengambil daftar revisi sidang dengan paginasi", async () => {
      vi.spyOn(prisma.sidangPeriod, "findFirst").mockResolvedValue(mockPeriod);
      vi.spyOn(prisma.revisiTugasAkhir, "count").mockResolvedValue(1);
      vi.spyOn(prisma.revisiTugasAkhir, "findMany").mockResolvedValue([mockRevisi]);

      const res = await request(app)
        .get("/api/revisi-sidang?sort=oldest")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Daftar revisi sidang berhasil diambil");
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe("revisi-1");
      expect(res.body.data[0].hasBerkas).toBe(false);
      expect(res.body.data[0].isSubmitted).toBe(false);
      expect(res.body.data[0].isApproved).toBe(false);
      expect(res.body.data[0].mahasiswa).toEqual({
        id: "mhs-1-id",
        name: "Ahmad Mahasiswa",
        nim: "1202200001",
        studyProgram: "S1 Sistem Informasi",
      });
      expect(res.body.data[0].sidang).toEqual({
        id: "reg-sidang-1",
        judulTugasAkhir: "Aplikasi Monitoring",
        tglSidang: expect.any(String),
        ruangan: "Ruang 101",
      });
      expect(res.body.pagination).toBeDefined();
      expect(res.body.selectedPeriod).toBeDefined();
    });

    it("Dosen Pembimbing 1 berhasil mengambil revisi sidang bimbingannya", async () => {
      vi.spyOn(prisma.dosen, "findUnique").mockResolvedValue(mockDosenP1);
      vi.spyOn(prisma.sidangPeriod, "findFirst").mockResolvedValue(mockPeriod);
      vi.spyOn(prisma.revisiTugasAkhir, "count").mockResolvedValue(1);
      vi.spyOn(prisma.revisiTugasAkhir, "findMany").mockResolvedValue([mockRevisi]);

      const res = await request(app)
        .get("/api/revisi-sidang")
        .set("Authorization", `Bearer ${dosenP1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    it("Mahasiswa dilarang mengakses GET /api/revisi-sidang (403)", async () => {
      const res = await request(app)
        .get("/api/revisi-sidang")
        .set("Authorization", `Bearer ${mhsToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe("GET /api/revisi-sidang/me", () => {
    it("Mahasiswa berhasil mengambil latest revisi sidang dia", async () => {
      vi.spyOn(prisma.mahasiswa, "findUnique").mockResolvedValue(mockMahasiswa);
      vi.spyOn(prisma.revisiTugasAkhir, "findFirst").mockResolvedValue(mockRevisi);

      const res = await request(app)
        .get("/api/revisi-sidang/me")
        .set("Authorization", `Bearer ${mhsToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBe("revisi-1");
      expect(res.body.data.isSubmitted).toBe(false);
      expect(res.body.data.isApproved).toBe(false);
      expect(res.body.data.hasBerkas).toBe(false);
      expect(res.body.data.berkasRevisi).toBeNull();
      expect(res.body.data.mahasiswa).toEqual({
        id: "mhs-1-id",
        name: "Ahmad Mahasiswa",
        nim: "1202200001",
        studyProgram: "S1 Sistem Informasi",
      });
      expect(res.body.data.sidang).toEqual({
        id: "reg-sidang-1",
        judulTugasAkhir: "Aplikasi Monitoring",
        tglSidang: expect.any(String),
        ruangan: "Ruang 101",
      });
    });

    it("Mahasiswa mengembalikan data: null jika belum ada revisi sidang", async () => {
      vi.spyOn(prisma.mahasiswa, "findUnique").mockResolvedValue(mockMahasiswa);
      vi.spyOn(prisma.revisiTugasAkhir, "findFirst").mockResolvedValue(null);

      const res = await request(app)
        .get("/api/revisi-sidang/me")
        .set("Authorization", `Bearer ${mhsToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeNull();
    });
  });

  describe("PUT /api/revisi-sidang/:id/submit", () => {
    it("Mahasiswa berhasil submit revisi tanpa berkas file (opsional)", async () => {
      vi.spyOn(prisma.mahasiswa, "findUnique").mockResolvedValue(mockMahasiswa);
      vi.spyOn(prisma.revisiTugasAkhir, "findFirst").mockResolvedValue(mockRevisi);
      vi.spyOn(prisma.revisiTugasAkhir, "update").mockResolvedValue({
        ...mockRevisi,
        tglSubmitRevisi: new Date(),
      });

      const res = await request(app)
        .put("/api/revisi-sidang/revisi-1/submit")
        .set("Authorization", `Bearer ${mhsToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Revisi sidang berhasil disubmit");
    });

    it("Mahasiswa berhasil submit revisi dengan mengunggah berkas file", async () => {
      vi.spyOn(prisma.mahasiswa, "findUnique").mockResolvedValue(mockMahasiswa);
      vi.spyOn(prisma.revisiTugasAkhir, "findFirst").mockResolvedValue(mockRevisi);
      vi.spyOn(storageService, "uploadFile").mockResolvedValue({
        filepath: "uploads/berkas-revisi/test.pdf",
        filename: "test.pdf",
        key: "uploads/berkas-revisi/test.pdf",
      });
      vi.spyOn(prisma.berkasMahasiswa, "create").mockResolvedValue({
        id: "berkas-1",
        name: "revisi_laporan.pdf",
        category: "Revisi Sidang",
        filepath: "uploads/berkas-revisi/test.pdf",
        mahasiswaId: "mhs-1-id",
      });
      vi.spyOn(prisma.revisiTugasAkhir, "update").mockResolvedValue({
        ...mockRevisi,
        tglSubmitRevisi: new Date(),
        berkasRevisiId: "berkas-1",
        berkasRevisi: {
          id: "berkas-1",
          name: "revisi_laporan.pdf",
          category: "Revisi Sidang",
          filepath: "uploads/berkas-revisi/test.pdf",
        },
      });

      const res = await request(app)
        .put("/api/revisi-sidang/revisi-1/submit")
        .set("Authorization", `Bearer ${mhsToken}`)
        .attach("berkasRevisi", Buffer.from("dummy pdf content"), "revisi_laporan.pdf");

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Revisi sidang berhasil disubmit");
    });

    it("Gagal submit jika sidang belum ditutup oleh Dospem 1 (400)", async () => {
      vi.spyOn(prisma.mahasiswa, "findUnique").mockResolvedValue(mockMahasiswa);
      vi.spyOn(prisma.revisiTugasAkhir, "findFirst").mockResolvedValue({
        ...mockRevisi,
        tglSetujuiUntukRevisi: null,
      });

      const res = await request(app)
        .put("/api/revisi-sidang/revisi-1/submit")
        .set("Authorization", `Bearer ${mhsToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Sidang belum ditutup oleh Dosen Pembimbing 1");
    });

    it("Gagal submit jika revisi sudah di-acc oleh Dosen (400)", async () => {
      vi.spyOn(prisma.mahasiswa, "findUnique").mockResolvedValue(mockMahasiswa);
      vi.spyOn(prisma.revisiTugasAkhir, "findFirst").mockResolvedValue({
        ...mockRevisi,
        tglSetujuiHasilRevisi: new Date(),
      });

      const res = await request(app)
        .put("/api/revisi-sidang/revisi-1/submit")
        .set("Authorization", `Bearer ${mhsToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe(
        "Revisi sidang sudah disetujui, data revisi tidak dapat diubah lagi"
      );
    });

    it("Gagal submit jika bukan mahasiswa pemilik sidang (403)", async () => {
      vi.spyOn(prisma.mahasiswa, "findUnique").mockResolvedValue(mockOtherMahasiswa);
      vi.spyOn(prisma.revisiTugasAkhir, "findFirst").mockResolvedValue(mockRevisi);

      const res = await request(app)
        .put("/api/revisi-sidang/revisi-1/submit")
        .set("Authorization", `Bearer ${otherMhsToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toBe("Anda tidak memiliki hak akses untuk merevisi sidang ini");
    });
  });

  describe("DELETE /api/revisi-sidang/:id/berkas", () => {
    it("Mahasiswa berhasil menghapus berkas revisi", async () => {
      const mockRevisiWithBerkas = {
        ...mockRevisi,
        berkasRevisiId: "berkas-1",
        berkasRevisi: {
          id: "berkas-1",
          filepath: "uploads/berkas-revisi/test.pdf",
        },
      };

      vi.spyOn(prisma.mahasiswa, "findUnique").mockResolvedValue(mockMahasiswa);
      vi.spyOn(prisma.revisiTugasAkhir, "findFirst").mockResolvedValue(mockRevisiWithBerkas);
      vi.spyOn(prisma.berkasMahasiswa, "findUnique").mockResolvedValue({
        id: "berkas-1",
        filepath: "uploads/berkas-revisi/test.pdf",
      });
      const deleteFileSpy = vi.spyOn(storageService, "deleteFile").mockResolvedValue();
      const deleteBerkasSpy = vi.spyOn(prisma.berkasMahasiswa, "delete").mockResolvedValue();
      const updateRevisiSpy = vi.spyOn(prisma.revisiTugasAkhir, "update").mockResolvedValue({
        ...mockRevisi,
        berkasRevisiId: null,
      });

      const res = await request(app)
        .delete("/api/revisi-sidang/revisi-1/berkas")
        .set("Authorization", `Bearer ${mhsToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Berkas revisi sidang berhasil dihapus");
      expect(deleteFileSpy).toHaveBeenCalledWith("uploads/berkas-revisi/test.pdf");
      expect(deleteBerkasSpy).toHaveBeenCalledWith({ where: { id: "berkas-1" } });
      expect(updateRevisiSpy).toHaveBeenCalledWith({
        where: { id: "revisi-1" },
        data: { berkasRevisiId: null },
      });
    });

    it("Gagal menghapus berkas jika revisi sudah di-acc (400)", async () => {
      vi.spyOn(prisma.mahasiswa, "findUnique").mockResolvedValue(mockMahasiswa);
      vi.spyOn(prisma.revisiTugasAkhir, "findFirst").mockResolvedValue({
        ...mockRevisi,
        berkasRevisiId: "berkas-1",
        tglSetujuiHasilRevisi: new Date(),
      });

      const res = await request(app)
        .delete("/api/revisi-sidang/revisi-1/berkas")
        .set("Authorization", `Bearer ${mhsToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe(
        "Revisi sidang sudah disetujui, berkas revisi tidak dapat dihapus"
      );
    });

    it("Gagal menghapus jika tidak ada berkas yang diunggah (400)", async () => {
      vi.spyOn(prisma.mahasiswa, "findUnique").mockResolvedValue(mockMahasiswa);
      vi.spyOn(prisma.revisiTugasAkhir, "findFirst").mockResolvedValue({
        ...mockRevisi,
        berkasRevisiId: null,
      });

      const res = await request(app)
        .delete("/api/revisi-sidang/revisi-1/berkas")
        .set("Authorization", `Bearer ${mhsToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Tidak ada berkas revisi yang diunggah untuk sidang ini");
    });
  });

  describe("PUT /api/revisi-sidang/:id/verify", () => {
    it("Dosen Pembimbing 1 berhasil memverifikasi hasil revisi dan menerbitkan Berita Acara", async () => {
      const submittedRevisi = {
        ...mockRevisi,
        tglSubmitRevisi: new Date("2026-11-18"),
      };

      vi.spyOn(prisma.dosen, "findUnique").mockResolvedValue(mockDosenP1);
      vi.spyOn(prisma.revisiTugasAkhir, "findFirst").mockResolvedValue(submittedRevisi);
      vi.spyOn(prisma.cloProdi, "findMany").mockResolvedValue([]);
      vi.spyOn(prisma.skemaPenilaiProdi, "findMany").mockResolvedValue([]);
      vi.spyOn(prisma.skemaPerhitunganNilaiBeritaAcaraTugasAkhirProdi, "findMany").mockResolvedValue([]);

      const updateSidangRegSpy = vi.fn().mockResolvedValue({
        ...mockSidangRegistration,
        status: "Sidang Selesai",
      });

      vi.spyOn(prisma, "$transaction").mockImplementation(async (callback) => {
        const tx = {
          sidangRegistration: {
            update: updateSidangRegSpy,
          },
          revisiTugasAkhir: {
            update: vi.fn().mockResolvedValue({
              ...submittedRevisi,
              tglSetujuiHasilRevisi: new Date(),
              setujuiHasilRevisiId: "dosen-p1-id",
              setujuiHasilRevisi: mockDosenP1,
              sidangRegistration: {
                ...mockSidangRegistration,
                status: "Sidang Selesai",
              },
            }),
          },
          beritaAcaraSidangTugasAkhir: {
            findFirst: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue({
              id: "ba-1",
              sidangRegistrationId: "reg-sidang-1",
              skemaPerhitunganNilai: [],
              nilaiAkhir: "85.5",
              nilaiHuruf: "A",
              keteranganLulus: "Lulus",
              justifikasi: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            }),
          },
        };
        return callback(tx);
      });

      const res = await request(app)
        .put("/api/revisi-sidang/revisi-1/verify")
        .set("Authorization", `Bearer ${dosenP1Token}`)
        .send({
          nilaiAkhir: "85.5",
          keteranganLulus: "Lulus",
          nilaiHuruf: "A",
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe(
        "Hasil revisi sidang berhasil diverifikasi dan Berita Acara telah diterbitkan"
      );
      expect(updateSidangRegSpy).toHaveBeenCalledWith({
        where: { id: "reg-sidang-1" },
        data: { status: "Sidang Selesai" },
      });
      expect(res.body.data.revisiTugasAkhir).toBeDefined();
      expect(res.body.data.revisiTugasAkhir.isApproved).toBe(true);
      expect(res.body.data.revisiTugasAkhir.sidangRegistration.status).toBe("Sidang Selesai");
      expect(res.body.data.beritaAcara).toBeDefined();
      expect(res.body.data.beritaAcara.nilaiAkhir).toBe("85.5");
      expect(res.body.data.beritaAcara.keteranganLulus).toBe("Lulus");
    });

    it("Gagal jika mahasiswa belum melakukan submit revisi (400)", async () => {
      vi.spyOn(prisma.dosen, "findUnique").mockResolvedValue(mockDosenP1);
      vi.spyOn(prisma.revisiTugasAkhir, "findFirst").mockResolvedValue({
        ...mockRevisi,
        tglSubmitRevisi: null, // belum submit
      });

      const res = await request(app)
        .put("/api/revisi-sidang/revisi-1/verify")
        .set("Authorization", `Bearer ${dosenP1Token}`)
        .send({
          nilaiAkhir: "85.5",
          keteranganLulus: "Lulus",
          nilaiHuruf: "A",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Mahasiswa belum melakukan submit revisi sidang");
    });

    it("Gagal jika dosen bukan Dosen Pembimbing 1 (403)", async () => {
      vi.spyOn(prisma.dosen, "findUnique").mockResolvedValue(mockDosenP2);
      vi.spyOn(prisma.revisiTugasAkhir, "findFirst").mockResolvedValue({
        ...mockRevisi,
        tglSubmitRevisi: new Date(),
      });

      const res = await request(app)
        .put("/api/revisi-sidang/revisi-1/verify")
        .set("Authorization", `Bearer ${dosenP2Token}`)
        .send({
          nilaiAkhir: "85.5",
          keteranganLulus: "Lulus",
          nilaiHuruf: "A",
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toBe(
        "Hanya Dosen Pembimbing 1 yang memiliki hak akses untuk memverifikasi revisi sidang"
      );
    });

    it("Gagal jika revisi sudah pernah disetujui sebelumnya (400)", async () => {
      vi.spyOn(prisma.dosen, "findUnique").mockResolvedValue(mockDosenP1);
      vi.spyOn(prisma.revisiTugasAkhir, "findFirst").mockResolvedValue({
        ...mockRevisi,
        tglSubmitRevisi: new Date(),
        tglSetujuiHasilRevisi: new Date(), // sudah di-acc
      });

      const res = await request(app)
        .put("/api/revisi-sidang/revisi-1/verify")
        .set("Authorization", `Bearer ${dosenP1Token}`)
        .send({
          nilaiAkhir: "85.5",
          keteranganLulus: "Lulus",
          nilaiHuruf: "A",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe(
        "Revisi sidang sudah disetujui sebelumnya dan tidak dapat diubah lagi"
      );
    });
  });
});
