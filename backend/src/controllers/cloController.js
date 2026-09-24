import asyncHandler from "express-async-handler";
import prisma from "../config/prisma.js";
import { getPaginationParams, formatPaginationResponse } from "../utils/paginationHelper.js";
import {sendValidationError, isNil } from "../utils/validationHelper.js";

//create clo
const createCloProdi = asyncHandler(async (req, res) => {
    const { name, description, studyProgramId } = req.body;
    const errors = [];

    if (isNil(name)) errors.push({ field: "name", message: "Nama CLO wajib diisi" });
    if (isNil(description)) errors.push({ field: "description", message: "Deskripsi CLO wajib diisi" });
    if (isNil(studyProgramId)) errors.push({ field: "studyProgramId", message: "ID Program Studi wajib diisi" });

    if (errors.length > 0) return sendValidationError(res, errors);

    const studyProgram = await prisma.studyProgram.findUnique({
        where: { id: studyProgramId },
    });
    if (!studyProgram || studyProgram.deletedAt) {
        res.status(404);
        throw new Error("Program Studi tidak ditemukan");
    }
    const clo = await prisma.cloProdi.create({
        data: { name, description, studyProgramId },
    });
    res.status(201).json({ message: "CLO berhasil dibuat", data: clo });
});

//get all clo
const getCloProdis = asyncHandler(async (req, res) => {
    const paginationParams = getPaginationParams(req.query);
    const { search, studyProgramId } = req.query;

    const where = {deletedAt: null};

    if (studyProgramId) {
        where.studyProgramId = studyProgramId;
    }
    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            {description: { contains: search, mode: "insensitive" } },
        ];
    }
    const [total, cloList] = await Promise.all([
        prisma.cloProdi.count({ where }),
        prisma.cloProdi.findMany({
            where,
            skip: paginationParams.skip,
            take: paginationParams.take,
            include: {
                studyProgram: true,
                subcloProdis: {
                    where: { deletedAt: null },
                }
            },
            orderBy: { name: "asc" },
        }),
    ]);
    res.json(formatPaginationResponse(cloList, total, paginationParams));
});

//get clo id
const getCloProdiById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const clo = await prisma.cloProdi.findUnique({
        where: { id },
        include: {
            studyProgram: true,
            subcloProdis: {
                where: { deletedAt: null },
            },
        },
    });
    if (!clo || clo.deletedAt) {
        res.status(404);
        throw new Error("CLO tidak ditemukan");
    }
    res.json({ data: clo });
});

//update clo
const updateCloProdi = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    const existingClo = await prisma.cloProdi.findUnique({ where: { id } });
    if (!existingClo || existingClo.deletedAt) {
        res.status(404);
        throw new Error("CLO tidak ditemukan");
    }

    const updatedClo = await prisma.cloProdi.update({
        where: { id },
        data: {
            name: name !== undefined ? name : existingClo.name,
            description: description !== undefined ? description : existingClo.description,
        },
    });
    res.json({ message: "CLO berhasil diperbarui", data: updatedClo });
});

//delete clo
const deleteCloProdi = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existingClo = await prisma.cloProdi.findUnique({ where: { id } });
    if (!existingClo || existingClo.deletedAt) {
        res.status(404);
        throw new Error("CLO tidak ditemukan");
    }

    await prisma.cloProdi.update({
        where: { id },
        data: { deletedAt: new Date() },
    });
    res.json({ message: "CLO berhasil dihapus" });
});

export {
    createCloProdi,
    getCloProdis,
    getCloProdiById,
    updateCloProdi,
    deleteCloProdi,
};
        