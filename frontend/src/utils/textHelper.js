/**
 * Helper untuk memformat nama dokumen atau slug menjadi nama yang mudah dibaca.
 * Contoh: "form_persetujuan_sidang" -> "Form Persetujuan Sidang"
 */
export const humanizeDocName = (name) => {
  if (!name || typeof name !== 'string') return '';
  
  // Jika nama sudah dalam format normal dengan spasi dan tanpa underscore/hyphen/extension
  if (!name.includes('_') && !name.includes('-') && !name.includes('.')) {
    return name.trim();
  }

  return name
    .replace(/\.[^/.]+$/, '') // Menghapus ekstensi file jika ada
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};
