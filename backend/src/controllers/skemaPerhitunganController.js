import asyncHandler from "express-async-handler";
import * as skemaService from "../services/skemaPerhitunganService.js";
import { mapSkemaPerhitungan, mapSkemaPerhitunganList } from "../mappers/skemaPerhitunganMapper.js";
import { createSkemaSchema, updateSkemaSchema } from "../schemas/skemaPerhitunganSchema.js";
import { sendValidationError } from "../utils/validationHelper.js";

const handleZodError = (res, validationResult) => {
    const errors = validationResult.error.issues.map(err => ({
        field: err.path.join("."),
        message: err.message,
    }));
    return sendValidationError(res, errors);
};

const createSkemaPerhitungan = asyncHandler(async (req, res) => {
    const validationResult = createSkemaSchema.safeParse(req.body);
    if (!validationResult.success) return handleZodError(res, validationResult);

    const result = await skemaService.createSkemaPerhitungan(validationResult.data);
    res.status(201).json({ 
        message: "Skema Perhitungan Nilai berhasil dibuat", 
        data: mapSkemaPerhitungan(result) 
    });
});

const getSkemaPerhitungans = asyncHandler(async (req, res) => {
    const result = await skemaService.getSkemaPerhitungans(req.query);
    res.json({
        ...result,
        data: mapSkemaPerhitunganList(result.data),
    });
});

const getSkemaPerhitunganById = asyncHandler(async (req, res) => {
    const result = await skemaService.getSkemaPerhitunganById(req.params.id);
    res.json({ data: mapSkemaPerhitungan(result) });
});

const updateSkemaPerhitungan = asyncHandler(async (req, res) => {
    const validationResult = updateSkemaSchema.safeParse(req.body);
    if (!validationResult.success) return handleZodError(res, validationResult);

    const result = await skemaService.updateSkemaPerhitungan(req.params.id, validationResult.data);
    res.json({ 
        message: "Skema Perhitungan Nilai berhasil diperbarui", 
        data: mapSkemaPerhitungan(result) 
    });
});

const deleteSkemaPerhitungan = asyncHandler(async (req, res) => {
    await skemaService.deleteSkemaPerhitungan(req.params.id);
    res.json({ message: "Skema Perhitungan Nilai berhasil dihapus" });
});

export {
    createSkemaPerhitungan,
    getSkemaPerhitungans,
    getSkemaPerhitunganById,
    updateSkemaPerhitungan,
    deleteSkemaPerhitungan,
};