const asyncHandler = require("express-async-handler");
const prisma = require("../prisma/client");
const fs = require("fs");
const path = require("path");

// Constants for File Validation
const REQUIRED_SLUGS = [];

// Yudisium Registration List
const listYudisiumRegistrations = asyncHandler(async (req, res) => {
  const yudisiumRegistrations = await prisma.yudisiumRegistration.findMany({
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
      yudisiumRegistrationUploads: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const data = yudisiumRegistrations.map((reg) => ({
    ...reg,
    yudisiumRegistrationUploads: reg.yudisiumRegistrationUploads.map(
      (upload) => ({
        ...upload,
        downloadUrl: `${req.protocol}://${req.get("host")}/api/yudisium-registrations/uploads/${upload.id}/download`,
      }),
    ),
  }));

  res.json({
    data,
  });
});

// Get Yudisium Registration by ID
const getYudisiumRegistrationById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const yudisiumRegistration = await prisma.yudisiumRegistration.findUnique({
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
      yudisiumRegistrationUploads: true,
    },
  });

  if (!yudisiumRegistration) {
    res.status(404);
    throw new Error("Yudisium registration not found");
  }

  yudisiumRegistration.yudisiumRegistrationUploads =
    yudisiumRegistration.yudisiumRegistrationUploads.map((upload) => ({
      ...upload,
      downloadUrl: `${req.protocol}://${req.get("host")}/api/yudisium-registrations/uploads/${upload.id}/download`,
    }));

  res.json({
    data: yudisiumRegistration,
  });
});

// Get Yudisium Registration by Student ID
const getYudisiumRegistrationByStudentId = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  const yudisiumRegistration = await prisma.yudisiumRegistration.findFirst({
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
      yudisiumRegistrationUploads: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!yudisiumRegistration) {
    res.status(404);
    throw new Error("Yudisium registration not found");
  }

  yudisiumRegistration.yudisiumRegistrationUploads =
    yudisiumRegistration.yudisiumRegistrationUploads.map((upload) => ({
      ...upload,
      downloadUrl: `${req.protocol}://${req.get("host")}/api/yudisium-registrations/uploads/${upload.id}/download`,
    }));

  res.json({
    data: yudisiumRegistration,
  });
});

// Save Draft Yudisium Registration (Upsert)
const saveYudisiumRegistration = asyncHandler(async (req, res) => {
  const {
    id,
    programType,
    tak,
    thesisTitleId,
    thesisTitleEn,
    isConfirmed,
    sidangScheme,
    cumlaudeScheme,
    jalurNonYudisium,
    eviden_cumlaude,
    studentId,
    dosenPembimbing1Id,
    dosenPembimbing2Id,
    yudisiumPeriodId,
    yudisiumRegistrationPeriodId,
  } = req.body;

  // Validate references if provided
  if (studentId) {
    const studentExists = await prisma.student.findUnique({
      where: { id: parseInt(studentId) },
    });
    if (!studentExists) {
      res.status(404);
      throw new Error("Student not found");
    }
  }

  if (dosenPembimbing1Id) {
    const dosenExists = await prisma.lecturer.findUnique({
      where: { id: parseInt(dosenPembimbing1Id) },
    });
    if (!dosenExists) {
      res.status(404);
      throw new Error("Dosen pembimbing 1 not found");
    }
  }

  if (dosenPembimbing2Id) {
    const dosenExists = await prisma.lecturer.findUnique({
      where: { id: parseInt(dosenPembimbing2Id) },
    });
    if (!dosenExists) {
      res.status(404);
      throw new Error("Dosen pembimbing 2 not found");
    }
  }

  const upsertData = {
    programType: programType !== undefined ? programType : undefined,
    tak: tak !== undefined ? tak : undefined,
    thesisTitleId: thesisTitleId !== undefined ? thesisTitleId : undefined,
    thesisTitleEn: thesisTitleEn !== undefined ? thesisTitleEn : undefined,
    isConfirmed: isConfirmed !== undefined ? isConfirmed : undefined,
    sidangScheme: sidangScheme !== undefined ? sidangScheme : undefined,
    cumlaudeScheme: cumlaudeScheme !== undefined ? cumlaudeScheme : undefined,
    jalurNonYudisium:
      jalurNonYudisium !== undefined ? jalurNonYudisium : undefined,
    eviden_cumlaude:
      eviden_cumlaude !== undefined ? eviden_cumlaude : undefined,
    studentId: studentId !== undefined ? parseInt(studentId) : undefined,
    dosenPembimbing1Id:
      dosenPembimbing1Id !== undefined
        ? parseInt(dosenPembimbing1Id)
        : undefined,
    dosenPembimbing2Id:
      dosenPembimbing2Id !== undefined
        ? parseInt(dosenPembimbing2Id)
        : undefined,
    yudisiumPeriodId:
      yudisiumPeriodId !== undefined ? parseInt(yudisiumPeriodId) : undefined,
    yudisiumRegistrationPeriodId:
      yudisiumRegistrationPeriodId !== undefined
        ? parseInt(yudisiumRegistrationPeriodId)
        : undefined,
    isDraft: true,
  };

  let yudisiumRegistration;

  if (id) {
    yudisiumRegistration = await prisma.yudisiumRegistration.update({
      where: { id: parseInt(id) },
      data: upsertData,
      include: {
        student: { select: { id: true, nim: true, name: true } },
        dosenPembimbing1: { select: { id: true, nip: true, name: true } },
        dosenPembimbing2: { select: { id: true, nip: true, name: true } },
      },
    });
  } else if (studentId) {
    const existing = await prisma.yudisiumRegistration.findFirst({
      where: { studentId: parseInt(studentId) },
      orderBy: { createdAt: "desc" },
    });

    if (existing && existing.isDraft) {
      yudisiumRegistration = await prisma.yudisiumRegistration.update({
        where: { id: existing.id },
        data: upsertData,
        include: {
          student: { select: { id: true, nim: true, name: true } },
          dosenPembimbing1: { select: { id: true, nip: true, name: true } },
          dosenPembimbing2: { select: { id: true, nip: true, name: true } },
        },
      });
    } else {
      yudisiumRegistration = await prisma.yudisiumRegistration.create({
        data: upsertData,
        include: {
          student: { select: { id: true, nim: true, name: true } },
          dosenPembimbing1: { select: { id: true, nip: true, name: true } },
          dosenPembimbing2: { select: { id: true, nip: true, name: true } },
        },
      });
    }
  } else {
    yudisiumRegistration = await prisma.yudisiumRegistration.create({
      data: upsertData,
      include: {
        student: { select: { id: true, nim: true, name: true } },
        dosenPembimbing1: { select: { id: true, nip: true, name: true } },
        dosenPembimbing2: { select: { id: true, nip: true, name: true } },
      },
    });
  }

  res.status(200).json({
    message: "Yudisium registration saved as draft successfully",
    data: yudisiumRegistration,
  });
});

// Submit Yudisium Registration (Update isDraft to false with Validation)
const submitYudisiumRegistration = asyncHandler(async (req, res) => {
  const {
    id,
    programType,
    tak,
    thesisTitleId,
    thesisTitleEn,
    isConfirmed,
    sidangScheme,
    cumlaudeScheme,
    jalurNonYudisium,
    eviden_cumlaude,
    studentId,
    dosenPembimbing1Id,
    dosenPembimbing2Id,
    yudisiumPeriodId,
    yudisiumRegistrationPeriodId,
  } = req.body;

  if (!id) {
    res.status(400);
    throw new Error("ID pendaftaran yudisium diperlukan untuk submit");
  }

  const existingRegistration = await prisma.yudisiumRegistration.findUnique({
    where: { id: parseInt(id) },
    include: {
      yudisiumRegistrationUploads: true,
    },
  });

  if (!existingRegistration) {
    res.status(404);
    throw new Error("Yudisium registration not found");
  }

  const updateData = {
    programType: programType !== undefined ? programType : undefined,
    tak: tak !== undefined ? tak : undefined,
    thesisTitleId: thesisTitleId !== undefined ? thesisTitleId : undefined,
    thesisTitleEn: thesisTitleEn !== undefined ? thesisTitleEn : undefined,
    isConfirmed: isConfirmed !== undefined ? isConfirmed : undefined,
    sidangScheme: sidangScheme !== undefined ? sidangScheme : undefined,
    cumlaudeScheme: cumlaudeScheme !== undefined ? cumlaudeScheme : undefined,
    jalurNonYudisium:
      jalurNonYudisium !== undefined ? jalurNonYudisium : undefined,
    eviden_cumlaude:
      eviden_cumlaude !== undefined ? eviden_cumlaude : undefined,
    studentId: studentId !== undefined ? parseInt(studentId) : undefined,
    dosenPembimbing1Id:
      dosenPembimbing1Id !== undefined
        ? parseInt(dosenPembimbing1Id)
        : undefined,
    dosenPembimbing2Id:
      dosenPembimbing2Id !== undefined
        ? parseInt(dosenPembimbing2Id)
        : undefined,
    yudisiumPeriodId:
      yudisiumPeriodId !== undefined ? parseInt(yudisiumPeriodId) : undefined,
    yudisiumRegistrationPeriodId:
      yudisiumRegistrationPeriodId !== undefined
        ? parseInt(yudisiumRegistrationPeriodId)
        : undefined,
  };

  const mergedData = { ...existingRegistration, ...updateData };

  const requiredFields = [
    "programType",
    "tak",
    "thesisTitleId",
    "thesisTitleEn",
    "isConfirmed",
    "studentId",
    "dosenPembimbing1Id",
    "dosenPembimbing2Id",
  ];

  const missingFields = requiredFields.filter(
    (field) => mergedData[field] === null || mergedData[field] === undefined,
  );

  if (missingFields.length > 0) {
    res.status(400);
    throw new Error(
      `Cannot submit. Missing required fields: ${missingFields.join(", ")}`,
    );
  }

  const uploadedSlugs = existingRegistration.yudisiumRegistrationUploads.map(
    (upload) => upload.slug,
  );

  const missingFiles = [];

  for (const slug of REQUIRED_SLUGS) {
    if (!uploadedSlugs.includes(slug)) missingFiles.push(slug);
  }

  if (missingFiles.length > 0) {
    res.status(400);
    throw new Error(
      `Cannot submit. Missing required files: ${missingFiles.join(", ")}`,
    );
  }

  if (mergedData.studentId) {
    const s = await prisma.student.findUnique({
      where: { id: mergedData.studentId },
    });
    if (!s) {
      res.status(404);
      throw new Error("Student not found");
    }
  }
  if (mergedData.dosenPembimbing1Id) {
    const d1 = await prisma.lecturer.findUnique({
      where: { id: mergedData.dosenPembimbing1Id },
    });
    if (!d1) {
      res.status(404);
      throw new Error("Dosen 1 not found");
    }
  }
  if (mergedData.dosenPembimbing2Id) {
    const d2 = await prisma.lecturer.findUnique({
      where: { id: mergedData.dosenPembimbing2Id },
    });
    if (!d2) {
      res.status(404);
      throw new Error("Dosen 2 not found");
    }
  }

  updateData.isDraft = false;

  const updatedYudisiumRegistration = await prisma.yudisiumRegistration.update({
    where: { id: parseInt(id) },
    data: updateData,
    include: {
      student: { select: { id: true, nim: true, name: true } },
      dosenPembimbing1: { select: { id: true, nip: true, name: true } },
      dosenPembimbing2: { select: { id: true, nip: true, name: true } },
    },
  });

  res.status(200).json({
    message: "Yudisium registration submitted successfully",
    data: updatedYudisiumRegistration,
  });
});

// Delete Yudisium Registration (soft delete)
const deleteYudisiumRegistration = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const yudisiumRegistrationExists =
    await prisma.yudisiumRegistration.findUnique({
      where: { id: parseInt(id) },
    });

  if (!yudisiumRegistrationExists) {
    res.status(404);
    throw new Error("Yudisium registration not found");
  }

  const deletedYudisiumRegistration = await prisma.yudisiumRegistration.update({
    where: { id: parseInt(id) },
    data: {
      deletedAt: new Date(),
    },
  });

  res.json({
    message: "Yudisium registration deleted successfully",
    data: deletedYudisiumRegistration,
  });
});

// Upload Dokumen Persyaratan Yudisium
const uploadYudisiumRegistrationFile = asyncHandler(async (req, res) => {
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

  const yudisiumRegistrationExists =
    await prisma.yudisiumRegistration.findUnique({
      where: { id: parseInt(id) },
    });

  if (!yudisiumRegistrationExists) {
    if (file.path) fs.unlink(file.path, () => {});
    res.status(404);
    throw new Error("Yudisium registration not found");
  }

  const existingUpload = await prisma.yudisiumRegistrationUpload.findFirst({
    where: {
      yudisiumRegistrationId: parseInt(id),
      slug: slug,
    },
  });

  let uploadRecord;

  if (existingUpload) {
    if (existingUpload.path && fs.existsSync(existingUpload.path)) {
      fs.unlinkSync(existingUpload.path);
    }

    uploadRecord = await prisma.yudisiumRegistrationUpload.update({
      where: { id: existingUpload.id },
      data: {
        name,
        filename: file.filename,
        path: file.path,
      },
    });
  } else {
    uploadRecord = await prisma.yudisiumRegistrationUpload.create({
      data: {
        name,
        slug,
        filename: file.filename,
        path: file.path,
        yudisiumRegistrationId: parseInt(id),
      },
    });
  }

  uploadRecord.downloadUrl = `${req.protocol}://${req.get("host")}/api/yudisium-registrations/uploads/${uploadRecord.id}/download`;

  res.status(200).json({
    message: existingUpload
      ? "File updated successfully"
      : "File uploaded successfully",
    data: uploadRecord,
  });
});

// Get All Uploaded Files by Yudisium Registration ID
const getYudisiumRegistrationFiles = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const uploads = await prisma.yudisiumRegistrationUpload.findMany({
    where: { yudisiumRegistrationId: parseInt(id) },
  });

  const data = uploads.map((upload) => ({
    ...upload,
    downloadUrl: `${req.protocol}://${req.get("host")}/api/yudisium-registrations/uploads/${upload.id}/download`,
  }));

  res.json({ data });
});

// Download Yudisium Registration Upload
const downloadYudisiumRegistrationFile = asyncHandler(async (req, res) => {
  const uploadId = parseInt(req.params.uploadId);

  const upload = await prisma.yudisiumRegistrationUpload.findFirst({
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
  listYudisiumRegistrations,
  getYudisiumRegistrationById,
  getYudisiumRegistrationByStudentId,
  saveYudisiumRegistration,
  submitYudisiumRegistration,
  deleteYudisiumRegistration,
  uploadYudisiumRegistrationFile,
  getYudisiumRegistrationFiles,
  downloadYudisiumRegistrationFile,
};
