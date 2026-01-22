/**
 * Custom AppError class extending Error
 * Used as base class for all application errors
 */
class AppError extends Error {
  constructor(message, statusCode, errorCode = 'INTERNAL_ERROR') {
    super(message);

    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.timestamp = new Date().toISOString();
    this.isOperational = true;

    // Maintain proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to JSON response format
   * @returns {Object} Formatted error response
   */
  toJSON() {
    return {
      success: false,
      error: {
        code: this.errorCode,
        message: this.message,
        timestamp: this.timestamp,
        statusCode: this.statusCode,
      },
    };
  }

  /**
   * Get HTTP status code
   * @returns {number} HTTP status code
   */
  getStatusCode() {
    return this.statusCode || 500;
  }

  /**
   * Get error code
   * @returns {string} Error code
   */
  getErrorCode() {
    return this.errorCode;
  }
}

module.exports = AppError;
