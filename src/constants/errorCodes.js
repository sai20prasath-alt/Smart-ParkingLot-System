/**
 * Error Codes Constants
 * Defines all error codes used throughout the application
 * Based on API_SPECIFICATION.md Section 7
 */

const ERROR_CODES = {
  // Success
  SUCCESS: {
    code: 'SUCCESS',
    message: 'Operation successful',
    statusCode: 200,
  },

  // Client Errors (4xx)
  BAD_REQUEST: {
    code: 'BAD_REQUEST',
    message: 'Invalid input parameters',
    statusCode: 400,
  },

  INVALID_VEHICLE_TYPE: {
    code: 'INVALID_VEHICLE_TYPE',
    message: 'Invalid vehicle type provided',
    statusCode: 400,
  },

  INVALID_LICENSE_PLATE: {
    code: 'INVALID_LICENSE_PLATE',
    message: 'Invalid or duplicate license plate',
    statusCode: 400,
  },

  INVALID_CONTENT_TYPE: {
    code: 'INVALID_CONTENT_TYPE',
    message: 'Invalid Content-Type header',
    statusCode: 400,
  },

  INVALID_JSON: {
    code: 'INVALID_JSON',
    message: 'Invalid JSON in request body',
    statusCode: 400,
  },

  INVALID_ID: {
    code: 'INVALID_ID',
    message: 'Invalid ID format',
    statusCode: 400,
  },

  INVALID_FORMAT: {
    code: 'INVALID_FORMAT',
    message: 'Invalid format for input field',
    statusCode: 400,
  },

  EMPTY_BODY: {
    code: 'EMPTY_BODY',
    message: 'Request body cannot be empty',
    statusCode: 400,
  },

  MISSING_REQUIRED_FIELD: {
    code: 'MISSING_REQUIRED_FIELD',
    message: 'Missing required field in request',
    statusCode: 400,
  },

  VALIDATION_ERROR: {
    code: 'VALIDATION_ERROR',
    message: 'Validation failed',
    statusCode: 400,
  },

  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    message: 'Missing or invalid authentication',
    statusCode: 401,
  },

  FORBIDDEN: {
    code: 'FORBIDDEN',
    message: 'Insufficient permissions',
    statusCode: 403,
  },

  NOT_FOUND: {
    code: 'NOT_FOUND',
    message: 'Resource not found',
    statusCode: 404,
  },

  VEHICLE_NOT_FOUND: {
    code: 'VEHICLE_NOT_FOUND',
    message: 'Vehicle is not parked in the lot',
    statusCode: 404,
  },

  SPOT_NOT_FOUND: {
    code: 'SPOT_NOT_FOUND',
    message: 'Parking spot not found',
    statusCode: 404,
  },

  TRANSACTION_NOT_FOUND: {
    code: 'TRANSACTION_NOT_FOUND',
    message: 'Parking transaction not found',
    statusCode: 404,
  },

  // Conflict Errors (409)
  CONFLICT: {
    code: 'CONFLICT',
    message: 'Resource conflict',
    statusCode: 409,
  },

  NO_SPOT_AVAILABLE: {
    code: 'NO_SPOT_AVAILABLE',
    message: 'No available parking spots for vehicle type',
    statusCode: 409,
  },

  VEHICLE_ALREADY_PARKED: {
    code: 'VEHICLE_ALREADY_PARKED',
    message: 'Vehicle is already parked in the lot',
    statusCode: 409,
  },

  ALREADY_EXITED: {
    code: 'ALREADY_EXITED',
    message: 'Vehicle has already exited',
    statusCode: 409,
  },

  DUPLICATE_VALUE: {
    code: 'DUPLICATE_VALUE',
    message: 'Duplicate value in database',
    statusCode: 409,
  },

  SPOT_ALREADY_OCCUPIED: {
    code: 'SPOT_ALREADY_OCCUPIED',
    message: 'Parking spot is already occupied',
    statusCode: 409,
  },

  // Rate Limiting (429)
  RATE_LIMIT_EXCEEDED: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Rate limit exceeded. Maximum requests per minute exceeded',
    statusCode: 429,
  },

  // Server Errors (5xx)
  INTERNAL_ERROR: {
    code: 'INTERNAL_ERROR',
    message: 'Internal server error',
    statusCode: 500,
  },

  DATABASE_ERROR: {
    code: 'DATABASE_ERROR',
    message: 'Internal server error',
    statusCode: 500,
  },

  LOCK_TIMEOUT: {
    code: 'LOCK_TIMEOUT',
    message: 'System busy, please retry',
    statusCode: 503,
  },

  SERVICE_UNAVAILABLE: {
    code: 'SERVICE_UNAVAILABLE',
    message: 'Service temporarily unavailable',
    statusCode: 503,
  },
};

/**
 * Get error object by code
 * @param {string} code - Error code
 * @returns {Object} Error object with code, message, and statusCode
 */
const getErrorByCode = (code) => {
  return ERROR_CODES[code] || ERROR_CODES.INTERNAL_ERROR;
};

/**
 * Get HTTP status code by error code
 * @param {string} code - Error code
 * @returns {number} HTTP status code
 */
const getStatusCode = (code) => {
  return getErrorByCode(code).statusCode;
};

/**
 * Get error message by code
 * @param {string} code - Error code
 * @returns {string} Error message
 */
const getErrorMessage = (code) => {
  return getErrorByCode(code).message;
};

module.exports = {
  ERROR_CODES,
  getErrorByCode,
  getStatusCode,
  getErrorMessage,
};
