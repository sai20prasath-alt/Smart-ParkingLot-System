/**
 * Fee Calculation Service
 * Implements fee calculation algorithm from TECHNICAL_DESIGN.md
 * Supports multiple vehicle types with different rate cards
 */

/**
 * Calculate parking fee based on vehicle type, entry time, and exit time
 * Algorithm:
 * 1. Retrieve rate card for vehicle type
 * 2. Calculate duration and apply grace period
 * 3. Calculate hourly units with rounding strategy
 * 4. Apply daily cap if applicable
 * 5. Return final fee
 *
 * @param {string} vehicleType - Vehicle type (MOTORCYCLE, CAR, BUS)
 * @param {Date} entryTime - Vehicle entry timestamp
 * @param {Date} exitTime - Vehicle exit timestamp
 * @param {Object} rateCard - Rate card configuration
 * @returns {Object} Fee calculation details
 */
const calculateParkingFee = (vehicleType, entryTime, exitTime, rateCard) => {
  if (!vehicleType || !entryTime || !exitTime || !rateCard) {
    throw new Error('Missing required parameters for fee calculation');
  }

  // Validate entry and exit times
  if (!(entryTime instanceof Date) || !(exitTime instanceof Date)) {
    throw new Error('Entry time and exit time must be Date objects');
  }

  if (exitTime <= entryTime) {
    throw new Error('Exit time must be after entry time');
  }

  // Extract rate card details
  const {
    hourly_rate,
    daily_max_rate,
    grace_period_minutes = 15,
    rounding_strategy = 'CEILING',
  } = rateCard;

  // Step 1: Calculate duration
  const durationMs = exitTime - entryTime;
  const durationMinutes = Math.floor(durationMs / (1000 * 60));

  // Step 2: Apply grace period
  let adjustedMinutes = durationMinutes;
  let gracePeriodApplied = 0;

  if (durationMinutes <= grace_period_minutes) {
    return {
      vehicle_type: vehicleType,
      entry_time: entryTime,
      exit_time: exitTime,
      duration_minutes: durationMinutes,
      duration_formatted: formatDuration(durationMinutes),
      rate_card: {
        hourly_rate,
        daily_max_rate,
        grace_period_minutes,
        rounding_strategy,
      },
      calculation_details: {
        grace_period_applied: durationMinutes,
        adjusted_minutes: 0,
        hourly_units: 0,
        base_fee: 0,
        daily_cap_applied: false,
        final_fee: 0,
      },
      parking_fee: 0,
      currency: 'USD',
    };
  }

  gracePeriodApplied = grace_period_minutes;
  adjustedMinutes = durationMinutes - grace_period_minutes;

  // Step 3: Calculate hourly units with rounding
  let hourlyUnits;
  switch (rounding_strategy) {
    case 'CEILING':
      hourlyUnits = Math.ceil(adjustedMinutes / 60);
      break;
    case 'FLOOR':
      hourlyUnits = Math.floor(adjustedMinutes / 60);
      break;
    case 'ROUND':
      hourlyUnits = Math.round(adjustedMinutes / 60);
      break;
    default:
      hourlyUnits = Math.ceil(adjustedMinutes / 60);
  }

  // Step 4: Calculate base fee
  let baseFee = hourlyUnits * hourly_rate;

  // Step 5: Apply daily cap
  let dailyCapApplied = false;
  let finalFee = baseFee;

  if (daily_max_rate !== null && daily_max_rate !== undefined && baseFee > daily_max_rate) {
    finalFee = daily_max_rate;
    dailyCapApplied = true;
  }

  // Round to 2 decimal places
  finalFee = parseFloat(finalFee.toFixed(2));

  return {
    vehicle_type: vehicleType,
    entry_time: entryTime,
    exit_time: exitTime,
    duration_minutes: durationMinutes,
    duration_formatted: formatDuration(durationMinutes),
    rate_card: {
      hourly_rate,
      daily_max_rate,
      grace_period_minutes,
      rounding_strategy,
    },
    calculation_details: {
      grace_period_applied: gracePeriodApplied,
      adjusted_minutes: adjustedMinutes,
      hourly_units: hourlyUnits,
      base_fee: parseFloat(baseFee.toFixed(2)),
      daily_cap_applied: dailyCapApplied,
      final_fee: finalFee,
    },
    parking_fee: finalFee,
    currency: 'USD',
  };
};

/**
 * Format duration in minutes to human-readable string
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration (e.g., "2 hours 15 minutes")
 */
const formatDuration = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins} minute${mins !== 1 ? 's' : ''}`;
  }

  if (mins === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }

  return `${hours} hour${hours !== 1 ? 's' : ''} ${mins} minute${mins !== 1 ? 's' : ''}`;
};

/**
 * Estimate parking fee based on current time
 * @param {string} vehicleType - Vehicle type
 * @param {Date} entryTime - Entry time
 * @param {Object} rateCard - Rate card configuration
 * @returns {Object} Fee estimation
 */
const estimateParkingFee = (vehicleType, entryTime, rateCard) => {
  const currentTime = new Date();
  return calculateParkingFee(vehicleType, entryTime, currentTime, rateCard);
};

module.exports = {
  calculateParkingFee,
  estimateParkingFee,
  formatDuration,
};
