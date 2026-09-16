import prisma from "../config/prisma.js";
import { NON_SIDANG_CATEGORY_MAP } from "../constants/index.js";

/**
 * Helper untuk menghitung persentase progres pengisian form pendaftaran sidang
 */
export const calculateSidangProgress = (reg, docsConfig) => {
  if (!reg.isDraft && reg.submittedAt) return 100;

  // 1. Validasi Input Fields (11 field wajib untuk submit)
  const requiredFields = [
    reg.program,
    reg.sks,
    reg.ipk,
    reg.tak,
    reg.sktaExpDate,
    reg.judulTugasAkhirIndonesia,
    reg.judulTugasAkhirInggris,
    reg.dosenPembimbing1Id,
    reg.dosenPembimbing2Id,
    reg.skemaSidang,
  ];

  let filledFieldsCount = requiredFields.filter(
    (f) => f !== null && f !== undefined && f !== ""
  ).length;

  if (reg.lulusTesBahasa === true || reg.lulusTesBahasa === false) {
    filledFieldsCount += 1;
  }
  const totalFieldsCount = 11;

  // 2. Validasi Uploaded Files
  const uploadedCategories = new Set(
    (reg.sidangRegistrationUploads || []).map((u) => u.category)
  );

  // A. Berkas Wajib
  const wajibSlugs = docsConfig.wajibSlugs || [];
  const wajibUploadedCount = wajibSlugs.filter((slug) =>
    uploadedCategories.has(slug)
  ).length;

  // B. Berkas Tes Bahasa
  let bahasaSlugs = [];
  if (reg.lulusTesBahasa === true) {
    bahasaSlugs = docsConfig.bahasaSudahSlugs || [];
  } else if (reg.lulusTesBahasa === false) {
    bahasaSlugs = docsConfig.bahasaBelumSlugs || [];
  } else {
    bahasaSlugs =
      docsConfig.bahasaSudahSlugs && docsConfig.bahasaSudahSlugs.length > 0
        ? docsConfig.bahasaSudahSlugs
        : docsConfig.bahasaBelumSlugs || [];
  }
  const bahasaUploadedCount = bahasaSlugs.filter((slug) =>
    uploadedCategories.has(slug)
  ).length;

  // C. Berkas Non Sidang (jika skema Non Sidang)
  const effectiveSkema = String(reg.skemaSidang || "").trim().toLowerCase();
  const isNonSidang =
    effectiveSkema === "non sidang" ||
    effectiveSkema.includes("non") ||
    (Array.isArray(reg.jalurNonSidang) && reg.jalurNonSidang.length > 0);

  let nonSidangSlugs = [];
  if (isNonSidang && Array.isArray(reg.jalurNonSidang)) {
    for (const jalur of reg.jalurNonSidang) {
      const normalized = String(jalur || "").trim();
      const matchedKey = Object.keys(NON_SIDANG_CATEGORY_MAP).find(
        (k) => k.toLowerCase() === normalized.toLowerCase()
      );
      const catName = matchedKey
        ? NON_SIDANG_CATEGORY_MAP[matchedKey]
        : `Sidang - Evidence Non Sidang ${normalized}`;
      const slugs = (docsConfig.allSidangDocs || [])
        .filter((d) => d.category === catName)
        .map((d) => d.code);
      nonSidangSlugs.push(...slugs);
    }
  }
  const nonSidangUploadedCount = nonSidangSlugs.filter((slug) =>
    uploadedCategories.has(slug)
  ).length;

  const totalCriteria =
    totalFieldsCount +
    wajibSlugs.length +
    bahasaSlugs.length +
    nonSidangSlugs.length;

  const completedCriteria =
    filledFieldsCount +
    wajibUploadedCount +
    bahasaUploadedCount +
    nonSidangUploadedCount;

  if (totalCriteria === 0) return 100;
  if (completedCriteria >= totalCriteria) return 100;

  const percentage = Math.floor((completedCriteria / totalCriteria) * 100);
  return Math.min(percentage, 99);
};
