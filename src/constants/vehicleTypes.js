/**
 * Vehicle Types Constants
 * Defines all vehicle types supported by the parking system
 */

const VEHICLE_TYPES = {
  MOTORCYCLE: 'MOTORCYCLE',
  CAR: 'CAR',
  BUS: 'BUS',
};

/**
 * Vehicle type descriptions
 */
const VEHICLE_TYPE_DESCRIPTIONS = {
  MOTORCYCLE: 'Motorcycle or Scooter',
  CAR: 'Sedan, SUV, or standard car',
  BUS: 'Bus or large vehicle',
};

/**
 * Vehicle spot size requirements
 * Defines how many standard units each vehicle type occupies
 */
const VEHICLE_SPOT_SIZE = {
  MOTORCYCLE: 1,
  CAR: 1,
  BUS: 2,
};

/**
 * Get all valid vehicle types as array
 * @returns {Array<string>} Array of vehicle types
 */
const getValidVehicleTypes = () => {
  return Object.values(VEHICLE_TYPES);
};

/**
 * Check if vehicle type is valid
 * @param {string} vehicleType - Vehicle type to check
 * @returns {boolean} True if valid vehicle type
 */
const isValidVehicleType = (vehicleType) => {
  return getValidVehicleTypes().includes(vehicleType);
};

/**
 * Get vehicle type description
 * @param {string} vehicleType - Vehicle type
 * @returns {string} Description of vehicle type
 */
const getVehicleTypeDescription = (vehicleType) => {
  return VEHICLE_TYPE_DESCRIPTIONS[vehicleType] || 'Unknown';
};

/**
 * Get spot size for vehicle type
 * @param {string} vehicleType - Vehicle type
 * @returns {number} Number of spot units required
 */
const getVehicleSpotSize = (vehicleType) => {
  return VEHICLE_SPOT_SIZE[vehicleType] || 1;
};

/**
 * Get eligible spot types for a vehicle
 * Spot size hierarchy: MOTORCYCLE < CAR < BUS
 * @param {string} vehicleType - Vehicle type
 * @returns {Array<string>} Array of eligible spot types
 */
const getEligibleSpotTypes = (vehicleType) => {
  const spotTypeMap = {
    MOTORCYCLE: ['MOTORCYCLE', 'CAR', 'BUS'],
    CAR: ['CAR', 'BUS'],
    BUS: ['BUS'],
  };
  return spotTypeMap[vehicleType] || [];
};

module.exports = {
  VEHICLE_TYPES,
  VEHICLE_TYPE_DESCRIPTIONS,
  VEHICLE_SPOT_SIZE,
  getValidVehicleTypes,
  isValidVehicleType,
  getVehicleTypeDescription,
  getVehicleSpotSize,
  getEligibleSpotTypes,
};
