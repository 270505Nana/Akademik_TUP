import "dotenv/config";
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import prisma from "../src/config/prisma.js";
import {
  maskMahasiswaName,
  maskMahasiswaNim,
  cekKelompokCapstone,
  listSidangRegistrations,
  saveSidangRegistration,
  submitSidangRegistration,
} from "../src/services/sidangRegistrationService.js";

const JWT_SECRET = process.env.JWT_SECRET || "akademiktup";

describe("Sidang Registration - Endpoint Cek Kelompok Capstone", () => {
  // ===============================================================
  // SEKSI 1: Unit Testing Helper Masking
  // ===============================================================
  describe("Helper Masking Data Mahasiswa", () => {
    it("maskMahasiswaName: menyensor setiap kata kecuali huruf pertama", () => {
      expect(maskMahasiswaName("Nizar Daffa Maulana")).toBe("N**** D**** M******");
      expect(maskMahasiswaName("Putri")).toBe("P****");
      expect(maskMahasiswaName("A B C")).toBe("A B C");
      expect(maskMahasiswaName("")).toBe("");
      expect(maskMahasiswaName(null)).toBe("");
    });

    it("maskMahasiswaNim: menyensor seluruh digit kecuali 3 digit terakhir", () => {
      expect(maskMahasiswaNim("1202200019")).toBe("*******019");
      expect(maskMahasiswaNim("1202200109")).toBe("*******109");
      expect(maskMahasiswaNim("123")).toBe("***");
      expect(maskMahasiswaNim("12")).toBe("**");
      expect(maskMahasiswaNim("")).toBe("");
      expect(maskMahasiswaNim(null)).toBe("");
    });
  });

  // ===============================================================
  // SEKSI 2: Unit Testing Service cekKelompokCapstone
  // ===============================================================
  describe("Service: cekKelompokCapstone", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it("melempar error 400 jika judul kosong atau hanya whitespace", async () => {
      await expect(cekKelompokCapstone({ judul: "" })).rejects.toThrowError(
        "Parameter judul wajib diisi"
      );
      await expect(cekKelompokCapstone({ judul: "   " })).rejects.toThrowError(
        "Parameter judul wajib diisi"
      );
      await expect(cekKelompokCapstone({})).rejects.toThrowError(
        "Parameter judul wajib diisi"
      );
    });

    it("mengembalikan array kosong jika tidak ada periode pendaftaran sidang yang aktif", async () => {
      vi.spyOn(prisma.sidangPeriod, "findFirst").mockResolvedValue(null);

      const result = await cekKelompokCapstone({ judul: "Sistem IoT" });
      expect(result).toEqual([]);
    });

    it("mencari berdasarkan judulTugasAkhirIndonesia terlebih dahulu pada periode aktif", async () => {
      const activePeriod = {
        id: "period-active-uuid",
        category: "pendaftaran",
        isOpen: true,
      };

      const mockRegistrations = [
        {
          id: "reg-1",
          mahasiswa: {
            name: "Nizar Daffa Maulana",
            nim: "1202200019",
          },
        },
        {
          id: "reg-2",
          mahasiswa: {
            name: "Pranata Putra Wicaksana",
            nim: "1202200109",
          },
        },
      ];

      vi.spyOn(prisma.sidangPeriod, "findFirst").mockResolvedValue(activePeriod);
      const findManySpy = vi.spyOn(prisma.sidangRegistration, "findMany").mockResolvedValue(mockRegistrations);

      const result = await cekKelompokCapstone({ judul: "  Rancang Bangun IoT  " });

      expect(findManySpy).toHaveBeenCalledTimes(1);
      expect(findManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            sidangRegistrationPeriodId: "period-active-uuid",
            judulTugasAkhirIndonesia: {
              equals: "Rancang Bangun IoT",
              mode: "insensitive",
            },
          }),
        })
      );

      expect(result).toEqual([
        {
          name: "N**** D**** M******",
          nim: "*******019",
        },
        {
          name: "P****** P**** W********",
          nim: "*******109",
        },
      ]);
    });

    it("fallback mencari ke judulTugasAkhirInggris jika judulTugasAkhirIndonesia tidak ditemukan", async () => {
      const activePeriod = {
        id: "period-active-uuid",
        category: "pendaftaran",
        isOpen: true,
      };

      const mockEnglishMatch = [
        {
          id: "reg-3",
          mahasiswa: {
            name: "Budi Utomo",
            nim: "1202200001",
          },
        },
      ];

      vi.spyOn(prisma.sidangPeriod, "findFirst").mockResolvedValue(activePeriod);
      const findManySpy = vi
        .spyOn(prisma.sidangRegistration, "findMany")
        .mockResolvedValueOnce([]) // Hasil pencarian judul Indonesia kosong
        .mockResolvedValueOnce(mockEnglishMatch); // Hasil pencarian judul Inggris ditemukan

      const result = await cekKelompokCapstone({ judul: "Smart IoT System" });

      expect(findManySpy).toHaveBeenCalledTimes(2);
      expect(result).toEqual([
        {
          name: "B*** U****",
          nim: "*******001",
        },
      ]);
    });
  });

  // ===============================================================
  // SEKSI 3: HTTP Endpoint Integration Testing (GET /api/sidang-registrations/cek-kelompok-capstone)
  // ===============================================================
  describe("API Endpoint: GET /api/sidang-registrations/cek-kelompok-capstone", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it("menolak request tanpa token autentikasi (401)", async () => {
      const res = await request(app).get(
        "/api/sidang-registrations/cek-kelompok-capstone?judul=Sistem%20IoT"
      );
      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Token not found");
    });

    it("menolak request jika query parameter judul tidak disertakan (400 Validation Error)", async () => {
      const token = jwt.sign(
        { id: "user-uuid", role: "MAHASISWA", email: "user@telkomuniversity.ac.id" },
        JWT_SECRET,
        { expiresIn: "1h" }
      );

      const res = await request(app)
        .get("/api/sidang-registrations/cek-kelompok-capstone")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Validation error");
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "judul",
            message: "Parameter judul wajib diisi",
          }),
        ])
      );
    });

    it("dapat diakses oleh role MAHASISWA dan mengembalikan data berhasil (200 OK)", async () => {
      const token = jwt.sign(
        { id: "mhs-uuid", role: "MAHASISWA", email: "mhs@student.telkomuniversity.ac.id" },
        JWT_SECRET,
        { expiresIn: "1h" }
      );

      vi.spyOn(prisma.sidangPeriod, "findFirst").mockResolvedValue({
        id: "active-period-1",
        isOpen: true,
      });

      vi.spyOn(prisma.sidangRegistration, "findMany").mockResolvedValue([
        {
          id: "reg-1",
          mahasiswa: {
            name: "Nizar Daffa Maulana",
            nim: "1202200019",
          },
        },
      ]);

      const res = await request(app)
        .get("/api/sidang-registrations/cek-kelompok-capstone?judul=Rancang%20Bangun%20IoT")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Data kelompok capstone berhasil diambil");
      expect(res.body.data).toEqual([
        {
          name: "N**** D**** M******",
          nim: "*******019",
        },
      ]);
    });
  });
  // ===============================================================
  // SEKSI 4: Periode Pendaftaran Sidang Filter & Default Fallback
  // ===============================================================
  describe("List Sidang Registration - Filter by Periode & Default Fallback", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it("secara default memilih periode pendaftaran aktif jika filter periode tidak disertakan", async () => {
      const activePeriodMock = {
        id: "active-sidang-period-uuid",
        category: "pendaftaran",
        isOpen: true,
        name: "Periode Sidang Semester Ganjil",
      };

      vi.spyOn(prisma.sidangPeriod, "findFirst").mockResolvedValue(activePeriodMock);
      vi.spyOn(prisma.sidangRegistration, "count").mockResolvedValue(1);
      const findManySpy = vi.spyOn(prisma.sidangRegistration, "findMany").mockResolvedValue([
        {
          id: "reg-1",
          sidangRegistrationPeriodId: activePeriodMock.id,
          mahasiswa: { user: { name: "Ahmad" } },
        },
      ]);

      const result = await listSidangRegistrations({ query: {} });

      expect(prisma.sidangPeriod.findFirst).toHaveBeenCalledWith({
        where: {
          category: { in: ["pendaftaran", "pendaftaran sidang"] },
          isOpen: true,
          deletedAt: null,
        },
        orderBy: { updatedAt: "desc" },
      });

      const findArgs = findManySpy.mock.calls[0][0];
      expect(findArgs.where.sidangRegistrationPeriodId).toBe("active-sidang-period-uuid");
      expect(result.data).toBeDefined();
    });

    it("secara default memilih periode pendaftaran kemarin terdekat jika tidak ada periode yang aktif", async () => {
      const nearestPeriodMock = {
        id: "nearest-past-period-uuid",
        category: "pendaftaran",
        isOpen: false,
        endDate: new Date("2026-05-01"),
      };

      vi.spyOn(prisma.sidangPeriod, "findFirst")
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(nearestPeriodMock);

      vi.spyOn(prisma.sidangRegistration, "count").mockResolvedValue(0);
      const findManySpy = vi.spyOn(prisma.sidangRegistration, "findMany").mockResolvedValue([]);

      await listSidangRegistrations({ query: {} });

      expect(prisma.sidangPeriod.findFirst).toHaveBeenCalledTimes(2);
      const findArgs = findManySpy.mock.calls[0][0];
      expect(findArgs.where.sidangRegistrationPeriodId).toBe("nearest-past-period-uuid");
    });

    it("menggunakan filter sidangRegistrationPeriodId yang diberikan secara eksplisit", async () => {
      const findPeriodSpy = vi.spyOn(prisma.sidangPeriod, "findFirst");
      vi.spyOn(prisma.sidangRegistration, "count").mockResolvedValue(1);
      const findManySpy = vi.spyOn(prisma.sidangRegistration, "findMany").mockResolvedValue([]);

      await listSidangRegistrations({
        query: { sidangRegistrationPeriodId: "custom-period-uuid" },
      });

      expect(findPeriodSpy).not.toHaveBeenCalled();
      const findArgs = findManySpy.mock.calls[0][0];
      expect(findArgs.where.sidangRegistrationPeriodId).toBe("custom-period-uuid");
    });

    it("menggunakan filter sidangPeriodId (pelaksanaan) jika diberikan secara eksplisit", async () => {
      const findPeriodSpy = vi.spyOn(prisma.sidangPeriod, "findFirst");
      vi.spyOn(prisma.sidangRegistration, "count").mockResolvedValue(1);
      const findManySpy = vi.spyOn(prisma.sidangRegistration, "findMany").mockResolvedValue([]);

      await listSidangRegistrations({
        query: { sidangPeriodId: "exec-sidang-period-uuid" },
      });

      expect(findPeriodSpy).not.toHaveBeenCalled();
      const findArgs = findManySpy.mock.calls[0][0];
      expect(findArgs.where.sidangPeriodId).toBe("exec-sidang-period-uuid");
    });

    it("endpoint GET /api/sidang-registrations mengembalikan response paginasi dengan filter periode", async () => {
      const token = jwt.sign(
        { id: "admin-uuid", role: "ADMIN", email: "admin@telkomuniversity.ac.id" },
        JWT_SECRET,
        { expiresIn: "1h" }
      );

      vi.spyOn(prisma.sidangPeriod, "findFirst").mockResolvedValue({
        id: "active-period-1",
        isOpen: true,
      });

      vi.spyOn(prisma.sidangRegistration, "count").mockResolvedValue(1);
      vi.spyOn(prisma.sidangRegistration, "findMany").mockResolvedValue([
        {
          id: "reg-1",
          sidangRegistrationPeriodId: "active-period-1",
          mahasiswa: { user: { name: "Nizar Daffa" } },
        },
      ]);

      const res = await request(app)
        .get("/api/sidang-registrations")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.total).toBe(1);
    });
  });
  // ===============================================================
  // SEKSI 5: Transisi Periode Draft ke Submit (Periode 1 ke Periode 2)
  // ===============================================================
  describe("Transisi Pendaftaran Draft dari Periode 1 ke Periode 2", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it("saveSidangRegistration: memperbarui sidangRegistrationPeriodId ke Periode 2 saat draft disimpan kembali pada periode baru", async () => {
      const activePeriod2 = {
        id: "period-2-active-uuid",
        category: "pendaftaran",
        isOpen: true,
      };

      vi.spyOn(prisma.sidangPeriod, "findFirst").mockResolvedValue(activePeriod2);

      vi.spyOn(prisma.sidangRegistration, "findUnique")
        .mockResolvedValueOnce({
          id: "reg-draft-1",
          isDraft: true,
          sidangRegistrationPeriodId: "period-1-closed-uuid",
        })
        .mockResolvedValueOnce({
          isDraft: true,
        });

      const updateSpy = vi.spyOn(prisma.sidangRegistration, "update").mockResolvedValue({
        id: "reg-draft-1",
        isDraft: true,
        sidangRegistrationPeriodId: activePeriod2.id,
      });

      const result = await saveSidangRegistration({
        id: "reg-draft-1",
        program: "Reguler",
      });

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "reg-draft-1" },
          data: expect.objectContaining({
            sidangRegistrationPeriodId: "period-2-active-uuid",
          }),
        })
      );
      expect(result.sidangRegistrationPeriodId).toBe("period-2-active-uuid");
    });

    it("submitSidangRegistration: draft yang dibuat di Periode 1 (tutup) otomatis dialihkan ke Periode 2 yang aktif saat disubmit", async () => {
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
        id: "reg-draft-1",
        isDraft: true,
        status: null,
        isEdit: null,
        message: null,
        sidangRegistrationPeriodId: period1Closed.id,
        program: "Reguler",
        sks: 144,
        ipk: 3.8,
        tak: 50,
        sktaExpDate: new Date("2026-12-31"),
        judulTugasAkhirIndonesia: "Implementasi AI",
        judulTugasAkhirInggris: "AI Implementation",
        mahasiswaId: "mhs-1",
        dosenPembimbing1Id: "dos-1",
        dosenPembimbing2Id: "dos-2",
        lulusTesBahasa: true,
        skemaSidang: "Reguler",
        jalurNonSidang: [],
        sidangRegistrationUploads: [{ category: "wajib-doc" }, { category: "bahasa-doc" }],
      };

      vi.spyOn(prisma.sidangRegistration, "findUnique").mockResolvedValue(existingDraftReg);
      vi.spyOn(prisma.sidangPeriod, "findFirst").mockResolvedValue(activePeriod2);
      vi.spyOn(prisma.dokumenPersyaratanBerkas, "findMany").mockResolvedValue([]);
      vi.spyOn(prisma.mahasiswa, "findUnique").mockResolvedValue({ id: "mhs-1" });
      vi.spyOn(prisma.dosen, "findUnique")
        .mockResolvedValueOnce({ id: "dos-1" })
        .mockResolvedValueOnce({ id: "dos-2" });
      vi.spyOn(prisma.sidangRegistrationUpload, "findMany").mockResolvedValue([]);
      vi.spyOn(prisma.sidangRegistrationUpload, "deleteMany").mockResolvedValue({ count: 0 });

      const updateSpy = vi.spyOn(prisma.sidangRegistration, "update").mockResolvedValue({
        ...existingDraftReg,
        isDraft: false,
        status: "Dalam Proses",
        sidangRegistrationPeriodId: activePeriod2.id,
        submittedAt: new Date(),
      });

      const submitPayload = {
        id: "reg-draft-1",
        program: "Reguler",
        sks: 144,
        ipk: 3.8,
        tak: 50,
        sktaExpDate: "2026-12-31T00:00:00.000Z",
        judulTugasAkhirIndonesia: "Implementasi AI",
        judulTugasAkhirInggris: "AI Implementation",
        mahasiswaId: "mhs-1",
        dosenPembimbing1Id: "dos-1",
        dosenPembimbing2Id: "dos-2",
        lulusTesBahasa: true,
        skemaSidang: "Reguler",
      };

      const result = await submitSidangRegistration(submitPayload);

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "reg-draft-1" },
          data: expect.objectContaining({
            sidangRegistrationPeriodId: "period-2-active-uuid",
            isDraft: false,
            status: "Dalam Proses",
          }),
        })
      );
      expect(result.sidangRegistrationPeriodId).toBe("period-2-active-uuid");
      expect(result.status).toBe("Dalam Proses");
    });

    it("submitSidangRegistration: melempar error 400 jika mahasiswa submit draft dari Periode 1 namun tidak ada periode aktif saat ini", async () => {
      const existingDraftReg = {
        id: "reg-draft-1",
        isDraft: true,
        sidangRegistrationPeriodId: "period-1-closed-uuid",
      };

      vi.spyOn(prisma.sidangRegistration, "findUnique").mockResolvedValue(existingDraftReg);
      vi.spyOn(prisma.sidangPeriod, "findFirst").mockResolvedValue(null);

      await expect(submitSidangRegistration({ id: "reg-draft-1" })).rejects.toThrowError(
        "Periode pendaftaran sidang ini sudah ditutup."
      );
    });

    it("endpoint POST /api/sidang-registrations/submit berhasil mengalihkan periode 1 ke periode 2 (HTTP 200)", async () => {
      const token = jwt.sign(
        { id: "mhs-uuid", role: "MAHASISWA", email: "mhs@student.telkomuniversity.ac.id" },
        JWT_SECRET,
        { expiresIn: "1h" }
      );

      const existingDraftReg = {
        id: "reg-draft-http",
        isDraft: true,
        status: null,
        isEdit: null,
        message: null,
        sidangRegistrationPeriodId: "period-1-closed-uuid",
        program: "Reguler",
        sks: 144,
        ipk: 3.8,
        tak: 50,
        sktaExpDate: new Date("2026-12-31"),
        judulTugasAkhirIndonesia: "Sistem IoT",
        judulTugasAkhirInggris: "IoT System",
        mahasiswaId: "mhs-uuid",
        dosenPembimbing1Id: "dos-1",
        dosenPembimbing2Id: "dos-2",
        lulusTesBahasa: true,
        skemaSidang: "Reguler",
        jalurNonSidang: [],
        sidangRegistrationUploads: [],
      };

      vi.spyOn(prisma.sidangRegistration, "findUnique").mockResolvedValue(existingDraftReg);
      vi.spyOn(prisma.sidangPeriod, "findFirst").mockResolvedValue({
        id: "period-2-active-uuid",
        category: "pendaftaran",
        isOpen: true,
      });
      vi.spyOn(prisma.dokumenPersyaratanBerkas, "findMany").mockResolvedValue([]);
      vi.spyOn(prisma.mahasiswa, "findUnique").mockResolvedValue({ id: "mhs-uuid" });
      vi.spyOn(prisma.dosen, "findUnique").mockResolvedValue({ id: "dos-1" });
      vi.spyOn(prisma.sidangRegistrationUpload, "findMany").mockResolvedValue([]);

      vi.spyOn(prisma.sidangRegistration, "update").mockResolvedValue({
        ...existingDraftReg,
        isDraft: false,
        status: "Dalam Proses",
        sidangRegistrationPeriodId: "period-2-active-uuid",
        submittedAt: new Date(),
      });

      const submitBody = {
        id: "reg-draft-http",
        program: "Reguler",
        sks: 144,
        ipk: 3.8,
        tak: 50,
        sktaExpDate: "2026-12-31T00:00:00.000Z",
        judulTugasAkhirIndonesia: "Sistem IoT",
        judulTugasAkhirInggris: "IoT System",
        mahasiswaId: "mhs-uuid",
        dosenPembimbing1Id: "dos-1",
        dosenPembimbing2Id: "dos-2",
        lulusTesBahasa: true,
        skemaSidang: "Reguler",
      };

      const res = await request(app)
        .post("/api/sidang-registrations/submit")
        .set("Authorization", `Bearer ${token}`)
        .send(submitBody);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Sidang registration submitted successfully");
      expect(res.body.data.sidangRegistrationPeriodId).toBe("period-2-active-uuid");
      expect(res.body.data.isDraft).toBe(false);
    });
  });
});
