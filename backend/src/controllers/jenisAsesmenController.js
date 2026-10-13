import asyncHandler from "express-async-handler";
import prisma from "../config/prisma.js";
import { getPaginationParams, formatPaginationResponse } from "../utils/paginationHelper.js";
import { sendValidationError, isNil } from "../utils/validationHelper.js";
import { getAcademicAccessContext } from "../middlewares/authorize.js";
import { checkActivePendingRequest } from "../services/approvalService.js";

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
    } else if (access.isRestrictedKetuaKK) {
        if (!access.allowedStudyProgramIds.includes(cloProdi.studyProgramId)) {
            return res.status(403).json({
                message: "Access denied. Ketua KK hanya dapat membuat data Jenis Asesmen untuk program studi yang terhubung dengan kelompok keahliannya.",
            });
        }
    }

    // Jika pembuat adalah Kaprodi, alihkan ke antrean persetujuan (menunggu approval Ketua KK)
    if (access.isRestrictedKaprodi) {
        const changeRequest = await prisma.approvalChangeRequest.create({
            data: {
                entityType: "JENIS_ASESMEN",
                action: "CREATE",
                targetId: null,
                title: `Penambahan Jenis Asesmen: ${content} (CLO: ${cloProdi.name})`,
                payload: { content, bobot: parseFloat(bobot), cloProdiId },
                oldData: null,
                status: "PENDING",
                studyProgramId: cloProdi.studyProgramId,
                requestedById: access.dosen.id,
            },
        });

        return res.status(202).json({
            message: "Permohonan penambahan Jenis Asesmen berhasil diajukan dan sedang menunggu persetujuan Ketua Kelompok Keahlian",
            data: {
                requestId: changeRequest.id,
                status: changeRequest.status,
                entityType: changeRequest.entityType,
                action: changeRequest.action,
            },
        });
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
    } else if (access.isRestrictedKetuaKK) {
        if (!access.allowedStudyProgramIds.includes(jenisAsesmen.cloProdi?.studyProgramId)) {
            return res.status(403).json({
                message: "Access denied. Ketua KK hanya dapat mengakses data untuk program studi yang terhubung dengan kelompok keahliannya.",
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

        const existingPending = await checkActivePendingRequest({
            entityType: "JENIS_ASESMEN",
            targetId: id,
        });
        if (existingPending) {
            if (existingPending.requestedById === access.dosen.id) {
                const payload = {
                    content: content !== undefined ? content : existingAsesmen.content,
                    bobot: bobot !== undefined ? parseFloat(bobot) : existingAsesmen.bobot,
                };
                const updatedRequest = await prisma.approvalChangeRequest.update({
                    where: { id: existingPending.id },
                    data: {
                        action: "UPDATE",
                        title: `Pembaruan Jenis Asesmen: ${payload.content}`,
                        payload,
                    },
                });

                return res.status(200).json({
                    message: "Permohonan pembaruan Jenis Asesmen berhasil diperbarui dengan data terbaru dan sedang menunggu persetujuan Ketua Kelompok Keahlian",
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
            content: content !== undefined ? content : existingAsesmen.content,
            bobot: bobot !== undefined ? parseFloat(bobot) : existingAsesmen.bobot,
        };

        const changeRequest = await prisma.approvalChangeRequest.create({
            data: {
                entityType: "JENIS_ASESMEN",
                action: "UPDATE",
                targetId: id,
                title: `Pembaruan Jenis Asesmen: ${payload.content}`,
                payload,
                oldData: {
                    content: existingAsesmen.content,
                    bobot: existingAsesmen.bobot,
                },
                status: "PENDING",
                studyProgramId: existingAsesmen.cloProdi.studyProgramId,
                requestedById: access.dosen.id,
            },
        });

        return res.status(202).json({
            message: "Permohonan pembaruan Jenis Asesmen berhasil diajukan dan sedang menunggu persetujuan Ketua Kelompok Keahlian",
            data: {
                requestId: changeRequest.id,
                status: changeRequest.status,
                entityType: changeRequest.entityType,
                action: changeRequest.action,
            },
        });
    } else if (access.isRestrictedKetuaKK) {
        if (!access.allowedStudyProgramIds.includes(existingAsesmen.cloProdi?.studyProgramId)) {
            return res.status(403).json({
                message: "Access denied. Ketua KK hanya dapat mengubah data untuk program studi yang terhubung dengan kelompok keahliannya.",
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

        const existingPending = await checkActivePendingRequest({
            entityType: "JENIS_ASESMEN",
            targetId: id,
        });
        if (existingPending) {
            if (existingPending.requestedById === access.dosen.id) {
                const updatedRequest = await prisma.approvalChangeRequest.update({
                    where: { id: existingPending.id },
                    data: {
                        action: "DELETE",
                        title: `Penghapusan Jenis Asesmen: ${existingAsesmen.content}`,
                        payload: {},
                    },
                });

                return res.status(200).json({
                    message: "Permohonan Jenis Asesmen berhasil diperbarui menjadi permohonan penghapusan dan sedang menunggu persetujuan Ketua Kelompok Keahlian",
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
                entityType: "JENIS_ASESMEN",
                action: "DELETE",
                targetId: id,
                title: `Penghapusan Jenis Asesmen: ${existingAsesmen.content}`,
                payload: {},
                oldData: {
                    content: existingAsesmen.content,
                    bobot: existingAsesmen.bobot,
                },
                status: "PENDING",
                studyProgramId: existingAsesmen.cloProdi.studyProgramId,
                requestedById: access.dosen.id,
            },
        });

        return res.status(202).json({
            message: "Permohonan penghapusan Jenis Asesmen berhasil diajukan dan sedang menunggu persetujuan Ketua Kelompok Keahlian",
            data: {
                requestId: changeRequest.id,
                status: changeRequest.status,
                entityType: changeRequest.entityType,
                action: changeRequest.action,
            },
        });
    } else if (access.isRestrictedKetuaKK) {
        if (!access.allowedStudyProgramIds.includes(existingAsesmen.cloProdi?.studyProgramId)) {
            return res.status(403).json({
                message: "Access denied. Ketua KK hanya dapat menghapus data untuk program studi yang terhubung dengan kelompok keahliannya.",
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
