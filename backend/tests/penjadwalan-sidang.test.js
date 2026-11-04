import "dotenv/config";
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import {
  isCapstoneScheme,
  isSameCapstoneGroup,
  validateBatchPengujiInternalConflict,
  validateBatchJadwalInternalConflict,
  checkJadwalConflict,
  formatWibDateTime,
} from "../src/utils/penjadwalanSidangHelper.js";
import { mapPenjadwalanSidangToFrontend } from "../src/mappers/penjadwalanMapper.js";
import {
  setPengujiSidang,
  batchSetPengujiSidang,
  setPengujiJadwalSidang,
  getPenjadwalanSidangList,
} from "../src/services/penjadwalanSidangService.js";
import prisma from "../src/config/prisma.js";

const JWT_SECRET = process.env.JWT_SECRET || "akademiktup";

describe("Penjadwalan Sidang - Skema Capstone & Validasi Konflik", () => {
  // ===============================================================
  // SEKSI 1: Unit Testing Helper Capstone
  // ===============================================================
  describe("Helper: isCapstoneScheme & isSameCapstoneGroup", () => {
    it("harus mengenali skema Capstone dari skemaSidang maupun skemaSidangFinal", () => {
      expect(isCapstoneScheme({ skemaSidang: "Capstone" })).toBe(true);
      expect(isCapstoneScheme({ skemaSidang: "capstone project" })).toBe(true);
      expect(isCapstoneScheme({ skemaSidangFinal: "Capstone" })).toBe(true);
      expect(isCapstoneScheme({ skemaSidang: "Reguler", skemaSidangFinal: "Capstone" })).toBe(true);
      expect(isCapstoneScheme({ skemaSidang: "Reguler" })).toBe(false);
      expect(isCapstoneScheme({ skemaSidang: "Non Sidang" })).toBe(false);
      expect(isCapstoneScheme(null)).toBe(false);
    });

    it("TC-SCH-CAP-001 & 009: harus mendeteksi 1 kelompok jika judul Indonesia sama (case-insensitive & trimmed)", () => {
      const regA = {
        skemaSidang: "Capstone",
        judulTugasAkhirIndonesia: "Rancang Bangun Sistem Monitoring IoT",
      };
      const regB = {
        skemaSidang: "Capstone",
        judulTugasAkhirIndonesia: "  rancang bangun sistem monitoring iot  ",
      };

      expect(isSameCapstoneGroup(regA, regB)).toBe(true);
    });

    it("TC-SCH-CAP-010: harus mendeteksi 1 kelompok jika judul Inggris sama", () => {
      const regA = {
        skemaSidang: "Capstone",
        judulTugasAkhirIndonesia: "Judul Berbeda A",
        judulTugasAkhirInggris: "Design and Build of IoT Monitoring System",
      };
      const regB = {
        skemaSidang: "Capstone",
        judulTugasAkhirIndonesia: "Judul Berbeda B",
        judulTugasAkhirInggris: "design and build of iot monitoring system",
      };

      expect(isSameCapstoneGroup(regA, regB)).toBe(true);
    });

    it("TC-SCH-CAP-002: harus mendeteksi beda kelompok jika judul berbeda", () => {
      const regA = {
        skemaSidang: "Capstone",
        judulTugasAkhirIndonesia: "Sistem Rekomendasi Pariwisata",
        judulTugasAkhirInggris: "Tourism Recommendation System",
      };
      const regB = {
        skemaSidang: "Capstone",
        judulTugasAkhirIndonesia: "Sistem Deteksi Hama Padi",
        judulTugasAkhirInggris: "Paddy Pest Detection System",
      };

      expect(isSameCapstoneGroup(regA, regB)).toBe(false);
    });

    it("TC-SCH-CAP-004: harus mengembalikan false jika salah satu atau keduanya bukan Capstone", () => {
      const regCapstone = {
        skemaSidang: "Capstone",
        judulTugasAkhirIndonesia: "Judul Sama Persis",
      };
      const regReguler = {
        skemaSidang: "Reguler",
        judulTugasAkhirIndonesia: "Judul Sama Persis",
      };

      expect(isSameCapstoneGroup(regCapstone, regReguler)).toBe(false);
      expect(isSameCapstoneGroup(regReguler, regReguler)).toBe(false);
    });
  });

  // ===============================================================
  // SEKSI 2: Validasi Internal Batch Jadwal (validateBatchJadwalInternalConflict)
  // ===============================================================
  describe("Batch Jadwal: validateBatchJadwalInternalConflict", () => {
    const ruanganMap = new Map([
      ["room-1", { id: "room-1", name: "Ruang A301", gedung: "Gedung IoT" }],
      ["room-2", { id: "room-2", name: "Ruang B201", gedung: "Gedung Telkom" }],
    ]);

    it("TC-SCH-CAP-005: lolos tanpa error jika sesama Capstone satu kelompok dijadwalkan di ruangan & waktu yang sama", () => {
      const sameTime = new Date("2026-11-20T09:00:00.000Z").toISOString();
      const itemsWithMeta = [
        {
          id: "cap-1",
          isCapstone: true,
          ruanganSidangId: "room-1",
          tglSidang: sameTime,
          mahasiswaName: "Mahasiswa Capstone A",
          involvedDosenIds: ["dosen-1", "dosen-2"],
          involvedDosens: [{ id: "dosen-1", name: "Dr. Pembimbing" }],
          registration: {
            skemaSidang: "Capstone",
            judulTugasAkhirIndonesia: "Smart Agriculture IoT System",
          },
        },
        {
          id: "cap-2",
          isCapstone: true,
          ruanganSidangId: "room-1",
          tglSidang: sameTime,
          mahasiswaName: "Mahasiswa Capstone B",
          involvedDosenIds: ["dosen-1", "dosen-2"],
          involvedDosens: [{ id: "dosen-1", name: "Dr. Pembimbing" }],
          registration: {
            skemaSidang: "Capstone",
            judulTugasAkhirIndonesia: "smart agriculture iot system",
          },
        },
      ];

      expect(() => {
        validateBatchJadwalInternalConflict(itemsWithMeta, ruanganMap);
      }).not.toThrow();
    });

    it("TC-SCH-CAP-006: melempar error 400 jika Capstone beda kelompok dijadwalkan di ruangan yang sama dalam rentang 2 jam", () => {
      const timeA = new Date("2026-11-20T09:00:00.000Z").toISOString();
      const timeB = new Date("2026-11-20T09:30:00.000Z").toISOString(); // beda 30 menit (< 2 jam)

      const itemsWithMeta = [
        {
          id: "cap-1",
          isCapstone: true,
          ruanganSidangId: "room-1",
          tglSidang: timeA,
          mahasiswaName: "Mahasiswa Capstone A",
          involvedDosenIds: ["dosen-1"],
          involvedDosens: [{ id: "dosen-1", name: "Dosen 1" }],
          registration: {
            skemaSidang: "Capstone",
            judulTugasAkhirIndonesia: "Judul Kelompok A",
          },
        },
        {
          id: "cap-2",
          isCapstone: true,
          ruanganSidangId: "room-1",
          tglSidang: timeB,
          mahasiswaName: "Mahasiswa Capstone B",
          involvedDosenIds: ["dosen-2"],
          involvedDosens: [{ id: "dosen-2", name: "Dosen 2" }],
          registration: {
            skemaSidang: "Capstone",
            judulTugasAkhirIndonesia: "Judul Kelompok B (BEDA)",
          },
        },
      ];

      expect(() => {
        validateBatchJadwalInternalConflict(itemsWithMeta, ruanganMap);
      }).toThrowError(/Ruangan Ruang A301 \(Gedung IoT\) dijadwalkan bersamaan/);
    });

    it("melempar error jika Capstone beda kelompok bentrok dosen dalam rentang 2 jam", () => {
      const timeA = new Date("2026-11-20T09:00:00.000Z").toISOString();
      const timeB = new Date("2026-11-20T09:30:00.000Z").toISOString();

      const itemsWithMeta = [
        {
          id: "cap-1",
          isCapstone: true,
          ruanganSidangId: "room-1",
          tglSidang: timeA,
          mahasiswaName: "Mahasiswa Capstone A",
          involvedDosenIds: ["dosen-shared"],
          involvedDosens: [{ id: "dosen-shared", name: "Prof. Shared" }],
          registration: {
            skemaSidang: "Capstone",
            judulTugasAkhirIndonesia: "Judul Proyek Alpha",
          },
        },
        {
          id: "cap-2",
          isCapstone: true,
          ruanganSidangId: "room-2", // ruangan berbeda
          tglSidang: timeB,
          mahasiswaName: "Mahasiswa Capstone B",
          involvedDosenIds: ["dosen-shared"],
          involvedDosens: [{ id: "dosen-shared", name: "Prof. Shared" }],
          registration: {
            skemaSidang: "Capstone",
            judulTugasAkhirIndonesia: "Judul Proyek Beta (BEDA)",
          },
        },
      ];

      expect(() => {
        validateBatchJadwalInternalConflict(itemsWithMeta, ruanganMap);
      }).toThrowError(/Dosen Prof. Shared terjadwal untuk mahasiswa/);
    });
  });

  // ===============================================================
  // SEKSI 3: Validasi Internal Batch Penguji (validateBatchPengujiInternalConflict)
  // ===============================================================
  describe("Batch Penguji: validateBatchPengujiInternalConflict", () => {
    const dosenMap = new Map([
      ["dosen-penguji-1", { id: "dosen-penguji-1", name: "Dr. Penguji Satu" }],
      ["dosen-penguji-2", { id: "dosen-penguji-2", name: "Dr. Penguji Dua" }],
    ]);

    it("TC-SCH-CAP-007: lolos tanpa error jika sesama Capstone satu kelompok ditugaskan penguji yang sama", () => {
      const sameTime = new Date("2026-11-20T09:00:00.000Z").toISOString();
      const scheduledItems = [
        {
          id: "cap-1",
          isCapstone: true,
          tglSidang: sameTime,
          mahasiswaName: "Mahasiswa Capstone A",
          allDosenIds: ["dosen-penguji-1"],
          registration: {
            skemaSidang: "Capstone",
            judulTugasAkhirIndonesia: "Pengembangan Autonomous Drone",
          },
        },
        {
          id: "cap-2",
          isCapstone: true,
          tglSidang: sameTime,
          mahasiswaName: "Mahasiswa Capstone B",
          allDosenIds: ["dosen-penguji-1"],
          registration: {
            skemaSidang: "Capstone",
            judulTugasAkhirIndonesia: "pengembangan autonomous drone",
          },
        },
      ];

      expect(() => {
        validateBatchPengujiInternalConflict(scheduledItems, dosenMap);
      }).not.toThrow();
    });

    it("TC-SCH-CAP-008: melempar error 400 jika Capstone beda kelompok ditugaskan penguji yang sama di waktu beririsan", () => {
      const sameTime = new Date("2026-11-20T09:00:00.000Z").toISOString();
      const scheduledItems = [
        {
          id: "cap-1",
          isCapstone: true,
          tglSidang: sameTime,
          mahasiswaName: "Mahasiswa Capstone A",
          allDosenIds: ["dosen-penguji-1"],
          registration: {
            skemaSidang: "Capstone",
            judulTugasAkhirIndonesia: "Judul Robotika",
          },
        },
        {
          id: "cap-2",
          isCapstone: true,
          tglSidang: sameTime,
          mahasiswaName: "Mahasiswa Capstone B",
          allDosenIds: ["dosen-penguji-1"],
          registration: {
            skemaSidang: "Capstone",
            judulTugasAkhirIndonesia: "Judul AI Vision (BEDA)",
          },
        },
      ];

      expect(() => {
        validateBatchPengujiInternalConflict(scheduledItems, dosenMap);
      }).toThrowError(/Dosen Dr. Penguji Satu terlibat pada sidang mahasiswa/);
    });
  });

  // ===============================================================
  // SEKSI 4: Validasi checkJadwalConflict Terhadap Database
  // ===============================================================
  describe("Fungsi checkJadwalConflict (Single Check)", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it("TC-SCH-CAP-001: tidak menghasilkan konflik jika target dan calon pendaftaran adalah Capstone kelompok yang sama", async () => {
      const existingSidang = {
        id: "existing-cap-1",
        tglSidang: new Date("2026-11-20T09:00:00.000Z"),
        ruanganSidangId: "room-101",
        skemaSidang: "Capstone",
        judulTugasAkhirIndonesia: "E-Health Telemedicine System",
        ruanganSidang: { name: "Lab A", gedung: "Gedung 1" },
        mahasiswa: { name: "Rizky Mahasiswa" },
      };

      vi.spyOn(prisma.sidangRegistration, "findMany").mockResolvedValue([existingSidang]);

      const result = await checkJadwalConflict({
        registrationId: "new-cap-2",
        tglSidang: new Date("2026-11-20T09:00:00.000Z"),
        ruanganSidangId: "room-101",
        isCapstone: true,
        targetRegistration: {
          id: "new-cap-2",
          skemaSidang: "Capstone",
          judulTugasAkhirIndonesia: "e-health telemedicine system",
        },
      });

      expect(result).toBeNull();
    });

    it("TC-SCH-CAP-002: menghasilkan pesan bentrok ruangan jika Capstone berbeda kelompok", async () => {
      const existingSidang = {
        id: "existing-cap-1",
        tglSidang: new Date("2026-11-20T09:00:00.000Z"),
        ruanganSidangId: "room-101",
        skemaSidang: "Capstone",
        judulTugasAkhirIndonesia: "Judul A (Smart Grid)",
        ruanganSidang: { name: "Lab A", gedung: "Gedung 1" },
        mahasiswa: { name: "Budi Santoso" },
      };

      vi.spyOn(prisma.sidangRegistration, "findMany").mockResolvedValue([existingSidang]);

      const result = await checkJadwalConflict({
        registrationId: "new-cap-2",
        tglSidang: new Date("2026-11-20T09:00:00.000Z"),
        ruanganSidangId: "room-101",
        isCapstone: true,
        targetRegistration: {
          id: "new-cap-2",
          skemaSidang: "Capstone",
          judulTugasAkhirIndonesia: "Judul B (Solar Panel Monitoring)",
        },
      });

      expect(result).toContain("Jadwal bentrok: Ruangan Lab A (Gedung 1) sudah terjadwal");
    });
  });

  // ===============================================================
  // SEKSI 5: HTTP Endpoint Integration Testing (Supertest)
  // ===============================================================
  describe("API Endpoint Security & RBAC (/api/penjadwalan-sidang)", () => {
    it("TC-SCH-GET-005: Menolak request tanpa token otentikasi (401)", async () => {
      const res = await request(app).get("/api/penjadwalan-sidang");
      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Token not found");
    });

    it("TC-SCH-GET-006: Menolak akses role Mahasiswa (403)", async () => {
      const mhsToken = jwt.sign(
        { id: "mhs-uuid", role: "MAHASISWA", email: "mhs@student.ac.id" },
        JWT_SECRET,
        { expiresIn: "1h" }
      );

      const res = await request(app)
        .get("/api/penjadwalan-sidang")
        .set("Authorization", `Bearer ${mhsToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain("Access denied");
    });
  });

  // ===============================================================
  // SEKSI 6: Integritas Akademik: Dosen Pembimbing !== Dosen Penguji
  // ===============================================================
  describe("Integritas Akademik: Dosen Pembimbing tidak boleh menjadi Penguji", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it("TC-PENGUJI-DOSPIN-001: setPengujiSidang menolak jika penguji 1 adalah pembimbing 1", async () => {
      const mockReg = {
        id: "reg-1",
        dosenPembimbing1Id: "dospem-1",
        dosenPembimbing2Id: "dospem-2",
        isLocked: false,
        sidangPeriod: { isPublished: false },
        mahasiswa: { name: "Budi" },
      };

      vi.spyOn(prisma.sidangRegistration, "findUnique").mockResolvedValue(mockReg);

      await expect(
        setPengujiSidang({
          id: "reg-1",
          dosenPenguji1Id: "dospem-1",
          dosenPenguji2Id: "dosen-lain",
        })
      ).rejects.toThrow(
        "Dosen pembimbing tidak dapat ditugaskan sebagai dosen penguji mahasiswa bimbingannya sendiri"
      );
    });

    it("TC-PENGUJI-DOSPIN-002: setPengujiSidang menolak jika penguji 2 adalah pembimbing 2", async () => {
      const mockReg = {
        id: "reg-1",
        dosenPembimbing1Id: "dospem-1",
        dosenPembimbing2Id: "dospem-2",
        isLocked: false,
        sidangPeriod: { isPublished: false },
        mahasiswa: { name: "Budi" },
      };

      vi.spyOn(prisma.sidangRegistration, "findUnique").mockResolvedValue(mockReg);

      await expect(
        setPengujiSidang({
          id: "reg-1",
          dosenPenguji1Id: "dosen-lain",
          dosenPenguji2Id: "dospem-2",
        })
      ).rejects.toThrow(
        "Dosen pembimbing tidak dapat ditugaskan sebagai dosen penguji mahasiswa bimbingannya sendiri"
      );
    });

    it("TC-PENGUJI-DOSPIN-003: batchSetPengujiSidang menolak jika penguji merangkap pembimbing", async () => {
      const mockRegistrations = [
        {
          id: "reg-10",
          dosenPembimbing1Id: "dospem-10",
          dosenPembimbing2Id: null,
          isLocked: false,
          sidangPeriod: { isPublished: false },
          mahasiswa: { name: "Siti Rahma" },
        },
      ];

      vi.spyOn(prisma.sidangRegistration, "findMany").mockResolvedValue(mockRegistrations);

      await expect(
        batchSetPengujiSidang([
          {
            id: "reg-10",
            dosenPenguji1Id: "dospem-10",
            dosenPenguji2Id: "penguji-lain",
          },
        ])
      ).rejects.toThrow(
        /Dosen pembimbing tidak dapat ditugaskan sebagai dosen penguji mahasiswa bimbingannya sendiri/
      );
    });

    it("TC-PENGUJI-DOSPIN-004: setPengujiJadwalSidang (Admin) menolak jika penguji merangkap pembimbing", async () => {
      const mockReg = {
        id: "reg-admin-1",
        dosenPembimbing1Id: "dospem-1",
        dosenPembimbing2Id: "dospem-2",
      };

      vi.spyOn(prisma.sidangRegistration, "findUnique").mockResolvedValue(mockReg);

      await expect(
        setPengujiJadwalSidang({
          id: "reg-admin-1",
          dosenPenguji1Id: "dospem-1",
          dosenPenguji2Id: "dosen-lain",
          tglSidang: "2026-11-20T09:00:00.000Z",
          ruanganSidangId: "room-1",
        })
      ).rejects.toThrow(
        "Dosen pembimbing tidak dapat ditugaskan sebagai dosen penguji mahasiswa bimbingannya sendiri"
      );
    });
  });

  // ===============================================================
  // SEKSI 7: Format Waktu Ekspor Excel WIB (Asia/Jakarta)
  // ===============================================================
  describe("Helper: formatWibDateTime", () => {
    it("harus memformat tanggal dan waktu ke standar WIB secara konsisten", () => {
      // 09:00 WIB sama dengan 02:00 UTC
      const utcDate = new Date("2026-11-20T02:00:00.000Z");
      const { formattedDate, formattedTime } = formatWibDateTime(utcDate);

      expect(formattedDate).toBe("20-Nov-26");
      expect(formattedTime).toBe("09:00");
    });

    it("harus menangani input null atau tidak valid secara aman", () => {
      expect(formatWibDateTime(null)).toEqual({ formattedDate: "", formattedTime: "" });
      expect(formatWibDateTime("invalid-date")).toEqual({ formattedDate: "", formattedTime: "" });
    });
  });

  // ===============================================================
  // SEKSI 8: DTO Mapper (mapPenjadwalanSidangToFrontend)
  // ===============================================================
  describe("Mapper: mapPenjadwalanSidangToFrontend", () => {
    it("harus menyertakan judul tugas akhir dan skema sidang pada response", () => {
      const mockItem = {
        id: "reg-map-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        judulTugasAkhirIndonesia: "Sistem Pemantauan Cerdas",
        judulTugasAkhirInggris: "Smart Monitoring System",
        skemaSidang: "Capstone",
        skemaSidangFinal: "Capstone",
        mahasiswa: { id: "mhs-1", name: "Ahmad" },
        dosenPembimbing1: { id: "d-1", name: "Dosen 1" },
        dosenPembimbing2: null,
        dosenPenguji1: null,
        dosenPenguji2: null,
        tglSidang: null,
        ruanganSidang: null,
        isLocked: false,
        sidangPeriod: { isPublished: false },
        isInfoPenjadwalanReaded: true,
      };

      const mapped = mapPenjadwalanSidangToFrontend(mockItem);
      expect(mapped.judulTugasAkhirIndonesia).toBe("Sistem Pemantauan Cerdas");
      expect(mapped.judulTugasAkhirInggris).toBe("Smart Monitoring System");
      expect(mapped.skemaSidang).toBe("Capstone");
      expect(mapped.skemaSidangFinal).toBe("Capstone");
      expect(mapped.isInfoPenjadwalanReaded).toBe(true);
    });

    it("harus mengembalikan null jika item bernilai falsy", () => {
      expect(mapPenjadwalanSidangToFrontend(null)).toBeNull();
    });
  });

  // ===============================================================
  // SEKSI 9: Query Parameter (Search & SortBy newest/oldest)
  // ===============================================================
  describe("Service: getPenjadwalanSidangList Query Parameter", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it("harus menerapkan filter search dan sort newest secara default", async () => {
      const countSpy = vi.spyOn(prisma.sidangRegistration, "count").mockResolvedValue(1);
      const findManySpy = vi.spyOn(prisma.sidangRegistration, "findMany").mockResolvedValue([]);

      await getPenjadwalanSidangList({
        user: { role: "ADMIN" },
        sidangPeriodId: "period-uuid-1",
        search: "Smart IoT",
        sortBy: "newest",
        skip: 0,
        take: 10,
      });

      expect(countSpy).toHaveBeenCalled();
      const findArgs = findManySpy.mock.calls[0][0];
      expect(findArgs.where.sidangPeriodId).toBe("period-uuid-1");
      expect(findArgs.where.AND).toBeDefined();
      expect(findArgs.orderBy).toEqual({ createdAt: "desc" });
    });

    it("harus menerapkan sort oldest ketika sortBy=oldest", async () => {
      vi.spyOn(prisma.sidangRegistration, "count").mockResolvedValue(0);
      const findManySpy = vi.spyOn(prisma.sidangRegistration, "findMany").mockResolvedValue([]);

      await getPenjadwalanSidangList({
        user: { role: "ADMIN" },
        sidangPeriodId: "period-uuid-1",
        sortBy: "oldest",
        skip: 0,
        take: 10,
      });

      const findArgs = findManySpy.mock.calls[0][0];
      expect(findArgs.orderBy).toEqual({ createdAt: "asc" });
    });
  });
});
