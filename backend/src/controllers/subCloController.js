import asyncHandler from "express-async-handler";
import prisma from "../config/prisma.js";
import { getPaginationParams, formatPaginationResponse } from "../utils/paginationHelper.js";
import { sendValidationError, isNil } from "../utils/validationHelper.js";
import { getAcademicAccessContext } from "../middlewares/authorize.js";

const createSubcloProdi = asyncHandler(async (req, res) => {
    const { name, description, cloProdiId } = req.body;
    const errors = [];

    if (isNil(name)) errors.push({ field: "name", message: "Nama Sub-CLO wajib diisi" });
    if (isNil(description)) errors.push({ field: "description", message: "Deskripsi Sub-CLO wajib diisi" });
    if (isNil(cloProdiId)) errors.push({ field: "cloProdiId", message: "ID Induk CLO wajib diisi" });

    if (errors.length > 0) return sendValidationError(res, errors);

    const clo = await prisma.cloProdi.findUnique({
        where: { id: cloProdiId },
    });

    if (!clo || clo.deletedAt) {
        res.status(404);
        throw new Error("CLO tidak ditemukan");
    }

    const access = await getAcademicAccessContext(req);
    if (access.isRestrictedKaprodi) {
        if (!access.studyProgramId || clo.studyProgramId !== access.studyProgramId) {
            return res.status(403).json({
                message: "Access denied. Ketua Prodi hanya dapat membuat data untuk program studinya sendiri.",
            });
        }
    } else if (access.isRestrictedKetuaKK) {
        if (!access.allowedStudyProgramIds.includes(clo.studyProgramId)) {
            return res.status(403).json({
                message: "Access denied. Ketua KK hanya dapat membuat data Sub-CLO untuk program studi yang terhubung dengan kelompok keahliannya.",
            });
        }
    }

    const subclo = await prisma.subcloProdi.create({
        data: { name, description, cloProdiId },
    });

    res.status(201).json({ message: "Sub CLO berhasil dibuat", data: subclo });
});

const getSubcloProdis = asyncHandler(async (req, res) => {
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
    } else if (access.isRestrictedKetuaKK) {
        if (access.allowedStudyProgramIds.length === 0) {
            return res.status(403).json({
                message: "Access denied. Kelompok Keahlian akun Ketua KK belum terhubung dengan Program Studi manapun.",
            });
        }
        if (cloProdiId) {
            const clo = await prisma.cloProdi.findUnique({
                where: { id: cloProdiId },
            });
            if (!clo || clo.deletedAt || !access.allowedStudyProgramIds.includes(clo.studyProgramId)) {
                return res.status(403).json({
                    message: "Access denied. Ketua KK hanya dapat mengakses data untuk program studi yang terhubung dengan kelompok keahliannya.",
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
    } else if (access.isRestrictedKetuaKK) {
        if (cloProdiId) {
            where.cloProdiId = cloProdiId;
        } else {
            where.cloProdi = {
                studyProgramId: { in: access.allowedStudyProgramIds },
                deletedAt: null,
            };
        }
    } else if (cloProdiId) {
        where.cloProdiId = cloProdiId;
    }

    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
        ];
    }

    const [total, subcloList] = await Promise.all([
        prisma.subcloProdi.count({ where }),
        prisma.subcloProdi.findMany({
            where,
            skip: paginationParams.skip,
            take: paginationParams.take,
            include: {
                cloProdi: true,
            },
            orderBy: { name: "asc" },
        }),
    ]);
    res.json(formatPaginationResponse(subcloList, total, paginationParams));
});

const getSubcloProdiById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const subclo = await prisma.subcloProdi.findUnique({
        where: { id },
        include: { cloProdi: true },
    });

    if (!subclo || subclo.deletedAt) {
        res.status(404);
        throw new Error("Sub clo tidak ditemukan");
    }

    const access = await getAcademicAccessContext(req);
    if (access.isRestrictedKaprodi) {
        if (!access.studyProgramId || subclo.cloProdi?.studyProgramId !== access.studyProgramId) {
            return res.status(403).json({
                message: "Access denied. Ketua Prodi hanya dapat mengakses data untuk program studinya sendiri.",
            });
        }
    } else if (access.isRestrictedKetuaKK) {
        if (!access.allowedStudyProgramIds.includes(subclo.cloProdi?.studyProgramId)) {
            return res.status(403).json({
                message: "Access denied. Ketua KK hanya dapat mengakses data untuk program studi yang terhubung dengan kelompok keahliannya.",
            });
        }
    }

    res.json({ data: subclo });
});

const updateSubcloProdi = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    const existingSubclo = await prisma.subcloProdi.findUnique({
        where: { id },
        include: { cloProdi: true },
    });
    if (!existingSubclo || existingSubclo.deletedAt) {
        res.status(404);
        throw new Error("Sub clo tidak ditemukan");
    }

    const access = await getAcademicAccessContext(req);
    if (access.isRestrictedKaprodi) {
        if (!access.studyProgramId || existingSubclo.cloProdi?.studyProgramId !== access.studyProgramId) {
            return res.status(403).json({
                message: "Access denied. Ketua Prodi hanya dapat mengubah data untuk program studinya sendiri.",
            });
        }
    } else if (access.isRestrictedKetuaKK) {
        if (!access.allowedStudyProgramIds.includes(existingSubclo.cloProdi?.studyProgramId)) {
            return res.status(403).json({
                message: "Access denied. Ketua KK hanya dapat mengubah data untuk program studi yang terhubung dengan kelompok keahliannya.",
            });
        }
    }

    const updatedSubclo = await prisma.subcloProdi.update({
        where: { id },
        data: {
            name: name !== undefined ? name : existingSubclo.name,
            description: description !== undefined ? description : existingSubclo.description,
        },
    });

    res.json({ message: "Sub clo berhasil diperbarui", data: updatedSubclo });
});

const deleteSubcloProdi = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existingSubclo = await prisma.subcloProdi.findUnique({
        where: { id },
        include: { cloProdi: true },
    });
    if (!existingSubclo || existingSubclo.deletedAt) {
        res.status(404);
        throw new Error("Sub clo tidak ditemukan");
    }

    const access = await getAcademicAccessContext(req);
    if (access.isRestrictedKaprodi) {
        if (!access.studyProgramId || existingSubclo.cloProdi?.studyProgramId !== access.studyProgramId) {
            return res.status(403).json({
                message: "Access denied. Ketua Prodi hanya dapat menghapus data untuk program studinya sendiri.",
            });
        }
    } else if (access.isRestrictedKetuaKK) {
        if (!access.allowedStudyProgramIds.includes(existingSubclo.cloProdi?.studyProgramId)) {
            return res.status(403).json({
                message: "Access denied. Ketua KK hanya dapat menghapus data untuk program studi yang terhubung dengan kelompok keahliannya.",
            });
        }
    }

    await prisma.subcloProdi.update({
        where: { id },
        data: { deletedAt: new Date() },
    });

    res.json({ message: "Sub CLO berhasil dihapus" });
});

export {
    createSubcloProdi,
    getSubcloProdis,
    getSubcloProdiById,
    updateSubcloProdi,
    deleteSubcloProdi,
};