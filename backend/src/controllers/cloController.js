import asyncHandler from "express-async-handler";
import prisma from "../config/prisma.js";
import { getPaginationParams, formatPaginationResponse } from "../utils/paginationHelper.js";
import { sendValidationError, isNil } from "../utils/validationHelper.js";
import { getAcademicAccessContext } from "../middlewares/authorize.js";
import { checkActivePendingRequest } from "../services/approvalService.js";

//create clo
const createCloProdi = asyncHandler(async (req, res) => {
    const { name, description, studyProgramId } = req.body;
    const errors = [];

    if (isNil(name)) errors.push({ field: "name", message: "Nama CLO wajib diisi" });
    if (isNil(description)) errors.push({ field: "description", message: "Deskripsi CLO wajib diisi" });
    if (isNil(studyProgramId)) errors.push({ field: "studyProgramId", message: "ID Program Studi wajib diisi" });

    if (errors.length > 0) return sendValidationError(res, errors);

    const access = await getAcademicAccessContext(req);
    if (access.isRestrictedKaprodi) {
        if (!access.studyProgramId || studyProgramId !== access.studyProgramId) {
            return res.status(403).json({
                message: "Access denied. Ketua Prodi hanya dapat membuat data untuk program studinya sendiri.",
            });
        }
    } else if (access.isRestrictedKetuaKK) {
        if (!access.allowedStudyProgramIds.includes(studyProgramId)) {
            return res.status(403).json({
                message: "Access denied. Ketua KK hanya dapat membuat data CLO untuk program studi yang terhubung dengan kelompok keahliannya.",
            });
        }
    }

    const studyProgram = await prisma.studyProgram.findUnique({
        where: { id: studyProgramId },
    });
    if (!studyProgram || studyProgram.deletedAt) {
        res.status(404);
        throw new Error("Program Studi tidak ditemukan");
    }

    // Jika pembuat adalah Kaprodi, alihkan ke antrean persetujuan (menunggu approval Ketua KK)
    if (access.isRestrictedKaprodi) {
        const changeRequest = await prisma.approvalChangeRequest.create({
            data: {
                entityType: "CLO",
                action: "CREATE",
                targetId: null,
                title: `Penambahan CLO: ${name}`,
                payload: { name, description, studyProgramId },
                oldData: null,
                status: "PENDING",
                studyProgramId,
                requestedById: access.dosen.id,
            },
        });

        return res.status(202).json({
            message: "Permohonan penambahan CLO berhasil diajukan dan sedang menunggu persetujuan Ketua Kelompok Keahlian",
            data: {
                requestId: changeRequest.id,
                status: changeRequest.status,
                entityType: changeRequest.entityType,
                action: changeRequest.action,
            },
        });
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

    const access = await getAcademicAccessContext(req);
    if (access.isRestrictedKaprodi) {
        if (!access.studyProgramId) {
            return res.status(403).json({
                message: "Access denied. Akun Ketua Prodi belum terasosiasi dengan Program Studi manapun.",
            });
        }
        if (studyProgramId && studyProgramId !== access.studyProgramId) {
            return res.status(403).json({
                message: "Access denied. Ketua Prodi hanya dapat mengakses data untuk program studinya sendiri.",
            });
        }
    } else if (access.isRestrictedKetuaKK) {
        if (access.allowedStudyProgramIds.length === 0) {
            return res.status(403).json({
                message: "Access denied. Kelompok Keahlian akun Ketua KK belum terhubung dengan Program Studi manapun.",
            });
        }
        if (studyProgramId && !access.allowedStudyProgramIds.includes(studyProgramId)) {
            return res.status(403).json({
                message: "Access denied. Ketua KK hanya dapat mengakses data untuk program studi yang terhubung dengan kelompok keahliannya.",
            });
        }
    }

    const where = { deletedAt: null };

    if (access.isRestrictedKaprodi) {
        where.studyProgramId = access.studyProgramId;
    } else if (access.isRestrictedKetuaKK) {
        if (studyProgramId) {
            where.studyProgramId = studyProgramId;
        } else {
            where.studyProgramId = { in: access.allowedStudyProgramIds };
        }
    } else if (studyProgramId) {
        where.studyProgramId = studyProgramId;
    }

    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
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
                subcloProdi: {
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
            subcloProdi: {
                where: { deletedAt: null },
            },
        },
    });
    if (!clo || clo.deletedAt) {
        res.status(404);
        throw new Error("CLO tidak ditemukan");
    }

    const access = await getAcademicAccessContext(req);
    if (access.isRestrictedKaprodi) {
        if (!access.studyProgramId || clo.studyProgramId !== access.studyProgramId) {
            return res.status(403).json({
                message: "Access denied. Ketua Prodi hanya dapat mengakses data untuk program studinya sendiri.",
            });
        }
    } else if (access.isRestrictedKetuaKK) {
        if (!access.allowedStudyProgramIds.includes(clo.studyProgramId)) {
            return res.status(403).json({
                message: "Access denied. Ketua KK hanya dapat mengakses data untuk program studi yang terhubung dengan kelompok keahliannya.",
            });
        }
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

    const access = await getAcademicAccessContext(req);
    if (access.isRestrictedKaprodi) {
        if (!access.studyProgramId || existingClo.studyProgramId !== access.studyProgramId) {
            return res.status(403).json({
                message: "Access denied. Ketua Prodi hanya dapat mengubah data untuk program studinya sendiri.",
            });
        }

        const existingPending = await checkActivePendingRequest({
            entityType: "CLO",
            targetId: id,
        });
        if (existingPending) {
            if (existingPending.requestedById === access.dosen.id) {
                const payload = {
                    name: name !== undefined ? name : existingClo.name,
                    description: description !== undefined ? description : existingClo.description,
                };
                const updatedRequest = await prisma.approvalChangeRequest.update({
                    where: { id: existingPending.id },
                    data: {
                        action: "UPDATE",
                        title: `Pembaruan CLO: ${payload.name}`,
                        payload,
                    },
                });

                return res.status(200).json({
                    message: "Permohonan pembaruan CLO berhasil diperbarui dengan data terbaru dan sedang menunggu persetujuan Ketua Kelompok Keahlian",
                    data: {
                        requestId: updatedRequest.id,
                        status: updatedRequest.status,
                        entityType: updatedRequest.entityType,
                        action: updatedRequest.action,
                    },
                });
            } else {
                return res.status(409).json({
                    message: `Data ini sedang dalam proses permohonan persetujuan oleh ${existingPending.requestedBy?.name || "pengguna lain"}. Perubahan tidak dapat diajukan sampai usulan sebelumnya selesai.`,
                    data: { requestId: existingPending.id },
                });
            }
        }

        const payload = {
            name: name !== undefined ? name : existingClo.name,
            description: description !== undefined ? description : existingClo.description,
        };

        const changeRequest = await prisma.approvalChangeRequest.create({
            data: {
                entityType: "CLO",
                action: "UPDATE",
                targetId: id,
                title: `Pembaruan CLO: ${payload.name}`,
                payload,
                oldData: {
                    name: existingClo.name,
                    description: existingClo.description,
                },
                status: "PENDING",
                studyProgramId: existingClo.studyProgramId,
                requestedById: access.dosen.id,
            },
        });

        return res.status(202).json({
            message: "Permohonan pembaruan CLO berhasil diajukan dan sedang menunggu persetujuan Ketua Kelompok Keahlian",
            data: {
                requestId: changeRequest.id,
                status: changeRequest.status,
                entityType: changeRequest.entityType,
                action: changeRequest.action,
            },
        });
    } else if (access.isRestrictedKetuaKK) {
        if (!access.allowedStudyProgramIds.includes(existingClo.studyProgramId)) {
            return res.status(403).json({
                message: "Access denied. Ketua KK hanya dapat mengubah data untuk program studi yang terhubung dengan kelompok keahliannya.",
            });
        }
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

    const access = await getAcademicAccessContext(req);
    if (access.isRestrictedKaprodi) {
        if (!access.studyProgramId || existingClo.studyProgramId !== access.studyProgramId) {
            return res.status(403).json({
                message: "Access denied. Ketua Prodi hanya dapat menghapus data untuk program studinya sendiri.",
            });
        }

        const existingPending = await checkActivePendingRequest({
            entityType: "CLO",
            targetId: id,
        });
        if (existingPending) {
            if (existingPending.requestedById === access.dosen.id) {
                const updatedRequest = await prisma.approvalChangeRequest.update({
                    where: { id: existingPending.id },
                    data: {
                        action: "DELETE",
                        title: `Penghapusan CLO: ${existingClo.name}`,
                        payload: {},
                    },
                });

                return res.status(200).json({
                    message: "Permohonan CLO berhasil diperbarui menjadi permohonan penghapusan dan sedang menunggu persetujuan Ketua Kelompok Keahlian",
                    data: {
                        requestId: updatedRequest.id,
                        status: updatedRequest.status,
                        entityType: updatedRequest.entityType,
                        action: updatedRequest.action,
                    },
                });
            } else {
                return res.status(409).json({
                    message: `Data ini sedang dalam proses permohonan persetujuan oleh ${existingPending.requestedBy?.name || "pengguna lain"}. Perubahan tidak dapat diajukan sampai usulan sebelumnya selesai.`,
                    data: { requestId: existingPending.id },
                });
            }
        }

        const changeRequest = await prisma.approvalChangeRequest.create({
            data: {
                entityType: "CLO",
                action: "DELETE",
                targetId: id,
                title: `Penghapusan CLO: ${existingClo.name}`,
                payload: {},
                oldData: {
                    name: existingClo.name,
                    description: existingClo.description,
                },
                status: "PENDING",
                studyProgramId: existingClo.studyProgramId,
                requestedById: access.dosen.id,
            },
        });

        return res.status(202).json({
            message: "Permohonan penghapusan CLO berhasil diajukan dan sedang menunggu persetujuan Ketua Kelompok Keahlian",
            data: {
                requestId: changeRequest.id,
                status: changeRequest.status,
                entityType: changeRequest.entityType,
                action: changeRequest.action,
            },
        });
    } else if (access.isRestrictedKetuaKK) {
        if (!access.allowedStudyProgramIds.includes(existingClo.studyProgramId)) {
            return res.status(403).json({
                message: "Access denied. Ketua KK hanya dapat menghapus data untuk program studi yang terhubung dengan kelompok keahliannya.",
            });
        }
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
        