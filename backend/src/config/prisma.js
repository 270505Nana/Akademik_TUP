import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);

const hideTimestamps = { createdAt: true, updatedAt: true, deletedAt: true };
const hidedeletedAt = { deletedAt: true };

const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  omit: {
    researchGroup: hideTimestamps,
    faculty: hideTimestamps,
    studyProgram: hideTimestamps,

    admin: hidedeletedAt,
    dosen: hideTimestamps,
    mahasiswa: hideTimestamps,
    permohonanSkta: hideTimestamps,
  },
});

export default prisma;
