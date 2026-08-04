// ============================================
// OZOBATH - Global Error Handler
// ============================================
const ApiError = require('../utils/apiError');

// ─── Error taxonomy ──────────────────────────────
// A stable machine-readable code per class of failure, so clients can branch
// on `code` instead of pattern-matching human-readable messages that change.
const CODES = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHENTICATED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  413: 'PAYLOAD_TOO_LARGE',
  429: 'RATE_LIMITED',
  500: 'INTERNAL_ERROR',
  502: 'UPSTREAM_ERROR',
  503: 'SERVICE_UNAVAILABLE',
};

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;
  let code = err.code && typeof err.code === 'string' ? err.code : null;

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    error = new ApiError(400, 'Resource not found. Invalid ID format.');
    code = 'INVALID_ID';
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    error = new ApiError(409, `Duplicate value for '${field}'. This ${field} already exists.`);
    code = 'DUPLICATE';
  }

  // Body larger than the configured limit — express.json raises this before
  // any route runs, and without a case here it surfaced as an opaque 500.
  if (err.type === 'entity.too.large') {
    error = new ApiError(413, 'Request body is too large.');
    code = 'PAYLOAD_TOO_LARGE';
  }

  // Malformed JSON.
  if (err instanceof SyntaxError && 'body' in err) {
    error = new ApiError(400, 'Request body is not valid JSON.');
    code = 'MALFORMED_JSON';
  }

  // CORS rejection — a 500 previously, which made a config problem look like
  // a server fault.
  if (typeof err.message === 'string' && err.message.startsWith('CORS:')) {
    error = new ApiError(403, 'Origin not allowed.');
    code = 'CORS_REJECTED';
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

  const statusCode = error.statusCode || 500;

  // Always log 500+ errors, in every environment — these are real server faults
  // and silently swallowing them in production leaves you debugging blind.
  // 4xx stays unlogged to avoid noise from Not Found / Unauthorized.
  if (statusCode >= 500) {
    console.error('❌ Server Error:', {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userId: req.user?._id?.toString(),
      message: err.message,
      stack: err.stack,
    });
  }

  // A 500 must never leak the internal message: it can carry a Mongo error
  // with collection names, or a driver string with connection details.
  const clientMessage = statusCode >= 500
    ? 'Something went wrong on our end. Please try again.'
    : (error.message || 'Request failed');

  res.status(statusCode).json({
    success: false,
    statusCode,
    code: code || CODES[statusCode] || 'ERROR',
    message: clientMessage,
    // Field-level detail from the validation layer, when present.
    ...(Array.isArray(error.errors) && error.errors.length ? { errors: error.errors } : {}),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
