// ============================================
// OZOBATH - Global Error Handler
// ============================================
const ApiError = require('../utils/apiError');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log for dev
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error:', err);
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    error = new ApiError(400, 'Resource not found. Invalid ID format.');
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = new ApiError(400, `Duplicate value for '${field}'. This ${field} already exists.`);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    error = new ApiError(400, messages.join('. '));
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new ApiError(401, 'Invalid token.');
  }
  if (err.name === 'TokenExpiredError') {
    error = new ApiError(401, 'Token has expired.');
  }

  res.status(error.statusCode || 500).json({
    success: false,
    statusCode: error.statusCode || 500,
    message: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
