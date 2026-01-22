/**
 * Spot Allocator Service
 * Implements spot allocation algorithm from TECHNICAL_DESIGN.md
 * Strategy: Best-Fit with Size Priority
 */

/**
 * Determine eligible spot types based on vehicle type
 * Spot size hierarchy: MOTORCYCLE < CAR < BUS
 * @param {string} vehicleType - Vehicle type (MOTORCYCLE, CAR, BUS)
 * @returns {Array} Array of eligible spot types
 */
const getEligibleSpotTypes = (vehicleType) => {
  const spotTypeMap = {
    MOTORCYCLE: ['MOTORCYCLE', 'CAR', 'BUS'],
    CAR: ['CAR', 'BUS'],
    BUS: ['BUS'],
  };

  if (!spotTypeMap[vehicleType]) {
    throw new Error(`Invalid vehicle type: ${vehicleType}`);
  }

  return spotTypeMap[vehicleType];
};

/**
 * Calculate spot size priority (lower number = higher priority)
 * Ensures best-fit allocation (smallest suitable spot first)
 * @param {string} spotType - Spot type
 * @returns {number} Priority number
 */
const getSpotTypePriority = (spotType) => {
  const priorityMap = {
    MOTORCYCLE: 1,
    CAR: 2,
    BUS: 3,
  };
  return priorityMap[spotType] || 999;
};

/**
 * Sort available spots for allocation
 * Priority: 1) Lower floor, 2) Spot type (best-fit), 3) Spot number
 * @param {Array} spots - Array of available spots
 * @returns {Array} Sorted array of spots
 */
const sortSpotsByPriority = (spots) => {
  return spots.sort((a, b) => {
    // Primary: Lower floor number (faster access)
    if (a.floor_number !== b.floor_number) {
      return a.floor_number - b.floor_number;
    }

    // Secondary: Better spot type (best-fit)
    const priorityA = getSpotTypePriority(a.spot_type);
    const priorityB = getSpotTypePriority(b.spot_type);
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // Tertiary: Lower spot number
    return a.spot_number - b.spot_number;
  });
};

/**
 * Select best spot for allocation
 * Algorithm:
 * 1. Determine eligible spot types
 * 2. Filter available spots matching eligible types
 * 3. Sort by priority (floor, spot type, spot number)
 * 4. Return first available spot
 *
 * @param {string} vehicleType - Vehicle type
 * @param {Array} availableSpots - Array of available spot objects
 * @returns {Object|null} Selected spot or null if no spot available
 */
const selectOptimalSpot = (vehicleType, availableSpots) => {
  if (!vehicleType || !availableSpots || !Array.isArray(availableSpots)) {
    throw new Error('Invalid parameters for spot allocation');
  }

  if (availableSpots.length === 0) {
    return null;
  }

  // Step 1: Get eligible spot types
  const eligibleTypes = getEligibleSpotTypes(vehicleType);

  // Step 2: Filter spots by eligible types and status
  const matchingSpots = availableSpots.filter(
    (spot) =>
      eligibleTypes.includes(spot.spot_type) &&
      spot.status === 'AVAILABLE'
  );

  if (matchingSpots.length === 0) {
    return null;
  }

  // Step 3: Sort by priority
  const sortedSpots = sortSpotsByPriority(matchingSpots);

  // Step 4: Return first spot
  return sortedSpots[0];
};

/**
 * Get spot allocation statistics
 * @param {Array} availableSpots - Array of available spots
 * @param {Array} occupiedSpots - Array of occupied spots
 * @returns {Object} Allocation statistics
 */
const getAllocationStats = (availableSpots = [], occupiedSpots = []) => {
  const stats = {
    MOTORCYCLE: { available: 0, occupied: 0, total: 0 },
    CAR: { available: 0, occupied: 0, total: 0 },
    BUS: { available: 0, occupied: 0, total: 0 },
  };

  // Count available spots by type
  availableSpots.forEach((spot) => {
    if (stats[spot.spot_type]) {
      stats[spot.spot_type].available++;
    }
  });

  // Count occupied spots by type
  occupiedSpots.forEach((spot) => {
    if (stats[spot.spot_type]) {
      stats[spot.spot_type].occupied++;
    }
  });

  // Calculate total and rates
  Object.keys(stats).forEach((type) => {
    stats[type].total = stats[type].available + stats[type].occupied;
    stats[type].occupancy_rate =
      stats[type].total > 0
        ? parseFloat((stats[type].occupied / stats[type].total).toFixed(2))
        : 0;
  });

  return stats;
};

/**
 * Get allocation recommendations
 * Suggests best vehicle type to park based on availability
 * @param {Object} spotStats - Spot allocation statistics
 * @returns {Array} Array of vehicle types sorted by availability
 */
const getAllocationRecommendations = (spotStats) => {
  const recommendations = [];

  Object.entries(spotStats).forEach(([vehicleType, stats]) => {
    if (stats.available > 0) {
      recommendations.push({
        vehicleType,
        availableSpots: stats.available,
        occupancyRate: stats.occupancy_rate,
      });
    }
  });

  // Sort by availability (highest first)
  return recommendations.sort((a, b) => b.availableSpots - a.availableSpots);
};

module.exports = {
  selectOptimalSpot,
  getEligibleSpotTypes,
  getSpotTypePriority,
  sortSpotsByPriority,
  getAllocationStats,
  getAllocationRecommendations,
};
