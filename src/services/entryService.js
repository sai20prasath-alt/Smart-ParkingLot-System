const vehicleRepository = require('../repositories/vehicleRepository');
const parkingSpotRepository = require('../repositories/parkingSpotRepository');
const transactionRepository = require('../repositories/transactionRepository');
const parkingLotRepository = require('../repositories/parkingLotRepository');
const spotAllocationService = require('./spotAllocationService');
const { createLogger } = require('../utils/logger');
const AppError = require('../errors/AppError');

const logger = createLogger('EntryService');

/**
 * Vehicle Entry Service
 * Handles vehicle entry and parking spot allocation
 * Workflow: Validate → Check existing entry → Allocate spot → Create transaction
 */

class EntryService {
  /**
   * Process vehicle entry
   * @param {Object} entryData - Entry data (license_plate, vehicle_type, owner_name, registration_number)
   * @returns {Promise<Object>} Entry confirmation with spot details
   */
  async processEntry(entryData) {
    try {
      const { license_plate, vehicle_type, owner_name, registration_number } = entryData;

      // Step 1: Check if vehicle already parked
      const existingVehicle = await vehicleRepository.findByLicensePlate(license_plate);

      if (existingVehicle && existingVehicle.is_currently_parked) {
        throw new AppError(
          `Vehicle ${license_plate} is already parked in the lot`,
          409,
          'VEHICLE_ALREADY_PARKED'
        );
      }

      // Step 2: Create or update vehicle record
      let vehicle;
      if (existingVehicle) {
        vehicle = existingVehicle;
      } else {
        vehicle = await vehicleRepository.create({
          license_plate: license_plate.toUpperCase(),
          vehicle_type,
          owner_name,
          registration_number,
          is_currently_parked: false,
        });
      }

      // Step 3: Allocate parking spot
      const allocatedSpot = await spotAllocationService.allocateSpot(vehicle_type);

      if (!allocatedSpot) {
        throw new AppError(
          `No available parking spots for vehicle type ${vehicle_type}`,
          409,
          'NO_SPOT_AVAILABLE'
        );
      }

      // Step 4: Create parking transaction
      const entryTime = new Date();
      const transaction = await transactionRepository.create({
        vehicle_id: vehicle._id,
        spot_id: allocatedSpot._id,
        entry_time: entryTime,
      });

      // Step 5: Update spot status
      await parkingSpotRepository.updateStatus(allocatedSpot._id, 'OCCUPIED', vehicle._id);

      // Step 6: Update vehicle parking status
      await vehicleRepository.updateParkingStatus(vehicle._id, true);

      // Step 7: Update parking lot available spots
      const lot = await parkingLotRepository.findDefault();
      if (lot) {
        await parkingLotRepository.incrementOccupiedSpots(lot._id, vehicle_type);
      }

      logger.logBusinessOperation('VEHICLE_ENTRY', 'Vehicle', {
        licensePlate: license_plate,
        vehicleType: vehicle_type,
        spotFloor: allocatedSpot.floor_number,
        spotNumber: allocatedSpot.spot_number,
      });

      return {
        transaction_id: transaction._id.toString(),
        vehicle_id: vehicle._id.toString(),
        spot_id: allocatedSpot._id.toString(),
        spot_details: {
          floor_number: allocatedSpot.floor_number,
          spot_number: allocatedSpot.spot_number,
          spot_type: allocatedSpot.spot_type,
        },
        entry_time: entryTime,
        message: `Vehicle successfully parked at Floor ${allocatedSpot.floor_number}, Spot ${allocatedSpot.spot_number}`,
      };
    } catch (error) {
      logger.error('Error processing vehicle entry', error, { entryData });
      throw error;
    }
  }

  /**
   * Get active entry transaction for a vehicle
   * @param {string} licensePlate - Vehicle license plate
   * @returns {Promise<Object>} Active transaction details
   */
  async getActiveEntry(licensePlate) {
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
          `No active parking transaction found for vehicle ${licensePlate}`,
          404,
          'TRANSACTION_NOT_FOUND'
        );
      }

      return {
        transaction_id: transaction._id.toString(),
        vehicle_id: vehicle._id.toString(),
        spot_id: transaction.spot_id._id.toString(),
        entry_time: transaction.entry_time,
        parking_duration_minutes: Math.floor((Date.now() - transaction.entry_time) / 60000),
      };
    } catch (error) {
      logger.error('Error getting active entry', error, { licensePlate });
      throw error;
    }
  }
}

module.exports = new EntryService();
