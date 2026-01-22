const ValidationError = require('../errors/ValidationError');
const {
  isValidLicensePlate,
} = require('../utils/validators');

/**
 * Validate vehicle exit request body
 * Required field: license_plate
 *
 * @param {Object} body - Request body
 * @returns {Object} Validated and sanitized body
 * @throws {ValidationError} If validation fails
 */
const validateExitRequest = (body) => {
  const errors = {};

  // Check if body exists
  if (!body || typeof body !== 'object') {
    throw new ValidationError(
      'Request body is required',
      'EMPTY_BODY'
    );
  }

  // Validate license_plate (required)
  if (!body.license_plate) {
    errors.license_plate = 'License plate is required for exit';
  } else if (typeof body.license_plate !== 'string') {
    errors.license_plate = 'License plate must be a string';
  } else if (!isValidLicensePlate(body.license_plate)) {
    errors.license_plate = 'Invalid license plate format (3-20 alphanumeric characters)';
  }

  // If there are errors, throw ValidationError
  if (Object.keys(errors).length > 0) {
    throw new ValidationError(
      'Validation failed for exit request',
      'INVALID_EXIT_REQUEST',
      errors
    );
  }

  // Return sanitized body
  return {
    license_plate: body.license_plate.trim().toUpperCase(),
  };
};

/**
 * Validate optional query parameters for exit request
 * Optional parameters: payment_method
 *
 * @param {Object} query - Query parameters
 * @returns {Object} Validated query parameters
 * @throws {ValidationError} If validation fails
 */
const validateExitQueryParams = (query) => {
  const validated = {};
  const errors = {};

  // Validate payment_method if provided
  if (query.payment_method !== undefined) {
    const validMethods = ['CASH', 'CARD', 'MOBILE', 'PREPAID'];
    if (!validMethods.includes(query.payment_method.toUpperCase())) {
      errors.payment_method = `Payment method must be one of: ${validMethods.join(', ')}`;
    } else {
      validated.payment_method = query.payment_method.toUpperCase();
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError(
      'Invalid query parameters for exit',
      'INVALID_QUERY_PARAMS',
      errors
    );
  }

  return validated;
};

/**
 * Validate path parameter: license_plate
 * Used in GET /parking/vehicle/:license_plate/status
 *
 * @param {string} licensePlate - License plate from path parameter
 * @returns {string} Validated and sanitized license plate
 * @throws {ValidationError} If validation fails
 */
const validateLicensePlateParam = (licensePlate) => {
  if (!licensePlate || typeof licensePlate !== 'string') {
    throw new ValidationError(
      'License plate parameter is required',
      'MISSING_PARAM',
      { license_plate: 'License plate parameter is required' }
    );
  }

  if (!isValidLicensePlate(licensePlate)) {
    throw new ValidationError(
      'Invalid license plate format',
      'INVALID_LICENSE_PLATE',
      { license_plate: 'Invalid license plate format (3-20 alphanumeric characters)' }
    );
  }

  return licensePlate.trim().toUpperCase();
};

module.exports = {
  validateExitRequest,
  validateExitQueryParams,
  validateLicensePlateParam,
};
