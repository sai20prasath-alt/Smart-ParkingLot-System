const statsService = require('../services/statsService');
const { createLogger } = require('../utils/logger');
const AppError = require('../errors/AppError');

const logger = createLogger('StatsController');

/**
 * Statistics Controller
 * Handles parking lot statistics and analytics endpoints
 */

class StatsController {
  /**
   * GET /parking/statistics
   * Get overall parking lot statistics
   */
  async getStatistics(req, res, next) {
    try {
      logger.logRequest(req);

      const timePeriod = (req.query.time_period || 'DAILY').toUpperCase();

      // Validate time period
      const validPeriods = ['HOURLY', 'DAILY', 'WEEKLY'];
      if (!validPeriods.includes(timePeriod)) {
        throw new AppError(
          `Invalid time_period. Must be one of: ${validPeriods.join(', ')}`,
          400,
          'BAD_REQUEST'
        );
      }

      // Get statistics
      const statistics = await statsService.getStatistics(timePeriod);

      const startTime = Date.now();
      res.status(200).json({
        success: true,
        data: statistics,
      });

      logger.logResponse(req, 200, Date.now() - startTime);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /parking/statistics/occupancy
   * Get current occupancy statistics (bonus endpoint)
   */
  async getOccupancy(req, res, next) {
    try {
      logger.logRequest(req);

      const occupancyStats = await statsService.getOccupancyStats();

      const startTime = Date.now();
      res.status(200).json({
        success: true,
        data: occupancyStats,
      });

      logger.logResponse(req, 200, Date.now() - startTime);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /parking/statistics/vehicles
   * Get vehicle statistics (bonus endpoint)
   */
  async getVehicleStats(req, res, next) {
    try {
      logger.logRequest(req);

      const vehicleStats = await statsService.getVehicleStats();

      const startTime = Date.now();
      res.status(200).json({
        success: true,
        data: vehicleStats,
      });

      logger.logResponse(req, 200, Date.now() - startTime);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /parking/statistics/revenue
   * Get revenue report for date range (bonus endpoint)
   */
  async getRevenueReport(req, res, next) {
    try {
      logger.logRequest(req);

      const { start_date, end_date } = req.query;

      // Validate dates
      if (!start_date || !end_date) {
        throw new AppError(
          'start_date and end_date query parameters are required',
          400,
          'MISSING_REQUIRED_FIELD'
        );
      }

      const startDate = new Date(start_date);
      const endDate = new Date(end_date);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new AppError(
          'start_date and end_date must be valid ISO 8601 dates',
          400,
          'INVALID_FORMAT'
        );
      }

      if (endDate <= startDate) {
        throw new AppError(
          'end_date must be after start_date',
          400,
          'BAD_REQUEST'
        );
      }

      // Get revenue report
      const revenueReport = await statsService.getRevenueReport(startDate, endDate);

      const startTime = Date.now();
      res.status(200).json({
        success: true,
        data: revenueReport,
      });

      logger.logResponse(req, 200, Date.now() - startTime);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /parking/health
   * Health check endpoint (bonus endpoint)
   */
  async healthCheck(req, res, next) {
    try {
      const occupancy = await statsService.getOccupancyStats();

      res.status(200).json({
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date(),
          parking_lot: occupancy,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new StatsController();
