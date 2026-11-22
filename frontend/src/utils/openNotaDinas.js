/**
 * Membaca pesan error dari response blob (misal saat request menggunakan responseType: 'blob').
 * @param {any} err - Error object dari Axios / exception
 * @param {string} fallback - Pesan fallback jika tidak ditemukan pesan error spesifik
 * @returns {Promise<string>}
 */
export const readBlobErrorMessage = async (err, fallback = 'Terjadi kesalahan saat memuat dokumen.') => {
  try {
    const errData = err?.response?.data;
    if (errData instanceof Blob) {
      const text = await errData.text();
      try {
        const json = JSON.parse(text);
        if (json?.message) return json.message;
      } catch (_) {
        if (text && text.trim().length > 0 && text.length < 200) {
          return text.trim();
        }
      }
    } else if (err?.response?.data?.message) {
      return err.response.data.message;
    } else if (err?.message) {
      return err.message;
    }
  } catch (_) {
  }
  return fallback;
};
