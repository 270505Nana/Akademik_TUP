/**
 * sidangTemplateHandler.js
 * Modul terpusat untuk operasi blob template dokumen sidang (fetch, preview, download).
 * Gunakan service ini di semua komponen — jangan duplikasi logika blob di tempat lain.
 */

import api, { getTemplate, downloadTemplate } from "./api";

/**
 * Ambil blob template dari endpoint preview (inline).
 * @param {string} code - Kode template, harus cocok dengan field 'code' di backend
 * @returns {Promise<{ blob: Blob, name: string }>}
 */
export const fetchTemplatePreviewBlob = async (code) => {
  const meta = await getTemplate(code);
  if (!meta) throw new Error("Template tidak ditemukan");

  const previewUrl = meta.previewUrl;
  if (!previewUrl) throw new Error("URL preview tidak tersedia untuk template ini");

  const response = await api.get(previewUrl, { responseType: "blob" });
  return {
    blob: response.data,
    name: meta.name || `template-${code}`,
  };
};

/**
 * Buka blob sebagai preview di tab baru, auto-revoke setelah 60 detik.
 * @param {Blob} blob
 */
export const openBlobPreview = (blob) => {
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
};

/**
 * Unduh file template ke perangkat user via endpoint download (attachment).
 * @param {string} code - Kode template
 */
export const triggerTemplateDownload = async (code) => {
  const { blob, name } = await downloadTemplate(code);

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  setTimeout(() => URL.revokeObjectURL(url), 5_000);
};