const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const hideTimestamps = { createdAt: true, updatedAt: true, deletedAt: true };
const hidedeletedAt = { deletedAt: true };

const prisma = new PrismaClient({
  adapter,
  omit: {
    researchGroup: hideTimestamps,
    faculty: hideTimestamps,
    studyProgram: hideTimestamps,

    academicStaff: hidedeletedAt,
    lecturer: hideTimestamps,
    student: hideTimestamps,
    sktaRequest: hideTimestamps,
  },
});

module.exports = prisma;
