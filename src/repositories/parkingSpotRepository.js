const ParkingSpot = require('../models/ParkingSpot');
const { createLogger } = require('../utils/logger');

const logger = createLogger('ParkingSpotRepository');

class ParkingSpotRepository {
  /**
   * Create a new parking spot
   * @param {Object} spotData - Spot data
   * @returns {Promise<Object>} Created spot
   */
  async create(spotData) {
    try {
      const spot = new ParkingSpot(spotData);
      await spot.save();
      logger.debug('Parking spot created', {
        spotId: spot._id,
        floorNumber: spot.floor_number,
        spotNumber: spot.spot_number,
      });
      return spot;
    } catch (error) {
      logger.error('Error creating parking spot', error, { spotData });
      throw error;
    }
  }

  /**
   * Find spot by ID
   * @param {string} spotId - Spot ID
   * @returns {Promise<Object>} Spot document
   */
  async findById(spotId) {
    try {
      return await ParkingSpot.findById(spotId);
    } catch (error) {
      logger.error('Error finding spot by ID', error, { spotId });
      throw error;
    }
  }

  /**
   * Find available spot by type
   * @param {string} spotType - Spot type (MOTORCYCLE, CAR, BUS)
   * @returns {Promise<Object>} First available spot
   */
  async findAvailableByType(spotType) {
    try {
      return await ParkingSpot.findOne({
        spot_type: spotType,
        status: 'AVAILABLE',
      })
        .sort({ floor_number: 1, spot_number: 1 })
        .exec();
    } catch (error) {
      logger.error('Error finding available spot', error, { spotType });
      throw error;
    }
  }

  /**
   * Find available spots by multiple types (best-fit allocation)
   * @param {Array<string>} spotTypes - Array of spot types
   * @returns {Promise<Array>} Available spots
   */
  async findAvailableByTypes(spotTypes) {
    try {
      
      const spotCount = await ParkingSpot.countDocuments();
      logger.debug('Checking available spots for types', { spotCount, spotTypes });
      
      return await ParkingSpot.find({
        spot_type: { $in: spotTypes },
        status: 'AVAILABLE',
      })
        .sort({ floor_number: 1, spot_type: 1, spot_number: 1 })
        .exec();
    } catch (error) {
      console.log('Error finding available spots by types', error, { spotTypes });
      logger.error('Error finding available spots by types', error, { spotTypes });
      throw error;
    }
  }

  /**
   * Get all available spots
   * @returns {Promise<Array>} All available spots
   */
  async findAllAvailable() {
    try {
      return await ParkingSpot.find({ status: 'AVAILABLE' })
        .sort({ floor_number: 1, spot_number: 1 })
        .exec();
    } catch (error) {
      logger.error('Error finding all available spots', error);
      throw error;
    }
  }

  /**
   * Get all occupied spots
   * @returns {Promise<Array>} All occupied spots
   */
  async findAllOccupied() {
    try {
      return await ParkingSpot.find({ status: 'OCCUPIED' })
        .populate('current_vehicle_id')
        .exec();
    } catch (error) {
      logger.error('Error finding all occupied spots', error);
      throw error;
    }
  }

  /**
   * Get spot availability by type
   * @param {string} spotType - Spot type
   * @returns {Promise<Object>} Availability stats
   */
  async getAvailabilityByType(spotType) {
    try {
      const [available, occupied, total] = await Promise.all([
        ParkingSpot.countDocuments({ spot_type: spotType, status: 'AVAILABLE' }),
        ParkingSpot.countDocuments({ spot_type: spotType, status: 'OCCUPIED' }),
        ParkingSpot.countDocuments({ spot_type: spotType }),
      ]);

      return {
        spot_type: spotType,
        available,
        occupied,
        total,
        occupancy_rate: total > 0 ? (occupied / total).toFixed(2) : 0,
      };
    } catch (error) {
      logger.error('Error getting availability by type', error, { spotType });
      throw error;
    }
  }

  /**
   * Get spot availability by floor
   * @param {number} floorNumber - Floor number
   * @returns {Promise<Object>} Availability stats
   */
  async getAvailabilityByFloor(floorNumber) {
    try {
      const [available, occupied, total] = await Promise.all([
        ParkingSpot.countDocuments({ floor_number: floorNumber, status: 'AVAILABLE' }),
        ParkingSpot.countDocuments({ floor_number: floorNumber, status: 'OCCUPIED' }),
        ParkingSpot.countDocuments({ floor_number: floorNumber }),
      ]);

      return {
        floor_number: floorNumber,
        available,
        occupied,
        total,
      };
    } catch (error) {
      logger.error('Error getting availability by floor', error, { floorNumber });
      throw error;
    }
  }

  /**
   * Update spot status
   * @param {string} spotId - Spot ID
   * @param {string} status - New status
   * @param {string} vehicleId - Vehicle ID (optional)
   * @returns {Promise<Object>} Updated spot
   */
  async updateStatus(spotId, status, vehicleId = null) {
    try {
      const updateData = { status };
      if (vehicleId !== null) {
        updateData.current_vehicle_id = vehicleId;
      }

      const spot = await ParkingSpot.findByIdAndUpdate(spotId, updateData, {
        new: true,
        runValidators: true,
      });

      logger.debug('Parking spot status updated', { spotId, status });
      return spot;
    } catch (error) {
      logger.error('Error updating spot status', error, { spotId, status });
      throw error;
    }
  }

  /**
   * Get total statistics
   * @returns {Promise<Object>} Overall statistics
   */
  async getStatistics() {
    try {
      const [totalSpots, availableSpots, occupiedSpots] = await Promise.all([
        ParkingSpot.countDocuments(),
        ParkingSpot.countDocuments({ status: 'AVAILABLE' }),
        ParkingSpot.countDocuments({ status: 'OCCUPIED' }),
      ]);

      return {
        total_spots: totalSpots,
        available_spots: availableSpots,
        occupied_spots: occupiedSpots,
        occupancy_rate: totalSpots > 0 ? (occupiedSpots / totalSpots).toFixed(2) : 0,
      };
    } catch (error) {
      logger.error('Error getting parking spot statistics', error);
      throw error;
    }
  }

  /**
   * Get all spots
   * @returns {Promise<Array>} All spots
   */
  async findAll() {
    try {
      return await ParkingSpot.find().sort({ floor_number: 1, spot_number: 1 }).exec();
    } catch (error) {
      logger.error('Error finding all spots', error);
      throw error;
    }
  }

  /**
   * Delete spot by ID
   * @param {string} spotId - Spot ID
   * @returns {Promise<Object>} Deleted spot
   */
  async deleteById(spotId) {
    try {
      return await ParkingSpot.findByIdAndDelete(spotId);
    } catch (error) {
      logger.error('Error deleting spot', error, { spotId });
      throw error;
    }
  }
}

module.exports = new ParkingSpotRepository();
