require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const authMiddleware = require('./middleware/authMiddleware');
const requestValidator = require('./middleware/requestValidator');
const rateLimiter = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

const parkingController = require('./controllers/parkingController');
const feeController = require('./controllers/feeController');
const statsController = require('./controllers/statsController');

const AppError = require('./errors/AppError');
const { createLogger } = require('./utils/logger');

const logger = createLogger('App');

/**
 * Initialize Express Application
 * Setup middleware, routes, and error handling
 */
const app = express();

// ==================== Security Middleware ====================

// Helmet - Set security HTTP headers
if (process.env.HELMET_ENABLED !== 'false') {
  app.use(helmet());
}

// CORS - Enable cross-origin requests
if (process.env.CORS_ENABLED !== 'false') {
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: process.env.CORS_CREDENTIALS === 'true',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    })
  );
}

// ==================== Body Parsing Middleware ====================

// JSON parser with size limit
app.use(express.json({ limit: '10mb' }));

// URL encoded parser
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ==================== Rate Limiting ====================

if (process.env.RATE_LIMIT_ENABLED !== 'false') {
  app.use(rateLimiter);
}

// ==================== Request Validation ====================

app.use(requestValidator);

// ==================== Health Check Route ====================

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ==================== API Routes ====================

// API version prefix
const apiPrefix = process.env.API_PREFIX || '/api/v1';

// ==================== Authentication ====================
// All API endpoints require Bearer token authentication
app.use(`${apiPrefix}`, authMiddleware);

// ==================== PARKING ENDPOINTS ====================
// POST /api/v1/parking/entry - Vehicle entry
app.post(`${apiPrefix}/parking/entry`, (req, res, next) =>
  parkingController.vehicleEntry(req, res, next)
);

// POST /api/v1/parking/exit - Vehicle exit
app.post(`${apiPrefix}/parking/exit`, (req, res, next) =>
  parkingController.vehicleExit(req, res, next)
);

// GET /api/v1/parking/spots/availability - Check availability
app.get(`${apiPrefix}/parking/spots/availability`, (req, res, next) =>
  parkingController.checkAvailability(req, res, next)
);

// GET /api/v1/parking/vehicle/:license_plate/status - Vehicle status
app.get(`${apiPrefix}/parking/vehicle/:license_plate/status`, (req, res, next) =>
  parkingController.getVehicleStatus(req, res, next)
);

// ==================== FEE ENDPOINTS ====================
// POST /api/v1/parking/fees/calculation - Calculate fee
app.post(`${apiPrefix}/parking/fees/calculation`, (req, res, next) =>
  feeController.calculateFee(req, res, next)
);

// GET /api/v1/parking/fees/rates - Get rate cards (bonus)
app.get(`${apiPrefix}/parking/fees/rates`, (req, res, next) =>
  feeController.getRateCards(req, res, next)
);

// GET /api/v1/parking/fees/estimate - Estimate fee (bonus)
app.get(`${apiPrefix}/parking/fees/estimate`, (req, res, next) =>
  feeController.estimateFee(req, res, next)
);

// ==================== STATISTICS ENDPOINTS ====================
// GET /api/v1/parking/statistics - Get statistics
app.get(`${apiPrefix}/parking/statistics`, (req, res, next) =>
  statsController.getStatistics(req, res, next)
);

// GET /api/v1/parking/statistics/occupancy - Get occupancy (bonus)
app.get(`${apiPrefix}/parking/statistics/occupancy`, (req, res, next) =>
  statsController.getOccupancy(req, res, next)
);

// GET /api/v1/parking/statistics/vehicles - Get vehicle stats (bonus)
app.get(`${apiPrefix}/parking/statistics/vehicles`, (req, res, next) =>
  statsController.getVehicleStats(req, res, next)
);

// GET /api/v1/parking/statistics/revenue - Get revenue report (bonus)
app.get(`${apiPrefix}/parking/statistics/revenue`, (req, res, next) =>
  statsController.getRevenueReport(req, res, next)
);

// ==================== Global Error Handling ====================

app.use(errorHandler);

// ==================== Export ====================

logger.info('Express app initialized', {
  environment: process.env.NODE_ENV,
  apiPrefix,
  port: process.env.PORT,
  host: process.env.HOST,
});

module.exports = app;
