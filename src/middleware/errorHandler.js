const AppError = require('../errors/AppError');

/**
 * Global error handling middleware
 * Should be registered as the last middleware in Express app
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const errorHandler = (err, req, res, next) => {
  // Log error to console (can be replaced with logger service)
  console.error({
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    error: {
      name: err.name,
      message: err.message,
      statusCode: err.statusCode,
      errorCode: err.errorCode,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    },
  });

  // Handle AppError (custom application errors)
  if (err instanceof AppError) {
    return res.status(err.getStatusCode()).json(err.toJSON());
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const errors = {};
    Object.keys(err.errors || {}).forEach((field) => {
      errors[field] = err.errors[field].message;
    });

    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        timestamp: new Date().toISOString(),
        statusCode: 400,
        validationErrors: errors,
      },
    });
  }

  // Handle Mongoose duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_VALUE',
        message: `${field} already exists in database`,
        timestamp: new Date().toISOString(),
        statusCode: 409,
      },
    });
  }

  // Handle Mongoose cast errors
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: `Invalid ID format: ${err.value}`,
        timestamp: new Date().toISOString(),
        statusCode: 400,
      },
    });
  }

  // Handle JSON parse errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Invalid JSON in request body',
        timestamp: new Date().toISOString(),
        statusCode: 400,
      },
    });
  }

  // Handle unknown errors
  const statusCode = err.statusCode || 500;
  const errorCode = err.errorCode || 'INTERNAL_ERROR';

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: err.message || 'Internal server error',
      timestamp: new Date().toISOString(),
      statusCode: statusCode,
    },
  });
};

module.exports = errorHandler;
