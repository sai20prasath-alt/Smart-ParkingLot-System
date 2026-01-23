const entryService = require('../services/entryService');
const exitService = require('../services/exitService');
const availabilityService = require('../services/availabilityService');
const { validateEntryRequest, validateEntryQueryParams } = require('../validators/entryValidator');
const { validateExitRequest, validateExitQueryParams, validateLicensePlateParam } = require('../validators/exitValidator');
const AppError = require('../errors/AppError');
const { createLogger } = require('../utils/logger');

const logger = createLogger('ParkingController');

/**
 * Parking Controller
 * Handles parking entry, exit, availability, and vehicle status endpoints
 */

class ParkingController {
  /**
   * POST /parking/entry
   * Record vehicle entry and assign parking spot
   */
  async vehicleEntry(req, res, next) {
    try {
      logger.logRequest(req);

      // Validate request body
      const validatedData = validateEntryRequest(req.body);

      // Process entry
      const result = await entryService.processEntry(validatedData);

      const startTime = Date.now();
      res.status(200).json({
        success: true,
        data: result,
      });

      logger.logResponse(req, 200, Date.now() - startTime);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /parking/exit
   * Record vehicle exit and calculate parking fee
   */
  async vehicleExit(req, res, next) {
    try {
      logger.logRequest(req);

      // Validate request body
      const validatedData = validateExitRequest(req.body);

      // Optional query parameters
      const queryParams = validateExitQueryParams(req.query || {});

      // Process exit
      const result = await exitService.processExit(validatedData);

      const startTime = Date.now();
      res.status(200).json({
        success: true,
        data: result,
      });

      logger.logResponse(req, 200, Date.now() - startTime);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /parking/spots/availability
   * Check real-time parking spot availability
   */
  async checkAvailability(req, res, next) {
    try {
      logger.logRequest(req);

      const vehicleType = req.query.vehicle_type;
      const floorNumber = req.query.floor_number;

      let result;

      if (vehicleType && floorNumber) {
        // Both filters provided
        throw new AppError(
          'Cannot filter by both vehicle_type and floor_number',
          400,
          'BAD_REQUEST'
        );
      }

      if (vehicleType) {
        // Filter by vehicle type
        result = {
          success: true,
          data: await availabilityService.getDetailedAvailability(vehicleType),
        };
      } else if (floorNumber) {
        // Filter by floor
        const floorNum = parseInt(floorNumber, 10);
        if (isNaN(floorNum) || floorNum < 1) {
          throw new AppError(
            'Invalid floor number',
            400,
            'BAD_REQUEST'
          );
        }
        result = {
          success: true,
          data: {
            floor_availability: await availabilityService.getAvailabilityByFloor(floorNum),
            timestamp: new Date(),
          },
        };
      } else {
        // Get overall availability
        result = {
          success: true,
          data: await availabilityService.getOverallAvailability(),
        };
      }

      const startTime = Date.now();
      res.status(200).json(result);

      logger.logResponse(req, 200, Date.now() - startTime);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /parking/vehicle/:license_plate/status
   * Get current parking status of a vehicle
   */
  async getVehicleStatus(req, res, next) {
    try {
      logger.logRequest(req);

      // Validate license plate parameter
      const licensePlate = validateLicensePlateParam(req.params.license_plate);

      // Get active entry to determine if parked
      let data;
      try {
        const activeEntry = await entryService.getActiveEntry(licensePlate);
        data = {
          vehicle_id: activeEntry.vehicle_id,
          license_plate: licensePlate,
          is_parked: true,
          parking_details: {
            transaction_id: activeEntry.transaction_id,
            spot_id: activeEntry.spot_id,
            entry_time: activeEntry.entry_time,
            current_duration_minutes: activeEntry.parking_duration_minutes,
            parking_started: this.formatDurationAgo(activeEntry.parking_duration_minutes),
          },
        };
      } catch (error) {
        // Vehicle not found or not parked
        if (error.errorCode === 'VEHICLE_NOT_FOUND' || error.errorCode === 'TRANSACTION_NOT_FOUND') {
          data = {
            license_plate: licensePlate,
            is_parked: false,
            message: 'Vehicle is not currently parked',
          };
        } else {
          throw error;
        }
      }

      const startTime = Date.now();
      res.status(200).json({
        success: true,
        data,
      });

      logger.logResponse(req, 200, Date.now() - startTime);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Helper to format duration as "X hours Y minutes ago"
   * @private
   */
  formatDurationAgo(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) {
      return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
    }

    if (mins === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }

    return `${hours} hour${hours !== 1 ? 's' : ''} ${mins} minute${mins !== 1 ? 's' : ''} ago`;
  }
}

module.exports = new ParkingController();
