import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);

const hideTimestamps = { createdAt: true, updatedAt: true, deletedAt: true };
const hidedeletedAt = { deletedAt: true };
const hideUpdateDelete = { updatedAt: true, deletedAt: true };

const basePrisma = new PrismaClient({
  adapter,
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "info", "warn", "error"]
      : ["error"],
  omit: {
    user: {
      password: true,
      deletedAt: true,
    },
    researchGroup: hideTimestamps,
    faculty: hideTimestamps,
    studyProgram: hideTimestamps,

    admin: hidedeletedAt,
    dosen: hideTimestamps,
    mahasiswa: hideTimestamps,
    permohonanSkta: hideUpdateDelete,
  },
});

const SCHEDULE_CHANGE_FIELDS = [
  "tglSidang",
  "ruanganSidangId",
  "dosenPenguji1Id",
  "dosenPenguji2Id",
];

const hasScheduleChanges = (data) => {
  if (!data || typeof data !== "object") return false;
  return SCHEDULE_CHANGE_FIELDS.some((field) => data[field] !== undefined);
};

// NOTE:
// Extension untuk model SidangRegistration:
// Setiap ada perubahan pada tglSidang, ruanganSidangId, dosenPenguji1Id, atau dosenPenguji2Id,
// otomatis ubah isInfoPenjadwalanReaded menjadi false.
const prisma = basePrisma.$extends({
  query: {
    sidangRegistration: {
      async update({ args, query }) {
        if (hasScheduleChanges(args.data)) {
          args.data.isInfoPenjadwalanReaded = false;
        }
        return query(args);
      },
      async updateMany({ args, query }) {
        if (hasScheduleChanges(args.data)) {
          args.data.isInfoPenjadwalanReaded = false;
        }
        return query(args);
      },
      async upsert({ args, query }) {
        if (hasScheduleChanges(args.update)) {
          args.update.isInfoPenjadwalanReaded = false;
        }
        return query(args);
      },
    },
  },
});

export default prisma;
