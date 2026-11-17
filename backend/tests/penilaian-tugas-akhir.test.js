import "dotenv/config";
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import prisma from "../src/config/prisma.js";
import { tutupSidang, savePenilaianTugasAkhir } from "../src/services/penilaianTugasAkhirService.js";

const JWT_SECRET = process.env.JWT_SECRET || "akademiktup";

describe("Penilaian Tugas Akhir - Tutup Sidang & Locking Penilaian", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockDosenPembimbing1 = {
    id: "dosen-p1-id",
    userId: "user-dosen-p1",
    name: "Dr. Pembimbing Satu",
    nip: "19800101",
    user: { id: "user-dosen-p1", role: "DOSEN" },
  };

  const mockDosenPembimbing2 = {
    id: "dosen-p2-id",
    userId: "user-dosen-p2",
    name: "Dr. Pembimbing Dua",
    nip: "19800102",
    user: { id: "user-dosen-p2", role: "DOSEN" },
  };

  const mockSidangRegistration = {
    id: "reg-sidang-123",
    deletedAt: null,
    dosenPembimbing1Id: "dosen-p1-id",
    dosenPembimbing1: mockDosenPembimbing1,
    dosenPembimbing2Id: "dosen-p2-id",
    dosenPembimbing2: mockDosenPembimbing2,
    dosenPenguji1Id: null,
    dosenPenguji1: null,
    dosenPenguji2Id: null,
    dosenPenguji2: null,
    mahasiswa: {
      id: "mhs-1",
      studyProgramId: "prodi-1",
      user: { id: "user-mhs-1", name: "Mahasiswa Test" },
    },
    tglSidang: new Date("2026-11-10T09:00:00Z"),
    penilaianTugasAkhir: [
      { id: "pen-1", dosenPenilaiId: "dosen-p1-id" },
      { id: "pen-2", dosenPenilaiId: "dosen-p2-id" },
    ],
    revisiTugasAkhir: [],
    beritaAcaraSidangTugasAkhirs: [],
  };

  it("gagal menutup sidang jika bukan Dosen Pembimbing 1", async () => {
    vi.spyOn(prisma.dosen, "findUnique").mockResolvedValueOnce(mockDosenPembimbing2);
    vi.spyOn(prisma.sidangRegistration, "findUnique").mockResolvedValueOnce(mockSidangRegistration);

    await expect(
      tutupSidang({
        sidangRegistrationId: "reg-sidang-123",
        userId: "user-dosen-p2",
        deadlineRevisi: "2026-11-30T23:59:59Z",
      })
    ).rejects.toThrow("Hanya Dosen Pembimbing 1 yang memiliki hak akses untuk menutup sidang tugas akhir");
  });

  it("gagal menutup sidang jika ada dosen penilai yang belum menyimpan penilaian", async () => {
    vi.spyOn(prisma.dosen, "findUnique").mockResolvedValueOnce(mockDosenPembimbing1);
    vi.spyOn(prisma.sidangRegistration, "findUnique").mockResolvedValueOnce({
      ...mockSidangRegistration,
      penilaianTugasAkhir: [{ id: "pen-1", dosenPenilaiId: "dosen-p1-id" }], // P2 belum menilai
    });

    await expect(
      tutupSidang({
        sidangRegistrationId: "reg-sidang-123",
        userId: "user-dosen-p1",
        deadlineRevisi: "2026-11-30T23:59:59Z",
      })
    ).rejects.toThrow(/Sidang belum dapat ditutup karena dosen penilai berikut belum menyimpan penilaian/);
  });

  it("berhasil menutup sidang, menetapkan deadline revisi, dan TIDAK membuat berita acara", async () => {
    vi.spyOn(prisma.dosen, "findUnique").mockResolvedValueOnce(mockDosenPembimbing1);
    vi.spyOn(prisma.sidangRegistration, "findUnique").mockResolvedValueOnce(mockSidangRegistration);
    vi.spyOn(prisma.revisiTugasAkhir, "findFirst").mockResolvedValueOnce(null);

    const createRevisiSpy = vi.spyOn(prisma.revisiTugasAkhir, "create").mockResolvedValueOnce({
      id: "revisi-new-id",
      sidangRegistrationId: "reg-sidang-123",
      deadlineRevisi: new Date("2026-11-30T23:59:59Z"),
      tglSetujuiUntukRevisi: new Date(),
      setujuiUntukRevisiId: "dosen-p1-id",
    });

    const createBeritaAcaraSpy = vi.spyOn(prisma.beritaAcaraSidangTugasAkhir, "create");

    const result = await tutupSidang({
      sidangRegistrationId: "reg-sidang-123",
      userId: "user-dosen-p1",
      deadlineRevisi: "2026-11-30T23:59:59Z",
    });

    expect(createRevisiSpy).toHaveBeenCalledTimes(1);
    expect(createBeritaAcaraSpy).not.toHaveBeenCalled();
    expect(result.revisiTugasAkhir).toBeDefined();
    expect(result.revisiTugasAkhir.id).toBe("revisi-new-id");
    expect(result.beritaAcara).toBeUndefined();
  });

  it("gagal menutup sidang jika sidang sudah pernah ditutup sebelumnya", async () => {
    vi.spyOn(prisma.dosen, "findUnique").mockResolvedValueOnce(mockDosenPembimbing1);
    vi.spyOn(prisma.sidangRegistration, "findUnique").mockResolvedValueOnce({
      ...mockSidangRegistration,
      revisiTugasAkhir: [
        {
          id: "revisi-existing",
          tglSetujuiUntukRevisi: new Date("2026-11-15T10:00:00Z"),
        },
      ],
    });

    await expect(
      tutupSidang({
        sidangRegistrationId: "reg-sidang-123",
        userId: "user-dosen-p1",
        deadlineRevisi: "2026-11-30T23:59:59Z",
      })
    ).rejects.toThrow("Sidang ini sudah ditutup sebelumnya");
  });

  it("gagal menyimpan nilai jika sidang sudah ditutup", async () => {
    vi.spyOn(prisma.dosen, "findUnique").mockResolvedValueOnce(mockDosenPembimbing1);
    vi.spyOn(prisma.sidangRegistration, "findUnique").mockResolvedValueOnce(mockSidangRegistration);
    vi.spyOn(prisma.revisiTugasAkhir, "findFirst").mockResolvedValueOnce({
      id: "revisi-existing",
      tglSetujuiUntukRevisi: new Date("2026-11-15T10:00:00Z"),
    });

    await expect(
      savePenilaianTugasAkhir({
        sidangRegistrationId: "reg-sidang-123",
        userId: "user-dosen-p1",
        userRole: "DOSEN",
        nilai: [],
        catatanRevisi: "Revisi abstrak",
      })
    ).rejects.toThrow("Penilaian tidak dapat diubah karena sidang sudah ditutup");
  });

  it("endpoint POST /api/penilaian-tugas-akhir/sidang-registration/:id/tutup-sidang berhasil dengan payload deadlineRevisi saja (HTTP 200)", async () => {
    const token = jwt.sign(
      { id: "user-dosen-p1", role: "DOSEN" },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    vi.spyOn(prisma.dosen, "findUnique").mockResolvedValue(mockDosenPembimbing1);
    vi.spyOn(prisma.sidangRegistration, "findUnique").mockResolvedValue(mockSidangRegistration);
    vi.spyOn(prisma.revisiTugasAkhir, "findFirst").mockResolvedValue(null);
    vi.spyOn(prisma.revisiTugasAkhir, "create").mockResolvedValue({
      id: "revisi-new-id",
      sidangRegistrationId: "reg-sidang-123",
      deadlineRevisi: new Date("2026-11-30T23:59:59Z"),
      tglSetujuiUntukRevisi: new Date("2026-11-16T10:00:00Z"),
      setujuiUntukRevisiId: "dosen-p1-id",
    });

    const res = await request(app)
      .post("/api/penilaian-tugas-akhir/sidang-registration/reg-sidang-123/tutup-sidang")
      .set("Authorization", `Bearer ${token}`)
      .send({
        deadlineRevisi: "2026-11-30T23:59:59.000Z",
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe(
      "Sidang tugas akhir berhasil ditutup dan batas waktu revisi telah ditetapkan"
    );
    expect(res.body.data.revisiTugasAkhir).toBeDefined();
    expect(res.body.data.revisiTugasAkhir.id).toBe("revisi-new-id");
    expect(res.body.data.beritaAcara).toBeUndefined();
  });

  it("endpoint GET /api/penilaian-tugas-akhir/sidang-registration/:id mengembalikan rekap penilaian sidang (HTTP 200)", async () => {
    const token = jwt.sign(
      { id: "user-dosen-p1", role: "DOSEN" },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    vi.spyOn(prisma.sidangRegistration, "findUnique").mockResolvedValue({
      ...mockSidangRegistration,
      ruanganSidang: { name: "Ruang Sidang 1" },
      revisiTugasAkhir: [],
    });
    vi.spyOn(prisma.cloProdi, "findMany").mockResolvedValue([]);
    vi.spyOn(prisma.skemaPenilaiProdi, "findMany").mockResolvedValue([]);

    const res = await request(app)
      .get("/api/penilaian-tugas-akhir/sidang-registration/reg-sidang-123")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Data rekap penilaian sidang berhasil diambil");
    expect(res.body.data).toBeDefined();
    expect(res.body.data.sidangRegistrationId).toBe("reg-sidang-123");
    expect(res.body.data.beritaAcaraCalculation).toBeUndefined();
    expect(res.body.data).toHaveProperty("isSidangClosed");
    expect(res.body.data).toHaveProperty("revisiTugasAkhir");
    expect(res.body.data.penilaianList).toBeDefined();
    expect(res.body.data.penilaianList[0]).toHaveProperty("id", "pen-1");
  });

  it("endpoint GET /api/penilaian-tugas-akhir/sidang-registration/:id/me mengembalikan formulir template / penilaian dosen (HTTP 200)", async () => {
    const token = jwt.sign(
      { id: "user-dosen-p1", role: "DOSEN" },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    vi.spyOn(prisma.dosen, "findUnique").mockResolvedValue(mockDosenPembimbing1);
    vi.spyOn(prisma.penilaianTugasAkhir, "findUnique").mockResolvedValue(null);
    vi.spyOn(prisma.sidangRegistration, "findUnique").mockResolvedValue(mockSidangRegistration);
    vi.spyOn(prisma.cloProdi, "findMany").mockResolvedValue([]);

    const res = await request(app)
      .get("/api/penilaian-tugas-akhir/sidang-registration/reg-sidang-123/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.sidangRegistrationId).toBe("reg-sidang-123");
    expect(res.body.penilaiType).toBe("pembimbing");
  });

  it("endpoint PUT /api/penilaian-tugas-akhir/sidang-registration/:id/me berhasil menyimpan penilaian (HTTP 200)", async () => {
    const token = jwt.sign(
      { id: "user-dosen-p1", role: "DOSEN" },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    vi.spyOn(prisma.dosen, "findUnique").mockResolvedValue(mockDosenPembimbing1);
    vi.spyOn(prisma.sidangRegistration, "findUnique").mockResolvedValue(mockSidangRegistration);
    vi.spyOn(prisma.revisiTugasAkhir, "findFirst").mockResolvedValue(null);
    vi.spyOn(prisma.beritaAcaraSidangTugasAkhir, "findFirst").mockResolvedValue(null);
    vi.spyOn(prisma.cloProdi, "findMany").mockResolvedValue([
      {
        id: "clo-1",
        name: "CLO 1",
        description: "Deskripsi CLO",
        subcloProdi: [],
        jenisAsesmenClo: [
          {
            id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            content: "Asesmen 1",
            bobot: 0.5,
          },
        ],
      },
    ]);
    vi.spyOn(prisma.penilaianTugasAkhir, "upsert").mockResolvedValue({
      id: "pen-1",
      bobotPenilai: 0.5,
      nilai: [],
      catatanRevisi: "Catatan test",
      sidangRegistrationId: "reg-sidang-123",
      penilaiType: "pembimbing",
      dosenPenilai: mockDosenPembimbing1,
      dosenKaprodi: null,
    });

    const res = await request(app)
      .put("/api/penilaian-tugas-akhir/sidang-registration/reg-sidang-123/me")
      .set("Authorization", `Bearer ${token}`)
      .send({
        nilai: [
          {
            jenisAsesmenId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            nilai: 90,
          },
        ],
        catatanRevisi: "Catatan test",
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Penilaian tugas akhir berhasil disimpan");
    expect(res.body.data.id).toBe("pen-1");
  });
});
