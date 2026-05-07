const prisma = require("../prisma/client");

// Sidang Registration List
const listSidangRegistrations = async (req, res) => {
  try {
    const sidangRegistrations = await prisma.sidangRegistration.findMany({
      include: {
        student: {
          select: {
            id: true,
            nim: true,
            name: true,
          },
        },
        dosenPembimbing1: {
          select: {
            id: true,
            nip: true,
            name: true,
          },
        },
        dosenPembimbing2: {
          select: {
            id: true,
            nip: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      data: sidangRegistrations,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Get Sidang Registration by ID
const getSidangRegistrationById = async (req, res) => {
  try {
    const { id } = req.params;

    const sidangRegistration = await prisma.sidangRegistration.findUnique({
      where: {
        id: parseInt(id),
      },
      include: {
        student: {
          select: {
            id: true,
            nim: true,
            name: true,
          },
        },
        dosenPembimbing1: {
          select: {
            id: true,
            nip: true,
            name: true,
          },
        },
        dosenPembimbing2: {
          select: {
            id: true,
            nip: true,
            name: true,
          },
        },
      },
    });

    if (!sidangRegistration) {
      return res.status(404).json({
        message: "Sidang registration not found",
      });
    }

    res.json({
      data: sidangRegistration,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Get Sidang Registration by Student ID
const getSidangRegistrationByStudentId = async (req, res) => {
  try {
    const { studentId } = req.params;

    const sidangRegistration = await prisma.sidangRegistration.findFirst({
      where: {
        studentId: parseInt(studentId),
      },
      include: {
        student: {
          select: {
            id: true,
            nim: true,
            name: true,
          },
        },
        dosenPembimbing1: {
          select: {
            id: true,
            nip: true,
            name: true,
          },
        },
        dosenPembimbing2: {
          select: {
            id: true,
            nip: true,
            name: true,
          },
        },
      },
    });

    if (!sidangRegistration) {
      return res.status(404).json({
        message: "Sidang registration not found",
      });
    }

    res.json({
      data: sidangRegistration,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Buat Sidang Registration Baru
const createSidangRegistration = async (req, res) => {
  try {
    const {
      programType,
      sidangScheme,
      sks,
      ipk,
      tak,
      sktaExpDate,
      thesisTitleId,
      thesisTitleEn,
      studentId,
      dosenPembimbing1Id,
      dosenPembimbing2Id,
    } = req.body;

    // Validate student exists
    const studentExists = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!studentExists) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    // Validate dosen pembimbing 1 exists
    const dosenPembimbing1Exists = await prisma.lecturer.findUnique({
      where: { id: dosenPembimbing1Id },
    });

    if (!dosenPembimbing1Exists) {
      return res.status(404).json({
        message: "Dosen pembimbing 1 not found",
      });
    }

    // Validate dosen pembimbing 2 exists
    const dosenPembimbing2Exists = await prisma.lecturer.findUnique({
      where: { id: dosenPembimbing2Id },
    });

    if (!dosenPembimbing2Exists) {
      return res.status(404).json({
        message: "Dosen pembimbing 2 not found",
      });
    }

    const newSidangRegistration = await prisma.sidangRegistration.create({
      data: {
        programType,
        sidangScheme: sidangScheme || null,
        sks,
        ipk,
        tak,
        sktaExpDate: new Date(sktaExpDate),
        thesisTitleId,
        thesisTitleEn,
        studentId,
        dosenPembimbing1Id,
        dosenPembimbing2Id,
      },
      include: {
        student: {
          select: {
            id: true,
            nim: true,
            name: true,
          },
        },
        dosenPembimbing1: {
          select: {
            id: true,
            nip: true,
            name: true,
          },
        },
        dosenPembimbing2: {
          select: {
            id: true,
            nip: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json({
      message: "Sidang registration created successfully",
      data: newSidangRegistration,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Update Sidang Registration
const updateSidangRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      programType,
      sidangScheme,
      sks,
      ipk,
      tak,
      sktaExpDate,
      thesisTitleId,
      thesisTitleEn,
      studentId,
      dosenPembimbing1Id,
      dosenPembimbing2Id,
    } = req.body;

    const editableResponse = await prisma.sidangRegistrationResponse.findFirst({
      where: {
        sidangRegistrationId: parseInt(id),
        isEdit: {
          gt: new Date(),
        },
      },
    });

    if (!editableResponse) {
      return res.status(403).json({
        message:
          "You cannot edit this sidang registration because the edit period has expired or no edit permission is available.",
      });
    }

    // Check if sidang registration exists
    const sidangRegistrationExists = await prisma.sidangRegistration.findUnique(
      {
        where: { id: parseInt(id) },
      },
    );

    if (!sidangRegistrationExists) {
      return res.status(404).json({
        message: "Sidang registration not found",
      });
    }

    // Validate foreign keys if provided
    if (studentId) {
      const studentExists = await prisma.student.findUnique({
        where: { id: studentId },
      });
      if (!studentExists) {
        return res.status(404).json({
          message: "Student not found",
        });
      }
    }

    if (dosenPembimbing1Id) {
      const dosenPembimbing1Exists = await prisma.lecturer.findUnique({
        where: { id: dosenPembimbing1Id },
      });
      if (!dosenPembimbing1Exists) {
        return res.status(404).json({
          message: "Dosen pembimbing 1 not found",
        });
      }
    }

    if (dosenPembimbing2Id) {
      const dosenPembimbing2Exists = await prisma.lecturer.findUnique({
        where: { id: dosenPembimbing2Id },
      });
      if (!dosenPembimbing2Exists) {
        return res.status(404).json({
          message: "Dosen pembimbing 2 not found",
        });
      }
    }

    const updateData = {};
    if (programType !== undefined) updateData.programType = programType;
    if (sidangScheme !== undefined) updateData.sidangScheme = sidangScheme;
    if (sks !== undefined) updateData.sks = sks;
    if (ipk !== undefined) updateData.ipk = ipk;
    if (tak !== undefined) updateData.tak = tak;
    if (sktaExpDate !== undefined)
      updateData.sktaExpDate = new Date(sktaExpDate);
    if (thesisTitleId !== undefined) updateData.thesisTitleId = thesisTitleId;
    if (thesisTitleEn !== undefined) updateData.thesisTitleEn = thesisTitleEn;
    if (studentId !== undefined) updateData.studentId = studentId;
    if (dosenPembimbing1Id !== undefined)
      updateData.dosenPembimbing1Id = dosenPembimbing1Id;
    if (dosenPembimbing2Id !== undefined)
      updateData.dosenPembimbing2Id = dosenPembimbing2Id;

    const updatedSidangRegistration = await prisma.sidangRegistration.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        student: {
          select: {
            id: true,
            nim: true,
            name: true,
          },
        },
        dosenPembimbing1: {
          select: {
            id: true,
            nip: true,
            name: true,
          },
        },
        dosenPembimbing2: {
          select: {
            id: true,
            nip: true,
            name: true,
          },
        },
      },
    });

    res.json({
      message: "Sidang registration updated successfully",
      data: updatedSidangRegistration,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Delete Sidang Registration (soft delete)
const deleteSidangRegistration = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if sidang registration exists
    const sidangRegistrationExists = await prisma.sidangRegistration.findUnique(
      {
        where: { id: parseInt(id) },
      },
    );

    if (!sidangRegistrationExists) {
      return res.status(404).json({
        message: "Sidang registration not found",
      });
    }

    const deletedSidangRegistration = await prisma.sidangRegistration.update({
      where: { id: parseInt(id) },
      data: {
        deletedAt: new Date(),
      },
    });

    res.json({
      message: "Sidang registration deleted successfully",
      data: deletedSidangRegistration,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

module.exports = {
  listSidangRegistrations,
  getSidangRegistrationById,
  getSidangRegistrationByStudentId,
  createSidangRegistration,
  updateSidangRegistration,
  deleteSidangRegistration,
};
