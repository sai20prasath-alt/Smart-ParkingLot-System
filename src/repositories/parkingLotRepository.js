const ParkingLot = require('../models/ParkingLot');
const { createLogger } = require('../utils/logger');

const logger = createLogger('ParkingLotRepository');

class ParkingLotRepository {
  /**
   * Create a new parking lot
   * @param {Object} lotData - Parking lot data
   * @returns {Promise<Object>} Created parking lot
   */
  async create(lotData) {
    try {
      const lot = new ParkingLot(lotData);
      await lot.save();
      logger.debug('Parking lot created', {
        lotId: lot._id,
        name: lot.name,
      });
      return lot;
    } catch (error) {
      logger.error('Error creating parking lot', error, { lotData });
      throw error;
    }
  }

  /**
   * Find parking lot by ID
   * @param {string} lotId - Lot ID
   * @returns {Promise<Object>} Parking lot document
   */
  async findById(lotId) {
    try {
      return await ParkingLot.findById(lotId);
    } catch (error) {
      logger.error('Error finding parking lot by ID', error, { lotId });
      throw error;
    }
  }

  /**
   * Find parking lot by name
   * @param {string} name - Lot name
   * @returns {Promise<Object>} Parking lot document
   */
  async findByName(name) {
    try {
      return await ParkingLot.findOne({ name });
    } catch (error) {
      logger.error('Error finding parking lot by name', error, { name });
      throw error;
    }
  }

  /**
   * Get all parking lots
   * @returns {Promise<Array>} All parking lots
   */
  async findAll() {
    try {
      return await ParkingLot.find().exec();
    } catch (error) {
      logger.error('Error finding all parking lots', error);
      throw error;
    }
  }

  /**
   * Get the default/first parking lot
   * @returns {Promise<Object>} First parking lot
   */
  async findDefault() {
    try {
      return await ParkingLot.findOne();
    } catch (error) {
      logger.error('Error finding default parking lot', error);
      throw error;
    }
  }

  /**
   * Update available spots for a vehicle type
   * @param {string} lotId - Lot ID
   * @param {string} vehicleType - Vehicle type (MOTORCYCLE, CAR, BUS)
   * @param {number} delta - Change in available spots (+1 for exit, -1 for entry)
   * @returns {Promise<Object>} Updated parking lot
   */
  async updateAvailableSpots(lotId, vehicleType, delta) {
    try {
      const field = `available_${vehicleType.toLowerCase()}_spots`;
      const occupiedField = `occupied_${vehicleType.toLowerCase()}_spots`;

      const updateData = {};
      updateData[field] = { $max: [{ $add: [{ $ifNull: [`$${field}`, 0] }, delta] }, 0] };
      updateData[occupiedField] = { $max: [{ $subtract: [{ $ifNull: [`$${occupiedField}`, 0] }, delta] }, 0] };

      const lot = await ParkingLot.findByIdAndUpdate(lotId, updateData, {
        new: true,
        runValidators: true,
      });

      logger.debug('Parking lot available spots updated', {
        lotId,
        vehicleType,
        delta,
      });
      return lot;
    } catch (error) {
      logger.error('Error updating available spots', error, {
        lotId,
        vehicleType,
        delta,
      });
      throw error;
    }
  }

  /**
   * Increment occupied spots
   * @param {string} lotId - Lot ID
   * @param {string} vehicleType - Vehicle type
   * @returns {Promise<Object>} Updated parking lot
   */
  async incrementOccupiedSpots(lotId, vehicleType) {
    try {
      const field = `occupied_${vehicleType.toLowerCase()}_spots`;
      const availableField = `available_${vehicleType.toLowerCase()}_spots`;

      const lot = await ParkingLot.findByIdAndUpdate(
        lotId,
        {
          $inc: { [field]: 1, [availableField]: -1 },
        },
        { new: true, runValidators: true }
      );

      logger.debug('Occupied spots incremented', { lotId, vehicleType });
      return lot;
    } catch (error) {
      logger.error('Error incrementing occupied spots', error, { lotId, vehicleType });
      throw error;
    }
  }

  /**
   * Decrement occupied spots
   * @param {string} lotId - Lot ID
   * @param {string} vehicleType - Vehicle type
   * @returns {Promise<Object>} Updated parking lot
   */
  async decrementOccupiedSpots(lotId, vehicleType) {
    try {
      const field = `occupied_${vehicleType.toLowerCase()}_spots`;
      const availableField = `available_${vehicleType.toLowerCase()}_spots`;

      const lot = await ParkingLot.findByIdAndUpdate(
        lotId,
        {
          $inc: { [field]: -1, [availableField]: 1 },
        },
        { new: true, runValidators: true }
      );

      logger.debug('Occupied spots decremented', { lotId, vehicleType });
      return lot;
    } catch (error) {
      logger.error('Error decrementing occupied spots', error, { lotId, vehicleType });
      throw error;
    }
  }

  /**
   * Get occupancy summary
   * @param {string} lotId - Lot ID
   * @returns {Promise<Object>} Occupancy summary
   */
  async getOccupancySummary(lotId) {
    try {
      const lot = await ParkingLot.findById(lotId);

      if (!lot) {
        return null;
      }

      return {
        lot_name: lot.name,
        total_spots: lot.total_spots,
        available_spots:
          lot.available_motorcycle_spots +
          lot.available_car_spots +
          lot.available_bus_spots,
        occupied_spots:
          lot.occupied_motorcycle_spots +
          lot.occupied_car_spots +
          lot.occupied_bus_spots,
        occupancy_rate: lot.occupancy_rate,
        by_type: {
          MOTORCYCLE: {
            available: lot.available_motorcycle_spots,
            occupied: lot.occupied_motorcycle_spots,
          },
          CAR: {
            available: lot.available_car_spots,
            occupied: lot.occupied_car_spots,
          },
          BUS: {
            available: lot.available_bus_spots,
            occupied: lot.occupied_bus_spots,
          },
        },
      };
    } catch (error) {
      logger.error('Error getting occupancy summary', error, { lotId });
      throw error;
    }
  }

  /**
   * Update parking lot
   * @param {string} lotId - Lot ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated parking lot
   */
  async update(lotId, updateData) {
    try {
      const lot = await ParkingLot.findByIdAndUpdate(lotId, updateData, {
        new: true,
        runValidators: true,
      });

      logger.debug('Parking lot updated', { lotId });
      return lot;
    } catch (error) {
      logger.error('Error updating parking lot', error, { lotId, updateData });
      throw error;
    }
  }

  /**
   * Delete parking lot by ID
   * @param {string} lotId - Lot ID
   * @returns {Promise<Object>} Deleted parking lot
   */
  async deleteById(lotId) {
    try {
      return await ParkingLot.findByIdAndDelete(lotId);
    } catch (error) {
      logger.error('Error deleting parking lot', error, { lotId });
      throw error;
    }
  }
}

module.exports = new ParkingLotRepository();
