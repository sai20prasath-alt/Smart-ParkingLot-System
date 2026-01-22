/**
 * Helper Utilities
 * General purpose helper functions
 */

/**
 * Generate UUID v4
 * Can be replaced with uuid package for production
 * @returns {string} Generated UUID
 */
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Generate transaction ID
 * Format: tx-<uuid>
 * @returns {string} Transaction ID
 */
const generateTransactionId = () => {
  return `tx-${generateUUID()}`;
};

/**
 * Generate vehicle ID
 * Format: vh-<uuid>
 * @returns {string} Vehicle ID
 */
const generateVehicleId = () => {
  return `vh-${generateUUID()}`;
};

/**
 * Generate spot ID
 * Format: sp-<uuid>
 * @returns {string} Spot ID
 */
const generateSpotId = () => {
  return `sp-${generateUUID()}`;
};

/**
 * Sleep for specified milliseconds (async)
 * Useful for retry logic and testing
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after specified time
 */
const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Retry operation with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxAttempts - Maximum retry attempts (default: 3)
 * @param {number} initialDelay - Initial delay in ms (default: 100)
 * @returns {Promise} Result from the operation
 */
const retryWithBackoff = async (fn, maxAttempts = 3, initialDelay = 100) => {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        const delay = initialDelay * Math.pow(2, attempt - 1);
        await sleep(delay);
      }
    }
  }

  throw lastError;
};

/**
 * Calculate time difference in specific unit
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {string} unit - Unit (milliseconds, seconds, minutes, hours, days)
 * @returns {number} Time difference
 */
const getTimeDifference = (startDate, endDate, unit = 'milliseconds') => {
  if (!(startDate instanceof Date) || !(endDate instanceof Date)) {
    throw new Error('Both parameters must be Date objects');
  }

  const differenceMs = endDate - startDate;

  const unitMap = {
    milliseconds: 1,
    seconds: 1000,
    minutes: 1000 * 60,
    hours: 1000 * 60 * 60,
    days: 1000 * 60 * 60 * 24,
  };

  if (!unitMap[unit]) {
    throw new Error(`Invalid unit: ${unit}`);
  }

  return differenceMs / unitMap[unit];
};

/**
 * Format currency value
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: USD)
 * @param {number} decimals - Decimal places (default: 2)
 * @returns {string} Formatted currency string
 */
const formatCurrency = (amount, currency = 'USD', decimals = 2) => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return `$0.00`;
  }

  const formatted = amount.toFixed(decimals);
  const currencySymbol = getCurrencySymbol(currency);
  return `${currencySymbol}${formatted}`;
};

/**
 * Get currency symbol
 * @param {string} currencyCode - Currency code (USD, EUR, etc.)
 * @returns {string} Currency symbol
 */
const getCurrencySymbol = (currencyCode) => {
  const symbolMap = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    INR: '₹',
  };
  return symbolMap[currencyCode] || '$';
};

/**
 * Deep clone object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Merge objects (shallow merge)
 * @param {...Object} objects - Objects to merge
 * @returns {Object} Merged object
 */
const mergeObjects = (...objects) => {
  return Object.assign({}, ...objects);
};

/**
 * Check if object is empty
 * @param {Object} obj - Object to check
 * @returns {boolean} True if object is empty
 */
const isEmptyObject = (obj) => {
  return Object.keys(obj).length === 0;
};

/**
 * Get nested object value safely
 * @param {Object} obj - Object to access
 * @param {string} path - Path to property (e.g., 'user.profile.name')
 * @param {any} defaultValue - Default value if path not found
 * @returns {any} Value or default value
 */
const getNestedValue = (obj, path, defaultValue = undefined) => {
  const keys = path.split('.');
  let value = obj;

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return defaultValue;
    }
  }

  return value;
};

module.exports = {
  generateUUID,
  generateTransactionId,
  generateVehicleId,
  generateSpotId,
  sleep,
  retryWithBackoff,
  getTimeDifference,
  formatCurrency,
  getCurrencySymbol,
  deepClone,
  mergeObjects,
  isEmptyObject,
  getNestedValue,
};
