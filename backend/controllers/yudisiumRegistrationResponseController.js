const asyncHandler = require("express-async-handler");
const prisma = require("../prisma/client");

// List Yudisium Registration Response
const listYudisiumRegistrationResponses = asyncHandler(async (req, res) => {
  const responses = await prisma.yudisiumRegistrationResponse.findMany({
    where: { deletedAt: null },
    include: {
      academicStaff: {
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

// Get Yudisium Registration Response by ID
const getYudisiumRegistrationResponseById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const response = await prisma.yudisiumRegistrationResponse.findFirst({
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
      yudisiumRegistration: {
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
    throw new Error("Yudisium registration response not found");
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
        academicStaff: {
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
      throw new Error("Yudisium registration response not found");
    }

    res.json({
      data: response,
    });
  },
);

// Create Yudisium Registration Response
const createYudisiumRegistrationResponse = asyncHandler(async (req, res) => {
  const { yudisiumRegistrationId, academicStaffId, message, isEdit } = req.body;

  const yudisiumRegistrationExists =
    await prisma.yudisiumRegistration.findUnique({
      where: { id: yudisiumRegistrationId },
    });

  if (!yudisiumRegistrationExists) {
    res.status(404);
    throw new Error("Yudisium registration not found");
  }

  const academicStaffExists = await prisma.academicStaff.findUnique({
    where: { id: academicStaffId },
  });

  if (!academicStaffExists) {
    res.status(404);
    throw new Error("Academic staff not found");
  }

  const newResponse = await prisma.yudisiumRegistrationResponse.create({
    data: {
      yudisiumRegistrationId,
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
      yudisiumRegistration: {
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
  const { message, isEdit, academicStaffId, yudisiumRegistrationId } = req.body;

  const responseExists = await prisma.yudisiumRegistrationResponse.findFirst({
    where: {
      id: parseInt(id),
      deletedAt: null,
    },
  });

  if (!responseExists) {
    res.status(404);
    throw new Error("Yudisium registration response not found");
  }

  if (yudisiumRegistrationId) {
    const yudisiumRegistrationExists =
      await prisma.yudisiumRegistration.findUnique({
        where: { id: yudisiumRegistrationId },
      });
    if (!yudisiumRegistrationExists) {
      res.status(404);
      throw new Error("Yudisium registration not found");
    }
  }

  if (academicStaffId) {
    const academicStaffExists = await prisma.academicStaff.findUnique({
      where: { id: academicStaffId },
    });
    if (!academicStaffExists) {
      res.status(404);
      throw new Error("Academic staff not found");
    }
  }

  const updateData = {};
  if (message !== undefined) updateData.message = message;
  if (isEdit !== undefined)
    updateData.isEdit = isEdit ? new Date(isEdit) : null;
  if (academicStaffId !== undefined)
    updateData.academicStaffId = academicStaffId;
  if (yudisiumRegistrationId !== undefined)
    updateData.yudisiumRegistrationId = yudisiumRegistrationId;

  const updatedResponse = await prisma.yudisiumRegistrationResponse.update({
    where: { id: parseInt(id) },
    data: updateData,
    include: {
      academicStaff: {
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
    throw new Error("Yudisium registration response not found");
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

module.exports = {
  listYudisiumRegistrationResponses,
  getYudisiumRegistrationResponseById,
  getYudisiumRegistrationResponseByYudisiumRegistrationId,
  createYudisiumRegistrationResponse,
  updateYudisiumRegistrationResponse,
  deleteYudisiumRegistrationResponse,
};
