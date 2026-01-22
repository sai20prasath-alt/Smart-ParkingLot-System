/**
 * Parking Spot Status Constants
 * Defines all possible states for parking spots
 */

const SPOT_STATUS = {
  AVAILABLE: 'AVAILABLE',
  OCCUPIED: 'OCCUPIED',
  MAINTENANCE: 'MAINTENANCE',
};

/**
 * Spot status descriptions
 */
const SPOT_STATUS_DESCRIPTIONS = {
  AVAILABLE: 'Spot is available for parking',
  OCCUPIED: 'Spot is currently occupied by a vehicle',
  MAINTENANCE: 'Spot is under maintenance and unavailable',
};

/**
 * Payment status constants
 */
const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
};

/**
 * Payment status descriptions
 */
const PAYMENT_STATUS_DESCRIPTIONS = {
  PENDING: 'Payment pending',
  PAID: 'Payment completed',
  CANCELLED: 'Payment cancelled',
};

/**
 * Rounding strategies for fee calculation
 */
const ROUNDING_STRATEGY = {
  CEILING: 'CEILING',
  FLOOR: 'FLOOR',
  ROUND: 'ROUND',
};

/**
 * Rounding strategy descriptions
 */
const ROUNDING_STRATEGY_DESCRIPTIONS = {
  CEILING: 'Round up to nearest hour',
  FLOOR: 'Round down to nearest hour',
  ROUND: 'Round to nearest hour',
};

/**
 * Get all valid spot statuses as array
 * @returns {Array<string>} Array of spot statuses
 */
const getValidSpotStatuses = () => {
  return Object.values(SPOT_STATUS);
};

/**
 * Check if spot status is valid
 * @param {string} status - Spot status to check
 * @returns {boolean} True if valid spot status
 */
const isValidSpotStatus = (status) => {
  return getValidSpotStatuses().includes(status);
};

/**
 * Get spot status description
 * @param {string} status - Spot status
 * @returns {string} Description of spot status
 */
const getSpotStatusDescription = (status) => {
  return SPOT_STATUS_DESCRIPTIONS[status] || 'Unknown';
};

/**
 * Get all valid payment statuses as array
 * @returns {Array<string>} Array of payment statuses
 */
const getValidPaymentStatuses = () => {
  return Object.values(PAYMENT_STATUS);
};

/**
 * Check if payment status is valid
 * @param {string} status - Payment status to check
 * @returns {boolean} True if valid payment status
 */
const isValidPaymentStatus = (status) => {
  return getValidPaymentStatuses().includes(status);
};

/**
 * Get payment status description
 * @param {string} status - Payment status
 * @returns {string} Description of payment status
 */
const getPaymentStatusDescription = (status) => {
  return PAYMENT_STATUS_DESCRIPTIONS[status] || 'Unknown';
};

/**
 * Get all valid rounding strategies as array
 * @returns {Array<string>} Array of rounding strategies
 */
const getValidRoundingStrategies = () => {
  return Object.values(ROUNDING_STRATEGY);
};

/**
 * Check if rounding strategy is valid
 * @param {string} strategy - Rounding strategy to check
 * @returns {boolean} True if valid rounding strategy
 */
const isValidRoundingStrategy = (strategy) => {
  return getValidRoundingStrategies().includes(strategy);
};

/**
 * Get rounding strategy description
 * @param {string} strategy - Rounding strategy
 * @returns {string} Description of rounding strategy
 */
const getRoundingStrategyDescription = (strategy) => {
  return ROUNDING_STRATEGY_DESCRIPTIONS[strategy] || 'Unknown';
};

module.exports = {
  SPOT_STATUS,
  SPOT_STATUS_DESCRIPTIONS,
  PAYMENT_STATUS,
  PAYMENT_STATUS_DESCRIPTIONS,
  ROUNDING_STRATEGY,
  ROUNDING_STRATEGY_DESCRIPTIONS,
  getValidSpotStatuses,
  isValidSpotStatus,
  getSpotStatusDescription,
  getValidPaymentStatuses,
  isValidPaymentStatus,
  getPaymentStatusDescription,
  getValidRoundingStrategies,
  isValidRoundingStrategy,
  getRoundingStrategyDescription,
};
