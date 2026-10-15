import prisma from "../config/prisma.js";
import { getPaginationParams, formatPaginationResponse } from "../utils/paginationHelper.js";

const skemaModel = prisma.skemaPerhitunganNilaiBeritaAcaraTugasAkhirProdi;

const throwError = (statusCode, message) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    throw error;
};

const findActiveOrThrow = async (id) => {
    const skema = await skemaModel.findFirst({
        where: { id, deletedAt: null },
        include: { studyProgram: true, cloProdi: true },
    });
    if (!skema) throwError(404, "Skema Perhitungan Nilai tidak ditemukan");
    return skema;
};

export const createSkemaPerhitungan = async (data) => {
    const studyProgram = await prisma.studyProgram.findFirst({
        where: { id: data.studyProgramId, deletedAt: null },
    });
    if (!studyProgram) throwError(404, "Program Studi tidak ditemukan");

    if (data.cloProdiId) {
        const cloProdi = await prisma.cloProdi.findFirst({
            where: { id: data.cloProdiId, studyProgramId: data.studyProgramId, deletedAt: null },
        });
        if (!cloProdi) throwError(404, "CLO tidak ditemukan pada Program Studi ini");
    }

    const existing = await skemaModel.findFirst({
        where: { studyProgramId: data.studyProgramId, cloProdiId: data.cloProdiId ?? null, deletedAt: null },
    });
    if (existing) throwError(409, "Skema untuk Prodi/CLO ini sudah ada");

    return await skemaModel.create({
        data: { 
            bobotRataRataPembimbing: data.bobotRataRataPembimbing, 
            bobotRataRataPenguji: data.bobotRataRataPenguji, 
            studyProgramId: data.studyProgramId,
            cloProdiId: data.cloProdiId ?? null
        },
        include: { studyProgram: true, cloProdi: true },
    });
};

export const getSkemaPerhitungans = async (query) => {
    const paginationParams = getPaginationParams(query);
    const { studyProgramId, cloProdiId } = query;

    const where = { deletedAt: null };
    if (studyProgramId) where.studyProgramId = studyProgramId;
    if (cloProdiId !== undefined) where.cloProdiId = cloProdiId || null;
    
    const [total, skemaList] = await Promise.all([
        skemaModel.count({ where }),
        skemaModel.findMany({
            where,
            skip: paginationParams.skip,
            take: paginationParams.take,
            include: { studyProgram: true, cloProdi: true },
            orderBy: { createdAt: "asc" },
        }),
    ]);
    
    return formatPaginationResponse(skemaList, total, paginationParams);
};

export const getSkemaPerhitunganById = async (id) => {
    return await findActiveOrThrow(id);
};

export const updateSkemaPerhitungan = async (id, data) => {
    const existing = await findActiveOrThrow(id);

    const newBobotPembimbing = data.bobotRataRataPembimbing ?? Number(existing.bobotRataRataPembimbing);
    const newBobotPenguji = data.bobotRataRataPenguji ?? Number(existing.bobotRataRataPenguji);
    
    if (Math.abs(newBobotPembimbing + newBobotPenguji - 1) >= 0.001) {
        throwError(400, "Total kombinasi bobot pembimbing + penguji harus 1 (100%)");
    }

    return await skemaModel.update({
        where: { id },
        data: { ...data },
        include: { studyProgram: true, cloProdi: true }
    });
};

export const deleteSkemaPerhitungan = async (id) => {
    await findActiveOrThrow(id);

    return await skemaModel.update({
        where: { id },
        data: { deletedAt: new Date() },
    });
};

// Helper pencarian bobot Ra/Rb spesifik CLO (Fallback ke Default Prodi jika null)
export const getBobotUntukClo = async (studyProgramId, cloProdiId) => {
    const kandidat = await skemaModel.findMany({
        where: {
            studyProgramId,
            deletedAt: null,
            OR: [{ cloProdiId }, { cloProdiId: null }],
        },
    });

    const skema = kandidat.find((s) => s.cloProdiId === cloProdiId) ?? kandidat.find((s) => s.cloProdiId === null);
    
    if (!skema) throwError(404, "Skema perhitungan belum diatur untuk prodi ini");
    
    return {
        pembimbing: Number(skema.bobotRataRataPembimbing),
        penguji: Number(skema.bobotRataRataPenguji),
    };
};