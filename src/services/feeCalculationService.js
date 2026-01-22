const rateCardRepository = require('../repositories/rateCardRepository');
const { calculateParkingFee, formatDuration } = require('../utils/feeCalculator');
const { createLogger } = require('../utils/logger');
const AppError = require('../errors/AppError');

const logger = createLogger('FeeCalculationService');

/**
 * Fee Calculation Service
 * Calculates parking fees based on vehicle type, duration, and rate cards
 */

class FeeCalculationService {
  /**
   * Calculate parking fee
   * @param {string} vehicleType - Vehicle type (MOTORCYCLE, CAR, BUS)
   * @param {Date} entryTime - Entry timestamp
   * @param {Date} exitTime - Exit timestamp
   * @param {Object} rateCard - Rate card object
   * @returns {Object} Fee calculation details
   */
  calculateFee(vehicleType, entryTime, exitTime, rateCard) {
    try {
      if (!vehicleType || !entryTime || !exitTime || !rateCard) {
        throw new AppError(
          'Missing required parameters for fee calculation',
          400,
          'BAD_REQUEST'
        );
      }

      const feeDetails = calculateParkingFee(vehicleType, entryTime, exitTime, rateCard);

      logger.debug('Fee calculated', {
        vehicleType,
        duration: feeDetails.duration_formatted,
        fee: feeDetails.parking_fee,
      });

      return feeDetails;
    } catch (error) {
      logger.error('Error calculating fee', error, { vehicleType, entryTime, exitTime });
      throw error;
    }
  }

  /**
   * Estimate parking fee
   * @param {string} vehicleType - Vehicle type
   * @param {Date} entryTime - Entry timestamp
   * @returns {Object} Fee estimation
   */
  async estimateFee(vehicleType, entryTime) {
    try {
      const rateCard = await rateCardRepository.findByVehicleType(vehicleType);

      if (!rateCard) {
        throw new AppError(
          `Rate card not found for vehicle type ${vehicleType}`,
          404,
          'NOT_FOUND'
        );
      }

      const currentTime = new Date();
      return this.calculateFee(vehicleType, entryTime, currentTime, rateCard);
    } catch (error) {
      logger.error('Error estimating fee', error, { vehicleType, entryTime });
      throw error;
    }
  }

  /**
   * Calculate fee for given duration
   * @param {string} vehicleType - Vehicle type
   * @param {number} durationMinutes - Duration in minutes
   * @returns {Object} Fee calculation for duration
   */
  async calculateFeeForDuration(vehicleType, durationMinutes) {
    try {
      const rateCard = await rateCardRepository.findByVehicleType(vehicleType);

      if (!rateCard) {
        throw new AppError(
          `Rate card not found for vehicle type ${vehicleType}`,
          404,
          'NOT_FOUND'
        );
      }

      const now = new Date();
      const entryTime = new Date(now - durationMinutes * 60 * 1000);

      return this.calculateFee(vehicleType, entryTime, now, rateCard);
    } catch (error) {
      logger.error('Error calculating fee for duration', error, {
        vehicleType,
        durationMinutes,
      });
      throw error;
    }
  }

  /**
   * Get all rate cards
   * @returns {Promise<Array>} All rate cards
   */
  async getAllRateCards() {
    try {
      return await rateCardRepository.findAll();
    } catch (error) {
      logger.error('Error getting rate cards', error);
      throw error;
    }
  }

  /**
   * Get rate card for vehicle type
   * @param {string} vehicleType - Vehicle type
   * @returns {Promise<Object>} Rate card
   */
  async getRateCard(vehicleType) {
    try {
      const rateCard = await rateCardRepository.findByVehicleType(vehicleType);

      if (!rateCard) {
        throw new AppError(
          `Rate card not found for vehicle type ${vehicleType}`,
          404,
          'NOT_FOUND'
        );
      }

      return rateCard;
    } catch (error) {
      logger.error('Error getting rate card', error, { vehicleType });
      throw error;
    }
  }
}

module.exports = new FeeCalculationService();
