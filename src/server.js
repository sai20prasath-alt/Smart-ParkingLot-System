require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');
const { createLogger } = require('./utils/logger');

const logger = createLogger('Server');

// ==================== Environment Variables ====================

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';
const NODE_ENV = process.env.NODE_ENV || 'development';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_parking_lot';

// ==================== Database Connection ====================

/**
 * Connect to MongoDB
 */
const connectDatabase = async () => {
  try {
    logger.info('Connecting to MongoDB...', {
      uri: MONGODB_URI.replace(/:\w+@/, ':****@'),
    });

    const mongooseOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: parseInt(process.env.MONGODB_POOL_SIZE || '10'),
      socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT || '30000'),
      connectTimeoutMS: parseInt(process.env.MONGODB_CONNECT_TIMEOUT || '30000'),
    };

    await mongoose.connect(MONGODB_URI, mongooseOptions);

    logger.info('MongoDB connected successfully', {
      host: mongoose.connection.host,
      database: mongoose.connection.db.databaseName,
    });

    // Database event listeners
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error', error);
    });

    return true;
  } catch (error) {
    logger.error('Failed to connect to MongoDB', error, {
      uri: MONGODB_URI.replace(/:\w+@/, ':****@'),
    });
    throw error;
  }
};

// ==================== Database Initialization ====================

/**
 * Initialize database (create indexes, seed data, etc.)
 */
const initializeDatabase = async () => {
  try {
    logger.info('Initializing database...');

    // Import models to ensure they're registered
    require('./models/ParkingSpot');
    require('./models/Vehicle');
    require('./models/ParkingTransaction');
    require('./models/RateCard');
    require('./models/ParkingLot');

    logger.info('Database models registered');

    // Optional: Seed initial data
    if (process.env.SEED_DATABASE === 'true') {
      logger.info('Seeding database with initial data...');
      // Seed logic would go here
    }

    logger.info('Database initialization complete');
  } catch (error) {
    logger.error('Failed to initialize database', error);
    throw error;
  }
};

// ==================== Server Startup ====================

/**
 * Start the Express server
 */
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Initialize database
    await initializeDatabase();

    // Start listening on port
    const server = app.listen(PORT, HOST, () => {
      logger.info('Server started successfully', {
        environment: NODE_ENV,
        host: HOST,
        port: PORT,
        url: `http://${HOST}:${PORT}`,
        apiPrefix: process.env.API_PREFIX || '/api/v1',
      });

      logger.info('Available endpoints:', {
        'POST /api/v1/parking/entry': 'Vehicle entry',
        'POST /api/v1/parking/exit': 'Vehicle exit',
        'GET /api/v1/parking/spots/availability': 'Check availability',
        'GET /api/v1/parking/vehicle/:license_plate/status': 'Vehicle status',
        'POST /api/v1/parking/fees/calculation': 'Calculate fee',
        'GET /api/v1/parking/statistics': 'Get statistics',
      });
    });

    // ==================== Graceful Shutdown ====================

    /**
     * Handle graceful shutdown on SIGTERM
     */
    const gracefulShutdown = async (signal) => {
      logger.info(`Received ${signal}, starting graceful shutdown...`);

      // Stop accepting new connections
      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          // Close database connection
          await mongoose.connection.close();
          logger.info('MongoDB connection closed');
        } catch (error) {
          logger.error('Error closing MongoDB connection', error);
        }

        logger.info('Graceful shutdown completed');
        process.exit(0);
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.warn('Graceful shutdown timeout, forcing exit');
        process.exit(1);
      }, 30000);
    };

    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // ==================== Unhandled Errors ====================

    /**
     * Handle uncaught exceptions
     */
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', error);
      process.exit(1);
    });

    /**
     * Handle unhandled promise rejections
     */
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', new Error(reason), {
        promise: promise.toString(),
      });
      process.exit(1);
    });

    return server;
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

// ==================== Start Application ====================

if (require.main === module) {
  startServer();
}

module.exports = startServer;
