const asyncHandler = require("express-async-handler");
const prisma = require("../prisma/client");
const fs = require("fs");
const path = require("path");

// Sidang Registration List
const listSidangRegistrations = asyncHandler(async (req, res) => {
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
      sidangRegistrationUploads: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Append downloadUrls
  const data = sidangRegistrations.map((reg) => ({
    ...reg,
    sidangRegistrationUploads: reg.sidangRegistrationUploads.map((upload) => ({
      ...upload,
      downloadUrl: `${req.protocol}://${req.get("host")}/api/sidang-registrations/uploads/${upload.id}/download`,
    })),
  }));

  res.json({
    data,
  });
});

// Get Sidang Registration by ID
const getSidangRegistrationById = asyncHandler(async (req, res) => {
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
      sidangRegistrationUploads: true,
    },
  });

  if (!sidangRegistration) {
    res.status(404);
    throw new Error("Sidang registration not found");
  }

  sidangRegistration.sidangRegistrationUploads = sidangRegistration.sidangRegistrationUploads.map((upload) => ({
    ...upload,
    downloadUrl: `${req.protocol}://${req.get("host")}/api/sidang-registrations/uploads/${upload.id}/download`,
  }));

  res.json({
    data: sidangRegistration,
  });
});

// Get Sidang Registration by Student ID
const getSidangRegistrationByStudentId = asyncHandler(async (req, res) => {
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
      sidangRegistrationUploads: true,
    },
  });

  if (!sidangRegistration) {
    res.status(404);
    throw new Error("Sidang registration not found");
  }

  sidangRegistration.sidangRegistrationUploads = sidangRegistration.sidangRegistrationUploads.map((upload) => ({
    ...upload,
    downloadUrl: `${req.protocol}://${req.get("host")}/api/sidang-registrations/uploads/${upload.id}/download`,
  }));

  res.json({
    data: sidangRegistration,
  });
});

// Save Draft Sidang Registration Baru
const saveSidangRegistration = asyncHandler(async (req, res) => {
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

  // Validate student exists if provided
  if (studentId) {
    const studentExists = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!studentExists) {
      res.status(404);
      throw new Error("Student not found");
    }
  }

  // Validate dosen pembimbing 1 exists if provided
  if (dosenPembimbing1Id) {
    const dosenPembimbing1Exists = await prisma.lecturer.findUnique({
      where: { id: dosenPembimbing1Id },
    });

    if (!dosenPembimbing1Exists) {
      res.status(404);
      throw new Error("Dosen pembimbing 1 not found");
    }
  }

  // Validate dosen pembimbing 2 exists if provided
  if (dosenPembimbing2Id) {
    const dosenPembimbing2Exists = await prisma.lecturer.findUnique({
      where: { id: dosenPembimbing2Id },
    });

    if (!dosenPembimbing2Exists) {
      res.status(404);
      throw new Error("Dosen pembimbing 2 not found");
    }
  }

  const newSidangRegistration = await prisma.sidangRegistration.create({
    data: {
      programType,
      sidangScheme: sidangScheme || null,
      sks,
      ipk,
      tak,
      sktaExpDate: sktaExpDate ? new Date(sktaExpDate) : null,
      thesisTitleId,
      thesisTitleEn,
      studentId,
      dosenPembimbing1Id,
      dosenPembimbing2Id,
      isDraft: true,
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
    message: "Sidang registration saved as draft successfully",
    data: newSidangRegistration,
  });
});

// Submit Sidang Registration Baru
const submitSidangRegistration = asyncHandler(async (req, res) => {
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

  // Since fields are nullable in db but required on submit, validator handles existence check.
  // We just validate existence of references here.
  const studentExists = await prisma.student.findUnique({
    where: { id: studentId },
  });

  if (!studentExists) {
    res.status(404);
    throw new Error("Student not found");
  }

  const dosenPembimbing1Exists = await prisma.lecturer.findUnique({
    where: { id: dosenPembimbing1Id },
  });

  if (!dosenPembimbing1Exists) {
    res.status(404);
    throw new Error("Dosen pembimbing 1 not found");
  }

  const dosenPembimbing2Exists = await prisma.lecturer.findUnique({
    where: { id: dosenPembimbing2Id },
  });

  if (!dosenPembimbing2Exists) {
    res.status(404);
    throw new Error("Dosen pembimbing 2 not found");
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
      isDraft: false, // Mark as submitted
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
    message: "Sidang registration submitted successfully",
    data: newSidangRegistration,
  });
});

// Update Sidang Registration
const updateSidangRegistration = asyncHandler(async (req, res) => {
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
    isDraft,
  } = req.body;

  const editableResponse = await prisma.sidangRegistrationResponse.findFirst({
    where: {
      sidangRegistrationId: parseInt(id),
      isEdit: {
        gt: new Date(),
      },
    },
  });

  // Check if sidang registration exists
  const sidangRegistrationExists = await prisma.sidangRegistration.findUnique({
    where: { id: parseInt(id) },
  });

  if (!sidangRegistrationExists) {
    res.status(404);
    throw new Error("Sidang registration not found");
  }

  // Validasi hanya jika bukan draft dan bukan dalam masa edit
  if (!sidangRegistrationExists.isDraft && !editableResponse) {
    res.status(403);
    throw new Error("You cannot edit this sidang registration because it is already submitted and no edit permission is available.");
  }

  // Validate foreign keys if provided
  if (studentId) {
    const studentExists = await prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!studentExists) {
      res.status(404);
      throw new Error("Student not found");
    }
  }

  if (dosenPembimbing1Id) {
    const dosenPembimbing1Exists = await prisma.lecturer.findUnique({
      where: { id: dosenPembimbing1Id },
    });
    if (!dosenPembimbing1Exists) {
      res.status(404);
      throw new Error("Dosen pembimbing 1 not found");
    }
  }

  if (dosenPembimbing2Id) {
    const dosenPembimbing2Exists = await prisma.lecturer.findUnique({
      where: { id: dosenPembimbing2Id },
    });
    if (!dosenPembimbing2Exists) {
      res.status(404);
      throw new Error("Dosen pembimbing 2 not found");
    }
  }

  const updateData = {};
  if (programType !== undefined) updateData.programType = programType;
  if (sidangScheme !== undefined) updateData.sidangScheme = sidangScheme;
  if (sks !== undefined) updateData.sks = sks;
  if (ipk !== undefined) updateData.ipk = ipk;
  if (tak !== undefined) updateData.tak = tak;
  if (sktaExpDate !== undefined)
    updateData.sktaExpDate = sktaExpDate ? new Date(sktaExpDate) : null;
  if (thesisTitleId !== undefined) updateData.thesisTitleId = thesisTitleId;
  if (thesisTitleEn !== undefined) updateData.thesisTitleEn = thesisTitleEn;
  if (studentId !== undefined) updateData.studentId = studentId;
  if (dosenPembimbing1Id !== undefined)
    updateData.dosenPembimbing1Id = dosenPembimbing1Id;
  if (dosenPembimbing2Id !== undefined)
    updateData.dosenPembimbing2Id = dosenPembimbing2Id;
  if (isDraft !== undefined) updateData.isDraft = isDraft;

  // If setting isDraft to false (submitting), we should validate required fields
  if (isDraft === false) {
    const requiredFields = [
      'programType', 'sks', 'ipk', 'tak', 'sktaExpDate',
      'thesisTitleId', 'thesisTitleEn', 'studentId', 
      'dosenPembimbing1Id', 'dosenPembimbing2Id'
    ];
    
    // Combine existing data with incoming data to check completeness
    const mergedData = { ...sidangRegistrationExists, ...updateData };
    const missingFields = requiredFields.filter(field => mergedData[field] === null || mergedData[field] === undefined);

    if (missingFields.length > 0) {
      res.status(400);
      throw new Error(`Cannot submit. Missing required fields: ${missingFields.join(", ")}`);
    }
  }

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
      sidangRegistrationUploads: true,
    },
  });

  updatedSidangRegistration.sidangRegistrationUploads = updatedSidangRegistration.sidangRegistrationUploads.map((upload) => ({
    ...upload,
    downloadUrl: `${req.protocol}://${req.get("host")}/api/sidang-registrations/uploads/${upload.id}/download`,
  }));

  res.json({
    message: "Sidang registration updated successfully",
    data: updatedSidangRegistration,
  });
});

// Delete Sidang Registration (soft delete)
const deleteSidangRegistration = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if sidang registration exists
  const sidangRegistrationExists = await prisma.sidangRegistration.findUnique({
    where: { id: parseInt(id) },
  });

  if (!sidangRegistrationExists) {
    res.status(404);
    throw new Error("Sidang registration not found");
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
});


// Upload Dokumen Persyaratan Sidang
const uploadSidangRegistrationFile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { slug, name } = req.body;
  const file = req.files?.file?.[0] || req.file;

  if (!file) {
    res.status(400);
    throw new Error("No file uploaded");
  }

  if (!slug || !name) {
    if (file.path) fs.unlink(file.path, () => {});
    res.status(400);
    throw new Error("Slug and name are required");
  }

  const sidangRegistrationExists = await prisma.sidangRegistration.findUnique({
    where: { id: parseInt(id) }
  });

  if (!sidangRegistrationExists) {
    if (file.path) fs.unlink(file.path, () => {});
    res.status(404);
    throw new Error("Sidang registration not found");
  }

  // Check if an upload with this slug already exists for this registration
  const existingUpload = await prisma.sidangRegistrationUpload.findFirst({
    where: {
      sidangRegistrationId: parseInt(id),
      slug: slug
    }
  });

  let uploadRecord;

  if (existingUpload) {
    // Delete old file from disk
    if (existingUpload.path && fs.existsSync(existingUpload.path)) {
       fs.unlinkSync(existingUpload.path);
    }

    uploadRecord = await prisma.sidangRegistrationUpload.update({
      where: { id: existingUpload.id },
      data: {
        name,
        filename: file.filename,
        path: file.path
      }
    });
  } else {
    uploadRecord = await prisma.sidangRegistrationUpload.create({
      data: {
        name,
        slug,
        filename: file.filename,
        path: file.path,
        sidangRegistrationId: parseInt(id)
      }
    });
  }

  uploadRecord.downloadUrl = `${req.protocol}://${req.get("host")}/api/sidang-registrations/uploads/${uploadRecord.id}/download`;

  res.status(200).json({
    message: existingUpload ? "File updated successfully" : "File uploaded successfully",
    data: uploadRecord
  });
});

// Get All Uploaded Files by Sidang Registration ID
const getSidangRegistrationFiles = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const uploads = await prisma.sidangRegistrationUpload.findMany({
    where: { sidangRegistrationId: parseInt(id) }
  });

  const data = uploads.map(upload => ({
    ...upload,
    downloadUrl: `${req.protocol}://${req.get("host")}/api/sidang-registrations/uploads/${upload.id}/download`
  }));

  res.json({ data });
});

// Download Sidang Registration Upload
const downloadSidangRegistrationFile = asyncHandler(async (req, res) => {
  const uploadId = parseInt(req.params.uploadId);

  const upload = await prisma.sidangRegistrationUpload.findFirst({
    where: { id: uploadId },
  });

  if (!upload) {
    res.status(404);
    throw new Error("Upload not found");
  }

  const filePath = path.resolve(process.cwd(), upload.path);

  if (!fs.existsSync(filePath)) {
    res.status(404);
    throw new Error("File not found");
  }

  res.download(filePath, upload.filename);
});

module.exports = {
  listSidangRegistrations,
  getSidangRegistrationById,
  getSidangRegistrationByStudentId,
  saveSidangRegistration,
  submitSidangRegistration,
  updateSidangRegistration,
  deleteSidangRegistration,
  uploadSidangRegistrationFile,
  getSidangRegistrationFiles,
  downloadSidangRegistrationFile
};
