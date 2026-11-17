import "dotenv/config";
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import prisma from "../src/config/prisma.js";
import {
  listYudisiumRegistrations,
  saveYudisiumRegistration,
  submitYudisiumRegistration,
} from "../src/services/yudisiumRegistrationService.js";

const JWT_SECRET = process.env.JWT_SECRET || "akademiktup";

describe("Yudisium Registration - List & Filter by Periode", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("secara default memilih periode pendaftaran aktif jika filter periode tidak disertakan", async () => {
    const activePeriodMock = {
      id: "active-yudisium-period-uuid",
      category: "pendaftaran",
      isOpen: true,
      name: "Periode Pendaftaran Yudisium Ganjil",
    };

    vi.spyOn(prisma.yudisiumPeriod, "findFirst").mockResolvedValue(activePeriodMock);
    vi.spyOn(prisma.yudisiumRegistration, "count").mockResolvedValue(1);
    const findManySpy = vi.spyOn(prisma.yudisiumRegistration, "findMany").mockResolvedValue([
      {
        id: "yud-reg-1",
        yudisiumRegistrationPeriodId: activePeriodMock.id,
        mahasiswa: { user: { name: "Budi Santoso" } },
      },
    ]);

    const result = await listYudisiumRegistrations({ query: {} });

    expect(prisma.yudisiumPeriod.findFirst).toHaveBeenCalledWith({
      where: {
        category: { in: ["pendaftaran", "pendaftaran yudisium"] },
        isOpen: true,
        deletedAt: null,
      },
      orderBy: { updatedAt: "desc" },
    });

    const findArgs = findManySpy.mock.calls[0][0];
    expect(findArgs.where.yudisiumRegistrationPeriodId).toBe("active-yudisium-period-uuid");
    expect(result.data).toBeDefined();
  });

  it("secara default memilih periode pendaftaran kemarin terdekat jika tidak ada periode aktif", async () => {
    const nearestPastPeriodMock = {
      id: "nearest-past-yudisium-period-uuid",
      category: "pendaftaran",
      isOpen: false,
      endDate: new Date("2026-04-15"),
    };

    vi.spyOn(prisma.yudisiumPeriod, "findFirst")
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(nearestPastPeriodMock);

    vi.spyOn(prisma.yudisiumRegistration, "count").mockResolvedValue(0);
    const findManySpy = vi.spyOn(prisma.yudisiumRegistration, "findMany").mockResolvedValue([]);

    await listYudisiumRegistrations({ query: {} });

    expect(prisma.yudisiumPeriod.findFirst).toHaveBeenCalledTimes(2);
    const findArgs = findManySpy.mock.calls[0][0];
    expect(findArgs.where.yudisiumRegistrationPeriodId).toBe("nearest-past-yudisium-period-uuid");
  });

  it("menggunakan filter yudisiumRegistrationPeriodId yang diberikan secara eksplisit", async () => {
    const findPeriodSpy = vi.spyOn(prisma.yudisiumPeriod, "findFirst");
    vi.spyOn(prisma.yudisiumRegistration, "count").mockResolvedValue(1);
    const findManySpy = vi.spyOn(prisma.yudisiumRegistration, "findMany").mockResolvedValue([]);

    await listYudisiumRegistrations({
      query: { yudisiumRegistrationPeriodId: "custom-yudisium-uuid" },
    });

    expect(findPeriodSpy).not.toHaveBeenCalled();
    const findArgs = findManySpy.mock.calls[0][0];
    expect(findArgs.where.yudisiumRegistrationPeriodId).toBe("custom-yudisium-uuid");
  });

  it("menggunakan filter yudisiumPeriodId (pelaksanaan) jika diberikan secara eksplisit", async () => {
    const findPeriodSpy = vi.spyOn(prisma.yudisiumPeriod, "findFirst");
    vi.spyOn(prisma.yudisiumRegistration, "count").mockResolvedValue(1);
    const findManySpy = vi.spyOn(prisma.yudisiumRegistration, "findMany").mockResolvedValue([]);

    await listYudisiumRegistrations({
      query: { yudisiumPeriodId: "exec-yudisium-uuid" },
    });

    expect(findPeriodSpy).not.toHaveBeenCalled();
    const findArgs = findManySpy.mock.calls[0][0];
    expect(findArgs.where.yudisiumPeriodId).toBe("exec-yudisium-uuid");
  });

  it("endpoint GET /api/yudisium-registrations mengembalikan response paginasi dengan filter periode", async () => {
    const token = jwt.sign(
      { id: "admin-uuid", role: "ADMIN", email: "admin@telkomuniversity.ac.id" },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    vi.spyOn(prisma.yudisiumPeriod, "findFirst").mockResolvedValue({
      id: "active-period-1",
      isOpen: true,
    });

    vi.spyOn(prisma.yudisiumRegistration, "count").mockResolvedValue(1);
    vi.spyOn(prisma.yudisiumRegistration, "findMany").mockResolvedValue([
      {
        id: "reg-1",
        yudisiumRegistrationPeriodId: "active-period-1",
        mahasiswa: { user: { name: "Nizar Daffa" } },
      },
    ]);

    const res = await request(app)
      .get("/api/yudisium-registrations")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.total).toBe(1);
  });

  // ===============================================================
  // SEKSI 2: Transisi Periode Draft ke Submit (Periode 1 ke Periode 2)
  // ===============================================================
  describe("Transisi Pendaftaran Yudisium Draft dari Periode 1 ke Periode 2", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it("saveYudisiumRegistration: memperbarui yudisiumRegistrationPeriodId ke Periode 2 saat draft disimpan kembali pada periode baru", async () => {
      const activePeriod2 = {
        id: "period-2-active-uuid",
        category: "pendaftaran",
        isOpen: true,
      };

      vi.spyOn(prisma.yudisiumPeriod, "findFirst").mockResolvedValue(activePeriod2);

      vi.spyOn(prisma.yudisiumRegistration, "findUnique")
        .mockResolvedValueOnce({
          id: "yud-reg-draft-1",
          isDraft: true,
          yudisiumRegistrationPeriodId: "period-1-closed-uuid",
        })
        .mockResolvedValueOnce({
          isDraft: true,
        });

      const updateSpy = vi.spyOn(prisma.yudisiumRegistration, "update").mockResolvedValue({
        id: "yud-reg-draft-1",
        isDraft: true,
        yudisiumRegistrationPeriodId: activePeriod2.id,
      });

      const result = await saveYudisiumRegistration({
        id: "yud-reg-draft-1",
        program: "Reguler",
      });

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "yud-reg-draft-1" },
          data: expect.objectContaining({
            yudisiumRegistrationPeriodId: "period-2-active-uuid",
          }),
        })
      );
      expect(result.yudisiumRegistrationPeriodId).toBe("period-2-active-uuid");
    });

    it("submitYudisiumRegistration: draft yang dibuat di Periode 1 (tutup) otomatis dialihkan ke Periode 2 yang aktif saat disubmit", async () => {
      const period1Closed = {
        id: "period-1-closed-uuid",
        category: "pendaftaran",
        isOpen: false,
      };

      const activePeriod2 = {
        id: "period-2-active-uuid",
        category: "pendaftaran",
        isOpen: true,
      };

      const existingDraftReg = {
        id: "yud-reg-draft-1",
        isDraft: true,
        status: null,
        isEdit: null,
        message: null,
        yudisiumRegistrationPeriodId: period1Closed.id,
        program: "Reguler",
        tak: 45,
        tglSidang: new Date("2026-08-15T09:30:00.000Z"),
        judulTugasAkhirIndonesia: "Implementasi Sistem Informasi Akademik",
        judulTugasAkhirInggris: "Implementation of Academic Information System",
        mahasiswaId: "mhs-1",
        dosenWaliId: "doswal-1",
        dosenPembimbing1Id: "dos-1",
        dosenPembimbing2Id: "dos-2",
        skemaSidang: "Sidang Reguler",
        yudisiumRegistrationUploads: [],
      };

      vi.spyOn(prisma.yudisiumRegistration, "findUnique").mockResolvedValue(existingDraftReg);
      vi.spyOn(prisma.yudisiumPeriod, "findFirst").mockResolvedValue(activePeriod2);
      vi.spyOn(prisma.dokumenPersyaratanBerkas, "findMany").mockResolvedValue([]);
      vi.spyOn(prisma.mahasiswa, "findUnique").mockResolvedValue({ id: "mhs-1" });
      vi.spyOn(prisma.dosen, "findUnique")
        .mockResolvedValueOnce({ id: "doswal-1" })
        .mockResolvedValueOnce({ id: "dos-1" })
        .mockResolvedValueOnce({ id: "dos-2" });

      const updateSpy = vi.spyOn(prisma.yudisiumRegistration, "update").mockResolvedValue({
        ...existingDraftReg,
        isDraft: false,
        status: "Dalam Proses",
        yudisiumRegistrationPeriodId: activePeriod2.id,
        submittedAt: new Date(),
      });

      const submitPayload = {
        id: "yud-reg-draft-1",
        program: "Reguler",
        tak: 45,
        tglSidang: "2026-08-15T09:30:00.000Z",
        judulTugasAkhirIndonesia: "Implementasi Sistem Informasi Akademik",
        judulTugasAkhirInggris: "Implementation of Academic Information System",
        mahasiswaId: "mhs-1",
        dosenWaliId: "doswal-1",
        dosenPembimbing1Id: "dos-1",
        dosenPembimbing2Id: "dos-2",
        skemaSidang: "Sidang Reguler",
      };

      const result = await submitYudisiumRegistration(submitPayload);

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "yud-reg-draft-1" },
          data: expect.objectContaining({
            yudisiumRegistrationPeriodId: "period-2-active-uuid",
            isDraft: false,
            status: "Dalam Proses",
          }),
        })
      );
      expect(result.yudisiumRegistrationPeriodId).toBe("period-2-active-uuid");
      expect(result.status).toBe("Dalam Proses");
    });

    it("submitYudisiumRegistration: melempar error 400 jika mahasiswa submit draft dari Periode 1 namun tidak ada periode aktif saat ini", async () => {
      const existingDraftReg = {
        id: "yud-reg-draft-1",
        isDraft: true,
        yudisiumRegistrationPeriodId: "period-1-closed-uuid",
      };

      vi.spyOn(prisma.yudisiumRegistration, "findUnique").mockResolvedValue(existingDraftReg);
      vi.spyOn(prisma.yudisiumPeriod, "findFirst").mockResolvedValue(null);

      await expect(submitYudisiumRegistration({ id: "yud-reg-draft-1" })).rejects.toThrowError(
        "Periode pendaftaran yudisium ini sudah ditutup."
      );
    });

    it("endpoint POST /api/yudisium-registrations/submit berhasil mengalihkan periode 1 ke periode 2 (HTTP 200)", async () => {
      const token = jwt.sign(
        { id: "mhs-uuid", role: "MAHASISWA", email: "mhs@student.telkomuniversity.ac.id" },
        JWT_SECRET,
        { expiresIn: "1h" }
      );

      const existingDraftReg = {
        id: "yud-draft-http",
        isDraft: true,
        status: null,
        isEdit: null,
        message: null,
        yudisiumRegistrationPeriodId: "period-1-closed-uuid",
        program: "Reguler",
        tak: 45,
        tglSidang: "2026-08-15T09:30:00.000Z",
        judulTugasAkhirIndonesia: "Implementasi Sistem Informasi Akademik",
        judulTugasAkhirInggris: "Implementation of Academic Information System",
        mahasiswaId: "mhs-uuid",
        yudisiumRegistrationUploads: [],
      };

      vi.spyOn(prisma.yudisiumRegistration, "findUnique").mockResolvedValue(existingDraftReg);
      vi.spyOn(prisma.yudisiumPeriod, "findFirst").mockResolvedValue({
        id: "period-2-active-uuid",
        category: "pendaftaran",
        isOpen: true,
      });
      vi.spyOn(prisma.dokumenPersyaratanBerkas, "findMany").mockResolvedValue([]);
      vi.spyOn(prisma.mahasiswa, "findUnique").mockResolvedValue({ id: "mhs-uuid" });

      vi.spyOn(prisma.yudisiumRegistration, "update").mockResolvedValue({
        ...existingDraftReg,
        isDraft: false,
        status: "Dalam Proses",
        yudisiumRegistrationPeriodId: "period-2-active-uuid",
        submittedAt: new Date(),
      });

      const submitBody = {
        id: "yud-draft-http",
        program: "Reguler",
        tak: 45,
        tglSidang: "2026-08-15T09:30:00.000Z",
        judulTugasAkhirIndonesia: "Implementasi Sistem Informasi Akademik",
        judulTugasAkhirInggris: "Implementation of Academic Information System",
        mahasiswaId: "mhs-uuid",
      };

      const res = await request(app)
        .post("/api/yudisium-registrations/submit")
        .set("Authorization", `Bearer ${token}`)
        .send(submitBody);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Yudisium registration submitted successfully");
      expect(res.body.data.yudisiumRegistrationPeriodId).toBe("period-2-active-uuid");
      expect(res.body.data.isDraft).toBe(false);
    });
  });
});
