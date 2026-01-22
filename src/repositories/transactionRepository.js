const ParkingTransaction = require('../models/ParkingTransaction');
const { createLogger } = require('../utils/logger');

const logger = createLogger('TransactionRepository');

class TransactionRepository {
  /**
   * Create a new parking transaction
   * @param {Object} transactionData - Transaction data
   * @returns {Promise<Object>} Created transaction
   */
  async create(transactionData) {
    try {
      const transaction = new ParkingTransaction(transactionData);
      await transaction.save();
      logger.debug('Parking transaction created', {
        transactionId: transaction._id,
        vehicleId: transaction.vehicle_id,
        spotId: transaction.spot_id,
      });
      return transaction;
    } catch (error) {
      logger.error('Error creating transaction', error, { transactionData });
      throw error;
    }
  }

  /**
   * Find transaction by ID
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>} Transaction document
   */
  async findById(transactionId) {
    try {
      return await ParkingTransaction.findById(transactionId)
        .populate('vehicle_id')
        .populate('spot_id');
    } catch (error) {
      logger.error('Error finding transaction by ID', error, { transactionId });
      throw error;
    }
  }

  /**
   * Find active transaction by vehicle ID
   * @param {string} vehicleId - Vehicle ID
   * @returns {Promise<Object>} Active transaction (where exit_time is null)
   */
  async findActiveByVehicleId(vehicleId) {
    try {
      return await ParkingTransaction.findOne({
        vehicle_id: vehicleId,
        exit_time: null,
      })
        .populate('vehicle_id')
        .populate('spot_id');
    } catch (error) {
      logger.error('Error finding active transaction', error, { vehicleId });
      throw error;
    }
  }

  /**
   * Find all transactions for a vehicle
   * @param {string} vehicleId - Vehicle ID
   * @returns {Promise<Array>} All transactions for vehicle
   */
  async findByVehicleId(vehicleId) {
    try {
      return await ParkingTransaction.find({ vehicle_id: vehicleId })
        .sort({ entry_time: -1 })
        .populate('vehicle_id')
        .populate('spot_id')
        .exec();
    } catch (error) {
      logger.error('Error finding transactions by vehicle', error, { vehicleId });
      throw error;
    }
  }

  /**
   * Update transaction with exit details
   * @param {string} transactionId - Transaction ID
   * @param {Object} exitData - Exit data (exit_time, duration_minutes, parking_fee, payment_status)
   * @returns {Promise<Object>} Updated transaction
   */
  async updateExit(transactionId, exitData) {
    try {
      const transaction = await ParkingTransaction.findByIdAndUpdate(
        transactionId,
        exitData,
        { new: true, runValidators: true }
      )
        .populate('vehicle_id')
        .populate('spot_id');

      logger.debug('Transaction updated with exit details', {
        transactionId,
        fee: exitData.parking_fee,
      });
      return transaction;
    } catch (error) {
      logger.error('Error updating transaction exit', error, {
        transactionId,
        exitData,
      });
      throw error;
    }
  }

  /**
   * Get all transactions in a time range
   * @param {Date} startTime - Start time
   * @param {Date} endTime - End time
   * @returns {Promise<Array>} Transactions in range
   */
  async findByTimeRange(startTime, endTime) {
    try {
      return await ParkingTransaction.find({
        entry_time: { $gte: startTime, $lte: endTime },
      })
        .populate('vehicle_id')
        .exec();
    } catch (error) {
      logger.error('Error finding transactions by time range', error, {
        startTime,
        endTime,
      });
      throw error;
    }
  }

  /**
   * Get completed transactions (with exit_time)
   * @returns {Promise<Array>} Completed transactions
   */
  async findCompleted() {
    try {
      return await ParkingTransaction.find({ exit_time: { $ne: null } })
        .sort({ exit_time: -1 })
        .exec();
    } catch (error) {
      logger.error('Error finding completed transactions', error);
      throw error;
    }
  }

  /**
   * Get transactions by payment status
   * @param {string} paymentStatus - Payment status (PENDING, PAID, CANCELLED)
   * @returns {Promise<Array>} Transactions with specified status
   */
  async findByPaymentStatus(paymentStatus) {
    try {
      return await ParkingTransaction.find({ payment_status: paymentStatus })
        .sort({ updated_at: -1 })
        .exec();
    } catch (error) {
      logger.error('Error finding transactions by payment status', error, {
        paymentStatus,
      });
      throw error;
    }
  }

  /**
   * Update payment status
   * @param {string} transactionId - Transaction ID
   * @param {string} paymentStatus - New payment status
   * @param {string} paymentMethod - Payment method (optional)
   * @returns {Promise<Object>} Updated transaction
   */
  async updatePaymentStatus(transactionId, paymentStatus, paymentMethod = null) {
    try {
      const updateData = { payment_status: paymentStatus };
      if (paymentMethod) {
        updateData.payment_method = paymentMethod;
      }

      const transaction = await ParkingTransaction.findByIdAndUpdate(
        transactionId,
        updateData,
        { new: true, runValidators: true }
      );

      logger.debug('Payment status updated', {
        transactionId,
        paymentStatus,
      });
      return transaction;
    } catch (error) {
      logger.error('Error updating payment status', error, {
        transactionId,
        paymentStatus,
      });
      throw error;
    }
  }

  /**
   * Get revenue statistics
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} Revenue statistics
   */
  async getRevenueStats(startDate, endDate) {
    try {
      const transactions = await ParkingTransaction.find({
        exit_time: { $gte: startDate, $lte: endDate },
        payment_status: 'PAID',
      }).exec();

      const totalRevenue = transactions.reduce((sum, t) => sum + (t.parking_fee || 0), 0);

      return {
        total_transactions: transactions.length,
        total_revenue: parseFloat(totalRevenue.toFixed(2)),
        average_fee: transactions.length > 0 
          ? parseFloat((totalRevenue / transactions.length).toFixed(2))
          : 0,
      };
    } catch (error) {
      logger.error('Error getting revenue statistics', error, {
        startDate,
        endDate,
      });
      throw error;
    }
  }

  /**
   * Get all transactions
   * @returns {Promise<Array>} All transactions
   */
  async findAll() {
    try {
      return await ParkingTransaction.find()
        .sort({ entry_time: -1 })
        .populate('vehicle_id')
        .exec();
    } catch (error) {
      logger.error('Error finding all transactions', error);
      throw error;
    }
  }
}

module.exports = new TransactionRepository();
