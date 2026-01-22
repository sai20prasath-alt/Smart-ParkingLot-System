const Vehicle = require('../models/Vehicle');
const { createLogger } = require('../utils/logger');

const logger = createLogger('VehicleRepository');

class VehicleRepository {
  /**
   * Create a new vehicle
   * @param {Object} vehicleData - Vehicle data
   * @returns {Promise<Object>} Created vehicle
   */
  async create(vehicleData) {
    try {
      const vehicle = new Vehicle(vehicleData);
      await vehicle.save();
      logger.debug('Vehicle created', {
        vehicleId: vehicle._id,
        licensePlate: vehicle.license_plate,
        vehicleType: vehicle.vehicle_type,
      });
      return vehicle;
    } catch (error) {
      logger.error('Error creating vehicle', error, { vehicleData });
      throw error;
    }
  }

  /**
   * Find vehicle by ID
   * @param {string} vehicleId - Vehicle ID
   * @returns {Promise<Object>} Vehicle document
   */
  async findById(vehicleId) {
    try {
      return await Vehicle.findById(vehicleId);
    } catch (error) {
      logger.error('Error finding vehicle by ID', error, { vehicleId });
      throw error;
    }
  }

  /**
   * Find vehicle by license plate
   * @param {string} licensePlate - License plate
   * @returns {Promise<Object>} Vehicle document
   */
  async findByLicensePlate(licensePlate) {
    try {
      return await Vehicle.findOne({ license_plate: licensePlate.toUpperCase() });
    } catch (error) {
      logger.error('Error finding vehicle by license plate', error, { licensePlate });
      throw error;
    }
  }

  /**
   * Get all vehicles
   * @returns {Promise<Array>} All vehicles
   */
  async findAll() {
    try {
      return await Vehicle.find().sort({ created_at: -1 }).exec();
    } catch (error) {
      logger.error('Error finding all vehicles', error);
      throw error;
    }
  }

  /**
   * Get currently parked vehicles
   * @returns {Promise<Array>} Currently parked vehicles
   */
  async findCurrentlyParked() {
    try {
      return await Vehicle.find({ is_currently_parked: true }).exec();
    } catch (error) {
      logger.error('Error finding currently parked vehicles', error);
      throw error;
    }
  }

  /**
   * Update vehicle parking status
   * @param {string} vehicleId - Vehicle ID
   * @param {boolean} isParked - Parking status
   * @returns {Promise<Object>} Updated vehicle
   */
  async updateParkingStatus(vehicleId, isParked) {
    try {
      const vehicle = await Vehicle.findByIdAndUpdate(
        vehicleId,
        { is_currently_parked: isParked },
        { new: true, runValidators: true }
      );

      logger.debug('Vehicle parking status updated', {
        vehicleId,
        isParked,
      });
      return vehicle;
    } catch (error) {
      logger.error('Error updating vehicle parking status', error, {
        vehicleId,
        isParked,
      });
      throw error;
    }
  }

  /**
   * Get vehicles by type
   * @param {string} vehicleType - Vehicle type (MOTORCYCLE, CAR, BUS)
   * @returns {Promise<Array>} Vehicles of specified type
   */
  async findByType(vehicleType) {
    try {
      return await Vehicle.find({ vehicle_type: vehicleType }).exec();
    } catch (error) {
      logger.error('Error finding vehicles by type', error, { vehicleType });
      throw error;
    }
  }

  /**
   * Get total vehicle count
   * @returns {Promise<number>} Total vehicles
   */
  async countTotal() {
    try {
      return await Vehicle.countDocuments();
    } catch (error) {
      logger.error('Error counting total vehicles', error);
      throw error;
    }
  }

  /**
   * Get currently parked vehicle count
   * @returns {Promise<number>} Count of parked vehicles
   */
  async countParked() {
    try {
      return await Vehicle.countDocuments({ is_currently_parked: true });
    } catch (error) {
      logger.error('Error counting parked vehicles', error);
      throw error;
    }
  }

  /**
   * Delete vehicle by ID
   * @param {string} vehicleId - Vehicle ID
   * @returns {Promise<Object>} Deleted vehicle
   */
  async deleteById(vehicleId) {
    try {
      return await Vehicle.findByIdAndDelete(vehicleId);
    } catch (error) {
      logger.error('Error deleting vehicle', error, { vehicleId });
      throw error;
    }
  }

  /**
   * Check if vehicle exists by license plate
   * @param {string} licensePlate - License plate
   * @returns {Promise<boolean>} True if exists
   */
  async existsByLicensePlate(licensePlate) {
    try {
      const count = await Vehicle.countDocuments({
        license_plate: licensePlate.toUpperCase(),
      });
      return count > 0;
    } catch (error) {
      logger.error('Error checking vehicle existence', error, { licensePlate });
      throw error;
    }
  }
}

module.exports = new VehicleRepository();
