import prisma from "../config/prisma.js";

/**
 * Mencari periode pelaksanaan sidang yang aktif (isOpen: true) atau yang terakhir aktif
 */
export const getActiveOrLatestPelaksanaanSidangPeriod = async () => {
  const active = await prisma.sidangPeriod.findFirst({
    where: {
      category: "pelaksanaan",
      isOpen: true,
      deletedAt: null,
    },
    orderBy: { updatedAt: "desc" },
  });

  if (active) return active;

  return await prisma.sidangPeriod.findFirst({
    where: {
      category: "pelaksanaan",
      deletedAt: null,
    },
    orderBy: { endDate: "desc" },
  });
};

/**
 * Helper untuk menghitung skemaPerhitunganNilai otomatis dari snapshot penilaian dosen
 */
export const calculateSkemaPerhitunganNilai = async (sidangRegistration) => {
  const studyProgramId = sidangRegistration.mahasiswa?.studyProgramId;
  if (!studyProgramId) return [];

  const cloList = await prisma.cloProdi.findMany({
    where: { studyProgramId, deletedAt: null },
    include: {
      subcloProdi: { where: { deletedAt: null }, orderBy: { name: "asc" } },
      jenisAsesmenClo: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } },
    },
    orderBy: { name: "asc" },
  });

  if (!cloList.length) return [];

  const skemaPenilaiList = await prisma.skemaPenilaiProdi.findMany({
    where: { studyProgramId, deletedAt: null },
  });

  const hasMultiplePembimbing = Boolean(
    sidangRegistration.dosenPembimbing1Id && sidangRegistration.dosenPembimbing2Id
  );
  const hasMultiplePenguji = Boolean(
    sidangRegistration.dosenPenguji1Id && sidangRegistration.dosenPenguji2Id
  );

  const getBobotDefaultPenilai = (peran) => {
    if (peran.startsWith("dosenPembimbing") && !hasMultiplePembimbing) return 1.0;
    if (peran.startsWith("dosenPenguji") && !hasMultiplePenguji) return 1.0;
    const found = skemaPenilaiList.find((s) => s.peran === peran);
    if (found && found.bobot != null) return Number(found.bobot);
    return 0.5;
  };

  const skemaPerhitunganList =
    await prisma.skemaPerhitunganNilaiBeritaAcaraTugasAkhirProdi.findMany({
      where: { studyProgramId, deletedAt: null },
    });

  const getBobotRaRbClo = (cloId) => {
    const specific = skemaPerhitunganList.find((s) => s.cloProdiId === cloId);
    if (specific) {
      return {
        bobotPembimbing: Number(specific.bobotRataRataPembimbing),
        bobotPenguji: Number(specific.bobotRataRataPenguji),
      };
    }
    const defaultProdi = skemaPerhitunganList.find((s) => s.cloProdiId === null);
    if (defaultProdi) {
      return {
        bobotPembimbing: Number(defaultProdi.bobotRataRataPembimbing),
        bobotPenguji: Number(defaultProdi.bobotRataRataPenguji),
      };
    }
    return { bobotPembimbing: 0.6, bobotPenguji: 0.4 };
  };

  const assignedRoles = [
    {
      peran: "dosenPembimbing1",
      dosenId: sidangRegistration.dosenPembimbing1Id,
    },
    {
      peran: "dosenPembimbing2",
      dosenId: sidangRegistration.dosenPembimbing2Id,
    },
    {
      peran: "dosenPenguji1",
      dosenId: sidangRegistration.dosenPenguji1Id,
    },
    {
      peran: "dosenPenguji2",
      dosenId: sidangRegistration.dosenPenguji2Id,
    },
  ];

  const activePenilai = assignedRoles.filter((item) => item.dosenId !== null);
  const existingPenilaianMap = new Map();
  for (const p of (sidangRegistration.penilaianTugasAkhir || [])) {
    existingPenilaianMap.set(p.dosenPenilaiId, p);
  }

  const hitungSkorCloDosen = (snapshotNilai, cloId) => {
    if (!Array.isArray(snapshotNilai)) return null;
    const cloItem = snapshotNilai.find(
      (c) => c.cloProdiId === cloId || c.cloName === cloId
    );
    if (!cloItem || !Array.isArray(cloItem.asesmen) || cloItem.asesmen.length === 0) {
      return null;
    }
    let totalBobot = 0;
    let totalTertimbang = 0;
    let anyFilled = false;
    for (const a of cloItem.asesmen) {
      if (a.nilai !== null && a.nilai !== undefined) {
        anyFilled = true;
        const b = Number(a.bobot) || 0;
        const n = Number(a.nilai) || 0;
        totalBobot += b;
        totalTertimbang += b * n;
      }
    }
    if (!anyFilled || totalBobot === 0) return null;
    return Number((totalTertimbang / totalBobot).toFixed(2));
  };

  const penilaianList = activePenilai.map((p) => {
    const existing = existingPenilaianMap.get(p.dosenId);
    const isSubmitted = Boolean(existing);
    const bobot =
      existing?.bobotPenilai != null
        ? Number(existing.bobotPenilai)
        : getBobotDefaultPenilai(p.peran);
    return {
      peran: p.peran,
      bobotPenilai: bobot,
      isSubmitted,
      nilai: isSubmitted ? existing.nilai : null,
    };
  });

  const p1 = penilaianList.find((p) => p.peran === "dosenPembimbing1");
  const p2 = penilaianList.find((p) => p.peran === "dosenPembimbing2");
  const u1 = penilaianList.find((p) => p.peran === "dosenPenguji1");
  const u2 = penilaianList.find((p) => p.peran === "dosenPenguji2");

  const wP1 = p1 ? p1.bobotPenilai : 0;
  const wP2 = p2 ? p2.bobotPenilai : 0;
  const totalWP = wP1 + wP2 || 1;

  const wU1 = u1 ? u1.bobotPenilai : 0;
  const wU2 = u2 ? u2.bobotPenilai : 0;
  const totalWU = wU1 + wU2 || 1;

  return cloList.map((clo) => {
    const bobotClo = Number(
      (clo.jenisAsesmenClo || [])
        .reduce((sum, a) => sum + (Number(a.bobot) || 0), 0)
        .toFixed(2)
    );
    const { bobotPembimbing, bobotPenguji } = getBobotRaRbClo(clo.id);

    const scoreP1 = p1 ? hitungSkorCloDosen(p1.nilai, clo.id) : null;
    const scoreP2 = p2 ? hitungSkorCloDosen(p2.nilai, clo.id) : null;
    const scoreU1 = u1 ? hitungSkorCloDosen(u1.nilai, clo.id) : null;
    const scoreU2 = u2 ? hitungSkorCloDosen(u2.nilai, clo.id) : null;

    let rataRataPembimbing = null;
    if (p1 && p2) {
      if (scoreP1 !== null && scoreP2 !== null) {
        rataRataPembimbing = Number(
          ((scoreP1 * wP1 + scoreP2 * wP2) / totalWP).toFixed(2)
        );
      }
    } else if (p1 && scoreP1 !== null) {
      rataRataPembimbing = scoreP1;
    }

    let rataRataPenguji = null;
    if (u1 && u2) {
      if (scoreU1 !== null && scoreU2 !== null) {
        rataRataPenguji = Number(
          ((scoreU1 * wU1 + scoreU2 * wU2) / totalWU).toFixed(2)
        );
      }
    } else if (u1 && scoreU1 !== null) {
      rataRataPenguji = scoreU1;
    }

    let nilaiHasilPerhitungan = null;
    let nilaiTertimbang = null;
    if (rataRataPembimbing !== null && rataRataPenguji !== null) {
      nilaiHasilPerhitungan = Number(
        (
          rataRataPembimbing * bobotPembimbing +
          rataRataPenguji * bobotPenguji
        ).toFixed(2)
      );
      nilaiTertimbang = Number((nilaiHasilPerhitungan * bobotClo).toFixed(2));
    }

    return {
      cloProdiId: clo.id,
      cloName: clo.name,
      deskripsi: clo.description,
      bobotClo,
      bobotPembimbing,
      bobotPenguji,
      nilaiPembimbing1: scoreP1,
      nilaiPembimbing2: scoreP2,
      rataRataPembimbing,
      nilaiPenguji1: scoreU1,
      nilaiPenguji2: scoreU2,
      rataRataPenguji,
      nilaiHasilPerhitungan,
      nilaiTertimbang,
    };
  });
};
