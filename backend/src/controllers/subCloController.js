import asyncHandler from "express-async-handler";
import prisma from "../config/prisma.js";
import { getPaginationParams, formatPaginationResponse } from "../utils/paginationHelper.js";
import { sendValidationError, isNil } from "../utils/validationHelper.js";

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

    const subclo = await prisma.subcloProdi.create({
        data: { name, description, cloProdiId },
    });

    res.status(201).json({ message: "Sub CLO berhasil dibuat", data: subclo });
});

const getSubcloProdis = asyncHandler(async (req, res) => {
    const paginationParams = getPaginationParams(req.query);
    const { search, cloProdiId } = req.query;

    const where = { deletedAt: null };

    if (cloProdiId){
        where.cloProdiId = cloProdiId;
    }

    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive"}},
            { description: { contains: search, mode: "insensitive"}},
        ];
    }

    const [total, subcloList] = await Promise.all([
        prisma.subcloProdi.count({ where }),
        prisma.subcloProdi.findMany({
            where,
            skip: paginationParams.skip,
            take: paginationParams.take,
            include: {
                cloProdi: true
            },
            orderBy: { name: "asc" }
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
        throw new Error("Sub clo tidak didetumakn");
    }

    res.json({ data: subclo });
});

const updateSubcloProdi = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    const existingSubclo = await prisma.subcloProdi.findUnique({ where: { id } });
    if (!existingSubclo || existingSubclo.deletedAt){
        res.status(404);
        throw new Error("Sub clo tidak ditemukan");
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

    const existingSubclo = await prisma.subcloProdi.findUnique({ where: { id } });
    if (!existingSubclo || existingSubclo.deletedAt) {
        res.status(404);
        throw new Error("Sub clo tidak ditemukan");
    }

    await prisma.subcloProdi.update({
        where: { id },
        data: { deletedAt: new Date() },
    });

    res.json({ message: "Sub CLO berhasil dihapus"});
});

export {
    createSubcloProdi,
    getSubcloProdis,
    getSubcloProdiById,
    updateSubcloProdi,
    deleteSubcloProdi,
}