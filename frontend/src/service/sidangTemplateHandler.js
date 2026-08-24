/**
 * sidangTemplateHandler.js
 *
 * Single module penanganan template dokumen sidang.
 * Semua operasi blob (fetch, preview, download, cleanup) terpusat di sini.
 * Komponen lain WAJIB menggunakan service ini — jangan duplikasi logika blob di tempat lain.
 *
 * Alur yang didukung:
 *   1. fetchTemplatePreviewBlob(code) → ambil blob dari previewUrl endpoint
 *   2. openBlobPreview(blob)          → buka di tab baru, auto-revoke setelah 60 detik
 *   3. triggerTemplateDownload(code)  → fetch via downloadUrl endpoint → simpan ke perangkat
 */

import api, { getTemplate, downloadTemplate } from "./api";

/**
 * Mengambil blob template dari endpoint preview (inline, bukan attachment).
 * Menggunakan previewUrl dari metadata agar server menyajikan file inline,
 * sehingga blob bisa dibuka langsung di browser tanpa paksa-download.
 * Bearer token disisipkan otomatis oleh interceptor axios di api.js.
 *
 * @param {string} code - Kode template (harus cocok dengan field 'code' di BE)
 * @returns {Promise<{ blob: Blob, name: string }>}
 * @throws {Error} 404 jika template belum diunggah admin, atau error jaringan lain
 */
export const fetchTemplatePreviewBlob = async (code) => {
  const meta = await getTemplate(code);

  if (!meta) throw new Error("Template tidak ditemukan");

  const previewUrl = meta.previewUrl;
  if (!previewUrl) throw new Error("URL preview tidak tersedia untuk template ini");

  // Fetch blob dari previewUrl — interceptor axios otomatis menyertakan Authorization header
  const response = await api.get(previewUrl, { responseType: "blob" });

  return {
    blob: response.data,
    name: meta.name || `template-${code}`,
  };
};

/**
 * Membuka blob sebagai preview di tab baru.
 * ObjectURL di-revoke otomatis setelah 60 detik (konsisten dengan pola handleViewFile
 * yang sudah dipakai di Step2Sidang.jsx untuk "Lihat berkas" upload mahasiswa).
 *
 * @param {Blob} blob
 */
export const openBlobPreview = (blob) => {
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  // Revoke setelah 60 detik — memberi waktu browser menampilkan file sebelum URL dicabut
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
};

/**
 * Trigger unduh file template ke perangkat user.
 * Memanggil downloadTemplate dari api.js (fetch via downloadUrl endpoint attachment),
 * kemudian memicu browser download via anchor element.
 * ObjectURL untuk unduhan di-revoke setelah 5 detik agar browser sempat menginisiasi download.
 *
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
