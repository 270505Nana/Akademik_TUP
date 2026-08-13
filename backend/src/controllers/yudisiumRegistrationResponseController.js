import asyncHandler from 'express-async-handler';
import prisma from "../config/prisma.js";
import { sendValidationError, isNil, isValidISO8601 } from '../utils/validationHelper.js';

// List Yudisium Registration Response
const listYudisiumRegistrationResponses = asyncHandler(async (req, res) => {
  const responses = await prisma.yudisiumRegistrationResponse.findMany({
    where: { deletedAt: null },
    include: {
      admin: {
        select: {
          id: true,
          name: true,
        },
      },
      yudisiumRegistration: {
        select: {
          id: true,
          thesisTitleId: true,
          thesisTitleEn: true,
          mahasiswa: {
            select: {
              id: true,
              nim: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  res.json({
    data: responses,
  });
});

// Get Yudisium Registration Response by ID
const getYudisiumRegistrationResponseById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const response = await prisma.yudisiumRegistrationResponse.findFirst({
    where: {
      id: parseInt(id),
      deletedAt: null,
    },
    include: {
      admin: {
        select: {
          id: true,
          name: true,
        },
      },
      yudisiumRegistration: {
        select: {
          id: true,
          thesisTitleId: true,
          thesisTitleEn: true,
          mahasiswa: {
            select: {
              id: true,
              nim: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!response) {
    res.status(404);
    throw new Error("Respon pendaftaran yudisium tidak ditemukan");
  }

  res.json({
    data: response,
  });
});

// Get Yudisium Registration Response by Yudisium Registration ID
const getYudisiumRegistrationResponseByYudisiumRegistrationId = asyncHandler(
  async (req, res) => {
    const { yudisiumRegistrationId } = req.params;

    const response = await prisma.yudisiumRegistrationResponse.findFirst({
      where: {
        yudisiumRegistrationId: parseInt(yudisiumRegistrationId),
        deletedAt: null,
      },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
          },
        },
        yudisiumRegistration: {
          select: {
            id: true,
            thesisTitleId: true,
            thesisTitleEn: true,
            mahasiswa: {
              select: {
                id: true,
                nim: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!response) {
      res.status(404);
      throw new Error("Respon pendaftaran yudisium tidak ditemukan");
    }

    res.json({
      data: response,
    });
  },
);

// Create Yudisium Registration Response
const createYudisiumRegistrationResponse = asyncHandler(async (req, res) => {
  const { yudisiumRegistrationId, adminId, message, isEdit } = req.body;

  const errors = [];
  if (isNil(yudisiumRegistrationId)) {
    errors.push({ field: "yudisiumRegistrationId", message: "ID pendaftaran yudisium wajib diisi" });
  } else if (isNaN(parseInt(yudisiumRegistrationId))) {
    errors.push({ field: "yudisiumRegistrationId", message: "ID pendaftaran yudisium harus berupa integer" });
  }

  if (isNil(adminId)) {
    errors.push({ field: "adminId", message: "ID staf akademik wajib diisi" });
  } else if (isNaN(parseInt(adminId))) {
    errors.push({ field: "adminId", message: "ID staf akademik harus berupa integer" });
  }

  if (!isNil(message) && typeof message !== "string") {
    errors.push({ field: "message", message: "Pesan harus berupa string" });
  }

  if (!isNil(isEdit) && !isValidISO8601(isEdit)) {
    errors.push({ field: "isEdit", message: "isEdit harus berupa tanggal yang valid (format ISO 8601)" });
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  const yudisiumRegistrationExists =
    await prisma.yudisiumRegistration.findUnique({
      where: { id: yudisiumRegistrationId },
    });

  if (!yudisiumRegistrationExists) {
    res.status(404);
    throw new Error("Pendaftaran yudisium tidak ditemukan");
  }

  const academicStaffExists = await prisma.admin.findUnique({
    where: { id: adminId },
  });

  if (!academicStaffExists) {
    res.status(404);
    throw new Error("Staf akademik tidak ditemukan");
  }

  const newResponse = await prisma.yudisiumRegistrationResponse.create({
    data: {
      yudisiumRegistrationId,
      adminId,
      message: message || null,
      isEdit: isEdit ? new Date(isEdit) : null,
    },
    include: {
      admin: {
        select: {
          id: true,
          name: true,
        },
      },
      yudisiumRegistration: {
        select: {
          id: true,
          thesisTitleId: true,
          thesisTitleEn: true,
          mahasiswa: {
            select: {
              id: true,
              nim: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (isEdit) {
    await prisma.yudisiumRegistration.update({
      where: { id: yudisiumRegistrationId },
      data: { isDraft: true },
    });
  }

  res.status(201).json({
    message: "Yudisium registration response created successfully",
    data: newResponse,
  });
});

// Update Yudisium Registration Response
const updateYudisiumRegistrationResponse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { message, isEdit, adminId, yudisiumRegistrationId } = req.body;

  const errors = [];
  if (!isNil(message) && typeof message !== "string") {
    errors.push({ field: "message", message: "Pesan harus berupa string" });
  }

  if (!isNil(isEdit) && !isValidISO8601(isEdit)) {
    errors.push({ field: "isEdit", message: "isEdit harus berupa tanggal yang valid (format ISO 8601)" });
  }

  if (!isNil(adminId) && isNaN(parseInt(adminId))) {
    errors.push({ field: "adminId", message: "ID staf akademik harus berupa integer" });
  }

  if (!isNil(yudisiumRegistrationId) && isNaN(parseInt(yudisiumRegistrationId))) {
    errors.push({ field: "yudisiumRegistrationId", message: "ID pendaftaran yudisium harus berupa integer" });
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  const responseExists = await prisma.yudisiumRegistrationResponse.findFirst({
    where: {
      id: parseInt(id),
      deletedAt: null,
    },
  });

  if (!responseExists) {
    res.status(404);
    throw new Error("Respon pendaftaran yudisium tidak ditemukan");
  }

  if (yudisiumRegistrationId) {
    const yudisiumRegistrationExists =
      await prisma.yudisiumRegistration.findUnique({
        where: { id: yudisiumRegistrationId },
      });
    if (!yudisiumRegistrationExists) {
      res.status(404);
      throw new Error("Pendaftaran yudisium tidak ditemukan");
    }
  }

  if (adminId) {
    const academicStaffExists = await prisma.admin.findUnique({
      where: { id: adminId },
    });
    if (!academicStaffExists) {
      res.status(404);
      throw new Error("Staf akademik tidak ditemukan");
    }
  }

  const updateData = {};
  if (message !== undefined) updateData.message = message;
  if (isEdit !== undefined)
    updateData.isEdit = isEdit ? new Date(isEdit) : null;
  if (adminId !== undefined)
    updateData.adminId = adminId;
  if (yudisiumRegistrationId !== undefined)
    updateData.yudisiumRegistrationId = yudisiumRegistrationId;

  const updatedResponse = await prisma.yudisiumRegistrationResponse.update({
    where: { id: parseInt(id) },
    data: updateData,
    include: {
      admin: {
        select: {
          id: true,
          name: true,
        },
      },
      yudisiumRegistration: {
        select: {
          id: true,
          thesisTitleId: true,
          thesisTitleEn: true,
          mahasiswa: {
            select: {
              id: true,
              nim: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (isEdit) {
    await prisma.yudisiumRegistration.update({
      where: {
        id:
          updateData.yudisiumRegistrationId ||
          responseExists.yudisiumRegistrationId,
      },
      data: { isDraft: true },
    });
  }

  res.json({
    message: "Yudisium registration response updated successfully",
    data: updatedResponse,
  });
});

// Delete Yudisium Registration Response (soft delete)
const deleteYudisiumRegistrationResponse = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const responseExists = await prisma.yudisiumRegistrationResponse.findFirst({
    where: {
      id: parseInt(id),
      deletedAt: null,
    },
  });

  if (!responseExists) {
    res.status(404);
    throw new Error("Respon pendaftaran yudisium tidak ditemukan");
  }

  const deletedResponse = await prisma.yudisiumRegistrationResponse.update({
    where: { id: parseInt(id) },
    data: {
      deletedAt: new Date(),
    },
  });

  res.json({
    message: "Yudisium registration response deleted successfully",
    data: deletedResponse,
  });
});

export { listYudisiumRegistrationResponses,
  getYudisiumRegistrationResponseById,
  getYudisiumRegistrationResponseByYudisiumRegistrationId,
  createYudisiumRegistrationResponse,
  updateYudisiumRegistrationResponse,
  deleteYudisiumRegistrationResponse, };
