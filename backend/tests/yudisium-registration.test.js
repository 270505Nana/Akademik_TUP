import "dotenv/config";
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import prisma from "../src/config/prisma.js";
import { listYudisiumRegistrations } from "../src/services/yudisiumRegistrationService.js";

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
});
