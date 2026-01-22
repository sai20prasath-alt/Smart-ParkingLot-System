const transactionRepository = require('../repositories/transactionRepository');
const vehicleRepository = require('../repositories/vehicleRepository');
const parkingLotRepository = require('../repositories/parkingLotRepository');
const { createLogger } = require('../utils/logger');
const AppError = require('../errors/AppError');

const logger = createLogger('StatsService');

/**
 * Statistics Service
 * Provides parking lot statistics and analytics
 */

class StatsService {
  /**
   * Get parking lot statistics for a period
   * @param {string} timePeriod - Time period (HOURLY, DAILY, WEEKLY)
   * @returns {Promise<Object>} Statistics
   */
  async getStatistics(timePeriod = 'DAILY') {
    try {
      const now = new Date();
      let startDate;

      // Calculate start date based on time period
      switch (timePeriod) {
        case 'HOURLY':
          startDate = new Date(now - 60 * 60 * 1000);
          break;
        case 'DAILY':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'WEEKLY':
          const dayOfWeek = now.getDay();
          startDate = new Date(now - dayOfWeek * 24 * 60 * 60 * 1000);
          startDate.setHours(0, 0, 0, 0);
          break;
        default:
          startDate = new Date(now.setHours(0, 0, 0, 0));
      }

      // Get transactions in period
      const transactions = await transactionRepository.findByTimeRange(startDate, now);

      // Calculate statistics
      const completedTransactions = transactions.filter((t) => t.exit_time !== null);

      const vehiclesEntered = new Set(transactions.map((t) => t.vehicle_id.toString())).size;
      const vehiclesExited = new Set(
        completedTransactions.map((t) => t.vehicle_id.toString())
      ).size;

      const currentVehicles = await vehicleRepository.countParked();

      const totalRevenue = completedTransactions.reduce(
        (sum, t) => sum + (t.parking_fee || 0),
        0
      );

      const revenueByType = {
        MOTORCYCLE: 0,
        CAR: 0,
        BUS: 0,
      };

      const avgDurationByType = {
        MOTORCYCLE: [],
        CAR: [],
        BUS: [],
      };

      completedTransactions.forEach((t) => {
        const vehicleType = t.vehicle_id.vehicle_type;
        if (revenueByType[vehicleType] !== undefined) {
          revenueByType[vehicleType] += t.parking_fee || 0;
        }
        if (t.duration_minutes && avgDurationByType[vehicleType]) {
          avgDurationByType[vehicleType].push(t.duration_minutes);
        }
      });

      // Calculate average durations
      const avgDurationMap = {};
      Object.keys(avgDurationByType).forEach((type) => {
        const durations = avgDurationByType[type];
        avgDurationMap[type] =
          durations.length > 0
            ? Math.round(durations.reduce((a, b) => a + b) / durations.length)
            : 0;
      });

      const peakHours = this.calculatePeakHours(transactions);

      logger.debug('Statistics retrieved', {
        timePeriod,
        vehiclesEntered,
        vehiclesExited,
        totalRevenue,
      });

      return {
        statistics_period: timePeriod,
        date: new Date(startDate).toISOString().split('T')[0],
        vehicles_entered: vehiclesEntered,
        vehicles_exited: vehiclesExited,
        current_vehicles_parked: currentVehicles,
        total_transactions: transactions.length,
        completed_transactions: completedTransactions.length,
        total_revenue: parseFloat(totalRevenue.toFixed(2)),
        revenue_by_vehicle_type: {
          MOTORCYCLE: parseFloat(revenueByType.MOTORCYCLE.toFixed(2)),
          CAR: parseFloat(revenueByType.CAR.toFixed(2)),
          BUS: parseFloat(revenueByType.BUS.toFixed(2)),
        },
        average_parking_duration_minutes: avgDurationMap,
        average_parking_fee: completedTransactions.length > 0
          ? parseFloat((totalRevenue / completedTransactions.length).toFixed(2))
          : 0,
        high_demand_periods: peakHours,
        timestamp: now,
      };
    } catch (error) {
      logger.error('Error getting statistics', error, { timePeriod });
      throw error;
    }
  }

  /**
   * Get occupancy statistics
   * @returns {Promise<Object>} Current occupancy
   */
  async getOccupancyStats() {
    try {
      const lot = await parkingLotRepository.findDefault();

      if (!lot) {
        throw new AppError(
          'No parking lot found',
          404,
          'NOT_FOUND'
        );
      }

      const summary = await parkingLotRepository.getOccupancySummary(lot._id);

      logger.debug('Occupancy statistics retrieved', {
        occupancyRate: summary.occupancy_rate,
      });

      return summary;
    } catch (error) {
      logger.error('Error getting occupancy statistics', error);
      throw error;
    }
  }

  /**
   * Calculate peak hours from transactions
   * @private
   * @param {Array} transactions - Array of transactions
   * @returns {Array} Peak hours
   */
  calculatePeakHours(transactions) {
    const hourCounts = {};

    transactions.forEach((t) => {
      const hour = new Date(t.entry_time).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    // Get top 3 hours
    const sorted = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map((entry) => {
        const hour = parseInt(entry[0]);
        return `${String(hour).padStart(2, '0')}:00-${String(hour + 1).padStart(2, '0')}:00`;
      });

    return sorted;
  }

  /**
   * Get revenue report for date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} Revenue report
   */
  async getRevenueReport(startDate, endDate) {
    try {
      const stats = await transactionRepository.getRevenueStats(startDate, endDate);

      logger.debug('Revenue report retrieved', {
        startDate,
        endDate,
        totalRevenue: stats.total_revenue,
      });

      return {
        period: {
          start: startDate,
          end: endDate,
        },
        total_transactions: stats.total_transactions,
        total_revenue: stats.total_revenue,
        average_fee: stats.average_fee,
      };
    } catch (error) {
      logger.error('Error getting revenue report', error, { startDate, endDate });
      throw error;
    }
  }

  /**
   * Get vehicle statistics
   * @returns {Promise<Object>} Vehicle statistics
   */
  async getVehicleStats() {
    try {
      const totalVehicles = await vehicleRepository.countTotal();
      const parkedVehicles = await vehicleRepository.countParked();

      logger.debug('Vehicle statistics retrieved', {
        total: totalVehicles,
        parked: parkedVehicles,
      });

      return {
        total_vehicles: totalVehicles,
        currently_parked: parkedVehicles,
        not_parked: totalVehicles - parkedVehicles,
      };
    } catch (error) {
      logger.error('Error getting vehicle statistics', error);
      throw error;
    }
  }
}

module.exports = new StatsService();
