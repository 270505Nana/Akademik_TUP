const asyncHandler = require("express-async-handler");
const prisma = require("../prisma/client");

// List Sidang Registration Response
const listSidangRegistrationResponses = asyncHandler(async (req, res) => {
  const responses = await prisma.sidangRegistrationResponse.findMany({
    where: { deletedAt: null },
    include: {
      academicStaff: {
        select: {
          id: true,
          name: true,
        },
      },
      sidangRegistration: {
        select: {
          id: true,
          thesisTitleId: true,
          thesisTitleEn: true,
          student: {
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

// Get Sidang Registration Response by ID
const getSidangRegistrationResponseById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const response = await prisma.sidangRegistrationResponse.findFirst({
    where: {
      id: parseInt(id),
      deletedAt: null,
    },
    include: {
      academicStaff: {
        select: {
          id: true,
          name: true,
        },
      },
      sidangRegistration: {
        select: {
          id: true,
          thesisTitleId: true,
          thesisTitleEn: true,
          student: {
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
    throw new Error("Respon pendaftaran sidang tidak ditemukan");
  }

  res.json({
    data: response,
  });
});

// Get Sidang Registration Response by Sidang Registration ID
const getSidangRegistrationResponseBySidangRegistrationId = asyncHandler(
  async (req, res) => {
    const { sidangRegistrationId } = req.params;

    const response = await prisma.sidangRegistrationResponse.findFirst({
      where: {
        sidangRegistrationId: parseInt(sidangRegistrationId),
        deletedAt: null,
      },
      include: {
        academicStaff: {
          select: {
            id: true,
            name: true,
          },
        },
        sidangRegistration: {
          select: {
            id: true,
            thesisTitleId: true,
            thesisTitleEn: true,
            student: {
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
      throw new Error("Respon pendaftaran sidang tidak ditemukan");
    }

    res.json({
      data: response,
    });
  },
);

// Create Sidang Registration Response
const createSidangRegistrationResponse = asyncHandler(async (req, res) => {
  const { sidangRegistrationId, academicStaffId, message, isEdit } = req.body;

  // Validate sidang registration exists
  const sidangRegistrationExists = await prisma.sidangRegistration.findUnique({
    where: { id: sidangRegistrationId },
  });

  if (!sidangRegistrationExists) {
    res.status(404);
    throw new Error("Pendaftaran sidang tidak ditemukan");
  }

  // Validate academic staff exists
  const academicStaffExists = await prisma.academicStaff.findUnique({
    where: { id: academicStaffId },
  });

  if (!academicStaffExists) {
    res.status(404);
    throw new Error("Staf akademik tidak ditemukan");
  }

  const newResponse = await prisma.sidangRegistrationResponse.create({
    data: {
      sidangRegistrationId,
      academicStaffId,
      message: message || null,
      isEdit: isEdit ? new Date(isEdit) : null,
    },
    include: {
      academicStaff: {
        select: {
          id: true,
          name: true,
        },
      },
      sidangRegistration: {
        select: {
          id: true,
          thesisTitleId: true,
          thesisTitleEn: true,
          student: {
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
    await prisma.sidangRegistration.update({
      where: { id: sidangRegistrationId },
      data: { isDraft: true },
    });
  }

  res.status(201).json({
    message: "Sidang registration response created successfully",
    data: newResponse,
  });
});

// Update Sidang Registration Response
const updateSidangRegistrationResponse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { message, isEdit, academicStaffId, sidangRegistrationId } = req.body;

  // Check if response exists
  const responseExists = await prisma.sidangRegistrationResponse.findFirst({
    where: {
      id: parseInt(id),
      deletedAt: null,
    },
  });

  if (!responseExists) {
    res.status(404);
    throw new Error("Respon pendaftaran sidang tidak ditemukan");
  }

  // Validate foreign keys if provided
  if (sidangRegistrationId) {
    const sidangRegistrationExists = await prisma.sidangRegistration.findUnique(
      {
        where: { id: sidangRegistrationId },
      },
    );
    if (!sidangRegistrationExists) {
      res.status(404);
      throw new Error("Pendaftaran sidang tidak ditemukan");
    }
  }

  if (academicStaffId) {
    const academicStaffExists = await prisma.academicStaff.findUnique({
      where: { id: academicStaffId },
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
  if (academicStaffId !== undefined)
    updateData.academicStaffId = academicStaffId;
  if (sidangRegistrationId !== undefined)
    updateData.sidangRegistrationId = sidangRegistrationId;

  const updatedResponse = await prisma.sidangRegistrationResponse.update({
    where: { id: parseInt(id) },
    data: updateData,
    include: {
      academicStaff: {
        select: {
          id: true,
          name: true,
        },
      },
      sidangRegistration: {
        select: {
          id: true,
          thesisTitleId: true,
          thesisTitleEn: true,
          student: {
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
    await prisma.sidangRegistration.update({
      where: {
        id:
          updateData.sidangRegistrationId ||
          responseExists.sidangRegistrationId,
      },
      data: { isDraft: true },
    });
  }

  res.json({
    message: "Sidang registration response updated successfully",
    data: updatedResponse,
  });
});

// Delete Sidang Registration Response (soft delete)
const deleteSidangRegistrationResponse = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if response exists
  const responseExists = await prisma.sidangRegistrationResponse.findFirst({
    where: {
      id: parseInt(id),
      deletedAt: null,
    },
  });

  if (!responseExists) {
    res.status(404);
    throw new Error("Respon pendaftaran sidang tidak ditemukan");
  }

  const deletedResponse = await prisma.sidangRegistrationResponse.update({
    where: { id: parseInt(id) },
    data: {
      deletedAt: new Date(),
    },
  });

  res.json({
    message: "Sidang registration response deleted successfully",
    data: deletedResponse,
  });
});

module.exports = {
  listSidangRegistrationResponses,
  getSidangRegistrationResponseById,
  getSidangRegistrationResponseBySidangRegistrationId,
  createSidangRegistrationResponse,
  updateSidangRegistrationResponse,
  deleteSidangRegistrationResponse,
};
