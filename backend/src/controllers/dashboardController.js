import asyncHandler from 'express-async-handler';
import prisma from '../config/prisma.js';
//admin
const getAdminDashboard = asyncHandler(async (req, res) => {
    const [sidangPeriods, rawSidangRegistrations, rawSktaRequests] = await Promise.all([
        prisma.sidangPeriod.findMany({ 
            where: { deletedAt: null },
            orderBy: { startDate: 'desc' } 
        }),
    
        prisma.sidangRegistration.findMany({
            where: { deletedAt: null },
            orderBy: { updatedAt: 'desc' },
            include: {
                mahasiswa: { 
                    include: { 
                        studyProgram: true,
                        user: { select: { name: true } }
                    } 
                },
                sidangPeriod: true,
                sidangRegistrationPeriod: true,
                sidangRegistrationUploads: true, 
                dosenPembimbing1: {
                    include: { user: { select: { name: true } } }
                },
                dosenPembimbing2: {
                    include: { user: { select: { name: true } } }
                }
            }
        }),
    
        prisma.permohonanSkta.findMany({
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
            include: { 
                mahasiswa: {
                    include: {
                        studyProgram: true,
                        user: { select: { name: true } }
                    }
                } 
            }
        })
    ]);
    const sidangRegistrations = rawSidangRegistrations.map(reg => ({
        ...reg,
        mahasiswa: reg.mahasiswa ? {
            ...reg.mahasiswa,
            name: reg.mahasiswa.user?.name || `Mahasiswa #${reg.mahasiswa.nim}`,
            prodi: reg.mahasiswa.studyProgram?.name || '-'
        } : null,
        namaDosenPembimbing1: reg.dosenPembimbing1?.user?.name || '-',
        namaDosenPembimbing2: reg.dosenPembimbing2?.user?.name || '-'
    }));

    const sktaRequests = rawSktaRequests.map(req => ({
        ...req,
        mahasiswa: req.mahasiswa ? {
            ...req.mahasiswa,
            name: req.mahasiswa.user?.name || `Mahasiswa #${req.mahasiswa.nim}`,
            prodi: req.mahasiswa.studyProgram?.name || '-'
        } : null
    }));

    res.json({
        message: "Admin dashboard data retrieved successfully",
        data: { sidangPeriods, sidangRegistrations, sktaRequests }
    });
});
//dosen
const getDosenDashboard = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const dosen = await prisma.dosen.findUnique({
        where: { userId, deletedAt: null },
    });

    if (!dosen) {
        res.status(404);
        throw new Error("Data Dosen tidak ditemukan");
    }

    const totalBimbingan = await prisma.mahasiswa.count({ 
        where: { dosenWaliId: dosen.id, deletedAt: null } 
    });

    const sidangList = await prisma.sidangRegistration.findMany({
        where: {
            deletedAt: null,
            isDraft: false,
            OR: [
                { dosenPembimbing1Id: dosen.id },
                { dosenPembimbing2Id: dosen.id }
            ]
        },
        orderBy: { tglSidang: 'asc' }, 
        include: {
            mahasiswa: { 
                include: { 
                    studyProgram: true,
                    user: { select: { name: true } }
                } 
            },
            //ruangSidang: true 
        }
    });

    const jadwalSidang = sidangList.map((sidang) => {
        let peran = 'Pembimbing';
        if (sidang.dosenPembimbing1Id === dosen.id) peran = 'Pembimbing 1';
        if (sidang.dosenPembimbing2Id === dosen.id) peran = 'Pembimbing 2';

        return {
            id: sidang.id,
            nama: sidang.mahasiswa?.user?.name || `Mahasiswa #${sidang.mahasiswa?.nim}`,
            nim: sidang.mahasiswa?.nim || '-',
            prodi: sidang.mahasiswa?.studyProgram?.name || '-',
            peran: peran,
            hari: sidang.tglSidang ? new Date(sidang.tglSidang).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Belum ditentukan',
            jam: sidang.tglSidang ? new Date(sidang.tglSidang).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-',
            ruangan: sidang.ruanganSidang || 'Ruangan Belum Ditentukan',
            isUrgent: sidang.tglSidang ? (new Date(sidang.tglSidang) - new Date() < 86400000) : false
        };
    });

    res.json({
        message: "Dosen dashboard data retrieved successfully",
        data: {
            statistik: [
                { label: 'Total Mahasiswa Bimbingan', nilai: totalBimbingan, icon: 'users' },
                { label: 'Mahasiswa Siap Sidang', nilai: jadwalSidang.length, icon: 'calendar' },
                { label: 'Nilai yang Belum Diinput', nilai: 0, icon: 'edit' }, 
            ],
            jadwalSidang: jadwalSidang,
            inputNilai: [] 
        }
    });
});
//mahasiswa
const getMahasiswaDashboard = asyncHandler(async (req, res) => {
    const userId = req.user.id; 

    const mahasiswa = await prisma.mahasiswa.findUnique({
        where: { userId, deletedAt: null },
    });

    if (!mahasiswa) {
        res.status(404);
        throw new Error("Data Mahasiswa tidak ditemukan");
    }

    const [sktaRequest, sidangRegistrations, sidangPeriods, yudisiumPeriods] = await Promise.all([
        prisma.permohonanSkta.findFirst({
            where: { mahasiswaId: mahasiswa.id, deletedAt: null },
            orderBy: { createdAt: 'desc' } 
        }),
        prisma.sidangRegistration.findMany({
            where: { mahasiswaId: mahasiswa.id, deletedAt: null },
            orderBy: { createdAt: 'desc' },
            include: {
                sidangPeriod: true,
                sidangRegistrationPeriod: true
            }
        }),
        prisma.sidangPeriod.findMany({ 
            where: { deletedAt: null },
            orderBy: { startDate: 'desc' }
        }),
        prisma.yudisiumPeriod.findMany({ 
            where: { deletedAt: null },
            orderBy: { startDate: 'desc' }
        })
    ]);

    res.json({
        message: "Mahasiswa dashboard data retrieved successfully",
        data: { sktaRequest, sidangRegistrations, sidangPeriods, yudisiumPeriods }
    });
});

export { getAdminDashboard, getDosenDashboard, getMahasiswaDashboard };