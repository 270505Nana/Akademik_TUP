/**
 * Helper untuk sanitasi nama file agar aman dari karakter khusus path.
 *
 * @param {string} value
 * @returns {string}
 */
export const sanitizeFilename = (value) =>
  String(value || "template")
    .trim()
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ");

/**
 * Helper untuk men-generate slug code unik dari kategori dan nama dokumen.
 *
 * @param {string} category
 * @param {string} name
 * @returns {string}
 */
export const generateCodeFromCategoryAndName = (category, name) => {
  const raw = `${category || ""} ${name || ""}`;
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
};
