const RateCard = require('../models/RateCard');
const { createLogger } = require('../utils/logger');

const logger = createLogger('RateCardRepository');

class RateCardRepository {
  /**
   * Create a new rate card
   * @param {Object} rateCardData - Rate card data
   * @returns {Promise<Object>} Created rate card
   */
  async create(rateCardData) {
    try {
      const rateCard = new RateCard(rateCardData);
      await rateCard.save();
      logger.debug('Rate card created', {
        rateCardId: rateCard._id,
        vehicleType: rateCard.vehicle_type,
      });
      return rateCard;
    } catch (error) {
      logger.error('Error creating rate card', error, { rateCardData });
      throw error;
    }
  }

  /**
   * Find rate card by ID
   * @param {string} rateCardId - Rate card ID
   * @returns {Promise<Object>} Rate card document
   */
  async findById(rateCardId) {
    try {
      return await RateCard.findById(rateCardId);
    } catch (error) {
      logger.error('Error finding rate card by ID', error, { rateCardId });
      throw error;
    }
  }

  /**
   * Find rate card by vehicle type
   * @param {string} vehicleType - Vehicle type (MOTORCYCLE, CAR, BUS)
   * @returns {Promise<Object>} Rate card document
   */
  async findByVehicleType(vehicleType) {
    try {
      return await RateCard.findOne({ vehicle_type: vehicleType });
    } catch (error) {
      logger.error('Error finding rate card by vehicle type', error, { vehicleType });
      throw error;
    }
  }

  /**
   * Get all rate cards
   * @returns {Promise<Array>} All rate cards
   */
  async findAll() {
    try {
      return await RateCard.find().exec();
    } catch (error) {
      logger.error('Error finding all rate cards', error);
      throw error;
    }
  }

  /**
   * Update rate card
   * @param {string} rateCardId - Rate card ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated rate card
   */
  async update(rateCardId, updateData) {
    try {
      const rateCard = await RateCard.findByIdAndUpdate(rateCardId, updateData, {
        new: true,
        runValidators: true,
      });

      logger.debug('Rate card updated', {
        rateCardId,
        vehicleType: rateCard.vehicle_type,
      });
      return rateCard;
    } catch (error) {
      logger.error('Error updating rate card', error, { rateCardId, updateData });
      throw error;
    }
  }

  /**
   * Update rate card by vehicle type
   * @param {string} vehicleType - Vehicle type
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated rate card
   */
  async updateByVehicleType(vehicleType, updateData) {
    try {
      const rateCard = await RateCard.findOneAndUpdate(
        { vehicle_type: vehicleType },
        updateData,
        { new: true, runValidators: true }
      );

      logger.debug('Rate card updated by vehicle type', { vehicleType });
      return rateCard;
    } catch (error) {
      logger.error('Error updating rate card by vehicle type', error, {
        vehicleType,
        updateData,
      });
      throw error;
    }
  }

  /**
   * Get hourly rates for all vehicle types
   * @returns {Promise<Object>} Hourly rates by vehicle type
   */
  async getHourlyRates() {
    try {
      const rateCards = await RateCard.find().select('vehicle_type hourly_rate').exec();

      const rates = {};
      rateCards.forEach((card) => {
        rates[card.vehicle_type] = card.hourly_rate;
      });

      return rates;
    } catch (error) {
      logger.error('Error getting hourly rates', error);
      throw error;
    }
  }

  /**
   * Delete rate card by ID
   * @param {string} rateCardId - Rate card ID
   * @returns {Promise<Object>} Deleted rate card
   */
  async deleteById(rateCardId) {
    try {
      return await RateCard.findByIdAndDelete(rateCardId);
    } catch (error) {
      logger.error('Error deleting rate card', error, { rateCardId });
      throw error;
    }
  }

  /**
   * Check if rate card exists for vehicle type
   * @param {string} vehicleType - Vehicle type
   * @returns {Promise<boolean>} True if exists
   */
  async existsByVehicleType(vehicleType) {
    try {
      const count = await RateCard.countDocuments({ vehicle_type: vehicleType });
      return count > 0;
    } catch (error) {
      logger.error('Error checking rate card existence', error, { vehicleType });
      throw error;
    }
  }
}

module.exports = new RateCardRepository();
