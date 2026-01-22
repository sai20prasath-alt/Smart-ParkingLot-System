/**
 * Logger Service
 * Provides centralized logging functionality
 * Can be integrated with external services like Winston, Bunyan, or DataDog
 */

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
};

class Logger {
  constructor(module) {
    this.module = module;
    this.environment = process.env.NODE_ENV || 'development';
  }

  /**
   * Format log message with timestamp and module
   * @private
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   * @returns {Object} Formatted log object
   */
  formatLog(level, message, meta = {}) {
    return {
      timestamp: new Date().toISOString(),
      level,
      module: this.module,
      message,
      environment: this.environment,
      ...meta,
    };
  }

  /**
   * Output log to console
   * @private
   * @param {Object} logData - Formatted log data
   */
  output(logData) {
    const logString = JSON.stringify(logData);

    switch (logData.level) {
      case LOG_LEVELS.ERROR:
        console.error(logString);
        break;
      case LOG_LEVELS.WARN:
        console.warn(logString);
        break;
      case LOG_LEVELS.DEBUG:
        if (this.environment === 'development') {
          console.debug(logString);
        }
        break;
      case LOG_LEVELS.INFO:
      default:
        console.log(logString);
    }
  }

  /**
   * Log error message
   * @param {string} message - Error message
   * @param {Object} error - Error object
   * @param {Object} meta - Additional metadata
   */
  error(message, error = null, meta = {}) {
    const errorMeta = error
      ? {
          errorName: error.name,
          errorMessage: error.message,
          errorStack: error.stack,
        }
      : {};

    this.output(
      this.formatLog(LOG_LEVELS.ERROR, message, {
        ...errorMeta,
        ...meta,
      })
    );
  }

  /**
   * Log warning message
   * @param {string} message - Warning message
   * @param {Object} meta - Additional metadata
   */
  warn(message, meta = {}) {
    this.output(this.formatLog(LOG_LEVELS.WARN, message, meta));
  }

  /**
   * Log info message
   * @param {string} message - Info message
   * @param {Object} meta - Additional metadata
   */
  info(message, meta = {}) {
    this.output(this.formatLog(LOG_LEVELS.INFO, message, meta));
  }

  /**
   * Log debug message (only in development)
   * @param {string} message - Debug message
   * @param {Object} meta - Additional metadata
   */
  debug(message, meta = {}) {
    if (this.environment === 'development') {
      this.output(this.formatLog(LOG_LEVELS.DEBUG, message, meta));
    }
  }

  /**
   * Log request information
   * @param {Object} req - Express request object
   * @param {Object} meta - Additional metadata
   */
  logRequest(req, meta = {}) {
    this.info('Incoming Request', {
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      ...meta,
    });
  }

  /**
   * Log response information
   * @param {Object} req - Express request object
   * @param {number} statusCode - HTTP status code
   * @param {number} duration - Request duration in ms
   * @param {Object} meta - Additional metadata
   */
  logResponse(req, statusCode, duration, meta = {}) {
    const level = statusCode >= 400 ? LOG_LEVELS.WARN : LOG_LEVELS.INFO;
    this.output(
      this.formatLog(level, 'Outgoing Response', {
        method: req.method,
        path: req.path,
        statusCode,
        durationMs: duration,
        ip: req.ip,
        ...meta,
      })
    );
  }

  /**
   * Log database operation
   * @param {string} operation - Operation name (query, insert, update, delete)
   * @param {string} collection - Collection/table name
   * @param {number} duration - Operation duration in ms
   * @param {Object} meta - Additional metadata
   */
  logDatabase(operation, collection, duration, meta = {}) {
    this.debug('Database Operation', {
      operation,
      collection,
      durationMs: duration,
      ...meta,
    });
  }

  /**
   * Log business logic operation
   * @param {string} operation - Operation name
   * @param {string} entity - Entity type
   * @param {Object} data - Operation data
   * @param {Object} meta - Additional metadata
   */
  logBusinessOperation(operation, entity, data = {}, meta = {}) {
    this.info('Business Operation', {
      operation,
      entity,
      data,
      ...meta,
    });
  }
}

/**
 * Create logger instance for a module
 * @param {string} module - Module name
 * @returns {Logger} Logger instance
 */
const createLogger = (module) => {
  return new Logger(module);
};

module.exports = {
  createLogger,
  Logger,
  LOG_LEVELS,
};
