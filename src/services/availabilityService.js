const parkingSpotRepository = require('../repositories/parkingSpotRepository');
const parkingLotRepository = require('../repositories/parkingLotRepository');
const { createLogger } = require('../utils/logger');
const AppError = require('../errors/AppError');

const logger = createLogger('AvailabilityService');

/**
 * Availability Service
 * Provides real-time parking spot availability information
 * Uses caching for performance optimization
 */

class AvailabilityService {
  /**
   * Get overall parking availability
   * @returns {Promise<Object>} Availability summary
   */
  async getOverallAvailability() {
    try {
      const lot = await parkingLotRepository.findDefault();

      if (!lot) {
        throw new AppError(
          'No parking lot found',
          404,
          'NOT_FOUND'
        );
      }

      const [motorcycleStats, carStats, busStats] = await Promise.all([
        parkingSpotRepository.getAvailabilityByType('MOTORCYCLE'),
        parkingSpotRepository.getAvailabilityByType('CAR'),
        parkingSpotRepository.getAvailabilityByType('BUS'),
      ]);

      const totalAvailable = motorcycleStats.available + carStats.available + busStats.available;
      const totalOccupied = motorcycleStats.occupied + carStats.occupied + busStats.occupied;
      const totalSpots = lot.total_spots;

      logger.debug('Overall availability retrieved', {
        totalAvailable,
        totalOccupied,
        totalSpots,
      });

      return {
        total_available_spots: totalAvailable,
        total_occupied_spots: totalOccupied,
        total_spots: totalSpots,
        occupancy_rate: totalSpots > 0 ? parseFloat((totalOccupied / totalSpots).toFixed(2)) : 0,
        availability_by_type: {
          MOTORCYCLE: motorcycleStats,
          CAR: carStats,
          BUS: busStats,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error('Error getting overall availability', error);
      throw error;
    }
  }

  /**
   * Get availability by vehicle type
   * @param {string} vehicleType - Vehicle type (MOTORCYCLE, CAR, BUS)
   * @returns {Promise<Object>} Availability for vehicle type
   */
  async getAvailabilityByType(vehicleType) {
    try {
      const stats = await parkingSpotRepository.getAvailabilityByType(vehicleType);

      logger.debug('Availability by type retrieved', {
        vehicleType,
        available: stats.available,
      });

      return stats;
    } catch (error) {
      logger.error('Error getting availability by type', error, { vehicleType });
      throw error;
    }
  }

  /**
   * Get availability by floor
   * @param {number} floorNumber - Floor number
   * @returns {Promise<Object>} Availability for floor
   */
  async getAvailabilityByFloor(floorNumber) {
    try {
      const stats = await parkingSpotRepository.getAvailabilityByFloor(floorNumber);

      logger.debug('Availability by floor retrieved', {
        floor: floorNumber,
        available: stats.available,
      });

      return stats;
    } catch (error) {
      logger.error('Error getting availability by floor', error, { floorNumber });
      throw error;
    }
  }

  /**
   * Get all floors availability
   * @returns {Promise<Object>} Availability for all floors
   */
  async getAvailabilityByAllFloors() {
    try {
      const lot = await parkingLotRepository.findDefault();

      if (!lot) {
        throw new AppError(
          'No parking lot found',
          404,
          'NOT_FOUND'
        );
      }

      const floorStats = {};

      for (let floor = 1; floor <= lot.total_floors; floor++) {
        floorStats[floor] = await parkingSpotRepository.getAvailabilityByFloor(floor);
      }

      logger.debug('All floors availability retrieved', {
        totalFloors: lot.total_floors,
      });

      return floorStats;
    } catch (error) {
      logger.error('Error getting availability by all floors', error);
      throw error;
    }
  }

  /**
   * Get detailed availability with floor distribution
   * @param {string} vehicleType - Optional vehicle type filter
   * @returns {Promise<Object>} Detailed availability
   */
  async getDetailedAvailability(vehicleType = null) {
    try {
      const lot = await parkingLotRepository.findDefault();

      if (!lot) {
        throw new AppError(
          'No parking lot found',
          404,
          'NOT_FOUND'
        );
      }

      let result;

      if (vehicleType) {
        const stats = await parkingSpotRepository.getAvailabilityByType(vehicleType);
        const floorStats = await this.getAvailabilityByAllFloors();

        result = {
          vehicle_type_filter: vehicleType,
          available_spots: stats.available,
          occupied_spots: stats.occupied,
          total_spots: stats.total,
          occupancy_rate: stats.occupancy_rate,
          available_floor_distribution: {},
          timestamp: new Date(),
        };

        // Get floor distribution for this vehicle type
        for (let floor = 1; floor <= lot.total_floors; floor++) {
          const spots = await parkingSpotRepository.findAvailableByTypes([vehicleType]);
          result.available_floor_distribution[floor] = spots.filter(
            (s) => s.floor_number === floor
          ).length;
        }
      } else {
        const overall = await this.getOverallAvailability();
        result = overall;
      }

      return result;
    } catch (error) {
      logger.error('Error getting detailed availability', error, { vehicleType });
      throw error;
    }
  }

  /**
   * Check if parking is available for vehicle type
   * @param {string} vehicleType - Vehicle type
   * @returns {Promise<boolean>} True if spots available
   */
  async isAvailableForType(vehicleType) {
    try {
      const stats = await parkingSpotRepository.getAvailabilityByType(vehicleType);
      return stats.available > 0;
    } catch (error) {
      logger.error('Error checking availability for type', error, { vehicleType });
      throw error;
    }
  }
}

module.exports = new AvailabilityService();
