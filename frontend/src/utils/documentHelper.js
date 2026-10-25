/**
 * Mengambil nama dokumen terakhir yang berstatus completed berdasarkan waktu upload paling baru.
 * Jika dokumen belum memiliki waktu upload (uploadedAt), gunakan lastUploadedDocName dari state.
 * Jangan menebak nama dari urutan array dokumen.
 *
 * @param {Array} documents - Daftar dokumen di state
 * @param {string} lastUploadedDocName - Nama dokumen terakhir yang tercatat di state saat upload
 * @returns {string|null} - Nama dokumen terakhir atau null jika belum ada yang diupload
 */
export function getLatestCompletedDocName(documents = [], lastUploadedDocName = "") {
  const completedDocs = (documents || []).filter((d) => d.status === "completed");
  if (completedDocs.length === 0) {
    return null;
  }

  // 1. Dokumen completed yang memiliki waktu upload (uploadedAt)
  const docsWithTime = completedDocs.filter((d) => d.uploadedAt);
  if (docsWithTime.length > 0) {
    docsWithTime.sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
    return docsWithTime[0].name || docsWithTime[0].fileName || null;
  }

  // 2. Jika tidak ada timestamp pada dokumen, ambil dari state nama dokumen terakhir yang berhasil diupload
  if (lastUploadedDocName) {
    return lastUploadedDocName;
  }

  // 3. Jika hanya ada 1 dokumen completed
  if (completedDocs.length === 1) {
    return completedDocs[0].name || completedDocs[0].fileName || null;
  }

  return null;
}
