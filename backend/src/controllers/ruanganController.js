import asyncHandler from "express-async-handler";
import prisma from "../config/prisma.js";

const createRuangan = asyncHandler(async (req, res) => {
    const { name, gedung } = req.body;

    if (!name || !gedung) {
        res.status(400);
        throw new Error('Nama ruangan dan gedung wajib diisi');
    }

    const ruangan = await prisma.ruangan.create({
        data: {
            name,
            gedung,
            isActive: true, 
        },
    });

    res.status(201).json({
        message: 'Data ruangan berhasil ditambahkan',
        data: ruangan,
    });
});

const getRuangans = asyncHandler(async (req, res) => {
    const ruangans = await prisma.ruangan.findMany({
        where: { deletedAt: null },
        orderBy: [
            { gedung: 'asc' }, 
            { name: 'asc' }    
        ],
    });

    res.json({
        message: 'Data ruangan berhasil diambil',
        data: ruangans,
    });
});

const getRuanganById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const ruangan = await prisma.ruangan.findFirst({
        where: { id, deletedAt: null },
    });

    if (!ruangan) {
        res.status(404);
        throw new Error('Data ruangan tidak ditemukan');
    }

    res.json({
        message: 'Data ruangan ditemukan',
        data: ruangan,
    });
});

const updateRuangan = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, gedung, isActive } = req.body;

    const ruanganExists = await prisma.ruangan.findFirst({
        where: { id, deletedAt: null },
    });

    if (!ruanganExists) {
        res.status(404);
        throw new Error('Data ruangan tidak ditemukan');
    }

    const ruangan = await prisma.ruangan.update({
        where: { id },
        data: {
            name,
            gedung,
            isActive,
        },
    });

    res.json({
        message: 'Data ruangan berhasil diperbarui',
        data: ruangan,
    });
});

const deleteRuangan = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const ruanganExists = await prisma.ruangan.findFirst({
        where: { id, deletedAt: null },
    });

    if (!ruanganExists) {
        res.status(404);
        throw new Error('Data ruangan tidak ditemukan');
    }

    await prisma.ruangan.update({
        where: { id },
        data: { deletedAt: new Date() },
    });

    res.json({
        message: 'Data ruangan berhasil dihapus',
    });
});

export {
  createRuangan,
  getRuangans,
  getRuanganById,
  updateRuangan,
  deleteRuangan,
};
