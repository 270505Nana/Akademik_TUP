const prisma = require("../prisma/client");

// List Sidang Registration Response
const listSidangRegistrationResponses = async (req, res) => {
  try {
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
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Get Sidang Registration Response by ID
const getSidangRegistrationResponseById = async (req, res) => {
  try {
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
      return res.status(404).json({
        message: "Sidang registration response not found",
      });
    }

    res.json({
      data: response,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Get Sidang Registration Response by Sidang Registration ID
const getSidangRegistrationResponseBySidangRegistrationId = async (
  req,
  res,
) => {
  try {
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
      return res.status(404).json({
        message: "Sidang registration response not found",
      });
    }

    res.json({
      data: response,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Create Sidang Registration Response
const createSidangRegistrationResponse = async (req, res) => {
  try {
    const { sidangRegistrationId, academicStaffId, message, isEdit } = req.body;

    // Validate sidang registration exists
    const sidangRegistrationExists = await prisma.sidangRegistration.findUnique(
      {
        where: { id: sidangRegistrationId },
      },
    );

    if (!sidangRegistrationExists) {
      return res.status(404).json({
        message: "Sidang registration not found",
      });
    }

    // Validate academic staff exists
    const academicStaffExists = await prisma.academicStaff.findUnique({
      where: { id: academicStaffId },
    });

    if (!academicStaffExists) {
      return res.status(404).json({
        message: "Academic staff not found",
      });
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

    res.status(201).json({
      message: "Sidang registration response created successfully",
      data: newResponse,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Update Sidang Registration Response
const updateSidangRegistrationResponse = async (req, res) => {
  try {
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
      return res.status(404).json({
        message: "Sidang registration response not found",
      });
    }

    // Validate foreign keys if provided
    if (sidangRegistrationId) {
      const sidangRegistrationExists =
        await prisma.sidangRegistration.findUnique({
          where: { id: sidangRegistrationId },
        });
      if (!sidangRegistrationExists) {
        return res.status(404).json({
          message: "Sidang registration not found",
        });
      }
    }

    if (academicStaffId) {
      const academicStaffExists = await prisma.academicStaff.findUnique({
        where: { id: academicStaffId },
      });
      if (!academicStaffExists) {
        return res.status(404).json({
          message: "Academic staff not found",
        });
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

    res.json({
      message: "Sidang registration response updated successfully",
      data: updatedResponse,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Delete Sidang Registration Response (soft delete)
const deleteSidangRegistrationResponse = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if response exists
    const responseExists = await prisma.sidangRegistrationResponse.findFirst({
      where: {
        id: parseInt(id),
        deletedAt: null,
      },
    });

    if (!responseExists) {
      return res.status(404).json({
        message: "Sidang registration response not found",
      });
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
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

module.exports = {
  listSidangRegistrationResponses,
  getSidangRegistrationResponseById,
  getSidangRegistrationResponseBySidangRegistrationId,
  createSidangRegistrationResponse,
  updateSidangRegistrationResponse,
  deleteSidangRegistrationResponse,
};
