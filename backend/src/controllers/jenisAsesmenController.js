import asyncHandler from "express-async-handler";
import prisma from "../config/prisma.js";
import { getPaginationParams, formatPaginationResponse } from "../utils/paginationHelper.js";
import { sendValidationError, isNil } from "../utils/validationHelper.js";
import { getAcademicAccessContext } from "../middlewares/authorize.js";

//create
const createJenisAsesmen = asyncHandler(async ( req, res)=> {
    const { content, bobot, cloProdiId } = req.body;
    const errors = [];

    if (isNil(content)) errors.push({ field: "content", message: "Deskripsi Jenis Asesmen wajib diisi" });
    if (isNil(bobot)) errors.push({ field: "bobot", message: "Bobot nilai wajib diisi" });
    if (isNil(cloProdiId)) errors.push({ field: "cloProdiId", message: "ID CLO wajib diisi" });

    if (errors.length > 0) return sendValidationError(res, errors);

    const cloProdi = await prisma.cloProdi.findUnique({
        where: { id: cloProdiId },
    });
    if (!cloProdi || cloProdi.deletedAt) {
        res.status(404);
        throw new Error("CLO tidak ditemukan");
    }

    const access = await getAcademicAccessContext(req);
    if (access.isRestrictedKaprodi) {
        if (!access.studyProgramId || cloProdi.studyProgramId !== access.studyProgramId) {
            return res.status(403).json({
                message: "Access denied. Ketua Prodi hanya dapat membuat data untuk program studinya sendiri.",
            });
        }
    }

    const jenisAsesmen = await prisma.jenisAsesmenClo.create({
        data: { 
            content, 
            bobot: parseFloat(bobot), 
            cloProdiId 
        },
    });
    res.status(201).json({ message: "Jenis Asesmen berhasil dibuat", data: jenisAsesmen });
});

// get all 
const getJenisAsesmens = asyncHandler(async (req, res) => {
    const paginationParams = getPaginationParams(req.query);
    const { search, cloProdiId } = req.query;

    const access = await getAcademicAccessContext(req);
    if (access.isRestrictedKaprodi) {
        if (!access.studyProgramId) {
            return res.status(403).json({
                message: "Access denied. Akun Ketua Prodi belum terasosiasi dengan Program Studi manapun.",
            });
        }
        if (cloProdiId) {
            const clo = await prisma.cloProdi.findUnique({
                where: { id: cloProdiId },
            });
            if (!clo || clo.deletedAt || clo.studyProgramId !== access.studyProgramId) {
                return res.status(403).json({
                    message: "Access denied. Ketua Prodi hanya dapat mengakses data untuk program studinya sendiri.",
                });
            }
        }
    }

    const where = { deletedAt: null };

    if (access.isRestrictedKaprodi) {
        if (cloProdiId) {
            where.cloProdiId = cloProdiId;
        } else {
            where.cloProdi = {
                studyProgramId: access.studyProgramId,
                deletedAt: null,
            };
        }
    } else if (cloProdiId) {
        where.cloProdiId = cloProdiId;
    }

    if (search) {
        where.OR = [
            { content: { contains: search, mode: "insensitive" } },
        ];
    }
    
    const [total, jenisAsesmenList] = await Promise.all([
        prisma.jenisAsesmenClo.count({ where }),
        prisma.jenisAsesmenClo.findMany({
            where,
            skip: paginationParams.skip,
            take: paginationParams.take,
            include: {
                cloProdi: true,
            },
            orderBy: { createdAt: "asc" },
        }),
    ]);
    res.json(formatPaginationResponse(jenisAsesmenList, total, paginationParams));
});

//get jenis asesmen by id
const getJenisAsesmenById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const jenisAsesmen = await prisma.jenisAsesmenClo.findUnique({
        where: { id },
        include: {
            cloProdi: true,
        },
    });
    
    if (!jenisAsesmen || jenisAsesmen.deletedAt) {
        res.status(404);
        throw new Error("Jenis Asesmen tidak ditemukan");
    }

    const access = await getAcademicAccessContext(req);
    if (access.isRestrictedKaprodi) {
        if (!access.studyProgramId || jenisAsesmen.cloProdi?.studyProgramId !== access.studyProgramId) {
            return res.status(403).json({
                message: "Access denied. Ketua Prodi hanya dapat mengakses data untuk program studinya sendiri.",
            });
        }
    }

    res.json({ data: jenisAsesmen });
});

// update
const updateJenisAsesmen = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { content, bobot } = req.body;

    const existingAsesmen = await prisma.jenisAsesmenClo.findUnique({
        where: { id },
        include: { cloProdi: true },
    });
    if (!existingAsesmen || existingAsesmen.deletedAt) {
        res.status(404);
        throw new Error("Jenis Asesmen tidak ditemukan");
    }

    const access = await getAcademicAccessContext(req);
    if (access.isRestrictedKaprodi) {
        if (!access.studyProgramId || existingAsesmen.cloProdi?.studyProgramId !== access.studyProgramId) {
            return res.status(403).json({
                message: "Access denied. Ketua Prodi hanya dapat mengubah data untuk program studinya sendiri.",
            });
        }
    }

    const updatedAsesmen = await prisma.jenisAsesmenClo.update({
        where: { id },
        data: {
            content: content !== undefined ? content : existingAsesmen.content,
            bobot: bobot !== undefined ? parseFloat(bobot) : existingAsesmen.bobot, // konversi jika ada update bobot
        },
    });
    res.json({ message: "Jenis Asesmen berhasil diperbarui", data: updatedAsesmen });
});

// delete
const deleteJenisAsesmen = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existingAsesmen = await prisma.jenisAsesmenClo.findUnique({
        where: { id },
        include: { cloProdi: true },
    });
    if (!existingAsesmen || existingAsesmen.deletedAt) {
        res.status(404);
        throw new Error("Jenis Asesmen tidak ditemukan");
    }

    const access = await getAcademicAccessContext(req);
    if (access.isRestrictedKaprodi) {
        if (!access.studyProgramId || existingAsesmen.cloProdi?.studyProgramId !== access.studyProgramId) {
            return res.status(403).json({
                message: "Access denied. Ketua Prodi hanya dapat menghapus data untuk program studinya sendiri.",
            });
        }
    }

    await prisma.jenisAsesmenClo.update({
        where: { id },
        data: { deletedAt: new Date() },
    });
    res.json({ message: "Jenis Asesmen berhasil dihapus" });
});

export {
    createJenisAsesmen,
    getJenisAsesmens,
    getJenisAsesmenById,
    updateJenisAsesmen,
    deleteJenisAsesmen,
};
