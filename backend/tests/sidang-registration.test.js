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
});
