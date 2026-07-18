// Global error handling middleware
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || err.statusCode || 500;
  
  const response = {
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  // Optional log for debugging
  console.error(`[Error Handler] ${statusCode} - ${err.message}`);
  if (process.env.NODE_ENV === 'development' && err.stack) {
    console.error(err.stack);
  }

  res.status(statusCode).json(response);
};

// Middleware for handling 404 (Not Found) routes
export const notFoundHandler = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
};
