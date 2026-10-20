import prisma from "../config/prisma.js";
import { getPaginationParams, formatPaginationResponse } from "../utils/paginationHelper.js";
import { checkActivePendingRequest } from "./approvalService.js";

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

export const createSkemaPerhitungan = async (data, access) => {
    if (access.isRestrictedKaprodi) {
        if (!access.studyProgramId || data.studyProgramId !== access.studyProgramId) {
            throwError(403, "Access denied. Ketua Prodi hanya dapat membuat data untuk program studinya sendiri.");
        }
    } else if (access.isRestrictedKetuaKK) {
        if (!access.allowedStudyProgramIds.includes(data.studyProgramId)) {
            throwError(403, "Access denied. Ketua KK hanya dapat membuat data untuk program studi yang terhubung dengan kelompok keahliannya.");
        }
    } else if (!access.isFullAccess) {
        throwError(403, "Access denied. Hanya Admin, Ketua KK, atau Ketua Prodi yang dapat mengakses.");
    }

    const cloProdi = await prisma.cloProdi.findFirst({
        where: { id: data.cloProdiId, studyProgramId: data.studyProgramId, deletedAt: null },
        include: { studyProgram: true }
    });
    if (!cloProdi) throwError(404, "CLO tidak ditemukan pada Program Studi ini");

    const existing = await skemaModel.findFirst({
        where: { studyProgramId: data.studyProgramId, cloProdiId: data.cloProdiId, deletedAt: null },
    });
    if (existing) throwError(409, "Skema perhitungan untuk CLO ini sudah ada");

    if (access.isRestrictedKaprodi) {
        const changeRequest = await prisma.approvalChangeRequest.create({
            data: {
                entityType: "SKEMA_PERHITUNGAN",
                action: "CREATE",
                targetId: null,
                title: `Penambahan Skema Perhitungan (CLO: ${cloProdi.name})`,
                payload: {
                    bobotRataRataPembimbing: data.bobotRataRataPembimbing,
                    bobotRataRataPenguji: data.bobotRataRataPenguji,
                    studyProgramId: data.studyProgramId,
                    cloProdiId: data.cloProdiId
                },
                oldData: null,
                status: "PENDING",
                studyProgramId: data.studyProgramId,
                requestedById: access.dosen.id,
            },
        });
        return { isPending: true, data: changeRequest };
    }
    const result = await skemaModel.create({
        data: { 
            bobotRataRataPembimbing: data.bobotRataRataPembimbing, 
            bobotRataRataPenguji: data.bobotRataRataPenguji, 
            studyProgramId: data.studyProgramId,
            cloProdiId: data.cloProdiId
        },
        include: { studyProgram: true, cloProdi: true },
    });
    return { isPending: false, data: result };
};

export const getSkemaPerhitungans = async (query, access) => {
    const paginationParams = getPaginationParams(query);
    const { studyProgramId, cloProdiId, sortBy, sortOrder } = query;

    const where = { deletedAt: null };
    if (access.isRestrictedKaprodi) {
        if (!access.studyProgramId) throwError(403, "Access denied. Akun Ketua Prodi belum terasosiasi dengan Program Studi manapun.");
        if (studyProgramId && studyProgramId !== access.studyProgramId) {
            throwError(403, "Access denied. Ketua Prodi hanya dapat mengakses data untuk program studinya sendiri.");
        }
        where.studyProgramId = access.studyProgramId;
    } else if (access.isRestrictedKetuaKK) {
        if (access.allowedStudyProgramIds.length === 0) throwError(403, "Access denied. Kelompok Keahlian belum terhubung dengan Program Studi manapun.");
        if (studyProgramId) {
            if (!access.allowedStudyProgramIds.includes(studyProgramId)) throwError(403, "Access denied. Ketua KK tidak dapat mengakses prodi ini.");
            where.studyProgramId = studyProgramId;
        } else {
            where.studyProgramId = { in: access.allowedStudyProgramIds };
        }
    } else if (studyProgramId) {
        where.studyProgramId = studyProgramId;
    }

    if (cloProdiId) where.cloProdiId = cloProdiId;

    const orderDirection = (sortOrder || "asc").toLowerCase() === "desc" ? "desc" : "asc";
    const sortField = (sortBy || "createdAt").trim();

    let orderBy = { createdAt: orderDirection };
    if (sortField === "bobotRataRataPembimbing") {
        orderBy = { bobotRataRataPembimbing: orderDirection };
    } else if (sortField === "bobotRataRataPenguji") {
        orderBy = { bobotRataRataPenguji: orderDirection };
    } else if (sortField === "createdAt") {
        orderBy = { createdAt: orderDirection };
    }
    
    const [total, skemaList] = await Promise.all([
        skemaModel.count({ where }),
        skemaModel.findMany({
            where,
            skip: paginationParams.skip,
            take: paginationParams.take,
            include: { studyProgram: true, cloProdi: true },
            orderBy,
        }),
    ]);
    
    return formatPaginationResponse(skemaList, total, paginationParams);
};

export const getSkemaPerhitunganById = async (id, access) => {
    const skema = await findActiveOrThrow(id);

    if (access.isRestrictedKaprodi && skema.studyProgramId !== access.studyProgramId) {
        throwError(403, "Access denied.");
    } else if (access.isRestrictedKetuaKK && !access.allowedStudyProgramIds.includes(skema.studyProgramId)) {
        throwError(403, "Access denied.");
    }

    return skema;
};

export const updateSkemaPerhitungan = async (id, data, access) => {
    const existing = await findActiveOrThrow(id);

    if (access.isRestrictedKaprodi) {
        if (existing.studyProgramId !== access.studyProgramId) throwError(403, "Access denied.");

        const newBobotPembimbing = data.bobotRataRataPembimbing ?? Number(existing.bobotRataRataPembimbing);
        const newBobotPenguji = data.bobotRataRataPenguji ?? Number(existing.bobotRataRataPenguji);
        
        if (Math.abs(newBobotPembimbing + newBobotPenguji - 1) >= 0.001) {
            throwError(400, "Total kombinasi bobot pembimbing + penguji harus 1 (100%)");
        }

        const payload = { bobotRataRataPembimbing: newBobotPembimbing, bobotRataRataPenguji: newBobotPenguji };

        const existingPending = await checkActivePendingRequest({ entityType: "SKEMA_PERHITUNGAN", targetId: id });
        if (existingPending) {
            if (existingPending.requestedById === access.dosen.id) {
                const updatedRequest = await prisma.approvalChangeRequest.update({
                    where: { id: existingPending.id },
                    data: {
                        action: "UPDATE",
                        title: `Pembaruan Skema Perhitungan (CLO: ${existing.cloProdi.name})`,
                        payload,
                    },
                });
                return { isPending: true, isUpdatedPending: true, data: updatedRequest };
            } else {
                throwError(409, `Data ini sedang dalam proses permohonan persetujuan oleh pengguna lain.`);
            }
        }

        const changeRequest = await prisma.approvalChangeRequest.create({
            data: {
                entityType: "SKEMA_PERHITUNGAN",
                action: "UPDATE",
                targetId: id,
                title: `Pembaruan Skema Perhitungan (CLO: ${existing.cloProdi.name})`,
                payload,
                oldData: { bobotRataRataPembimbing: existing.bobotRataRataPembimbing, bobotRataRataPenguji: existing.bobotRataRataPenguji },
                status: "PENDING",
                studyProgramId: existing.studyProgramId,
                requestedById: access.dosen.id,
            },
        });
        return { isPending: true, data: changeRequest };
    } else if (access.isRestrictedKetuaKK && !access.allowedStudyProgramIds.includes(existing.studyProgramId)) {
        throwError(403, "Access denied.");
    } else if (!access.isFullAccess && !access.isRestrictedKetuaKK) {
        throwError(403, "Access denied. Hanya Admin, Ketua KK, atau Ketua Prodi yang dapat mengakses.");
    }

    const newBobotPembimbing = data.bobotRataRataPembimbing ?? Number(existing.bobotRataRataPembimbing);
    const newBobotPenguji = data.bobotRataRataPenguji ?? Number(existing.bobotRataRataPenguji);
    if (Math.abs(newBobotPembimbing + newBobotPenguji - 1) >= 0.001) throwError(400, "Total kombinasi bobot pembimbing + penguji harus 1 (100%)");

    const result = await skemaModel.update({
        where: { id },
        data: { ...data },
        include: { studyProgram: true, cloProdi: true }
    });
    return { isPending: false, data: result };
};

export const deleteSkemaPerhitungan = async (id, access) => {
    const existing = await findActiveOrThrow(id);

    if (access.isRestrictedKaprodi) {
        if (existing.studyProgramId !== access.studyProgramId) throwError(403, "Access denied.");

        const existingPending = await checkActivePendingRequest({ entityType: "SKEMA_PERHITUNGAN", targetId: id });
        if (existingPending) {
            if (existingPending.requestedById === access.dosen.id) {
                const updatedRequest = await prisma.approvalChangeRequest.update({
                    where: { id: existingPending.id },
                    data: { action: "DELETE", title: `Penghapusan Skema Perhitungan (CLO: ${existing.cloProdi.name})`, payload: {} },
                });
                return { isPending: true, isUpdatedPending: true, data: updatedRequest };
            } else {
                throwError(409, `Data ini sedang dalam proses permohonan persetujuan oleh pengguna lain.`);
            }
        }

        const changeRequest = await prisma.approvalChangeRequest.create({
            data: {
                entityType: "SKEMA_PERHITUNGAN",
                action: "DELETE",
                targetId: id,
                title: `Penghapusan Skema Perhitungan (CLO: ${existing.cloProdi.name})`,
                payload: {},
                oldData: { bobotRataRataPembimbing: existing.bobotRataRataPembimbing, bobotRataRataPenguji: existing.bobotRataRataPenguji },
                status: "PENDING",
                studyProgramId: existing.studyProgramId,
                requestedById: access.dosen.id,
            },
        });
        return { isPending: true, data: changeRequest };
    } else if (access.isRestrictedKetuaKK && !access.allowedStudyProgramIds.includes(existing.studyProgramId)) {
        throwError(403, "Access denied.");
    } else if (!access.isFullAccess && !access.isRestrictedKetuaKK) {
        throwError(403, "Access denied. Hanya Admin, Ketua KK, atau Ketua Prodi yang dapat mengakses.");
    }

    return await skemaModel.update({
        where: { id },
        data: { deletedAt: new Date() },
    });
};

export const getBobotUntukClo = async (studyProgramId, cloProdiId) => {
    const skema = await skemaModel.findFirst({
        where: { studyProgramId, cloProdiId, deletedAt: null },
    });

    if (!skema) throwError(404, "Skema perhitungan belum diatur untuk CLO ini");
    
    return {
        pembimbing: Number(skema.bobotRataRataPembimbing),
        penguji: Number(skema.bobotRataRataPenguji),
    };
};
