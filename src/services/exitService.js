const vehicleRepository = require('../repositories/vehicleRepository');
const transactionRepository = require('../repositories/transactionRepository');
const parkingSpotRepository = require('../repositories/parkingSpotRepository');
const parkingLotRepository = require('../repositories/parkingLotRepository');
const rateCardRepository = require('../repositories/rateCardRepository');
const feeCalculationService = require('./feeCalculationService');
const { createLogger } = require('../utils/logger');
const AppError = require('../errors/AppError');

const logger = createLogger('ExitService');

/**
 * Vehicle Exit Service
 * Handles vehicle exit, fee calculation, and spot release
 * Workflow: Validate → Calculate fee → Update transaction → Release spot
 */

class ExitService {
  /**
   * Process vehicle exit
   * @param {Object} exitData - Exit data (license_plate)
   * @returns {Promise<Object>} Exit confirmation with fee details
   */
  async processExit(exitData) {
    try {
      const { license_plate } = exitData;

      // Step 1: Find vehicle
      const vehicle = await vehicleRepository.findByLicensePlate(license_plate);

      if (!vehicle) {
        throw new AppError(
          `Vehicle ${license_plate} not found`,
          404,
          'VEHICLE_NOT_FOUND'
        );
      }

      // Step 2: Check if vehicle is parked
      if (!vehicle.is_currently_parked) {
        throw new AppError(
          `Vehicle ${license_plate} is not currently parked`,
          409,
          'ALREADY_EXITED'
        );
      }

      // Step 3: Find active transaction
      const transaction = await transactionRepository.findActiveByVehicleId(vehicle._id);

      if (!transaction) {
        throw new AppError(
          `No active parking transaction found for vehicle ${license_plate}`,
          404,
          'TRANSACTION_NOT_FOUND'
        );
      }

      // Step 4: Calculate parking fee
      const exitTime = new Date();
      const rateCard = await rateCardRepository.findByVehicleType(vehicle.vehicle_type);

      if (!rateCard) {
        throw new AppError(
          `Rate card not found for vehicle type ${vehicle.vehicle_type}`,
          500,
          'DATABASE_ERROR'
        );
      }

      const feeDetails = feeCalculationService.calculateFee(
        vehicle.vehicle_type,
        transaction.entry_time,
        exitTime,
        rateCard
      );

      // Step 5: Update transaction with exit details
      const updatedTransaction = await transactionRepository.updateExit(transaction._id, {
        exit_time: exitTime,
        duration_minutes: feeDetails.duration_minutes,
        parking_fee: feeDetails.parking_fee,
        payment_status: 'PENDING',
      });

      // Step 6: Release parking spot
      const spot = transaction.spot_id;
      await parkingSpotRepository.updateStatus(spot._id, 'AVAILABLE', null);

      // Step 7: Update vehicle parking status
      await vehicleRepository.updateParkingStatus(vehicle._id, false);

      // Step 8: Update parking lot available spots
      const lot = await parkingLotRepository.findDefault();
      if (lot) {
        await parkingLotRepository.decrementOccupiedSpots(lot._id, vehicle.vehicle_type);
      }

      logger.logBusinessOperation('VEHICLE_EXIT', 'Vehicle', {
        licensePlate: license_plate,
        vehicleType: vehicle.vehicle_type,
        fee: feeDetails.parking_fee,
        duration: feeDetails.duration_formatted,
      });

      return {
        transaction_id: updatedTransaction._id.toString(),
        vehicle_id: vehicle._id.toString(),
        spot_id: spot._id.toString(),
        entry_time: transaction.entry_time,
        exit_time: exitTime,
        duration_minutes: feeDetails.duration_minutes,
        duration_formatted: feeDetails.duration_formatted,
        parking_fee: feeDetails.parking_fee,
        currency: 'USD',
        payment_status: 'PENDING',
        message: 'Thank you for using our parking lot',
      };
    } catch (error) {
      logger.error('Error processing vehicle exit', error, { exitData });
      throw error;
    }
  }

  /**
   * Get exit details for a vehicle
   * @param {string} licensePlate - Vehicle license plate
   * @returns {Promise<Object>} Estimated exit details
   */
  async getExitEstimate(licensePlate) {
    try {
      const vehicle = await vehicleRepository.findByLicensePlate(licensePlate);

      if (!vehicle) {
        throw new AppError(
          `Vehicle ${licensePlate} not found`,
          404,
          'VEHICLE_NOT_FOUND'
        );
      }

      if (!vehicle.is_currently_parked) {
        throw new AppError(
          `Vehicle ${licensePlate} is not currently parked`,
          404,
          'VEHICLE_NOT_FOUND'
        );
      }

      const transaction = await transactionRepository.findActiveByVehicleId(vehicle._id);

      if (!transaction) {
        throw new AppError(
          `No active parking transaction for ${licensePlate}`,
          404,
          'TRANSACTION_NOT_FOUND'
        );
      }

      const rateCard = await rateCardRepository.findByVehicleType(vehicle.vehicle_type);

      if (!rateCard) {
        throw new AppError(
          `Rate card not found for vehicle type ${vehicle.vehicle_type}`,
          500,
          'DATABASE_ERROR'
        );
      }

      const currentTime = new Date();
      const feeDetails = feeCalculationService.calculateFee(
        vehicle.vehicle_type,
        transaction.entry_time,
        currentTime,
        rateCard
      );

      return {
        transaction_id: transaction._id.toString(),
        vehicle_id: vehicle._id.toString(),
        entry_time: transaction.entry_time,
        current_time: currentTime,
        duration_minutes: feeDetails.duration_minutes,
        duration_formatted: feeDetails.duration_formatted,
        estimated_fee: feeDetails.parking_fee,
        currency: 'USD',
      };
    } catch (error) {
      logger.error('Error getting exit estimate', error, { licensePlate });
      throw error;
    }
  }
}

module.exports = new ExitService();
