import asyncHandler from 'express-async-handler';
import prisma from '../config/prisma.js';

/**
 * Mencari periode yang paling dekat dengan waktu sekarang (current time).
 * Logika penentuan:
 * 1. Jika ada periode yang sedang aktif/berlangsung (startDate <= now <= endDate), distance = 0 (prioritas utama).
 * 2. Jika tidak ada yang aktif, hitung selisih waktu terdekat ke startDate (periode mendatang) atau endDate (periode lampau).
 * 3. Mengembalikan null jika belum ada data periode.
 */
const findNearestPeriod = (periods) => {
  if (!periods || periods.length === 0) return null;
  const now = new Date().getTime();

  let nearest = null;
  let minDistance = Infinity;

  for (const p of periods) {
    const start = new Date(p.startDate).getTime();
    const end = new Date(p.endDate).getTime();

    let distance;
    if (now >= start && now <= end) {
      distance = 0; // Sedang berlangsung
    } else if (now < start) {
      distance = start - now; // Periode mendatang
    } else {
      distance = now - end; // Periode lampau
    }

    if (distance < minDistance) {
      minDistance = distance;
      nearest = p;
    }
  }

  if (!nearest) return null;

  return {
    name: nearest.name,
    category: nearest.category,
    period: nearest.period,
    startDate: nearest.startDate ? nearest.startDate.toISOString() : null,
    endDate: nearest.endDate ? nearest.endDate.toISOString() : null,
  };
};

/**
 * @desc    Ambil data preview periode sidang dan yudisium terdekat (landing page / pusat informasi)
 * @route   GET /api/pusat-informasi/preview
 * @access  Public
 */
const getPusatInformasiPreview = asyncHandler(async (req, res) => {
  const [sidangPeriods, yudisiumPeriods] = await Promise.all([
    prisma.sidangPeriod.findMany({
      where: { deletedAt: null, isOpen: true },
      orderBy: { startDate: 'asc' },
    }),
    prisma.yudisiumPeriod.findMany({
      where: { deletedAt: null, isOpen: true },
      orderBy: { startDate: 'asc' },
    }),
  ]);

  const periodeSidang = findNearestPeriod(sidangPeriods);
  const periodeYudisium = findNearestPeriod(yudisiumPeriods);

  res.json({
    periodeSidang,
    periodeYudisium,
  });
});

export {
  getPusatInformasiPreview,
  findNearestPeriod,
};
