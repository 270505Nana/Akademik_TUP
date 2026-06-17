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
          sidangRegistrationUploads: true,
          // nana note : ini buat cek is revisidokumendi FE.
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const mappedResponses = responses.map((resItem) => {
    if (
      resItem.sidangRegistration &&
      resItem.sidangRegistration.sidangRegistrationUploads
    ) {
      resItem.sidangRegistration.sidangRegistrationUploads =
        resItem.sidangRegistration.sidangRegistrationUploads.map((upload) => ({
          ...upload,
          downloadUrl: `${req.protocol}://${req.get("host")}/api/sidang-registrations/uploads/${upload.id}/download`,
        }));
    }
    return resItem;
  });

  res.json({
    data: mappedResponses,
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
          sidangRegistrationUploads: true,
        },
      },
    },
  });

  if (!response) {
    res.status(404);
    throw new Error("Respon pendaftaran sidang tidak ditemukan");
  }

  if (
    response.sidangRegistration &&
    response.sidangRegistration.sidangRegistrationUploads
  ) {
    response.sidangRegistration.sidangRegistrationUploads =
      response.sidangRegistration.sidangRegistrationUploads.map((upload) => ({
        ...upload,
        downloadUrl: `${req.protocol}://${req.get("host")}/api/sidang-registrations/uploads/${upload.id}/download`,
      }));
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
            sidangRegistrationUploads: true,
          },
        },
      },
    });

    if (!response) {
      res.status(404);
      throw new Error("Respon pendaftaran sidang tidak ditemukan");
    }

    if (
      response.sidangRegistration &&
      response.sidangRegistration.sidangRegistrationUploads
    ) {
      response.sidangRegistration.sidangRegistrationUploads =
        response.sidangRegistration.sidangRegistrationUploads.map((upload) => ({
          ...upload,
          downloadUrl: `${req.protocol}://${req.get("host")}/api/sidang-registrations/uploads/${upload.id}/download`,
        }));
    }

    res.json({
      data: response,
    });
  },
);

// Create Sidang Registration Response
const createSidangRegistrationResponse = asyncHandler(async (req, res) => {
  const { sidangRegistrationId, academicStaffId, message, isEdit, sidangPeriodId, sidangRegistrationUploadIds } = req.body;

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

  if (sidangPeriodId) {
    const sidangPeriodExists = await prisma.sidangPeriod.findUnique({
      where: { id: sidangPeriodId },
    });

    if (!sidangPeriodExists) {
      res.status(404);
      throw new Error("Periode sidang tidak ditemukan");
    }
  }

  if (Array.isArray(sidangRegistrationUploadIds)) {
    await prisma.sidangRegistrationUpload.updateMany({
      where: {
        sidangRegistrationId,
        id: { in: sidangRegistrationUploadIds },
      },
      data: { isValid: true },
    });

    await prisma.sidangRegistrationUpload.updateMany({
      where: {
        sidangRegistrationId,
        id: { notIn: sidangRegistrationUploadIds },
      },
      data: { isValid: false },
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
          sidangRegistrationUploads: true,
        },
      },
    },
  });

  if (isEdit || sidangPeriodId !== undefined) {
    const updateData = {};
    if (isEdit) updateData.isDraft = true;
    if (sidangPeriodId !== undefined) updateData.sidangPeriodId = sidangPeriodId;

    await prisma.sidangRegistration.update({
      where: { id: sidangRegistrationId },
      data: updateData,
    });
  }

  if (
    newResponse.sidangRegistration &&
    newResponse.sidangRegistration.sidangRegistrationUploads
  ) {
    newResponse.sidangRegistration.sidangRegistrationUploads =
      newResponse.sidangRegistration.sidangRegistrationUploads.map((upload) => ({
        ...upload,
        downloadUrl: `${req.protocol}://${req.get("host")}/api/sidang-registrations/uploads/${upload.id}/download`,
      }));
  }

  res.status(201).json({
    message: "Sidang registration response created successfully",
    data: newResponse,
  });
});

// Update Sidang Registration Response
const updateSidangRegistrationResponse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { message, isEdit, academicStaffId, sidangRegistrationId, sidangRegistrationUploadIds } = req.body;

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

  const finalSidangRegistrationId = sidangRegistrationId || responseExists.sidangRegistrationId;

  if (Array.isArray(sidangRegistrationUploadIds)) {
    await prisma.sidangRegistrationUpload.updateMany({
      where: {
        sidangRegistrationId: finalSidangRegistrationId,
        id: { in: sidangRegistrationUploadIds },
      },
      data: { isValid: true },
    });

    await prisma.sidangRegistrationUpload.updateMany({
      where: {
        sidangRegistrationId: finalSidangRegistrationId,
        id: { notIn: sidangRegistrationUploadIds },
      },
      data: { isValid: false },
    });
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
          sidangRegistrationUploads: true,
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

  if (
    updatedResponse.sidangRegistration &&
    updatedResponse.sidangRegistration.sidangRegistrationUploads
  ) {
    updatedResponse.sidangRegistration.sidangRegistrationUploads =
      updatedResponse.sidangRegistration.sidangRegistrationUploads.map((upload) => ({
        ...upload,
        downloadUrl: `${req.protocol}://${req.get("host")}/api/sidang-registrations/uploads/${upload.id}/download`,
      }));
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

// Toggle isValid status of a Sidang Registration Upload
const toggleSidangRegistrationUploadIsValid = asyncHandler(async (req, res) => {
  const uploadId = parseInt(req.params.uploadId);

  const upload = await prisma.sidangRegistrationUpload.findUnique({
    where: { id: uploadId },
  });

  if (!upload) {
    res.status(404);
    throw new Error("Unggahan pendaftaran sidang tidak ditemukan");
  }

  const updatedUpload = await prisma.sidangRegistrationUpload.update({
    where: { id: uploadId },
    data: {
      isValid: upload.isValid === true ? false : true,
    },
  });

  res.json({
    message: `Validasi berkas ${updatedUpload.name} berhasil diubah menjadi ${
      updatedUpload.isValid ? "Valid" : "Tidak Valid"
    }`,
    data: updatedUpload,
  });
});

module.exports = {
  listSidangRegistrationResponses,
  getSidangRegistrationResponseById,
  getSidangRegistrationResponseBySidangRegistrationId,
  createSidangRegistrationResponse,
  updateSidangRegistrationResponse,
  deleteSidangRegistrationResponse,
  toggleSidangRegistrationUploadIsValid,
};
