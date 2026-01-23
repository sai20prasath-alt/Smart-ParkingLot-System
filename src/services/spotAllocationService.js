const parkingSpotRepository = require('../repositories/parkingSpotRepository');
const { selectOptimalSpot, getEligibleSpotTypes } = require('../utils/spotAllocator');
const { createLogger } = require('../utils/logger');
const AppError = require('../errors/AppError');

const logger = createLogger('SpotAllocationService');

/**
 * Spot Allocation Service
 * Implements best-fit spot allocation algorithm
 * Allocates smallest suitable spot with priority for lower floors
 */

class SpotAllocationService {
  /**
   * Allocate parking spot for vehicle
   * Algorithm: Best-fit with priority for lower floors
   * @param {string} vehicleType - Vehicle type (MOTORCYCLE, CAR, BUS)
   * @returns {Promise<Object>} Allocated parking spot
   */
  async allocateSpot(vehicleType) {
    try {
      // Step 1: Get eligible spot types
      const eligibleTypes = getEligibleSpotTypes(vehicleType);
      
      console.log('Eligible spot types:', eligibleTypes);

      if (eligibleTypes.length === 0) {
        throw new AppError(
          `Invalid vehicle type: ${vehicleType}`,
          400,
          'INVALID_VEHICLE_TYPE'
        );
      }

      console.log('Eligible spot types:', eligibleTypes);

      // Step 2: Get available spots by eligible types
      const availableSpots = await parkingSpotRepository.findAvailableByTypes(
        eligibleTypes
      );

      if (availableSpots.length === 0) {
        logger.warn('No available spots for allocation', {
          vehicleType,
          eligibleTypes,
        });
        return null;
      }

      // Step 3: Select optimal spot
      const optimalSpot = selectOptimalSpot(vehicleType, availableSpots);

      if (!optimalSpot) {
        logger.warn('Could not select optimal spot', {
          vehicleType,
          availableSpotsCount: availableSpots.length,
        });
        return null;
      }

      logger.debug('Spot allocated', {
        vehicleType,
        spotId: optimalSpot._id,
        floor: optimalSpot.floor_number,
        spotNumber: optimalSpot.spot_number,
      });

      return optimalSpot;
    } catch (error) {
      logger.error('Error allocating parking spot', error, { vehicleType });
      throw error;
    }
  }

  /**
   * Get allocation recommendations
   * @returns {Promise<Object>} Availability by vehicle type
   */
  async getAllocationRecommendations() {
    try {
      const recommendations = {
        MOTORCYCLE: await parkingSpotRepository.getAvailabilityByType('MOTORCYCLE'),
        CAR: await parkingSpotRepository.getAvailabilityByType('CAR'),
        BUS: await parkingSpotRepository.getAvailabilityByType('BUS'),
      };

      return recommendations;
    } catch (error) {
      logger.error('Error getting allocation recommendations', error);
      throw error;
    }
  }

  /**
   * Check if spot is available
   * @param {string} spotId - Spot ID
   * @returns {Promise<boolean>} True if available
   */
  async isSpotAvailable(spotId) {
    try {
      const spot = await parkingSpotRepository.findById(spotId);
      return spot && spot.status === 'AVAILABLE';
    } catch (error) {
      logger.error('Error checking spot availability', error, { spotId });
      throw error;
    }
  }
}

module.exports = new SpotAllocationService();
