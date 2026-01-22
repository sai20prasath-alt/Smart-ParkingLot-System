const AppError = require('./AppError');

/**
 * ValidationError class for input validation failures
 * Extends AppError with validation-specific properties
 */
class ValidationError extends AppError {
  constructor(message, errorCode = 'BAD_REQUEST', errors = {}) {
    super(message, 400, errorCode);
    this.name = 'ValidationError';
    this.validationErrors = errors;
  }

  /**
   * Add field-specific validation error
   * @param {string} field - Field name
   * @param {string} error - Error message
   */
  addFieldError(field, error) {
    if (!this.validationErrors) {
      this.validationErrors = {};
    }
    this.validationErrors[field] = error;
  }

  /**
   * Add multiple field errors at once
   * @param {Object} errors - Object with field names as keys and error messages as values
   */
  addFieldErrors(errors) {
    if (!this.validationErrors) {
      this.validationErrors = {};
    }
    Object.assign(this.validationErrors, errors);
  }

  /**
   * Check if there are validation errors
   * @returns {boolean} True if validation errors exist
   */
  hasErrors() {
    return Object.keys(this.validationErrors || {}).length > 0;
  }

  /**
   * Get all validation errors
   * @returns {Object} Validation errors object
   */
  getErrors() {
    return this.validationErrors || {};
  }

  /**
   * Convert to JSON response format with validation errors
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
        validationErrors: this.validationErrors,
      },
    };
  }

  /**
   * Create validation error from MongoDB Mongoose validation errors
   * @static
   * @param {Object} mongooseError - Mongoose validation error object
   * @returns {ValidationError} ValidationError instance
   */
  static fromMongooseError(mongooseError) {
    const errors = {};

    if (mongooseError.errors) {
      Object.keys(mongooseError.errors).forEach((field) => {
        errors[field] = mongooseError.errors[field].message;
      });
    }

    return new ValidationError('Validation failed', 'VALIDATION_ERROR', errors);
  }

  /**
   * Create validation error for missing required field
   * @static
   * @param {string} fieldName - Field name
   * @returns {ValidationError} ValidationError instance
   */
  static missingField(fieldName) {
    const errors = {};
    errors[fieldName] = `${fieldName} is required`;
    return new ValidationError(`Missing required field: ${fieldName}`, 'MISSING_REQUIRED_FIELD', errors);
  }

  /**
   * Create validation error for invalid field format
   * @static
   * @param {string} fieldName - Field name
   * @param {string} expectedFormat - Expected format description
   * @returns {ValidationError} ValidationError instance
   */
  static invalidFormat(fieldName, expectedFormat) {
    const errors = {};
    errors[fieldName] = `${fieldName} has invalid format. Expected: ${expectedFormat}`;
    return new ValidationError(
      `Invalid format for ${fieldName}`,
      'INVALID_FORMAT',
      errors
    );
  }

  /**
   * Create validation error for duplicate value
   * @static
   * @param {string} fieldName - Field name
   * @returns {ValidationError} ValidationError instance
   */
  static duplicate(fieldName) {
    const errors = {};
    errors[fieldName] = `${fieldName} already exists`;
    return new ValidationError(`Duplicate ${fieldName}`, 'DUPLICATE_VALUE', errors);
  }
}

module.exports = ValidationError;
