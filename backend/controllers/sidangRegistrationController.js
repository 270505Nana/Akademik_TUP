const asyncHandler = require("express-async-handler");
const prisma = require("../prisma/client");
const fs = require("fs");
const path = require("path");

// Constants for File Validation
const REQUIRED_SLUGS = [
  "berkasFormValidasiDosenWali",
  "berkasRekomendasiSidangPembimbing",
  "berkasScanPernyataanBiodataIjazahBermaterai",
  "berkasDummyIjazahBermaterai",
  "berkasScanAktaKelahiran",
  "berkasScanIjazahTerakhir",
  "berkasScanKhsDenganTtdDoswalKaprodi",
  "berkasLogBimbingan",
  "berkasSertifikatTak",
  "berkasRekomendasiBerkasEvidenceTaPaIgraciasPembimbing",
  "uploadDraftBukuTaSiapSidang",
];

const NON_SIDANG_SLUGS = {
  "Publikasi Jurnal": [
    "berkasLoaJurnal",
    "berkasPersetujuanPublikasiTaSebagaiPenggantiSidangJurnal",
    "berkasCameraReadyPaperYangSudahTerbit",
    "berkasCameraReadyPaperJurnal",
    "berkasRiwayatReviewOlehReviewers",
    "berkasResponseJurnal",
  ],
  "Proceeding International": [
    "berkasLoaProceeding",
    "berkasPersetujuanPublikasiTaSebagaiPenggantiSidangProceeding",
    "berkasCameraReadyPaperProceeding",
    "berkasPaktaIntegritas",
    "berkasResponseProceeding",
  ],
  HKI: [
    "sertifikatHki",
    "sertifikatDariMitraDudi",
    "sertifikatPendukungLainnya",
  ],
};

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
      // sidangRegistrationUploads: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Append downloadUrls
  const data = sidangRegistrations.map((reg) => ({
    ...reg,
    // sidangRegistrationUploads: reg.sidangRegistrationUploads.map((upload) => ({
    //   ...upload,
    //   downloadUrl: `${req.protocol}://${req.get("host")}/api/sidang-registrations/uploads/${upload.id}/download`,
    // })),
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
    throw new Error("Pendaftaran sidang tidak ditemukan");
  }

  sidangRegistration.sidangRegistrationUploads =
    sidangRegistration.sidangRegistrationUploads.map((upload) => ({
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
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!sidangRegistration) {
    res.status(404);
    throw new Error("Pendaftaran sidang tidak ditemukan");
  }

  sidangRegistration.sidangRegistrationUploads =
    sidangRegistration.sidangRegistrationUploads.map((upload) => ({
      ...upload,
      downloadUrl: `${req.protocol}://${req.get("host")}/api/sidang-registrations/uploads/${upload.id}/download`,
    }));

  res.json({
    data: sidangRegistration,
  });
});

// Save Draft Sidang Registration (Upsert)
const saveSidangRegistration = asyncHandler(async (req, res) => {
  const {
    id,
    programType,
    sidangScheme,
    jalurNonSidang,
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

  // Validate references if provided
  if (studentId) {
    const studentExists = await prisma.student.findUnique({
      where: { id: parseInt(studentId) },
    });
    if (!studentExists) {
      res.status(404);
      throw new Error("Mahasiswa tidak ditemukan");
    }
  }

  if (dosenPembimbing1Id) {
    const dosenExists = await prisma.lecturer.findUnique({
      where: { id: parseInt(dosenPembimbing1Id) },
    });
    if (!dosenExists) {
      res.status(404);
      throw new Error("Dosen pembimbing 1 tidak ditemukan");
    }
  }

  if (dosenPembimbing2Id) {
    const dosenExists = await prisma.lecturer.findUnique({
      where: { id: parseInt(dosenPembimbing2Id) },
    });
    if (!dosenExists) {
      res.status(404);
      throw new Error("Dosen pembimbing 2 tidak ditemukan");
    }
  }

  const upsertData = {
    programType: programType !== undefined ? programType : undefined,
    sidangScheme: sidangScheme !== undefined ? sidangScheme : undefined,
    jalurNonSidang: jalurNonSidang !== undefined ? jalurNonSidang : undefined,
    sks: sks !== undefined ? sks : undefined,
    ipk: ipk !== undefined ? ipk : undefined,
    tak: tak !== undefined ? tak : undefined,
    sktaExpDate: sktaExpDate ? new Date(sktaExpDate) : undefined,
    thesisTitleId: thesisTitleId !== undefined ? thesisTitleId : undefined,
    thesisTitleEn: thesisTitleEn !== undefined ? thesisTitleEn : undefined,
    studentId: studentId !== undefined ? parseInt(studentId) : undefined,
    dosenPembimbing1Id:
      dosenPembimbing1Id !== undefined
        ? parseInt(dosenPembimbing1Id)
        : undefined,
    dosenPembimbing2Id:
      dosenPembimbing2Id !== undefined
        ? parseInt(dosenPembimbing2Id)
        : undefined,
    isDraft: true,
  };

  let sidangRegistration;

  if (id) {
    // Update existing
    sidangRegistration = await prisma.sidangRegistration.update({
      where: { id: parseInt(id) },
      data: upsertData,
      include: {
        student: { select: { id: true, nim: true, name: true } },
        dosenPembimbing1: { select: { id: true, nip: true, name: true } },
        dosenPembimbing2: { select: { id: true, nip: true, name: true } },
      },
    });
  } else if (studentId) {
    // Look for existing draft
    const existing = await prisma.sidangRegistration.findFirst({
      where: { studentId: parseInt(studentId) },
      orderBy: { createdAt: "desc" },
    });

    if (existing && existing.isDraft) {
      sidangRegistration = await prisma.sidangRegistration.update({
        where: { id: existing.id },
        data: upsertData,
        include: {
          student: { select: { id: true, nim: true, name: true } },
          dosenPembimbing1: { select: { id: true, nip: true, name: true } },
          dosenPembimbing2: { select: { id: true, nip: true, name: true } },
        },
      });
    } else {
      sidangRegistration = await prisma.sidangRegistration.create({
        data: upsertData,
        include: {
          student: { select: { id: true, nim: true, name: true } },
          dosenPembimbing1: { select: { id: true, nip: true, name: true } },
          dosenPembimbing2: { select: { id: true, nip: true, name: true } },
        },
      });
    }
  } else {
    // Create new
    sidangRegistration = await prisma.sidangRegistration.create({
      data: upsertData,
      include: {
        student: { select: { id: true, nim: true, name: true } },
        dosenPembimbing1: { select: { id: true, nip: true, name: true } },
        dosenPembimbing2: { select: { id: true, nip: true, name: true } },
      },
    });
  }

  res.status(200).json({
    message: "Sidang registration saved as draft successfully",
    data: sidangRegistration,
  });
});

// Submit Sidang Registration (Update isDraft to false with Validation)
const submitSidangRegistration = asyncHandler(async (req, res) => {
  const {
    id,
    programType,
    sidangScheme,
    jalurNonSidang,
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

  if (!id) {
    res.status(400);
    throw new Error("ID pendaftaran sidang diperlukan untuk submit");
  }

  const existingRegistration = await prisma.sidangRegistration.findUnique({
    where: { id: parseInt(id) },
    include: {
      sidangRegistrationUploads: true,
    },
  });

  if (!existingRegistration) {
    res.status(404);
    throw new Error("Pendaftaran sidang tidak ditemukan");
  }

  // Update field sebelum validasi (supaya merge)
  const updateData = {
    programType: programType !== undefined ? programType : undefined,
    sidangScheme: sidangScheme !== undefined ? sidangScheme : undefined,
    jalurNonSidang: jalurNonSidang !== undefined ? jalurNonSidang : undefined,
    sks: sks !== undefined ? sks : undefined,
    ipk: ipk !== undefined ? ipk : undefined,
    tak: tak !== undefined ? tak : undefined,
    sktaExpDate: sktaExpDate ? new Date(sktaExpDate) : undefined,
    thesisTitleId: thesisTitleId !== undefined ? thesisTitleId : undefined,
    thesisTitleEn: thesisTitleEn !== undefined ? thesisTitleEn : undefined,
    studentId: studentId !== undefined ? parseInt(studentId) : undefined,
    dosenPembimbing1Id:
      dosenPembimbing1Id !== undefined
        ? parseInt(dosenPembimbing1Id)
        : undefined,
    dosenPembimbing2Id:
      dosenPembimbing2Id !== undefined
        ? parseInt(dosenPembimbing2Id)
        : undefined,
  };

  const mergedData = { ...existingRegistration, ...updateData };

  // 1. Validasi Field Required
  const requiredFields = [
    "programType",
    "sks",
    "ipk",
    "tak",
    "sktaExpDate",
    "thesisTitleId",
    "thesisTitleEn",
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
      `Tidak dapat submit. Field wajib belum lengkap: ${missingFields.join(", ")}`,
    );
  }

  // 2. Validasi Uploaded Files
  const uploadedSlugs = existingRegistration.sidangRegistrationUploads.map(
    (upload) => upload.slug,
  );

  const missingFiles = [];

  // Wajib
  for (const slug of REQUIRED_SLUGS) {
    if (!uploadedSlugs.includes(slug)) missingFiles.push(slug);
  }

  // Jalur Non Sidang
  if (mergedData.jalurNonSidang && Array.isArray(mergedData.jalurNonSidang)) {
    for (const jalur of mergedData.jalurNonSidang) {
      if (NON_SIDANG_SLUGS[jalur]) {
        for (const slug of NON_SIDANG_SLUGS[jalur]) {
          if (!uploadedSlugs.includes(slug)) missingFiles.push(slug);
        }
      }
    }
  }

  if (missingFiles.length > 0) {
    res.status(400);
    throw new Error(
      `Tidak dapat submit. Berkas wajib belum lengkap: ${missingFiles.join(", ")}`,
    );
  }

  // Validasi referensi eksis
  if (mergedData.studentId) {
    const s = await prisma.student.findUnique({
      where: { id: mergedData.studentId },
    });
    if (!s) {
      res.status(404);
      throw new Error("Mahasiswa tidak ditemukan");
    }
  }
  if (mergedData.dosenPembimbing1Id) {
    const d1 = await prisma.lecturer.findUnique({
      where: { id: mergedData.dosenPembimbing1Id },
    });
    if (!d1) {
      res.status(404);
      throw new Error("Dosen pembimbing 1 tidak ditemukan");
    }
  }
  if (mergedData.dosenPembimbing2Id) {
    const d2 = await prisma.lecturer.findUnique({
      where: { id: mergedData.dosenPembimbing2Id },
    });
    if (!d2) {
      res.status(404);
      throw new Error("Dosen pembimbing 2 tidak ditemukan");
    }
  }

  updateData.isDraft = false; // Finalize submit

  const updatedSidangRegistration = await prisma.sidangRegistration.update({
    where: { id: parseInt(id) },
    data: updateData,
    include: {
      student: { select: { id: true, nim: true, name: true } },
      dosenPembimbing1: { select: { id: true, nip: true, name: true } },
      dosenPembimbing2: { select: { id: true, nip: true, name: true } },
    },
  });

  res.status(200).json({
    message: "Sidang registration submitted successfully",
    data: updatedSidangRegistration,
  });
});

// Delete Sidang Registration (soft delete)
const deleteSidangRegistration = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const sidangRegistrationExists = await prisma.sidangRegistration.findUnique({
    where: { id: parseInt(id) },
  });

  if (!sidangRegistrationExists) {
    res.status(404);
    throw new Error("Pendaftaran sidang tidak ditemukan");
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
    throw new Error("Tidak ada file yang diunggah");
  }

  if (!slug || !name) {
    if (file.path) fs.unlink(file.path, () => {});
    res.status(400);
    throw new Error("Slug dan nama wajib diisi");
  }

  const sidangRegistrationExists = await prisma.sidangRegistration.findUnique({
    where: { id: parseInt(id) },
  });

  if (!sidangRegistrationExists) {
    if (file.path) fs.unlink(file.path, () => {});
    res.status(404);
    throw new Error("Pendaftaran sidang tidak ditemukan");
  }

  const existingUpload = await prisma.sidangRegistrationUpload.findFirst({
    where: {
      sidangRegistrationId: parseInt(id),
      slug: slug,
    },
  });

  let uploadRecord;

  if (existingUpload) {
    if (existingUpload.path && fs.existsSync(existingUpload.path)) {
      fs.unlinkSync(existingUpload.path);
    }

    uploadRecord = await prisma.sidangRegistrationUpload.update({
      where: { id: existingUpload.id },
      data: {
        name,
        filename: file.filename,
        path: file.path,
      },
    });
  } else {
    uploadRecord = await prisma.sidangRegistrationUpload.create({
      data: {
        name,
        slug,
        filename: file.filename,
        path: file.path,
        sidangRegistrationId: parseInt(id),
      },
    });
  }

  uploadRecord.downloadUrl = `${req.protocol}://${req.get(
    "host",
  )}/api/sidang-registrations/uploads/${uploadRecord.id}/download`;

  res.status(200).json({
    message: existingUpload
      ? "File updated successfully"
      : "File uploaded successfully",
    data: uploadRecord,
  });
});

// Get All Uploaded Files by Sidang Registration ID
const getSidangRegistrationFiles = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const uploads = await prisma.sidangRegistrationUpload.findMany({
    where: { sidangRegistrationId: parseInt(id) },
  });

  const data = uploads.map((upload) => ({
    ...upload,
    downloadUrl: `${req.protocol}://${req.get(
      "host",
    )}/api/sidang-registrations/uploads/${upload.id}/download`,
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
    throw new Error("Unggahan tidak ditemukan");
  }

  const filePath = path.resolve(process.cwd(), upload.path);

  if (!fs.existsSync(filePath)) {
    res.status(404);
    throw new Error("File tidak ditemukan");
  }

  res.download(filePath, upload.filename);
});

module.exports = {
  listSidangRegistrations,
  getSidangRegistrationById,
  getSidangRegistrationByStudentId,
  saveSidangRegistration,
  submitSidangRegistration,
  deleteSidangRegistration,
  uploadSidangRegistrationFile,
  getSidangRegistrationFiles,
  downloadSidangRegistrationFile,
};
