import rateLimit from "express-rate-limit";

/**
 * Rate limiter untuk endpoint autentikasi (login, register, forgot password, change password)
 * Membatasi percobaan brute force: maks 20 request per 15 menit per IP.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 20, // Maksimal 20 request per IP
  standardHeaders: true, // Return standard RateLimit headers
  legacyHeaders: false, // Disable X-RateLimit headers
  statusCode: 429,
  message: {
    success: false,
    message: "Terlalu banyak percobaan autentikasi. Silakan coba lagi setelah 15 menit.",
  },
});

/**
 * Rate limiter umum untuk endpoint API
 * Maksimal 1000 request per 15 menit per IP.
 */
export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  message: {
    success: false,
    message: "Terlalu banyak permintaan ke API. Silakan coba lagi nanti.",
  },
});
