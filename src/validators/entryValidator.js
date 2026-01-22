const ValidationError = require('../errors/ValidationError');
const {
  isValidLicensePlate,
  isValidVehicleType,
  isValidStringLength,
  sanitizeString,
} = require('../utils/validators');

/**
 * Validate vehicle entry request body
 * Required fields: license_plate, vehicle_type
 * Optional fields: owner_name, registration_number
 *
 * @param {Object} body - Request body
 * @returns {Object} Validated and sanitized body
 * @throws {ValidationError} If validation fails
 */
const validateEntryRequest = (body) => {
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
    errors.license_plate = 'License plate is required';
  } else if (typeof body.license_plate !== 'string') {
    errors.license_plate = 'License plate must be a string';
  } else if (!isValidLicensePlate(body.license_plate)) {
    errors.license_plate = 'Invalid license plate format (3-20 alphanumeric characters)';
  }

  // Validate vehicle_type (required)
  if (!body.vehicle_type) {
    errors.vehicle_type = 'Vehicle type is required';
  } else if (typeof body.vehicle_type !== 'string') {
    errors.vehicle_type = 'Vehicle type must be a string';
  } else if (!isValidVehicleType(body.vehicle_type)) {
    errors.vehicle_type = 'Invalid vehicle type. Must be MOTORCYCLE, CAR, or BUS';
  }

  // Validate owner_name (optional)
  if (body.owner_name !== undefined) {
    if (body.owner_name === null) {
      // Allow null
    } else if (typeof body.owner_name !== 'string') {
      errors.owner_name = 'Owner name must be a string';
    } else if (!isValidStringLength(body.owner_name, 1, 100)) {
      errors.owner_name = 'Owner name must be between 1 and 100 characters';
    }
  }

  // Validate registration_number (optional)
  if (body.registration_number !== undefined) {
    if (body.registration_number === null) {
      // Allow null
    } else if (typeof body.registration_number !== 'string') {
      errors.registration_number = 'Registration number must be a string';
    } else if (!isValidStringLength(body.registration_number, 1, 50)) {
      errors.registration_number = 'Registration number must be between 1 and 50 characters';
    }
  }

  // If there are errors, throw ValidationError
  if (Object.keys(errors).length > 0) {
    throw new ValidationError(
      'Validation failed for entry request',
      'INVALID_ENTRY_REQUEST',
      errors
    );
  }

  // Return sanitized body
  return {
    license_plate: body.license_plate.trim().toUpperCase(),
    vehicle_type: body.vehicle_type.trim().toUpperCase(),
    owner_name: body.owner_name ? sanitizeString(body.owner_name) : null,
    registration_number: body.registration_number
      ? sanitizeString(body.registration_number)
      : null,
  };
};

/**
 * Validate optional query parameters for entry request
 * Optional parameters: floor_number, spot_preference
 *
 * @param {Object} query - Query parameters
 * @returns {Object} Validated query parameters
 * @throws {ValidationError} If validation fails
 */
const validateEntryQueryParams = (query) => {
  const validated = {};
  const errors = {};

  // Validate floor_number if provided
  if (query.floor_number !== undefined) {
    const floorNumber = parseInt(query.floor_number, 10);
    if (isNaN(floorNumber) || floorNumber < 1) {
      errors.floor_number = 'Floor number must be a positive integer';
    } else {
      validated.floor_number = floorNumber;
    }
  }

  // Validate spot_preference if provided
  if (query.spot_preference !== undefined) {
    const validPreferences = ['lowest_floor', 'nearest_exit', 'random'];
    if (!validPreferences.includes(query.spot_preference)) {
      errors.spot_preference = `Spot preference must be one of: ${validPreferences.join(', ')}`;
    } else {
      validated.spot_preference = query.spot_preference;
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError(
      'Invalid query parameters for entry',
      'INVALID_QUERY_PARAMS',
      errors
    );
  }

  return validated;
};

module.exports = {
  validateEntryRequest,
  validateEntryQueryParams,
};
