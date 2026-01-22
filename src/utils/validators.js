/**
 * General Validation Utilities
 * Helper functions for input validation across the application
 */

/**
 * Validate if string is a valid license plate format
 * Accepts alphanumeric with hyphens, length 3-20
 * @param {string} licensePlate - License plate to validate
 * @returns {boolean} True if valid
 */
const isValidLicensePlate = (licensePlate) => {
  if (!licensePlate || typeof licensePlate !== 'string') {
    return false;
  }

  const pattern = /^[A-Z0-9-]{3,20}$/;
  return pattern.test(licensePlate.toUpperCase());
};

/**
 * Validate vehicle type
 * @param {string} vehicleType - Vehicle type to validate
 * @returns {boolean} True if valid (MOTORCYCLE, CAR, or BUS)
 */
const isValidVehicleType = (vehicleType) => {
  const validTypes = ['MOTORCYCLE', 'CAR', 'BUS'];
  return validTypes.includes(vehicleType);
};

/**
 * Validate spot status
 * @param {string} status - Spot status to validate
 * @returns {boolean} True if valid (AVAILABLE, OCCUPIED, or MAINTENANCE)
 */
const isValidSpotStatus = (status) => {
  const validStatuses = ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE'];
  return validStatuses.includes(status);
};

/**
 * Validate payment status
 * @param {string} status - Payment status to validate
 * @returns {boolean} True if valid (PENDING, PAID, or CANCELLED)
 */
const isValidPaymentStatus = (status) => {
  const validStatuses = ['PENDING', 'PAID', 'CANCELLED'];
  return validStatuses.includes(status);
};

/**
 * Validate rounding strategy
 * @param {string} strategy - Rounding strategy to validate
 * @returns {boolean} True if valid (CEILING, FLOOR, or ROUND)
 */
const isValidRoundingStrategy = (strategy) => {
  const validStrategies = ['CEILING', 'FLOOR', 'ROUND'];
  return validStrategies.includes(strategy);
};

/**
 * Validate if date string is ISO 8601 format
 * @param {string|Date} dateString - Date string or Date object
 * @returns {boolean} True if valid ISO 8601 date
 */
const isValidISODate = (dateString) => {
  if (dateString instanceof Date) {
    return !isNaN(dateString.getTime());
  }

  if (typeof dateString !== 'string') {
    return false;
  }

  const isoPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
  if (!isoPattern.test(dateString)) {
    return false;
  }

  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

/**
 * Validate positive integer
 * @param {any} value - Value to validate
 * @param {number} minValue - Minimum value (inclusive, default: 1)
 * @returns {boolean} True if valid positive integer
 */
const isValidPositiveInteger = (value, minValue = 1) => {
  if (!Number.isInteger(value)) {
    return false;
  }
  return value >= minValue;
};

/**
 * Validate positive decimal number
 * @param {any} value - Value to validate
 * @param {number} minValue - Minimum value (default: 0)
 * @returns {boolean} True if valid positive number
 */
const isValidPositiveDecimal = (value, minValue = 0) => {
  if (typeof value !== 'number' || isNaN(value)) {
    return false;
  }
  return value >= minValue;
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
const isValidEmail = (email) => {
  if (typeof email !== 'string') {
    return false;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
};

/**
 * Validate string length
 * @param {string} str - String to validate
 * @param {number} minLength - Minimum length
 * @param {number} maxLength - Maximum length
 * @returns {boolean} True if length is within range
 */
const isValidStringLength = (str, minLength = 1, maxLength = 255) => {
  if (typeof str !== 'string') {
    return false;
  }
  return str.length >= minLength && str.length <= maxLength;
};

/**
 * Sanitize string by trimming and removing extra spaces
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') {
    return '';
  }
  return str.trim().replace(/\s+/g, ' ');
};

/**
 * Sanitize object by removing null/undefined values
 * @param {Object} obj - Object to sanitize
 * @returns {Object} Sanitized object
 */
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return {};
  }

  const sanitized = {};
  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    if (value !== null && value !== undefined) {
      sanitized[key] = value;
    }
  });

  return sanitized;
};

module.exports = {
  isValidLicensePlate,
  isValidVehicleType,
  isValidSpotStatus,
  isValidPaymentStatus,
  isValidRoundingStrategy,
  isValidISODate,
  isValidPositiveInteger,
  isValidPositiveDecimal,
  isValidEmail,
  isValidStringLength,
  sanitizeString,
  sanitizeObject,
};
