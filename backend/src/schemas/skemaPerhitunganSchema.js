import { z } from "zod";

const bobot = z.number({ 
    invalid_type_error: "Bobot harus berupa angka",
    required_error: "Bobot wajib diisi" 
}).min(0, "Bobot minimal 0").max(1, "Bobot maksimal 1");

const isTotalOne = (data) => {
    return Math.abs(data.bobotRataRataPembimbing + data.bobotRataRataPenguji - 1) < 0.001;
};

export const createSkemaSchema = z.object({
    bobotRataRataPembimbing: bobot,
    bobotRataRataPenguji: bobot,
    studyProgramId: z.string({ required_error: "ID Program Studi wajib diisi" }),
    cloProdiId: z.string().uuid("Format ID CLO tidak valid").optional().nullable(),
}).refine(isTotalOne, { 
    message: "Total bobot pembimbing + penguji harus 1 (100%)",
    path: ["bobotRataRataPembimbing"] 
});

export const updateSkemaSchema = z.object({
    bobotRataRataPembimbing: bobot.optional(),
    bobotRataRataPenguji: bobot.optional(),
}).refine((data) => Object.keys(data).length > 0, {
    message: "Minimal satu field harus diisi untuk melakukan pembaruan"
});