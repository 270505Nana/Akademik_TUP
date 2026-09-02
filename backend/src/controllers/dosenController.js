import asyncHandler from 'express-async-handler';
import prisma from "../config/prisma.js";
import { sendValidationError, isNil } from '../utils/validationHelper.js';
import { getPaginationParams, formatPaginationResponse } from '../utils/paginationHelper.js';

const mapDosen = (dosen) => {
  if (!dosen) return null;
  const { user, ...rest } = dosen;
  return {
    ...rest,
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || null,
  };
};

const dosenInclude = {
  user: {
    select: {
      name: true,
      email: true,
      phone: true,
    },
  },
  researchGroup: true,
};

// Daftar Semua Dosen (dengan search, filter, sort, dan pagination)
const listDosens = asyncHandler(async (req, res) => {
  const paginationParams = getPaginationParams(req.query);
  const {
    search,
    q,
    name,
    nip,
    nidn,
    kodeDosen,
    kode_dosen,
    researchGroupId,
    research_group_id,
    researchGroup,
    research_group,
    sortBy,
    sort,
    order,
  } = req.query;

  const where = {
    deletedAt: null,
  };

  // Search across name, nip, nidn, kodeDosen
  const searchTerm = (search || q || '').trim();
  if (searchTerm) {
    where.OR = [
      {
        user: {
          name: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
      },
      {
        nip: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      },
      {
        nidn: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      },
      {
        kodeDosen: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      },
    ];
  }

  // Specific field filters
  if (name && typeof name === 'string' && name.trim() !== '') {
    where.user = {
      ...where.user,
      name: {
        contains: name.trim(),
        mode: 'insensitive',
      },
    };
  }

  if (nip && typeof nip === 'string' && nip.trim() !== '') {
    where.nip = {
      contains: nip.trim(),
      mode: 'insensitive',
    };
  }

  if (nidn && typeof nidn === 'string' && nidn.trim() !== '') {
    where.nidn = {
      contains: nidn.trim(),
      mode: 'insensitive',
    };
  }

  const kodeDosenParam = kodeDosen || kode_dosen;
  if (kodeDosenParam && typeof kodeDosenParam === 'string' && kodeDosenParam.trim() !== '') {
    where.kodeDosen = {
      contains: kodeDosenParam.trim(),
      mode: 'insensitive',
    };
  }

  // Filter based on researchGroup
  const rgId = (researchGroupId || research_group_id || '').trim();
  const rg = (researchGroup || research_group || '').trim();

  if (rgId) {
    where.researchGroupId = rgId;
  } else if (rg) {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rg);
    if (isUUID) {
      where.researchGroupId = rg;
    } else {
      where.researchGroup = {
        name: {
          contains: rg,
          mode: 'insensitive',
        },
      };
    }
  }

  // Sort options: nameAsc, nameDesc, researchGroupAsc, researchGroupDesc, newest, oldest
  const sortParam = (sortBy || sort || '').toLowerCase().trim();

  let orderBy = { createdAt: 'desc' };

  if (sortParam === 'nameasc' || sortParam === 'a-z') {
    orderBy = { user: { name: 'asc' } };
  } else if (sortParam === 'namedesc' || sortParam === 'z-a') {
    orderBy = { user: { name: 'desc' } };
  } else if (sortParam === 'researchgroupasc' || sortParam === 'research_group_asc') {
    orderBy = { researchGroup: { name: 'asc' } };
  } else if (sortParam === 'researchgroupdesc' || sortParam === 'research_group_desc') {
    orderBy = { researchGroup: { name: 'desc' } };
  } else if (sortParam === 'oldest') {
    orderBy = { createdAt: 'asc' };
  } else if (sortParam === 'newest') {
    orderBy = { createdAt: 'desc' };
  }

  const [total, dosens] = await Promise.all([
    prisma.dosen.count({ where }),
    prisma.dosen.findMany({
      where,
      skip: paginationParams.skip,
      take: paginationParams.take,
      orderBy,
      include: dosenInclude,
    }),
  ]);

  const mapped = dosens.map(mapDosen);

  res.json(formatPaginationResponse(mapped, total, paginationParams));
});

// Update or Insert Dosen
const upsertDosen = asyncHandler(async (req, res) => {
  const idOrUserId = req.params.id; // String UUID

  let dosenRecord = await prisma.dosen.findUnique({
    where: { id: idOrUserId },
  });

  let userId;
  if (dosenRecord) {
    userId = dosenRecord.userId;
  } else {
    dosenRecord = await prisma.dosen.findUnique({
      where: { userId: idOrUserId },
    });
    if (dosenRecord) {
      userId = dosenRecord.userId;
    } else {
      userId = idOrUserId;
    }
  }

  const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
  if (!user) {
    res.status(404);
    throw new Error("Pengguna tidak ditemukan");
  }
  if (user.role !== "DOSEN") {
    res.status(400);
    throw new Error("Pengguna bukan dosen");
  }

  const { nip, nidn, lecturerCode, kodeDosen, name, researchGroupId } = req.body;
  const targetKodeDosen = kodeDosen || lecturerCode;

  const errors = [];
  if (isNil(nip)) errors.push({ field: 'nip', message: 'NIP wajib diisi' });
  if (isNil(name)) errors.push({ field: 'name', message: 'Nama wajib diisi' });
  if (isNil(researchGroupId)) errors.push({ field: 'researchGroupId', message: 'ID kelompok riset wajib diisi' });
  if (req.body.kodeDosen !== undefined && isNil(kodeDosen)) {
    errors.push({ field: 'kodeDosen', message: 'Kode dosen wajib diisi' });
  }
  if (req.body.lecturerCode !== undefined && isNil(lecturerCode)) {
    errors.push({ field: 'lecturerCode', message: 'Kode dosen wajib diisi' });
  }
  if (errors.length > 0) return sendValidationError(res, errors, req);

  // Update name in User table
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { name },
  });

  // Upsert Dosen record
  const dosen = await prisma.dosen.upsert({
    where: { userId },
    update: {
      nip,
      nidn,
      kodeDosen: targetKodeDosen,
      researchGroupId,
    },
    create: {
      nip,
      nidn,
      kodeDosen: targetKodeDosen,
      researchGroupId,
      userId,
    },
  });

  res.json({
    message: "Create or update dosen data successful",
    data: {
      ...dosen,
      name: updatedUser.name,
    },
  });
});

// Find Dosen By Id (with fallback to userId)
const findDosenById = asyncHandler(async (req, res) => {
  const idOrUserId = req.params.id; // String UUID

  let dosen = await prisma.dosen.findUnique({
    where: { id: idOrUserId },
    include: dosenInclude,
  });

  if (!dosen) {
    // Fallback to userId
    dosen = await prisma.dosen.findUnique({
      where: { userId: idOrUserId },
      include: dosenInclude,
    });
  }

  if (!dosen) {
    res.status(404);
    throw new Error("Data dosen tidak ditemukan");
  }

  res.json({
    data: mapDosen(dosen),
  });
});

// Toggle Ketua KK status
const toggleKetuaKK = asyncHandler(async (req, res) => {
  const idOrUserId = req.params.id; // String UUID

  let dosen = await prisma.dosen.findUnique({
    where: { id: idOrUserId },
  });

  if (!dosen) {
    // Fallback to userId
    dosen = await prisma.dosen.findUnique({
      where: { userId: idOrUserId },
    });
  }

  if (!dosen) {
    res.status(404);
    throw new Error("Data dosen tidak ditemukan");
  }

  const nextStatus = !dosen.isKetuaKK;

  const updatedDosen = await prisma.$transaction(async (tx) => {
    if (nextStatus) {
      // Set dosen lain di KK (Research Group) yang sama ke false
      await tx.dosen.updateMany({
        where: {
          researchGroupId: dosen.researchGroupId,
          isKetuaKK: true,
          NOT: {
            id: dosen.id,
          },
        },
        data: {
          isKetuaKK: false,
        },
      });
    }

    // Update status dosen saat ini
    return await tx.dosen.update({
      where: { id: dosen.id },
      data: {
        isKetuaKK: nextStatus,
      },
    });
  });

  res.json({
    message: `Berhasil mengubah status Ketua KK menjadi ${nextStatus ? 'Aktif' : 'Nonaktif'}`,
    data: updatedDosen,
  });
});

export { listDosens,
  upsertDosen,
  findDosenById,
  toggleKetuaKK, };
