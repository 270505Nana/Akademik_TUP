export const mapSkemaPerhitungan = (skema) => {
    if (!skema) return null;

    return {
        id: skema.id,
        bobotRataRataPembimbing: Number(skema.bobotRataRataPembimbing),
        bobotRataRataPenguji: Number(skema.bobotRataRataPenguji),
        studyProgramId: skema.studyProgramId,
        cloProdiId: skema.cloProdiId,
        studyProgram: skema.studyProgram ? {
            id: skema.studyProgram.id,
            name: skema.studyProgram.name,
        } : undefined,
        cloProdi: skema.cloProdi ? {
            id: skema.cloProdi.id,
            name: skema.cloProdi.name,
        } : undefined,
        createdAt: skema.createdAt,
        updatedAt: skema.updatedAt,
    };
};

export const mapSkemaPerhitunganList = (skemaList) => {
    if (!Array.isArray(skemaList)) return [];
    return skemaList.map(mapSkemaPerhitungan);
};