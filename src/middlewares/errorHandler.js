const logger = require('../utils/logger');
const { ApiResponse } = require('../utils/helpers');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error(`Error ${error.statusCode || 500}: ${error.message}`, {
    error: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Prisma errors
  if (err.code === 'P2002') {
    const message = `Duplicate field value entered`;
    error = { statusCode: 400, message };
  }

  if (err.code === 'P2014') {
    const message = `Invalid ID`;
    error = { statusCode: 400, message };
  }

  if (err.code === 'P2003') {
    const message = `Invalid input data`;
    error = { statusCode: 400, message };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { statusCode: 401, message };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { statusCode: 401, message };
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = { statusCode: 400, message };
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File too large';
    error = { statusCode: 400, message };
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    const message = 'Too many files';
    error = { statusCode: 400, message };
  }

  // Default error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Server Error';

  res.status(statusCode).json(
    ApiResponse.error(message, process.env.NODE_ENV === 'development' ? error.stack : null)
  );
};

/**
 * Handle 404 errors
 */
const notFound = (req, res, next) => {
  const message = `Route ${req.originalUrl} not found`;
  logger.warn(`404 - ${message}`, {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });
  
  res.status(404).json(ApiResponse.error(message));
};

/**
 * Async error wrapper
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  notFound,
  asyncHandler,
};
