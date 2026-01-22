const AppError = require('../errors/AppError');

/**
 * Rate limiter middleware
 * Limits: 1000 requests per minute per API key
 * Uses in-memory store (can be replaced with Redis for distributed systems)
 */
class RateLimiter {
  constructor(maxRequests = 1000, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs; // 1 minute in milliseconds
    this.requests = new Map();
  }

  /**
   * Clean up old entries to prevent memory leaks
   */
  cleanup() {
    const now = Date.now();
    for (const [key, data] of this.requests) {
      if (now - data.resetTime > this.windowMs) {
        this.requests.delete(key);
      }
    }
  }

  /**
   * Middleware function
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  middleware() {
    return (req, res, next) => {
      try {
        // Get client identifier (API key from header or IP address)
        const clientId = req.headers['x-api-key'] || req.ip;

        const now = Date.now();
        let clientData = this.requests.get(clientId);

        // Initialize or reset if window has passed
        if (!clientData || now - clientData.resetTime > this.windowMs) {
          clientData = {
            count: 0,
            resetTime: now,
          };
          this.requests.set(clientId, clientData);
        }

        // Increment request count
        clientData.count++;

        // Calculate remaining requests and reset time
        const remaining = Math.max(0, this.maxRequests - clientData.count);
        const resetTime = Math.ceil(clientData.resetTime + this.windowMs);

        // Set rate limit headers
        res.set('X-RateLimit-Limit', this.maxRequests);
        res.set('X-RateLimit-Remaining', remaining);
        res.set('X-RateLimit-Reset', resetTime);

        // Check if rate limit exceeded
        if (clientData.count > this.maxRequests) {
          throw new AppError(
            `Rate limit exceeded. Maximum ${this.maxRequests} requests per minute allowed`,
            429,
            'RATE_LIMIT_EXCEEDED'
          );
        }

        // Periodically clean up old entries
        if (Math.random() < 0.01) {
          this.cleanup();
        }

        next();
      } catch (error) {
        if (error instanceof AppError) {
          return res.status(error.getStatusCode()).json(error.toJSON());
        }
        next(error);
      }
    };
  }
}

// Create singleton instance
const rateLimiter = new RateLimiter(1000, 60000);

module.exports = rateLimiter.middleware();
