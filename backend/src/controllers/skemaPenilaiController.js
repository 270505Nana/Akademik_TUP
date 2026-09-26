import asyncHandler from "express-async-handler";
import prisma from "../config/prisma.js";
import { getPaginationParams, formatPaginationResponse } from "../utils/paginationHelper.js";
import { sendValidationError, isNil } from "../utils/validationHelper.js";

// create skema penilai
const createSkemaPenilai = asyncHandler(async (req, res) => {
    const { type, bobot, studyProgramId } = req.body;
    const errors = [];

    if (isNil(type)) errors.push({ field: "type", message: "Tipe penilai wajib diisi (contoh: pembimbing_1, penguji_1)" });
    if (isNil(bobot)) errors.push({ field: "bobot", message: "Bobot nilai wajib diisi" });
    if (isNil(studyProgramId)) errors.push({ field: "studyProgramId", message: "ID Program Studi wajib diisi" });

    if (errors.length > 0) return sendValidationError(res, errors);

    const studyProgram = await prisma.studyProgram.findUnique({
        where: { id: studyProgramId },
    });
    
    if (!studyProgram || studyProgram.deletedAt) {
        res.status(404);
        throw new Error("Program Studi tidak ditemukan");
    }

    const skema = await prisma.skemaPenilaiProdi.create({
        data: { 
            type, 
            bobot: parseFloat(bobot), 
            studyProgramId 
        },
    });
    res.status(201).json({ message: "Skema Penilai berhasil dibuat", data: skema });
});

// get all skema penilai
const getSkemaPenilais = asyncHandler(async (req, res) => {
    const paginationParams = getPaginationParams(req.query);
    const { search, studyProgramId } = req.query;

    const where = { deletedAt: null };

    if (studyProgramId) {
        where.studyProgramId = studyProgramId;
    }
    if (search) {
        where.OR = [
            { type: { contains: search, mode: "insensitive" } },
        ];
    }
    
    const [total, skemaList] = await Promise.all([
        prisma.skemaPenilaiProdi.count({ where }),
        prisma.skemaPenilaiProdi.findMany({
            where,
            skip: paginationParams.skip,
            take: paginationParams.take,
            include: {
                studyProgram: true,
            },
            orderBy: { createdAt: "asc" },
        }),
    ]);
    res.json(formatPaginationResponse(skemaList, total, paginationParams));
});

// get skema penilai by id
const getSkemaPenilaiById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const skema = await prisma.skemaPenilaiProdi.findUnique({
        where: { id },
        include: {
            studyProgram: true,
        },
    });
    
    if (!skema || skema.deletedAt) {
        res.status(404);
        throw new Error("Skema Penilai tidak ditemukan");
    }
    res.json({ data: skema });
});

// update skema penilai
const updateSkemaPenilai = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { type, bobot } = req.body;

    const existingSkema = await prisma.skemaPenilaiProdi.findUnique({ where: { id } });
    if (!existingSkema || existingSkema.deletedAt) {
        res.status(404);
        throw new Error("Skema Penilai tidak ditemukan");
    }

    const updatedSkema = await prisma.skemaPenilaiProdi.update({
        where: { id },
        data: {
            type: type !== undefined ? type : existingSkema.type,
            bobot: bobot !== undefined ? parseFloat(bobot) : existingSkema.bobot,
        },
    });
    res.json({ message: "Skema Penilai berhasil diperbarui", data: updatedSkema });
});

// delete skema penilai
const deleteSkemaPenilai = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existingSkema = await prisma.skemaPenilaiProdi.findUnique({ where: { id } });
    if (!existingSkema || existingSkema.deletedAt) {
        res.status(404);
        throw new Error("Skema Penilai tidak ditemukan");
    }

    await prisma.skemaPenilaiProdi.update({
        where: { id },
        data: { deletedAt: new Date() },
    });
    res.json({ message: "Skema Penilai berhasil dihapus" });
});

export {
    createSkemaPenilai,
    getSkemaPenilais,
    getSkemaPenilaiById,
    updateSkemaPenilai,
    deleteSkemaPenilai,
};