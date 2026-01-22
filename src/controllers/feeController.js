const feeCalculationService = require('../services/feeCalculationService');
const { createLogger } = require('../utils/logger');
const AppError = require('../errors/AppError');
const {
  isValidVehicleType,
  isValidISODate,
} = require('../utils/validators');

const logger = createLogger('FeeController');

/**
 * Fee Controller
 * Handles parking fee calculation endpoints
 */

class FeeController {
  /**
   * POST /parking/fees/calculation
   * Calculate estimated or final parking fee
   */
  async calculateFee(req, res, next) {
    try {
      logger.logRequest(req);

      const { vehicle_type, entry_time, exit_time } = req.body;

      // Validate vehicle_type
      if (!vehicle_type) {
        throw new AppError(
          'vehicle_type is required',
          400,
          'MISSING_REQUIRED_FIELD'
        );
      }

      if (!isValidVehicleType(vehicle_type)) {
        throw new AppError(
          `Invalid vehicle type: ${vehicle_type}. Must be MOTORCYCLE, CAR, or BUS`,
          400,
          'INVALID_VEHICLE_TYPE'
        );
      }

      // Validate entry_time
      if (!entry_time) {
        throw new AppError(
          'entry_time is required',
          400,
          'MISSING_REQUIRED_FIELD'
        );
      }

      if (!isValidISODate(entry_time)) {
        throw new AppError(
          'entry_time must be a valid ISO 8601 date',
          400,
          'INVALID_FORMAT'
        );
      }

      // Validate exit_time if provided
      if (exit_time && !isValidISODate(exit_time)) {
        throw new AppError(
          'exit_time must be a valid ISO 8601 date',
          400,
          'INVALID_FORMAT'
        );
      }

      // Get rate card
      const rateCard = await feeCalculationService.getRateCard(vehicle_type);

      // Parse dates
      const entryDate = new Date(entry_time);
      const exitDate = exit_time ? new Date(exit_time) : new Date();

      // Validate exit is after entry
      if (exitDate <= entryDate) {
        throw new AppError(
          'exit_time must be after entry_time',
          400,
          'BAD_REQUEST'
        );
      }

      // Calculate fee
      const feeDetails = feeCalculationService.calculateFee(
        vehicle_type,
        entryDate,
        exitDate,
        rateCard
      );

      const startTime = Date.now();
      res.status(200).json({
        success: true,
        data: feeDetails,
      });

      logger.logResponse(req, 200, Date.now() - startTime);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /parking/fees/rates
   * Get all rate cards (bonus endpoint)
   */
  async getRateCards(req, res, next) {
    try {
      logger.logRequest(req);

      const rateCards = await feeCalculationService.getAllRateCards();

      const startTime = Date.now();
      res.status(200).json({
        success: true,
        data: {
          rate_cards: rateCards,
          timestamp: new Date(),
        },
      });

      logger.logResponse(req, 200, Date.now() - startTime);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /parking/fees/estimate
   * Estimate fee for a vehicle with custom duration
   */
  async estimateFee(req, res, next) {
    try {
      logger.logRequest(req);

      const { vehicle_type, duration_minutes } = req.query;

      // Validate vehicle_type
      if (!vehicle_type) {
        throw new AppError(
          'vehicle_type query parameter is required',
          400,
          'MISSING_REQUIRED_FIELD'
        );
      }

      if (!isValidVehicleType(vehicle_type)) {
        throw new AppError(
          `Invalid vehicle type: ${vehicle_type}`,
          400,
          'INVALID_VEHICLE_TYPE'
        );
      }

      // Validate duration_minutes
      if (!duration_minutes) {
        throw new AppError(
          'duration_minutes query parameter is required',
          400,
          'MISSING_REQUIRED_FIELD'
        );
      }

      const durationNum = parseInt(duration_minutes, 10);
      if (isNaN(durationNum) || durationNum < 0) {
        throw new AppError(
          'duration_minutes must be a non-negative integer',
          400,
          'BAD_REQUEST'
        );
      }

      // Calculate fee for duration
      const feeEstimate = await feeCalculationService.calculateFeeForDuration(
        vehicle_type,
        durationNum
      );

      const startTime = Date.now();
      res.status(200).json({
        success: true,
        data: feeEstimate,
      });

      logger.logResponse(req, 200, Date.now() - startTime);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FeeController();
