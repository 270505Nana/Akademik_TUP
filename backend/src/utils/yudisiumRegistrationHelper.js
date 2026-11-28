/**
 * Menghasilkan predikat yudisium otomatis berdasarkan pengajuanCumlaudeFinal dan IPK.
 *
 * Ketentuan:
 * - "Sempurna"         : pengajuanCumlaudeFinal === "Summa Cumlaude"
 * - "Dengan Pujian"    : pengajuanCumlaudeFinal === "Cumlaude"
 * - "Sangat Memuaskan" : pengajuanCumlaudeFinal === "Non Cumlaude" dan ipk >= 3.01
 * - "Memuaskan"        : pengajuanCumlaudeFinal === "Non Cumlaude" (ipk < 3.01 atau null)
 */
export const generatePredikatYudisium = (pengajuanCumlaudeFinal, ipk) => {
  if (typeof pengajuanCumlaudeFinal !== "string") return null;

  const normalized = pengajuanCumlaudeFinal.trim().toLowerCase();
  if (!normalized) return null;

  if (normalized === "summa cumlaude") {
    return "Sempurna";
  }

  if (normalized === "cumlaude") {
    return "Dengan Pujian";
  }

  if (normalized === "non cumlaude") {
    const numericIpk = typeof ipk === "number" ? ipk : Number(ipk);
    if (!Number.isNaN(numericIpk) && ipk !== null && ipk !== undefined && numericIpk >= 3.01) {
      return "Sangat Memuaskan";
    }
    return "Memuaskan";
  }

  return null;
};
