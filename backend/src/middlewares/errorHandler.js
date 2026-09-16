const errorHandler = (err, req, res, next) => {
  const statusCode =
    err.statusCode ||
    err.status ||
    (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);

  res.status(statusCode).json({
    message: err.message || "Terjadi kesalahan pada server",
    errors: err.errors || undefined,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

const notFoundHandler = (req, res, next) => {
  const error = new Error(`Resource tidak ditemukan - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export { errorHandler, notFoundHandler };
